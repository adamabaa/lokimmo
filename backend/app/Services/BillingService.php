<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Services\CacheService;

class BillingService
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Vérifier si une agence peut ajouter un bien
     */
    public function canAddProperty(int $agencyId): array
    {
        $plan = $this->getAgencyPlan($agencyId);
        if (!$plan) return ['allowed' => true, 'reason' => ''];

        if ($plan['status'] === 'expired') {
            return ['allowed' => false, 'reason' => 'Votre abonnement a expiré'];
        }

        $count = $this->countResource($agencyId, 'properties');

        if ($count >= $plan['max_properties']) {
            return [
                'allowed' => false,
                'reason'  => "Limite atteinte ({$plan['max_properties']} biens max). Passez au plan supérieur.",
                'upgrade' => true,
            ];
        }

        return ['allowed' => true, 'reason' => ''];
    }

    /**
     * Vérifier si une agence peut ajouter un locataire
     */
    public function canAddTenant(int $agencyId): array
    {
        $plan = $this->getAgencyPlan($agencyId);
        if (!$plan) return ['allowed' => true, 'reason' => ''];

        $count = $this->countResource($agencyId, 'tenants');

        if ($count >= $plan['max_tenants']) {
            return [
                'allowed' => false,
                'reason'  => "Limite atteinte ({$plan['max_tenants']} locataires max). Passez au plan supérieur.",
                'upgrade' => true,
            ];
        }

        return ['allowed' => true, 'reason' => ''];
    }

    /**
     * Vérifier si une agence peut ajouter un utilisateur
     */
    public function canAddUser(int $agencyId): array
    {
        $plan = $this->getAgencyPlan($agencyId);
        if (!$plan) return ['allowed' => true, 'reason' => ''];

        $count = $this->countResource($agencyId, 'users');

        if ($count >= $plan['max_users']) {
            return [
                'allowed' => false,
                'reason'  => "Limite atteinte ({$plan['max_users']} agents max). Passez au plan supérieur.",
                'upgrade' => true,
            ];
        }

        return ['allowed' => true, 'reason' => ''];
    }

    /**
     * Récupérer le plan actif d'une agence
     */
    public function getAgencyPlan(int $agencyId): ?array
    {
        $cacheKey = "agency_plan_{$agencyId}";

        // Lire depuis cache (5 minutes)
        $cached = CacheService::get($cacheKey);
        if ($cached !== null) return $cached;

        $stmt = $this->db->prepare(
            'SELECT s.*, p.name AS plan_name, p.slug AS plan_slug,
                    p.price, p.max_properties, p.max_users,
                    p.max_owners, p.max_tenants, p.features
            FROM agency_subscriptions s
            LEFT JOIN subscription_plans p ON p.id = s.plan_id
            WHERE s.agency_id = ? LIMIT 1'
        );
        $stmt->execute([$agencyId]);
        $plan = $stmt->fetch() ?: null;

        // Mettre en cache 5 minutes
        CacheService::set($cacheKey, $plan, 300);

        return $plan;
    }

    /**
     * Récupérer les statistiques d'usage
     */
    public function getUsageStats(int $agencyId): array
    {
        $plan = $this->getAgencyPlan($agencyId);

        return [
            'properties' => [
                'used' => $this->countResource($agencyId, 'properties'),
                'max'  => $plan['max_properties'] ?? 999999,
            ],
            'tenants' => [
                'used' => $this->countResource($agencyId, 'tenants'),
                'max'  => $plan['max_tenants'] ?? 999999,
            ],
            'users' => [
                'used' => $this->countResource($agencyId, 'users'),
                'max'  => $plan['max_users'] ?? 999999,
            ],
            'owners' => [
                'used' => $this->countResource($agencyId, 'owners'),
                'max'  => $plan['max_owners'] ?? 999999,
            ],
        ];
    }

    /**
     * Créer une facture
     */
    public function createInvoice(
        int    $agencyId,
        int    $planId,
        float  $amount,
        string $periodStart,
        string $periodEnd
    ): int {
        $number = 'INV-' . date('Y') . '-' . str_pad(
            (string) ($this->getNextInvoiceNumber()),
            4, '0', STR_PAD_LEFT
        );

        $stmt = $this->db->prepare(
            'INSERT INTO invoices
                (agency_id, plan_id, invoice_number, amount, status,
                 due_date, period_start, period_end)
             VALUES (?, ?, ?, ?, "sent",
                 DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?)'
        );
        $stmt->execute([$agencyId, $planId, $number, $amount, $periodStart, $periodEnd]);

        return (int) $this->db->lastInsertId();
    }

    /**
     * Marquer une facture comme payée
     */
    public function markInvoicePaid(int $invoiceId, string $method = 'cash'): void
    {
        $this->db->prepare(
            'UPDATE invoices
             SET status = "paid", paid_at = NOW(), payment_method = ?
             WHERE id = ?'
        )->execute([$method, $invoiceId]);

        // Étendre l'abonnement d'un mois
        $stmt = $this->db->prepare(
            'SELECT * FROM invoices WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$invoiceId]);
        $invoice = $stmt->fetch();

        if ($invoice) {
            $this->db->prepare(
                'UPDATE agency_subscriptions
                 SET status     = "active",
                     expires_at = DATE_ADD(
                         COALESCE(expires_at, NOW()),
                         INTERVAL 1 MONTH
                     )
                 WHERE agency_id = ?'
            )->execute([$invoice['agency_id']]);
        }
    }

    /**
     * Changer le plan d'une agence
     */
   
    public function changePlan(int $agencyId, string $planSlug): bool
    {
        $stmt = $this->db->prepare(
            'SELECT id, price FROM subscription_plans WHERE slug = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([$planSlug]);
        $plan = $stmt->fetch();

        if (!$plan) return false;

        // Mettre à jour ou créer l'abonnement
        $this->db->prepare(
            'INSERT INTO agency_subscriptions (agency_id, plan_id, status, expires_at)
             VALUES (?, ?, "active", DATE_ADD(NOW(), INTERVAL 1 MONTH))
             ON DUPLICATE KEY UPDATE
                plan_id    = VALUES(plan_id),
                status     = "active",
                expires_at = DATE_ADD(NOW(), INTERVAL 1 MONTH)'
        )->execute([$agencyId, $plan['id']]);

        // Créer une facture si plan payant
        if ($plan['price'] > 0) {
            $this->createInvoice(
                $agencyId,
                (int) $plan['id'],
                (float) $plan['price'],
                date('Y-m-d'),
                date('Y-m-d', strtotime('+1 month'))
            );
        }

        CacheService::forget("agency_plan_{$agencyId}");

        return true;
    }

    // ── Helpers privés ────────────────────────────────────────

    private function countResource(int $agencyId, string $table): int
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM {$table}
             WHERE agency_id = ? AND deleted_at IS NULL"
        );
        $stmt->execute([$agencyId]);
        return (int) $stmt->fetchColumn();
    }

    private function getNextInvoiceNumber(): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM invoices WHERE YEAR(created_at) = YEAR(NOW())'
        );
        $stmt->execute();
        return (int) $stmt->fetchColumn() + 1;
    }

    public function canAddOwner(int $agencyId): array
    {
        $plan = $this->getAgencyPlan($agencyId);
        if (!$plan) return ['allowed' => true, 'reason' => ''];

        if ($plan['status'] === 'expired') {
            return ['allowed' => false, 'reason' => 'Votre abonnement a expiré'];
        }

        $count = $this->countResource($agencyId, 'owners');

        if ($count >= $plan['max_owners']) {
            return [
                'allowed' => false,
                'reason'  => "Limite atteinte ({$plan['max_owners']} propriétaires max). Passez au plan supérieur.",
                'upgrade' => true,
            ];
        }

        return ['allowed' => true, 'reason' => ''];
    }
}