/**
 * Created by badouralix on 02/08/16.
 */
'use strict';

// Create new express router
var express = require('express');
var router  = express.Router();

// Setup config
var config  = require('../config');

// Setup log config
var log = require('winston');

// Get app directory
var path    = require('path');
var app_dir = path.dirname(require.main.filename);


/**
 * Define router
 **********************************************************************************************************************/

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


/**
 * Export module
 **********************************************************************************************************************/

module.exports = router;
