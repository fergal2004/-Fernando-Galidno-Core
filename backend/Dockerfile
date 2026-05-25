FROM php:8.4-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl zip unzip \
    libpq-dev \
    libxml2-dev \
    libonig-dev \
    && docker-php-ext-install pdo pdo_pgsql mbstring xml \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --no-dev --optimize-autoloader \
    && chmod -R 755 storage bootstrap/cache

CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
