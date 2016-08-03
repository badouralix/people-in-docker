## issues

 - le problème du hot reload de /etc/passwd : supposons que l'on mette à jour /etc/passwd sur l'hôte,
   alors il n'est pas mis à jour dans un container ayant le volume /etc/passwd:/etc/passwd:ro...
   ( /!\ bind de fichiers et non de dossiers /!\ )
 - l'application crash quand le container node-proxy est stoppé, à cause des timeout qui ne sont pas encore exécutés
   solutions envisageables : 
   * exécuter tous les timeout au SIGTERM
   * utiliser un container tiers pour gérer l'extinction des containers spwan par l'application 
 - il faut pull l'image docker utilisée dans l'app avant de lancer l'app ( pas de pull automatique si l'image n'existe pas sur le disque )


## features

 - etc-nginx est un dossier bindé plutôt que juste certains fichiers pour permettre la mise à jour dans recréer les containers 
   ( quand le dev sera fini, passer aux fichiers )
 - traiter les people en ~
 - pas grave si le node-proxy redémarre et ne stoppe plus les containers inutilisés : ils seront stoppés à la requête suivante + timeout
 - utiliser le node-proxy pour catch les GET /icons ( moche, archi à revoir... ) : beaucoup plus rapide que faire une requête en plus sur un apache
 - pour une image httpd : on utilise un AliasMatch dans le httpd.conf en plus mod_userdir qui nécessiterait /etc/passwd


## to-do

 - ajouter un header au passage du proxy à vérifier dans le apache-user
 - faire une api permettant de récupérer la liste des user, les routes, etc...
 - proprifier la façon de récupérer le network name
 - attention aux permissions dans les dossiers / fichiers montés
 - log la véritable ip du client côté node
 - attention aux permissions des dossiers public_html, private,... ( nginx exécuté par... nginx ) ( vérifier le comportement pour apache )
 - logrotate
 - attention UTC dans les logs node-proxy ( moment.js ? )
 - pour le nginx-proxy : https://stackoverflow.com/questions/27959860/how-to-merge-host-folder-with-container-folder-in-docker
 - config pour la variable t ( stop_container )
 - revoir config.js ( notamment pour config.docker... )
 - traiter err dans la callback de container.stop
 - ajouter l'heure de timeout du container dans le log.silly
 - gérer les private et le php
 - trouver une solution pour certs/ dans .gitignore et docker-compose.yml ( docker-compose.yml.sample ? )
 - ajouter une license
 - segmenter le projet
 - faire la doc et en anglais !!!!!
 - faire des sample de conf de sites nginx et apache
 - utiliser le node-proxy pour catcher les erreurs des apache-user
 - remplacer les throw(err) par des log.error(err)
 - ajouter la possibilité de mettre un robot.txt
 - ajouter une variable de config pour le workdir des user containers, pour le log dir, pour le dossier dans lequel est monté PEOPLE_SYNC_DIR
 - prendre en compte les custom entrypoint
 - faire un script d'installation automatique


## done

 - proprifier le require('./proxy')
 - faire la config dans un config.js
 - regarder pour un console debug
 - éviter PEOPLE ETC NGINX... problème à moitié résolu en utilisant $PWD : il faut lancer docker-compose up dans le bon dossier
 - utiliser un volume pour les certificats ( attention à la conf .well-known pour let's encrypt sur le proxy frontal )
 - ajouter un label aux containers créés par le node-proxy
 - faire en sorte d'attendre que nginx démarre dans les containers ( erreur 502 ) : résolution temporaire : relancer une connexion après un certain lapse de temps
 - vérifier l'input username ( quitte à tr )
 - log du node-proxy dans des fichiers ( possible avec winston ) ( majuscules dans winston ? )
 - vérifier dans le node proxy que l'utilisateur à un UID autorisé ; ajouter une config ( range ou min / max )
 - séparer le code en un fichier proxy.js et un fichier docker-wrapper.js
 - éteindre les containers après une certaine durée d'inactivité
 - config pour le timeout ( stop_container )
 - utilisation d'un json pour enregistrer les timeout : problablement une erreur quand l'username contient des caractères spéciaux 
 - utiliser un env_file pour le docker-compose
 - workdir dans le docker-compose pour avoir la commande `npm start`
 - utiliser un start-up script pour les apache-user pour bind le dossier contenant la conf, copier les fichiers et ensuite seulement démarrer apache
   ( parce que pour l'instant c'est statique, et il faut spawn un nouveau container pour charger la nouvelle conf... )
 - rendre le wrapper indépendant du serveur http des user ( attention à ce qui est écrit en dur... )
 - gérer les cas des containers created / pause etc...
 

## left aside

 - faire du haproxy pour le proxy frontal
 - voir pour les stats haproxy ( port 8080 )
 - essayer de monter des fichiers via l'api docker
