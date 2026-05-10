<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Services\BillingService;
use App\Services\LogService;

class BillingController extends BaseController
{
    private \PDO           $db;
    private BillingService $billing;

    public function __construct()
    {
        $this->db      = Database::getInstance();
        $this->billing = new BillingService();
    }

    /**
     * GET /api/billing/plan
     * Plan actuel de l'agence
     */
    public function currentPlan(Request $request): void
    {
        $this->authenticate($request);

        $plan  = $this->billing->getAgencyPlan($request->agencyId);
        $usage = $this->billing->getUsageStats($request->agencyId);

        // Récupérer tous les plans disponibles
        $stmt = $this->db->prepare(
            'SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC'
        );
        $stmt->execute();
        $plans = $stmt->fetchAll();

        Response::json([
            'current_plan' => $plan,
            'usage'        => $usage,
            'plans'        => $plans,
        ]);
    }

    /**
     * GET /api/billing/invoices
     * Factures de l'agence
     */
    public function invoices(Request $request): void
    {
        $this->authenticate($request);

        $stmt = $this->db->prepare(
            'SELECT i.*, p.name AS plan_name, p.slug AS plan_slug
             FROM invoices i
             LEFT JOIN subscription_plans p ON p.id = i.plan_id
             WHERE i.agency_id = ?
             ORDER BY i.created_at DESC'
        );
        $stmt->execute([$request->agencyId]);

        Response::json($stmt->fetchAll());
    }

    /**
     * GET /api/super/billing/plans
     * Tous les plans — Super Admin
     */
    public function plans(Request $request): void
    {
        \App\Middlewares\SuperAdminMiddleware::handle($request);

        $stmt = $this->db->prepare(
            'SELECT p.*,
                    COUNT(s.id) as subscriber_count
             FROM subscription_plans p
             LEFT JOIN agency_subscriptions s ON s.plan_id = p.id
               AND s.status = "active"
             GROUP BY p.id
             ORDER BY p.price ASC'
        );
        $stmt->execute();

        Response::json($stmt->fetchAll());
    }

    /**
     * GET /api/super/billing/invoices
     * Toutes les factures — Super Admin
     */
    public function allInvoices(Request $request): void
    {
        \App\Middlewares\SuperAdminMiddleware::handle($request);

        $page    = max(1, (int) ($_GET['page']   ?? 1));
        $limit   = 20;
        $offset  = ($page - 1) * $limit;
        $status  = $_GET['status'] ?? '';

        $where  = ['1=1'];
        $params = [];

        if (!empty($status)) {
            $where[]  = 'i.status = ?';
            $params[] = $status;
        }

        $whereStr = implode(' AND ', $where);

        $countStmt = $this->db->prepare(
            "SELECT COUNT(*) FROM invoices i WHERE {$whereStr}"
        );
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $this->db->prepare(
            "SELECT i.*,
                    a.name AS agency_name,
                    a.slug AS agency_slug,
                    p.name AS plan_name,
                    p.slug AS plan_slug
            FROM invoices i
            LEFT JOIN agencies           a ON a.id = i.agency_id
            LEFT JOIN subscription_plans p ON p.id = i.plan_id
            WHERE {$whereStr}
            ORDER BY i.created_at DESC
            LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute($params);

        Response::json([
            'invoices'    => $stmt->fetchAll(),
            'total'       => $total,
            'page'        => $page,
            'total_pages' => max(1, (int) ceil($total / $limit)),
        ]);
    }

    /**
     * PUT /api/super/billing/invoices/{id}/pay
     * Marquer facture comme payée — Super Admin
     */
    public function markPaid(Request $request, array $params): void
    {
        $superAdmin = \App\Middlewares\SuperAdminMiddleware::handle($request);
        $id         = $this->validateId($params['id']);
        $data       = $request->all();

        $this->billing->markInvoicePaid($id, $data['payment_method'] ?? 'cash');

        // Récupérer la facture pour le log
        $stmt = $this->db->prepare('SELECT * FROM invoices WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $invoice = $stmt->fetch() ?: [];

        LogService::logSuperAdmin(
            $superAdmin['id'],
            'mark_invoice_paid',
            "Facture {$invoice['invoice_number']} marquée payée",
            $invoice['agency_id'] ?? null
        );

        Response::json(null, 'Facture marquée comme payée');
    }

    /**
     * POST /api/super/billing/invoices
     * Créer une facture manuellement — Super Admin
     */
    public function createInvoice(Request $request): void
    {
        $superAdmin = \App\Middlewares\SuperAdminMiddleware::handle($request);
        $data       = $request->all();

        if (empty($data['agency_id']) || empty($data['plan_id'])) {
            Response::error('agency_id et plan_id requis', 422);
        }

        // Récupérer le prix du plan
        $stmt = $this->db->prepare(
            'SELECT price FROM subscription_plans WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$data['plan_id']]);
        $plan = $stmt->fetch();

        if (!$plan) Response::notFound('Plan introuvable');

        $invoiceId = $this->billing->createInvoice(
            (int) $data['agency_id'],
            (int) $data['plan_id'],
            (float) ($data['amount'] ?? $plan['price']),
            $data['period_start'] ?? date('Y-m-d'),
            $data['period_end']   ?? date('Y-m-d', strtotime('+1 month'))
        );

        LogService::logSuperAdmin(
            $superAdmin['id'],
            'create_invoice',
            "Facture créée pour agence ID {$data['agency_id']}",
            (int) $data['agency_id']
        );

        Response::json(['id' => $invoiceId], 'Facture créée', 201);
    }

    /**
     * GET /api/super/billing/stats
     * Statistiques facturation — Super Admin
     */
    public function stats(Request $request): void
    {
        \App\Middlewares\SuperAdminMiddleware::handle($request);

        // Revenus par mois
        $stmt = $this->db->prepare(
            'SELECT DATE_FORMAT(created_at, "%Y-%m") as month,
                    COUNT(*) as count,
                    SUM(amount) as total
            FROM invoices
            WHERE status = "paid"
            GROUP BY DATE_FORMAT(created_at, "%Y-%m")
            ORDER BY month ASC
            LIMIT 6'
        );
        $stmt->execute();
        $revenueByMonth = $stmt->fetchAll();

        // Total revenus
        $stmt = $this->db->prepare(
            'SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = "paid"'
        );
        $stmt->execute();
        $totalRevenue = (float) $stmt->fetchColumn();

        // Factures en attente
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total
            FROM invoices WHERE status IN ("sent", "draft", "overdue")'
        );
        $stmt->execute();
        $pending = $stmt->fetch() ?: [];

        // Abonnés par plan
        $stmt = $this->db->prepare(
            'SELECT p.name, p.slug, p.price,
                    COUNT(s.id) as count
            FROM subscription_plans p
            LEFT JOIN agency_subscriptions s ON s.plan_id = p.id
            GROUP BY p.id
            ORDER BY p.price ASC'
        );
        $stmt->execute();
        $byPlan = $stmt->fetchAll();

        Response::json([
            'total_revenue'    => $totalRevenue,
            'pending_count'    => (int) ($pending['cnt']   ?? 0),
            'pending_amount'   => (float) ($pending['total'] ?? 0),
            'revenue_by_month' => $revenueByMonth,
            'by_plan'          => $byPlan,
        ]);
    }
}