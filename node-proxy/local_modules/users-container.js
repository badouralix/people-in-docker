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
var proxy       = http_proxy.createProxyServer();

var passwd_user     = require('passwd-user');
var wait_on         = require('wait-on');
var docker_wrapper  = require('./docker-wrapper');

// Create a global variable containing all timeout ids
var timeout_id = {};


/*
 * Define useful functions
 **********************************************************************************************************************/

var check_user = function (req, res, next) {
	var username = req.username;

	// Check if existing user matches username
	passwd_user(username).then(function (user) {
		if (user === undefined) {

			log.debug("No user " + username + " has been found -> aborting task!");

			var err = new Error("User " + username + " was not found");
			err.status = 404;
			return next(err);

		} else if ( user.uid < config.proxy.uid_min ) {

			log.warn("User " + user.username + " is not supposed to be accessible -> aborting task!");

			var err = new Error("Forbidden");
			err.status = 403;
			return next(err);

		}

		route_user(req, res, next, user);

	});
};

var route_user = function (req, res, next, user) {


	log.debug("User " + user.username + " has been found -> looking for container..." );
	docker_wrapper.setup_container(user, function (err, ip) {
		if ( err ) {
			return next(err);
		}

		var http_target = 'http://' + ip + ':80';
		var tcp_target  = 'tcp:' + ip + ':80';

		log.silly("Target for " + user.username + " is " + http_target);

		// Wait for the targeted container to be ready and listening on port 80
		wait_on({ resources: [tcp_target], interval: config.proxy.wait_after_refused, window: 0}, function (err) {
			if ( err ) {
				return next(err);
			}

			// Forward client request to the targeted container
			proxy.web(req, res, { target: http_target }, function (err) {
				return next(err);
			});
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

	// Define the function to call when the timer elapses. It stops user's container and delete the timeout object
	// associated.
	var callback = function () {

		docker_wrapper.stop_container(user, function (err) {
			log.error(err);
		});

		delete timeout_id[user.username];

	};

	// Save timeout object to a global json object.
	timeout_id[user.username] = setTimeout( callback, config.proxy.container_timeout );

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
