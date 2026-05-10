<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Request;
use App\Core\Response;

class RoleMiddleware
{
    public static function requireRole(Request $request, string $role): void
    {
        if ($request->user === null) {
            Response::unauthorized('Non authentifié');
        }

        if ($request->user['role'] !== $role) {
            Response::forbidden("Rôle '{$role}' requis pour cette action");
        }
    }
}