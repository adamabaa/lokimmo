<?php

declare(strict_types=1);

return [
    'name'       => $_ENV['APP_NAME']       ?? 'Lokimmo',
    'env'        => $_ENV['APP_ENV']        ?? 'development',
    'url'        => $_ENV['APP_URL']        ?? 'http://localhost',
    'jwt_secret' => $_ENV['JWT_SECRET']     ?? '',
    'jwt_exp'    => (int)($_ENV['JWT_EXPIRATION'] ?? 86400),
];