FROM php:8.2-fpm

# Extensions PHP + composer + nginx
RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip curl nginx \
    && docker-php-ext-install pdo pdo_mysql zip \
    && curl -sS https://getcomposer.org/installer | php \
    && mv composer.phar /usr/local/bin/composer \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY . .

# Installer les dépendances PHP
RUN composer install --no-dev --optimize-autoloader

# Config nginx
COPY nginx.conf /etc/nginx/sites-available/default

# Permissions
RUN chmod -R 775 storage \
    && chown -R www-data:www-data /var/www/html

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]