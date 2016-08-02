/**
 * Created by badouralix on 22/07/16.
 */
'use strict';

// Create new express router
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
const user_route        = require('../local_modules/users-container').user_route;

// Create a global variable containing all timeout ids
var timeout_id = {};

// Get app directory
var path    = require('path');
var app_dir = path.dirname(require.main.filename);



/*
 * Define router
 **********************************************************************************************************************/

router.param('username', function (req, res, next, username) {

    // Check username syntax according to a regex ( if defined in config.proxy.username_regex ).
    // On Linux-based systems, usernames usually match /^[a-z_][a-z0-9_-]*[$]?$/.

    if (( config.proxy.username_regex !== undefined ) && ( ! username.match(config.proxy.username_regex) )) {

        // If username doesn't match the username_regex, the app responds with a 400 error

        log.warn("Invalide username detected for " + username );
        res.sendStatus(400);

    } else {

        // Else, it keeps going.
        // Username is saved in req.username in case it is modified.

        req.username = username;
        next();

    }
});

// Any valid route must start with "~username"
router.all(['/~:username', '/~:username/*'], user_route);

router.get('/icons/:icon', function (req, res) {
    var options = {
        root: app_dir + '/html/icons/',
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };

    res.sendFile(req.params.icon, options, function (err) {
        if ( err ) {
            res.sendStatus(err.statusCode);
        }
        else {
            log.verbose("Successfully sent " + req.params.icon);
        }
    });
});

// Other routes are forbidden or not defined
router.all('/', function(req, res) {
    res.sendStatus(403)
});

router.all('*', function(req, res) {
    res.sendStatus(404)
});


/*
 * Exporte module
 **********************************************************************************************************************/

module.exports = router;
