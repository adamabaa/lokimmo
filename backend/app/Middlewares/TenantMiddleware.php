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
        '/api/auth/login',    // â† ajouter
        '/api/super/login',
        '/api/portal/login',
        '/api/owner-portal/login',
    ];

    public static function handle(Request $request): void
    {
        $uri = $request->getUri();

        // Routes publiques â€” pas de tenant
        if (in_array($uri, self::PUBLIC_ROUTES, true)) {
            return;
        }

        // Routes Super Admin â€” pas de tenant
        if (str_starts_with($uri, '/api/super/')) {
            return;
        }

        // Prioriser le header X-Agency-Slug (frontend React)
        $slug = $request->getHeader('x-agency-slug');

        // Fallback subdomain uniquement en local (pas sur Render/production)
        if (empty($slug)) {
            $sub = $request->getSubdomain();
            if (
                !empty($sub) &&
                $sub !== 'localhost' &&
                !str_contains($sub, 'onrender') &&
                !str_contains($sub, 'vercel')
            ) {
                $slug = $sub;
            }
        }

        if (empty($slug)) {
            Response::error('Agence non identifiÃ©e', 400);
            exit;
        }

        $pdo  = Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT id, is_active FROM agencies WHERE slug = ? LIMIT 1'
        );
        $stmt->execute([$slug]);
        $agency = $stmt->fetch();

        if (!$agency) {
            Response::notFound("Agence '{$slug}' introuvable");
            exit;
        }

        if (!(bool) $agency['is_active']) {
            Response::error('Ce compte agence est dÃ©sactivÃ©', 403);
            exit;
        }

        $request->agencyId = (int) $agency['id'];
    }
}