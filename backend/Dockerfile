FROM php:8.2-fpm

# Extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip curl \
    && docker-php-ext-install pdo pdo_mysql zip

# Dossier de travail
WORKDIR /var/www/html

# Copier les fichiers
COPY . .

# Permissions storage
RUN chmod -R 775 storage

EXPOSE 9000
CMD ["php-fpm"]