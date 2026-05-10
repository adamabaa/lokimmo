<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Request;
use App\Core\Response;
use App\Services\JwtService;

class TenantPortalMiddleware
{
    public static function handle(Request $request): array
    {
        $token = JwtService::extractFromHeader(
            $request->getHeader('authorization')
        );

        if ($token === null) {
            Response::unauthorized('Token locataire manquant');
            exit;
        }

        $payload = null;

        try {
            $payload = JwtService::decodeTenant($token);
        } catch (\RuntimeException $e) {
            Response::unauthorized($e->getMessage());
            exit;
        }

        if ((int) $payload['agency_id'] !== $request->agencyId) {
            Response::forbidden('Accès non autorisé');
            exit;
        }

        $request->user = [
            'id'        => (int) $payload['tenant_id'],
            'agency_id' => (int) $payload['agency_id'],
            'type'      => 'tenant',
        ];

        return $request->user;
    }
}