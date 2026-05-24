<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Services\JwtService;
use App\Services\ValidationService;
use App\Middlewares\TenantPortalMiddleware;

class TenantPortalController extends BaseController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * POST /api/portal/login
     * Connexion locataire avec email + mot de passe
     */
    public function login(Request $request): void
    {
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        // Résoudre agency_id depuis le slug (route publique — pas de JWT)
        $agencyId = $request->agencyId;

        if (!$agencyId) {
            $slug = $request->getHeader('x-agency-slug');
            if (!$slug) {
                Response::error('Agence non identifiée', 400);
            }

            $stmt = $this->db->prepare(
                'SELECT id FROM agencies WHERE slug = ? AND is_active = 1 LIMIT 1'
            );
            $stmt->execute([$slug]);
            $agency = $stmt->fetch();

            if (!$agency) {
                Response::error('Agence introuvable', 404);
            }

            $agencyId = (int) $agency['id'];
        }

        $stmt = $this->db->prepare(
            'SELECT id, agency_id, first_name, last_name,
                    email, portal_email, portal_password,
                    portal_active
            FROM tenants
            WHERE (portal_email = ? OR email = ?)
            AND agency_id = ?
            AND deleted_at IS NULL
            LIMIT 1'
        );
        $stmt->execute([
            $data['email'],
            $data['email'],
            $agencyId,
        ]);
        $tenant = $stmt->fetch();

        if (!$tenant) {
            Response::unauthorized('Email ou mot de passe incorrect');
        }

        if (!(bool) $tenant['portal_active']) {
            Response::forbidden('Votre accès au portail n\'est pas activé. Contactez votre agence.');
        }

        if (!password_verify($data['password'], $tenant['portal_password'])) {
            Response::unauthorized('Email ou mot de passe incorrect');
        }

        $this->db->prepare(
            'UPDATE tenants SET last_portal_login = NOW() WHERE id = ?'
        )->execute([$tenant['id']]);

        $token = JwtService::generateTenant(
            $tenant['id'],
            $tenant['agency_id']
        );

        Response::json([
            'token'  => $token,
            'tenant' => [
                'id'         => $tenant['id'],
                'first_name' => $tenant['first_name'],
                'last_name'  => $tenant['last_name'],
                'email'      => $tenant['portal_email'] ?? $tenant['email'],
            ],
        ], 'Connexion réussie');
    }

    /**
     * GET /api/portal/me
     * Profil du locataire connecté
     */
    public function me(Request $request): void
    {
        $auth = TenantPortalMiddleware::handle($request);

        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email,
                    phone, profession, monthly_income,
                    score, last_portal_login
             FROM tenants
             WHERE id = ? AND agency_id = ? AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([$auth['id'], $auth['agency_id']]);
        $tenant = $stmt->fetch();

        if (!$tenant) {
            Response::notFound('Locataire introuvable');
        }

        Response::json($tenant);
    }

    /**
     * GET /api/portal/contract
     * Contrat actif du locataire
     */
    public function contract(Request $request): void
    {
        $auth = TenantPortalMiddleware::handle($request);

        $stmt = $this->db->prepare(
            'SELECT c.*,
                    p.title          AS property_title,
                    p.address        AS property_address,
                    p.city           AS property_city,
                    p.type           AS property_type,
                    p.area_sqm       AS property_area,
                    a.name           AS agency_name,
                    a.email          AS agency_email,
                    a.phone          AS agency_phone,
                    a.primary_color  AS agency_color,
                    a.logo_url       AS agency_logo
             FROM contracts c
             LEFT JOIN properties p ON p.id = c.property_id
             LEFT JOIN agencies   a ON a.id = c.agency_id
             WHERE c.tenant_id  = ?
               AND c.agency_id  = ?
               AND c.status     = \'active\'
               AND c.deleted_at IS NULL
             ORDER BY c.start_date DESC
             LIMIT 1'
        );
        $stmt->execute([$auth['id'], $auth['agency_id']]);
        $contract = $stmt->fetch();

        if (!$contract) {
            Response::notFound('Aucun contrat actif trouvé');
        }

        Response::json($contract);
    }

    /**
     * GET /api/portal/payments
     * Historique des paiements du locataire
     */
    public function payments(Request $request): void
    {
        $auth = TenantPortalMiddleware::handle($request);

        $stmt = $this->db->prepare(
            'SELECT py.*
             FROM payments py
             LEFT JOIN contracts c ON c.id = py.contract_id
             WHERE c.tenant_id = ?
               AND py.agency_id = ?
             ORDER BY py.period_year DESC, py.period_month DESC'
        );
        $stmt->execute([$auth['id'], $auth['agency_id']]);

        Response::json($stmt->fetchAll());
    }

    /**
     * GET /api/portal/agency
     * Infos de l'agence (pour affichage dans le portail)
     */
    public function agency(Request $request): void
    {
        TenantPortalMiddleware::handle($request);

        $stmt = $this->db->prepare(
            'SELECT name, email, phone, address,
                    website, primary_color, logo_url, plan
             FROM agencies WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$request->agencyId]);
        $agency = $stmt->fetch();

        Response::json($agency);
    }
}