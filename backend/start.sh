#!/bin/bash
# Démarrer php-fpm en arrière-plan
php-fpm -D

# Démarrer nginx au premier plan (Render détecte le port 80)
nginx -g "daemon off;"