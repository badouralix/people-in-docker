/**
 * Created by badouralix on 02/08/16.
 *
 * Controller for users' containers.
 */
'use strict';

// Setup config
var config  = require('../config');

// Setup log config
var log = require('winston');

// Create a proxy server with custom application logic
var http_proxy  = require('http-proxy');
var proxy       = http_proxy.createProxyServer({});

var passwd_user     = require('passwd-user');
var wait_on         = require('wait-on');
var docker_wrapper  = require('./docker-wrapper');

// Create a global variable containing all timeout ids
var timeout_id = {};


/*
 * Define useful functions
 **********************************************************************************************************************/

var check_user = function (req, res) {
	var username = req.username;

	// Check if existing user matches username
	passwd_user(username).then(function (user) {
		if (user === undefined) {

			log.debug("No user " + username + " has been found -> aborting task!");
			res.sendStatus(404);
			return;

		} else if ( user.uid < config.proxy.uid_min ) {

			log.warn("User " + user.username + " is not supposed to be accessible -> aborting task!");
			res.sendStatus(403);
			return;

		}

		route_user(user, req, res);

	});
};

var route_user = function (user, req, res) {


	log.debug("User " + user.username + " has been found -> looking for container..." );
	docker_wrapper.setup_container(user, function (err, ip) {
		if ( err ) {
			throw err;
		}

		var http_target = 'http://' + ip + ':80';
		var tcp_target  = 'tcp:' + ip + ':80';

		log.silly("Target for " + user.username + " is " + http_target);

		// Wait for the targeted container to be ready and listening on port 80
		wait_on({ resources: [tcp_target], interval: config.proxy.wait_after_refused, window: 0}, function (err) {
			if ( err ) {
				throw err;
			}

			// Forward client request to the targeted container
			proxy.web(req, res, { target: http_target });
		});
	});

	update_timeout(user);
};

var update_timeout = function (user) {

	var container_name =  docker_wrapper.get_user_container_name(user);

	if ( timeout_id.hasOwnProperty(user.username) ) {
		log.silly("Updating timeout for container " + container_name);
		clearTimeout(timeout_id[user.username]);
	} else {
		log.silly("Setting timeout for container " + docker_wrapper.get_user_container_name(user) + "");
	}

	timeout_id[user.username] = setTimeout( function () {
		docker_wrapper.stop_container(user);
		delete timeout_id[user.username];
	}, config.proxy.container_timeout );

};

var trigger_timeouts = function () {

	// This function forces users' containers launched to stop. Theses containers should have been stopped after a
	// certain amount of ms ( defined in config.proxy.container_timeout ), with a setTimeout saved in the json object
	// timeout_id. Timeouts are cleared and containers are stopped.

	for ( var username in timeout_id ) {
		clearTimeout(timeout_id[username]);

		passwd_user(username).then(function (user) {
			if (user !== undefined) {
				docker_wrapper.stop_container(user);
			}
		});
	}
};


/*
 * Export module
 **********************************************************************************************************************/

module.exports = {
    user_route: check_user,
    trigger_timeouts: trigger_timeouts
};
