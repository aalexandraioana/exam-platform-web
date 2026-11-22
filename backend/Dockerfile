# One image for local development (target `dev`) and Render (target `prod`), D-014 / D-036.
FROM php:8.4-apache AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev unzip git \
    && docker-php-ext-install pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Apache serves Laravel's public/ directory.
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && a2enmod rewrite

WORKDIR /var/www/html
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]

# Local: code is mounted from the host and served by `php artisan serve` (see docker-compose.yml).
FROM base AS dev
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

# Render: code baked into the image, production dependencies only, served by Apache.
FROM base AS prod
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress \
    && chown -R www-data:www-data storage bootstrap/cache
CMD ["apache2-foreground"]
