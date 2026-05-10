<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Services\JwtService;
use App\Services\ValidationService;
use App\Middlewares\OwnerPortalMiddleware;

class OwnerPortalController extends BaseController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * POST /api/owner-portal/login
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

        $stmt = $this->db->prepare(
            'SELECT id, agency_id, first_name, last_name,
                    email, portal_email, portal_password, portal_active
             FROM owners
             WHERE (portal_email = ? OR email = ?)
               AND agency_id = ?
               AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([
            $data['email'],
            $data['email'],
            $request->agencyId,
        ]);
        $owner = $stmt->fetch();

        if (!$owner) {
            Response::unauthorized('Email ou mot de passe incorrect');
        }

        if (!(bool) $owner['portal_active']) {
            Response::forbidden('Votre accès au portail n\'est pas activé. Contactez votre agence.');
        }

        if (!password_verify($data['password'], $owner['portal_password'])) {
            Response::unauthorized('Email ou mot de passe incorrect');
        }

        $this->db->prepare(
            'UPDATE owners SET last_portal_login = NOW() WHERE id = ?'
        )->execute([$owner['id']]);

        $token = JwtService::generateOwner($owner['id'], $owner['agency_id']);

        Response::json([
            'token' => $token,
            'owner' => [
                'id'         => $owner['id'],
                'first_name' => $owner['first_name'],
                'last_name'  => $owner['last_name'],
                'email'      => $owner['portal_email'] ?? $owner['email'],
            ],
        ], 'Connexion réussie');
    }

    /**
     * GET /api/owner-portal/me
     */
    public function me(Request $request): void
    {
        $auth = OwnerPortalMiddleware::handle($request);

        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email, phone,
                    address, id_card_number, last_portal_login
             FROM owners
             WHERE id = ? AND agency_id = ? AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([$auth['id'], $auth['agency_id']]);
        $owner = $stmt->fetch();

        if (!$owner) Response::notFound('Propriétaire introuvable');

        Response::json($owner);
    }

    /**
     * GET /api/owner-portal/properties
     * Mes biens avec stats
     */
    public function properties(Request $request): void
    {
        $auth = OwnerPortalMiddleware::handle($request);

        $stmt = $this->db->prepare(
            'SELECT
                p.*,
                -- Locataire actif
                CONCAT(t.first_name, " ", t.last_name) AS tenant_name,
                t.phone AS tenant_phone,
                -- Revenus totaux
                COALESCE((
                    SELECT SUM(py.amount_paid)
                    FROM payments py
                    LEFT JOIN contracts c2 ON c2.id = py.contract_id
                    WHERE c2.property_id = p.id
                      AND py.status IN ("paid", "partial")
                ), 0) AS total_revenue,
                -- Revenus ce mois
                COALESCE((
                    SELECT SUM(py.amount_paid)
                    FROM payments py
                    LEFT JOIN contracts c3 ON c3.id = py.contract_id
                    WHERE c3.property_id = p.id
                      AND py.status IN ("paid", "partial")
                      AND py.period_month = MONTH(NOW())
                      AND py.period_year  = YEAR(NOW())
                ), 0) AS revenue_this_month,
                -- Dépenses totales
                COALESCE((
                    SELECT SUM(e.amount)
                    FROM property_expenses e
                    WHERE e.property_id = p.id
                      AND e.deleted_at IS NULL
                ), 0) AS total_expenses,
                -- Paiements en retard
                COALESCE((
                    SELECT COUNT(*)
                    FROM payments py
                    LEFT JOIN contracts c4 ON c4.id = py.contract_id
                    WHERE c4.property_id = p.id
                      AND py.status = "late"
                ), 0) AS late_payments_count
             FROM properties p
             LEFT JOIN contracts c ON c.property_id = p.id
               AND c.status = "active" AND c.deleted_at IS NULL
             LEFT JOIN tenants t ON t.id = c.tenant_id
             WHERE p.owner_id  = ?
               AND p.agency_id = ?
               AND p.deleted_at IS NULL
             ORDER BY p.created_at DESC'
        );
        $stmt->execute([$auth['id'], $auth['agency_id']]);

        Response::json($stmt->fetchAll());
    }

    /**
     * GET /api/owner-portal/properties/{id}/payments
     * Paiements d'un bien
     */
    public function propertyPayments(Request $request, array $params): void
    {
        $auth = OwnerPortalMiddleware::handle($request);
        $id   = $this->validateId($params['id']);

        // Vérifier que le bien appartient au propriétaire
        $stmt = $this->db->prepare(
            'SELECT id FROM properties
             WHERE id = ? AND owner_id = ? AND agency_id = ? AND deleted_at IS NULL'
        );
        $stmt->execute([$id, $auth['id'], $auth['agency_id']]);
        if (!$stmt->fetch()) Response::notFound('Bien introuvable');

        $stmt = $this->db->prepare(
            'SELECT py.*,
                    CONCAT(t.first_name, " ", t.last_name) AS tenant_name
             FROM payments py
             LEFT JOIN contracts c ON c.id = py.contract_id
             LEFT JOIN tenants   t ON t.id = c.tenant_id
             WHERE c.property_id = ?
               AND py.agency_id  = ?
             ORDER BY py.period_year DESC, py.period_month DESC'
        );
        $stmt->execute([$id, $auth['agency_id']]);

        Response::json($stmt->fetchAll());
    }

    /**
     * GET /api/owner-portal/properties/{id}/expenses
     * Dépenses d'un bien
     */
    public function propertyExpenses(Request $request, array $params): void
    {
        $auth = OwnerPortalMiddleware::handle($request);
        $id   = $this->validateId($params['id']);

        $stmt = $this->db->prepare(
            'SELECT id FROM properties
             WHERE id = ? AND owner_id = ? AND agency_id = ? AND deleted_at IS NULL'
        );
        $stmt->execute([$id, $auth['id'], $auth['agency_id']]);
        if (!$stmt->fetch()) Response::notFound('Bien introuvable');

        $stmt = $this->db->prepare(
            'SELECT * FROM property_expenses
             WHERE property_id = ? AND agency_id = ? AND deleted_at IS NULL
             ORDER BY expense_date DESC'
        );
        $stmt->execute([$id, $auth['agency_id']]);

        Response::json($stmt->fetchAll());
    }

    /**
     * GET /api/owner-portal/summary
     * Bilan financier global
     */
    public function summary(Request $request): void
    {
        $auth = OwnerPortalMiddleware::handle($request);

        // Total revenus
        $stmt = $this->db->prepare(
            'SELECT COALESCE(SUM(py.amount_paid), 0) as total
             FROM payments py
             LEFT JOIN contracts c ON c.id = py.contract_id
             LEFT JOIN properties p ON p.id = c.property_id
             WHERE p.owner_id = ? AND py.agency_id = ?
               AND py.status IN ("paid", "partial")'
        );
        $stmt->execute([$auth['id'], $auth['agency_id']]);
        $totalRevenue = (float) $stmt->fetchColumn();

        // Total dépenses
        $stmt = $this->db->prepare(
            'SELECT COALESCE(SUM(e.amount), 0) as total
             FROM property_expenses e
             LEFT JOIN properties p ON p.id = e.property_id
             WHERE p.owner_id = ? AND e.agency_id = ? AND e.deleted_at IS NULL'
        );
        $stmt->execute([$auth['id'], $auth['agency_id']]);
        $totalExpenses = (float) $stmt->fetchColumn();

        // Nombre de biens
        $stmt = $this->db->prepare(
            'SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = "rented"      THEN 1 ELSE 0 END) as rented,
                SUM(CASE WHEN status = "available"   THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = "maintenance" THEN 1 ELSE 0 END) as maintenance
             FROM properties
             WHERE owner_id = ? AND agency_id = ? AND deleted_at IS NULL'
        );
        $stmt->execute([$auth['id'], $auth['agency_id']]);
        $properties = $stmt->fetch();

        // Paiements en retard
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) as total
             FROM payments py
             LEFT JOIN contracts c ON c.id = py.contract_id
             LEFT JOIN properties p ON p.id = c.property_id
             WHERE p.owner_id = ? AND py.agency_id = ? AND py.status = "late"'
        );
        $stmt->execute([$auth['id'], $auth['agency_id']]);
        $latePayments = (int) $stmt->fetchColumn();

        Response::json([
            'total_revenue'  => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_income'     => $totalRevenue - $totalExpenses,
            'properties'     => $properties,
            'late_payments'  => $latePayments,
        ]);
    }

    /**
     * GET /api/owner-portal/agency
     */
    public function agency(Request $request): void
    {
        OwnerPortalMiddleware::handle($request);

        $stmt = $this->db->prepare(
            'SELECT name, email, phone, address,
                    website, primary_color, logo_url
             FROM agencies WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$request->agencyId]);

        Response::json($stmt->fetch());
    }
}