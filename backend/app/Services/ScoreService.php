<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/**
 * Service de calcul du score locatif
 * Score sur 100 points basé sur plusieurs critères
 */
class ScoreService
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Calcule et met à jour le score d'un locataire
     */
    public function calculate(int $tenantId, int $agencyId): int
    {
        $score = 0;

        // ── 1. Historique paiements (40 pts) ──────────────────
        $score += $this->scorePaymentHistory($tenantId, $agencyId);

        // ── 2. Ratio revenu / loyer (25 pts) ─────────────────
        $score += $this->scoreIncomeRatio($tenantId, $agencyId);

        // ── 3. Ponctualité (20 pts) ───────────────────────────
        $score += $this->scorePunctuality($tenantId, $agencyId);

        // ── 4. Ancienneté (10 pts) ────────────────────────────
        $score += $this->scoreSeniority($tenantId, $agencyId);

        // ── 5. Complétude du profil (5 pts) ───────────────────
        $score += $this->scoreProfile($tenantId, $agencyId);

        // Limiter entre 0 et 100
        $score = max(0, min(100, $score));

        // Sauvegarder le score
        $this->db->prepare(
            'UPDATE tenants SET score = ? WHERE id = ? AND agency_id = ?'
        )->execute([$score, $tenantId, $agencyId]);

        return $score;
    }

    /**
     * Calcule les scores de tous les locataires d'une agence
     */
    public function calculateAll(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id FROM tenants WHERE agency_id = ? AND deleted_at IS NULL'
        );
        $stmt->execute([$agencyId]);
        $tenants = $stmt->fetchAll();

        $results = [];
        foreach ($tenants as $tenant) {
            $results[$tenant['id']] = $this->calculate(
                $tenant['id'],
                $agencyId
            );
        }

        return $results;
    }

    /**
     * Détail du score pour affichage
     */
    public function getDetail(int $tenantId, int $agencyId): array
    {
        return [
            'payment_history' => $this->scorePaymentHistory($tenantId, $agencyId),
            'income_ratio'    => $this->scoreIncomeRatio($tenantId, $agencyId),
            'punctuality'     => $this->scorePunctuality($tenantId, $agencyId),
            'seniority'       => $this->scoreSeniority($tenantId, $agencyId),
            'profile'         => $this->scoreProfile($tenantId, $agencyId),
            'max' => [
                'payment_history' => 40,
                'income_ratio'    => 25,
                'punctuality'     => 20,
                'seniority'       => 10,
                'profile'         => 5,
            ],
        ];
    }

    // ── Critères privés ───────────────────────────────────────

    /**
     * Historique paiements — 40 pts
     * Basé sur le % de paiements réglés
     */
private function scorePaymentHistory(int $tenantId, int $agencyId): int
    {
        $stmt = $this->db->prepare(
            'SELECT
                COUNT(*) as total,
                SUM(CASE WHEN py.status = "paid"    THEN 1 ELSE 0 END) as paid,
                SUM(CASE WHEN py.status = "late"    THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN py.status = "partial" THEN 1 ELSE 0 END) as partial
            FROM payments py
            LEFT JOIN contracts c ON c.id = py.contract_id
            WHERE c.tenant_id = ? AND py.agency_id = ?'
        );
        $stmt->execute([$tenantId, $agencyId]);
        $data = $stmt->fetch() ?: [];

        $total   = (int) $data['total'];
        $paid    = (int) $data['paid'];
        $late    = (int) $data['late'];
        $partial = (int) $data['partial'];

        if ($total === 0) return 20;

        $paidRate    = $paid / $total;
        $lateRate    = $late / $total;
        $partialRate = $partial / $total;

        $score = (int) ($paidRate * 40);
        $score -= (int) ($lateRate * 20);
        $score -= (int) ($partialRate * 10);

        return max(0, min(40, $score));
    }

    /**
     * Ratio revenu / loyer — 25 pts
     * Idéalement revenu >= 3x loyer
     */
    private function scoreIncomeRatio(int $tenantId, int $agencyId): int
    {
        $stmt = $this->db->prepare(
            'SELECT t.monthly_income, c.rent_amount
             FROM tenants t
             LEFT JOIN contracts c ON c.tenant_id = t.id
               AND c.agency_id = ? AND c.status = "active"
             WHERE t.id = ? AND t.agency_id = ?
             LIMIT 1'
        );
        $stmt->execute([$agencyId, $tenantId, $agencyId]);
        $data = $stmt->fetch() ?: [];

        $income = (float) ($data['monthly_income'] ?? 0);
        $rent   = (float) ($data['rent_amount']    ?? 0);

        if ($income <= 0 || $rent <= 0) return 10; // Neutre si données manquantes

        $ratio = $income / $rent;

        if ($ratio >= 4)   return 25; // Excellent
        if ($ratio >= 3)   return 20; // Très bien
        if ($ratio >= 2.5) return 15; // Bien
        if ($ratio >= 2)   return 10; // Acceptable
        if ($ratio >= 1.5) return 5;  // Risqué
        return 0;                      // Insuffisant
    }

    /**
     * Ponctualité — 20 pts
     * % de paiements effectués avant ou à la date d'échéance
     */
private function scorePunctuality(int $tenantId, int $agencyId): int
    {
        $stmt = $this->db->prepare(
            'SELECT
                COUNT(*) as total,
                SUM(CASE
                    WHEN py.status = "paid"
                    AND py.payment_date IS NOT NULL
                    AND py.payment_date <= py.due_date
                    THEN 1 ELSE 0
                END) as on_time
            FROM payments py
            LEFT JOIN contracts c ON c.id = py.contract_id
            WHERE c.tenant_id = ? AND py.agency_id = ?
            AND py.status = "paid"'
        );
        $stmt->execute([$tenantId, $agencyId]);
        $data = $stmt->fetch() ?: [];

        $total  = (int) $data['total'];
        $onTime = (int) $data['on_time'];

        if ($total === 0) return 10;

        $rate = $onTime / $total;

        if ($rate >= 0.95) return 20;
        if ($rate >= 0.85) return 16;
        if ($rate >= 0.75) return 12;
        if ($rate >= 0.60) return 8;
        if ($rate >= 0.40) return 4;
        return 0;
    }

    /**
     * Ancienneté — 10 pts
     * Basé sur la durée du contrat actif
     */
   private function scoreSeniority(int $tenantId, int $agencyId): int
    {
        $stmt = $this->db->prepare(
            'SELECT TIMESTAMPDIFF(MONTH, start_date, NOW()) as months
            FROM contracts
            WHERE tenant_id = ? AND agency_id = ?
            AND status = "active"
            ORDER BY start_date ASC LIMIT 1'
        );
        $stmt->execute([$tenantId, $agencyId]);
        $data = $stmt->fetch() ?: [];

        $months = (int) ($data['months'] ?? 0);

        if ($months >= 24) return 10;
        if ($months >= 12) return 8;
        if ($months >= 6)  return 6;
        if ($months >= 3)  return 4;
        if ($months >= 1)  return 2;
        return 0;
    }

    /**
     * Complétude du profil — 5 pts
     */
    private function scoreProfile(int $tenantId, int $agencyId): int
    {
        $stmt = $this->db->prepare(
            'SELECT email, phone, profession, monthly_income, id_card_number
             FROM tenants WHERE id = ? AND agency_id = ? LIMIT 1'
        );
        $stmt->execute([$tenantId, $agencyId]);
        $data = $stmt->fetch() ?: [];

        $filled = 0;
        foreach (['email', 'phone', 'profession', 'monthly_income', 'id_card_number'] as $field) {
            if (!empty($data[$field])) $filled++;
        }

        return $filled; // 1 pt par champ rempli
    }
}