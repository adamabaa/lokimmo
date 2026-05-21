<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Models\Property;
use App\Models\Owner;
use App\Models\Tenant;
use App\Models\Contract;
use App\Models\Payment;

class DashboardController extends BaseController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function stats(Request $request): void
    {
        $this->authenticate($request);
        $agencyId = $request->agencyId;

        $propertyModel = new Property();
        $ownerModel    = new Owner();
        $tenantModel   = new Tenant();
        $contractModel = new Contract();
        $paymentModel  = new Payment();

        $month = (int) date('m');
        $year  = (int) date('Y');

        // Payment counts
        $stmt = $this->db->prepare(
            "SELECT
                SUM(CASE WHEN status = 'paid'    THEN 1 ELSE 0 END) as paid,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'late'    THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial
             FROM payments
             WHERE agency_id = ? AND deleted_at IS NULL"
        );
        $stmt->execute([$agencyId]);
        $paymentCounts = $stmt->fetch() ?: [];

        // Revenus par mois (8 derniers mois)
        $stmt = $this->db->prepare(
            "SELECT MONTH(payment_date) as month,
                    YEAR(payment_date)  as year,
                    SUM(amount_paid)    as total
             FROM payments
             WHERE agency_id = ?
               AND status IN ('paid', 'partial')
               AND payment_date >= DATE_SUB(NOW(), INTERVAL 8 MONTH)
               AND deleted_at IS NULL
             GROUP BY YEAR(payment_date), MONTH(payment_date)
             ORDER BY year ASC, month ASC"
        );
        $stmt->execute([$agencyId]);
        $revenueByMonth = $stmt->fetchAll();

        Response::json([
            'properties'       => $propertyModel->getStatsByAgency($agencyId),
            'owners'           => $ownerModel->countByAgency($agencyId),
            'tenants'          => $tenantModel->countByAgency($agencyId),
            'active_contracts' => count($contractModel->findActive($agencyId)),
            'late_payments'    => count($paymentModel->findLate($agencyId)),
            'monthly_revenue'  => $paymentModel->getTotalByMonth($agencyId, $month, $year),
            'revenue_period'   => 'Revenus ' . date('F Y'),
            'payment_counts'   => [
                'paid'    => (int) ($paymentCounts['paid']    ?? 0),
                'pending' => (int) ($paymentCounts['pending'] ?? 0),
                'late'    => (int) ($paymentCounts['late']    ?? 0),
                'partial' => (int) ($paymentCounts['partial'] ?? 0),
            ],
            'revenue_by_month' => $revenueByMonth,
        ]);
    }
}