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

// Load controller
const user_route = require('../local_modules/users-container').user_route;


/**
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


/**
 * Export module
 **********************************************************************************************************************/

module.exports = router;
