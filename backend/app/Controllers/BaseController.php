<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Middlewares\AuthMiddleware;
use App\Middlewares\RoleMiddleware;

abstract class BaseController
{
    protected function authenticate(Request $request): array
    {
        return AuthMiddleware::handle($request);
    }

    protected function requireAdmin(Request $request): array
    {
        $user = $this->authenticate($request);
        RoleMiddleware::requireRole($request, 'admin');
        return $user;
    }

    protected function validateId(mixed $id): int
    {
        $id = (int) $id;
        if ($id <= 0) {
            Response::error('ID invalide', 422);
        }
        return $id;
    }
}