FROM php:8.2-fpm

# Extensions PHP
RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip curl nginx \
    && docker-php-ext-install pdo pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

# Config nginx
COPY nginx.conf /etc/nginx/sites-available/default

# Dossier de travail
WORKDIR /var/www/html
COPY . .

# Permissions
RUN chmod -R 775 storage \
    && chown -R www-data:www-data /var/www/html

# Script de démarrage
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]