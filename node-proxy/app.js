/**
 * Created by badouralix on 22/07/16.
 */
'use strict';


/**
 * Load packages
 **********************************************************************************************************************/
var log     = require('winston');
var morgan  = require('morgan');
var express = require('express');
var fs      = require('fs');
var path    = require('path');
var favicon = require('serve-favicon');
var robots  = require('express-robots');

var config                  = require('./config');
var proxy_router            = require('./routes/proxy');
var stop_users_containers   = require('./local_modules/users-container').trigger_timeouts;


/**
 * Base setup
 **********************************************************************************************************************/

// Setup config
var port = config.app.port;

// Setup log config
log.level = config.log.level;
log.remove(log.transports.Console).add(log.transports.Console, { colorize: true });
log.add(log.transports.File, { filename: '/var/log/node/node-proxy.log' });

// Create express server
var app = express();

// Use morgan to print logs
app.use( morgan('combined', {stream: fs.createWriteStream('/var/log/node/access.log', {flags: 'a'})}) );
app.use( morgan('dev') );

// Setup view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


/**
 * Configure routes
 **********************************************************************************************************************/
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(robots(path.join(__dirname, 'public', 'robots.txt')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', proxy_router);


/**
 * Start the server
 **********************************************************************************************************************/
var server = app.listen( port, function () {

	log.info( "Magic happens on port " + port );

}).on('close', function () {

	stop_users_containers();
	log.info( "Magic just stopped" );

});


/**
 * Handle sigterm
 **********************************************************************************************************************/
process.on('SIGTERM', function () {

	server.close();

});
