<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Request;
use App\Core\Response;
use App\Services\JwtService;

class SuperAdminMiddleware
{
    public static function handle(Request $request): array
    {
        $token = JwtService::extractFromHeader(
            $request->getHeader('authorization')
        );

        if ($token === null) {
            Response::unauthorized('Token super admin manquant');
            exit;
        }

        $payload = null;

        try {
            $payload = JwtService::decodeSuperAdmin($token);
        } catch (\RuntimeException $e) {
            Response::unauthorized($e->getMessage());
            exit;
        }

        $request->user = [
            'id'   => (int) $payload['super_admin_id'],
            'type' => 'super_admin',
            'role' => 'super_admin',
        ];

        return $request->user;
    }
}