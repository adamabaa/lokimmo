<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Request;
use App\Core\Response;
use App\Services\JwtService;

class AuthMiddleware
{
    public static function handle(Request $request): array
    {
        $token = JwtService::extractFromHeader(
            $request->getHeader('authorization')
        );

        if ($token === null) {
            Response::unauthorized('Token d\'authentification manquant');
            exit; // â† dire Ã  PHP que le code s'arrÃªte ici
        }

        $payload = null; // â† initialiser Ã  null

        try {
            $payload = JwtService::decode($token);
        } catch (\RuntimeException $e) {
            Response::unauthorized($e->getMessage());
            exit; // â† idem
        }

        // $payload est forcÃ©ment dÃ©fini ici
        if ((int) $payload['agency_id'] !== $request->agencyId) {
            Response::forbidden('AccÃ¨s non autorisÃ© Ã  cette agence');
        }

        $request->user = [
            'id'        => (int) $payload['user_id'],
            'agency_id' => (int) $payload['agency_id'],
            'role'      => $payload['role'],
        ];

        return $request->user;
    }
}