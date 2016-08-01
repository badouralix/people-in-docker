/**
 * Created by badouralix on 22/07/16.
 */
'use strict';

// BASE SETUP
// =============================================================================

// Setup config
var config  = require('./config');
var port    = config.app.port;

// Setup log config
var log = require('winston');
log.level = config.log.level;
log.remove(log.transports.Console).add(log.transports.Console, { colorize: true });
log.add(log.transports.File, { filename: '/var/log/node/node-proxy.log' });

// Call the packages we need
var express = require('express');
var app     = express();

// Use morgan to print logs
var morgan  = require('morgan');
var fs = require('fs');
app.use( morgan('combined', {stream: fs.createWriteStream('var/log/node/access.log', {flags: 'a'})}) );
app.use( morgan('dev') );


// ROUTES FOR OUR API
// =============================================================================
var proxy_router = require('./routes/proxy');
app.use('/', proxy_router);


// START THE SERVER
// =============================================================================
var server = app.listen( port, function () {
    log.info( "Magic happens on port " + port );
}).on('close', function () {
    log.info( "Magic just stopped" );
});


// HANDLE SIGTERM
// =============================================================================
process.on('SIGTERM', function () {
    server.close();
});
