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

const passwd_user       = require('passwd-user');
const docker_wrapper    = require('./docker-wrapper');

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

        var target = 'http://' + ip + ':80';
        log.silly("Target for " + user.username + " is " + target);

        proxy.web(req, res, { target: target }, function (err) {

            if ( err.errno == 'ECONNREFUSED' ) {
                // If connection is refused by user container, it may be due to the http server not started yet
                log.warn("Unable to create connection with server at address " + err.address + ":" + err.port + " -> waiting " + config.proxy.wait_after_refused + "ms before trying again" );

                // Forward one more time client request
                setTimeout( function () {
                    proxy.web(req, res, { target: target });
                }, config.proxy.wait_after_refused );

            } else {
                throw err;
            }
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


/*
 * Exporte module
 **********************************************************************************************************************/

module.exports = {
    user_route: check_user
};
