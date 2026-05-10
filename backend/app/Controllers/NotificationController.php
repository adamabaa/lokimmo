<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;

class NotificationController extends BaseController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * GET /api/notifications
     * Liste les notifications de l'utilisateur connecté
     */
    public function index(Request $request): void
    {
        $user = $this->authenticate($request);

        $stmt = $this->db->prepare(
            'SELECT id, type, title, body, is_read, created_at
             FROM notifications
             WHERE agency_id = ? AND user_id = ?
             ORDER BY created_at DESC
             LIMIT 50'
        );
        $stmt->execute([$request->agencyId, $user['id']]);

        Response::json($stmt->fetchAll());
    }

    /**
     * GET /api/notifications/count
     * Nombre de notifications non lues
     */
    public function count(Request $request): void
    {
        $user = $this->authenticate($request);

        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM notifications
             WHERE agency_id = ? AND user_id = ? AND is_read = 0'
        );
        $stmt->execute([$request->agencyId, $user['id']]);

        Response::json(['count' => (int) $stmt->fetchColumn()]);
    }

    /**
     * PUT /api/notifications/{id}/read
     * Marquer une notification comme lue
     */
    public function markRead(Request $request, array $params): void
    {
        $user = $this->authenticate($request);
        $id   = $this->validateId($params['id']);

        $this->db->prepare(
            'UPDATE notifications SET is_read = 1
             WHERE id = ? AND agency_id = ? AND user_id = ?'
        )->execute([$id, $request->agencyId, $user['id']]);

        Response::json(null, 'Notification lue');
    }

    /**
     * PUT /api/notifications/read-all
     * Marquer toutes les notifications comme lues
     */
    public function markAllRead(Request $request): void
    {
        $user = $this->authenticate($request);

        $this->db->prepare(
            'UPDATE notifications SET is_read = 1
             WHERE agency_id = ? AND user_id = ?'
        )->execute([$request->agencyId, $user['id']]);

        Response::json(null, 'Toutes les notifications lues');
    }

    /**
     * GET /api/notifications/generate
     * Génère les notifications automatiques
     * Loyers en retard + Contrats expirant bientôt
     */
    public function generate(Request $request): void
    {
        $this->authenticate($request);
        $agencyId = $request->agencyId;
        $count    = 0;

        // 1. Loyers en retard
        $stmt = $this->db->prepare(
            'SELECT py.id, py.amount_due, py.due_date,
                    CONCAT(t.first_name, " ", t.last_name) AS tenant_name,
                    p.title AS property_title
             FROM payments py
             LEFT JOIN contracts  c ON c.id = py.contract_id
             LEFT JOIN tenants    t ON t.id = c.tenant_id
             LEFT JOIN properties p ON p.id = c.property_id
             WHERE py.agency_id = ?
               AND py.status IN ("pending", "partial")
               AND py.due_date < CURDATE()'
        );
        $stmt->execute([$agencyId]);
        $latePayments = $stmt->fetchAll();

        foreach ($latePayments as $payment) {
            if ($this->notificationExists($agencyId, 'payment_late', $payment['id'])) {
                continue;
            }

            $this->createForAllUsers(
                $agencyId,
                'payment_late',
                "Loyer en retard — {$payment['tenant_name']}",
                "Le loyer de {$payment['property_title']} (échéance : {$payment['due_date']}) n'a pas été réglé."
            );
            $count++
        ;
        }

        // 2. Contrats expirant dans 30 jours
        $stmt = $this->db->prepare(
            'SELECT c.id, c.end_date,
                    CONCAT(t.first_name, " ", t.last_name) AS tenant_name,
                    p.title AS property_title
             FROM contracts c
             LEFT JOIN tenants    t ON t.id = c.tenant_id
             LEFT JOIN properties p ON p.id = c.property_id
             WHERE c.agency_id = ?
               AND c.status = "active"
               AND c.end_date IS NOT NULL
               AND c.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)'
        );
        $stmt->execute([$agencyId]);
        $expiringContracts = $stmt->fetchAll();

        foreach ($expiringContracts as $contract) {
            if ($this->notificationExists($agencyId, 'contract_expiring', $contract['id'])) {
                continue;
            }

            $this->createForAllUsers(
                $agencyId,
                'contract_expiring',
                "Contrat expirant — {$contract['tenant_name']}",
                "Le contrat de {$contract['property_title']} expire le {$contract['end_date']}."
            );
            $count++;
        }

        Response::json(['generated' => $count], "{$count} notification(s) générée(s)");
    }

    // ── Helpers privés ───────────────────────────────────────

    private function notificationExists(
        int $agencyId,
        string $type,
        int $refId
    ): bool {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM notifications
             WHERE agency_id = ? AND type = ?
               AND body LIKE ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)'
        );
        $stmt->execute([$agencyId, $type, "%{$refId}%"]);
        return (int) $stmt->fetchColumn() > 0;
    }

    private function createForAllUsers(
        int $agencyId,
        string $type,
        string $title,
        string $body
    ): void {
        // Récupérer tous les users actifs de l'agence
        $stmt = $this->db->prepare(
            'SELECT id FROM users
             WHERE agency_id = ? AND is_active = 1 AND deleted_at IS NULL'
        );
        $stmt->execute([$agencyId]);
        $users = $stmt->fetchAll();

        $insert = $this->db->prepare(
            'INSERT INTO notifications (agency_id, user_id, type, title, body)
             VALUES (?, ?, ?, ?, ?)'
        );

        foreach ($users as $user) {
            $insert->execute([$agencyId, $user['id'], $type, $title, $body]);
        }
    }
}