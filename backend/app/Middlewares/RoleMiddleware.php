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
            Response::unauthorized('Non authentifiÃ©');
        }

        if ($request->user['role'] !== $role) {
            Response::forbidden("RÃ´le '{$role}' requis pour cette action");
        }
    }
}