## prerequisite

 - `git`
 - `npm`
 - `docker` and `docker-compose`

## how-to

To configure the stack :

 - in `http-user/` :
   + copy `startup.sh.sample` to `startup.sh` and write the script
     ( this script is run as `CMD` of each user's container, thus it may copy all config files from this folder to the right place before running the http server ) 
 - in `nginx-proxy/` :
   + configure the front proxy by adding conf in `sites-enabled/`
 - in `node-proxy/` :
   + run `npm install` to install modules

 - rewrite `docker-compose.yml` to match your config :
   + configure your environment ( pay particularly attention to `PEOPLE_CONTAINER_IMAGE` which contains the name of the image used for each user ; the image MUST be pulled before running the app )
   + add a volume for certificates if needed

To run the stack :

 - run `docker-compose up -d`
 - to see logs, run : `docker-compose logs -f`
 - to stop the stack : `docker-compose down`
