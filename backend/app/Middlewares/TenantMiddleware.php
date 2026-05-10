<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

class TenantMiddleware
{
    private const PUBLIC_ROUTES = [
        '/api/health',
        '/api/auth/register',
        '/api/super/login',
    ];

    public static function handle(Request $request): void
    {
        $uri = $request->getUri();

        // Routes publiques — pas de tenant
        if (in_array($uri, self::PUBLIC_ROUTES, true)) {
            return;
        }

        // Routes Super Admin — pas de tenant
        if (str_starts_with($uri, '/api/super/')) {
            return;
        }

        $slug = $request->getSubdomain();

        if (empty($slug) || $slug === 'localhost') {
            $slug = $request->getHeader('x-agency-slug');
        }

        if (empty($slug)) {
            Response::error('Agence non identifiée', 400);
        }

        $pdo  = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT id, is_active FROM agencies WHERE slug = ? LIMIT 1'
        );
        $stmt->execute([$slug]);
        $agency = $stmt->fetch();

        if (!$agency) {
            Response::notFound("Agence '{$slug}' introuvable");
        }

        if (!(bool) $agency['is_active']) {
            Response::error('Ce compte agence est désactivé', 403);
        }

        $request->agencyId = (int) $agency['id'];
    }
}