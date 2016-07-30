/**
 * Created by badouralix on 22/07/16.
 */
'use strict';

var express = require('express');
var router  = express.Router();

// Setup config
var config  = require('../config');

// Setup log config
var log = require('winston');

// Create a proxy server with custom application logic
var http_proxy  = require('http-proxy');
var proxy       = http_proxy.createProxyServer({});

const passwd_user       = require('passwd-user');
const docker_wrapper    = require('../local_modules/docker-wrapper');

// Create a global variable containing all timeout ids
var timeout_id = {};


/**********************************************************************************************************************/

var route_user = function (user, req, res) {

    if ( user.uid < config.proxy.uid_min ) {
        log.debug("User " + user.username + " is not supposed to be accessible -> aborting task!");
        res.sendStatus(403);
        return;
    }

    log.debug("User " + user.username + " has been found -> looking for container..." );
    docker_wrapper.setup_container(user, function (err, ip) {
        if ( err ) {
            throw err;
        }

        var target = 'http://' + ip + ':80';
        log.debug("Target for " + user.username + " is " + target);

        proxy.web(req, res, { target: target }, function (err) {

            if ( err.errno == 'ECONNREFUSED' ) {
                // If connection is refused by user container, it may be due to the http server not started yet
                log.warn("Unable to create connection with server at address " + err.address + ":" + err.port + " -> waiting " + config.proxy.wait_after_refused + "ms before trying again" );

                // Forward one more time client request
                setTimeout( function () {
                    proxy.web(req, res, { target: target });
                }, config.proxy.wait_after_refused);

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
        log.debug("Removing outdated timeout for container " + container_name);
        clearTimeout(timeout_id[user.username]);
    }

    log.debug("Updating timeout for container " + docker_wrapper.get_user_container_name(user) + "");

    timeout_id[user.username] = setTimeout(function () {
        docker_wrapper.stop_container(user);
    }, config.proxy.container_timeout);

};

/**********************************************************************************************************************/

// Root route is forbidden
router.all('/', function(req, res) {
    res.sendStatus(403)
});

// Any other route must start with "~username" ( or "username" )
router.all(['/~:username', '/~:username/*'], function (req, res) {
    var username = req.params.username;

    // Check syntax
    if (( config.proxy.username_regex !== undefined ) && ( ! username.match(config.proxy.username_regex) )) {
        log.warn("Invalide username detected for " + username );
        res.sendStatus(400);
        return;
    }

    // Check if existing user matches username
    passwd_user(username).then( function (user) {
        if ( user === undefined ) {
            log.debug("No user " + username + " has been found -> aborting task!");
            res.sendStatus(404);
            return;
        }

        route_user(user, req, res);

    });
});

module.exports = router;
