<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/**
 * Synchronisation automatique Paiements â†’ Caisse
 * AppelÃ© quand un paiement est marquÃ© payÃ©
 */
class CashSyncService
{
    /**
     * CrÃ©er une opÃ©ration de caisse depuis un paiement
     */
    public static function syncPayment(
        int    $paymentId,
        int    $agencyId,
        int    $userId
    ): bool {
        $db = Database::getInstance();

        // VÃ©rifier si dÃ©jÃ  synchronisÃ©
        $stmt = $db->prepare(
            'SELECT id FROM cash_operations WHERE payment_id = ? LIMIT 1'
        );
        $stmt->execute([$paymentId]);
        if ($stmt->fetch()) return false; // DÃ©jÃ  synchro

        // RÃ©cupÃ©rer le paiement
        $stmt = $db->prepare(
            'SELECT py.*, t.first_name, t.last_name,
                    p.title AS property_title,
                    c.tenant_id
             FROM payments py
             LEFT JOIN contracts  c ON c.id = py.contract_id
             LEFT JOIN tenants    t ON t.id = c.tenant_id
             LEFT JOIN properties p ON p.id = c.property_id
             WHERE py.id = ? LIMIT 1'
        );
        $stmt->execute([$paymentId]);
        $payment = $stmt->fetch();

        if (!$payment) return false;

        // Trouver session ouverte du jour
        $stmt2 = $db->prepare(
            'SELECT id FROM cash_sessions
             WHERE agency_id = ? AND user_id = ?
               AND date = CURDATE() AND status = "open"
             LIMIT 1'
        );
        $stmt2->execute([$agencyId, $userId]);
        $session = $stmt2->fetch();

        // Pas de session ouverte â†’ crÃ©er automatiquement
        if (!$session) {
            $db->prepare(
                'INSERT INTO cash_sessions
                    (agency_id, user_id, date, opening_balance, notes)
                 VALUES (?, ?, CURDATE(), 0, "Session auto-crÃ©Ã©e")'
            )->execute([$agencyId, $userId]);
            $sessionId = (int) $db->lastInsertId();
        } else {
            $sessionId = $session['id'];
        }

        $tenantName = trim(
            ($payment['first_name'] ?? '') . ' ' . ($payment['last_name'] ?? '')
        );
        $month      = $payment['period_month'] ?? '';
        $year       = $payment['period_year']  ?? '';
        $months     = ['Jan','FÃ©v','Mar','Avr','Mai','Jun',
                       'Jul','AoÃ»','Sep','Oct','Nov','DÃ©c'];
        $monthLabel = $month ? ($months[$month - 1] ?? $month) : '';

        $description = "Loyer {$monthLabel} {$year}"
            . ($tenantName ? " â€” {$tenantName}" : '')
            . ($payment['property_title'] ? " ({$payment['property_title']})" : '');

        // CrÃ©er l'opÃ©ration de caisse
        $db->prepare(
            'INSERT INTO cash_operations
                (agency_id, session_id, user_id, type, category,
                 amount, description, payment_id, tenant_id,
                 property_id, payment_method, status)
             VALUES (?, ?, ?, "income", "rent",
                     ?, ?, ?, ?, ?, ?, "validated")'
        )->execute([
            $agencyId,
            $sessionId,
            $userId,
            $payment['amount_paid'],
            $description,
            $paymentId,
            $payment['tenant_id']    ?? null,
            $payment['property_id']  ?? null,
            $payment['payment_method'] ?? 'cash',
        ]);

        return true;
    }

    /**
     * Annuler une opÃ©ration de caisse liÃ©e Ã  un paiement
     * (quand un paiement payÃ© est remis en attente)
     */
    public static function unsyncPayment(int $paymentId): void
    {
        $db = Database::getInstance();
        $db->prepare(
            'UPDATE cash_operations SET status = "rejected"
             WHERE payment_id = ?'
        )->execute([$paymentId]);
    }
}