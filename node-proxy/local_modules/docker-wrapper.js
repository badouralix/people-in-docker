/**
 * Created by badouralix on 28/07/16.
 */
'use strict';

// Setup config
var config  = require('../config');

// Setup log config
var log = require('winston');

var Docker = require('dockerode');
var fs     = require('fs');

var socket = config.docker.socket;
var stats  = fs.statSync(socket);

if (!stats.isSocket()) {
    throw new Error('Are you sure the docker is running?');
}
var docker = new Docker({ socketPath: socket });

// Get network of the node container #L113 ( needs to improve... )
var network_name = '';
docker.getContainer(process.env.HOSTNAME).inspect( function (err, data) {
	network_name = data.HostConfig.NetworkMode;
});


var get_user_container_name = function (user) {
	var container_prefix = config.docker.container_prefix;
	//var container_name = container_prefix + user.username;

	return container_prefix + user.username;
};

var setup_container = function (user, callback) {
	var container_name = get_user_container_name(user);
	log.verbose("Targeting container " + container_name);

	var container = docker.getContainer(container_name);
	container.inspect( user, function (err, data) {
		if ( err ) {
			//throw( err );
			// create_container(container_name, user, callback); // needs to pay attention to 404 error response from docker api
		}

		if ( data == null ) {
			// Container does not exist
			setup_image( function (err) {
				if (err) {
					throw err;
				}

				create_container(container_name, user, callback);
			});


		} else if ( data.State.Running == false ) {
			// Container is stopped
			start_container(container, container_name, callback);

		} else if ( data.State.Paused == true ) {
			// Container is paused
			unpause_container(container, container_name, callback);

		} else {
			log.debug("Using started container " + container_name);
			get_ip_from_data(data, callback)

		}

	});
};

var start_container = function (container, container_name, callback) {
	log.info("Starting container " + container_name);

	container.start( function () {
		// weird : start callback doesn't not return updated data and therefore container needs inspect call
		get_ip_from_container(container, callback);
	});
};

var unpause_container = function (container, container_name, callback) {
	log.info("Unpausing container " + container_name);

	container.unpause( function () {
		get_ip_from_container(container, callback);
	});
};

var create_container = function (container_name, user, callback) {
	log.info("Creating container " + container_name);

	var image_name = config.docker.image_name;
	var log_suffix = config.docker.log_suffix;

	var create_options = {
		'name': container_name,
		'labels': {},
		'cmd': config.docker.cmd,
		'image': image_name,
		'workingDir': '/mnt',
		'exposedPorts': {},
		'hostConfig': {
			'binds': [
				user.homedir + ':/home/' + user.username + ':ro',
				process.env.PEOPLE_SYNC_DIR + ':/mnt:ro',
				container_name + log_suffix + ':/var/log',
				'/etc/localtime:/etc/localtime:ro'
			],
			'networkMode': network_name //'container:' + process.env.HOSTNAME doesn't work...
		}
	};
	create_options['labels'][config.docker.labels_prefix + '.automatic_run'] = true.toString();
	create_options['labels'][config.docker.labels_prefix + '.username'] = user.username;

	docker.createContainer( create_options, function (err, container) {
		if ( err ) {
			throw err;
		}

		start_container(container, container_name, callback);
	});
};

var setup_image = function (callback) {
	var image_name = config.docker.image_name;
	log.silly("Checking image " + image_name);

	var image = docker.getImage(image_name);
	image.inspect( function (err, data) {

		if ( err && err.statusCode == 404 ) {

			// The image image_name hasn't been found and must be pulled
			pull_image(image_name, callback)

		} else {

			// The image image_name has been found or the error can't be handled here
			callback(err);

		}
	});
};

var pull_image = function (image_name, callback) {
	log.info("Pulling image " + image_name);

	docker.pull(image_name, function (err, stream) {
		if ( err ) {
			callback(err);
		}

		docker.modem.followProgress(stream, on_finished);

		function on_finished(err, output) {
			if ( err ) {
				callback(err);
			}

			log.silly("Image " + image_name + " has been successfully pulled \\o/");
			callback(null);
		}
	})
};

var get_ip_from_container = function (container, callback) {
	container.inspect( function (err, data) {
		if ( err ) {
			throw err;
		}

		get_ip_from_data(data, callback);
	});
};

var get_ip_from_data = function (data, callback) {
	var container_id = data.Id;
	var networks = data.NetworkSettings.Networks;

	if ( Object.keys(networks).length != 1 ) {
		callback( new Error("An error occured while parsing networks of container " + container_id + " ( probably too many networks )"), null );
	} else {
		callback( null, networks[Object.keys(networks)[0]].IPAddress );
	}
};

var stop_container = function (user) {
	var container_name = get_user_container_name(user);
	log.info("Stopping container " + container_name);

	var container = docker.getContainer(container_name);
	container.inspect( user, function (err, data) {
		if ( err ) {
			throw( err );
		}

		if ( data.State.Running == true ) {
			// Container is stopped
			container.stop( { t: config.docker.wait_before_kill }, function () {} );
		}
	});

};


module.exports = {
	get_user_container_name: get_user_container_name,
	setup_container: setup_container,
	stop_container: stop_container
};
