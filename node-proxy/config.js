/**
 * Created by badouralix on 25/07/16.
 */
'use strict';

var os      = require('os');
var config  = {};

config.app          = {};
config.app.port     = process.env.PORT || 8080;

config.log          = {};
config.log.level    = process.env.LOG_LEVEL || 'debug';

config.proxy                    = {};
config.proxy.docker_socket      = process.env.DOCKER_SOCKET                     || '/var/run/docker.sock';
config.proxy.image_name         = process.env.PEOPLE_CONTAINER_IMAGE            || 'nginx:1.11-alpine';
config.proxy.log_suffix         = process.env.PEOPLE_CONTAINER_LOG_SUFFIX       || '-log';
config.proxy.container_prefix   = process.env.PEOPLE_CONTAINER_PREFIX           || 'people_nginx-';
config.proxy.labels_prefix      = process.env.PEOPLE_CONTAINER_LABELS_PREFIX    || os.hostname();
config.proxy.wait_after_refused = 500;
config.proxy.username_regex     = '^[a-z_][a-z0-9_-]*[$]?$';
config.proxy.uid_min            = 1000;
config.proxy.container_timeout  = 600000;   // default timeout is 10min

module.exports = config;
