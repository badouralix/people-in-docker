/**
 * Created by badouralix on 25/07/16.
 */
'use strict';

var os      = require('os');
var config  = {};

config.app          = {};
config.app.port     = process.env.PORT      || 8080;

config.log          = {};
config.log.level    = process.env.LOG_LEVEL || 'info';

config.proxy                    = {};
config.proxy.username_regex     = '^[a-z_][a-z0-9_-]*[$]?$';
config.proxy.uid_min            = 1000;
config.proxy.wait_after_refused = 10;
config.proxy.container_timeout  = 600000;   // default timeout is 10min

config.docker                   = {};
config.docker.socket            = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
config.docker.image_name        = process.env.PEOPLE_CONTAINER_IMAGE            || 'nginx:1.11-alpine';
config.docker.log_suffix        = process.env.PEOPLE_CONTAINER_LOG_SUFFIX       || '-log';
config.docker.container_prefix  = process.env.PEOPLE_CONTAINER_PREFIX           || 'people_user-';
config.docker.labels_prefix     = process.env.PEOPLE_CONTAINER_LABELS_PREFIX    || os.hostname();
config.docker.cmd               = process.env.PEOPLE_CMD                        || './startup.sh';
config.docker.wait_before_kill  = 20;       // number of seconds to wait before killing the container

module.exports = config;
