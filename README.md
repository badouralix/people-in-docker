people-in-docker
================


This repository contains a fully integrated stack to run a web server for each UNIX user (see [Apache UserDir](https://httpd.apache.org/docs/2.4/fr/howto/public_html.html)).


## Project

This project is divided in three parts, corresponding to the three subfolders :

 - `nginx-proxy/` : the front-end proxy
 - `node-proxy/`  : a node app managing users' containers
 - `http-server/` : the web server spawned for each UNIX user within a Docker container


## Installation

See [INSTALL.md](INSTALL.md)


## License

All contents licensed under the [WTFPL](LICENSE)
