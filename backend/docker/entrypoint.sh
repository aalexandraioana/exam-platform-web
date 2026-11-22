#!/bin/sh
set -e

if [ "$APP_ENV" = "production" ]; then
    # Render routes traffic to $PORT; Apache listens on 80 by default.
    if [ -n "$PORT" ]; then
        sed -ri "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf
        sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf
    fi
    php artisan optimize
else
    # Local first run: install dependencies and create a .env with its own key (never committed).
    [ -d vendor ] || composer install --no-interaction --no-progress
    if [ ! -f .env ]; then
        cp .env.example .env
        php artisan key:generate --no-interaction
    fi
fi

# Render's free plan has no pre-deploy step, so migrations run on start (P0 plan).
php artisan migrate --force --no-interaction

exec "$@"
