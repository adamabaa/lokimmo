<?php

declare(strict_types=1);

namespace App\Models;

class Payment extends BaseModel
{
    protected string $table = 'payments';

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO payments
                (agency_id, contract_id, amount_due, amount_paid,
                 payment_date, due_date, period_month, period_year,
                 status, payment_method, notes)
             VALUES
                (:agency_id, :contract_id, :amount_due, :amount_paid,
                 :payment_date, :due_date, :period_month, :period_year,
                 :status, :payment_method, :notes)'
        );
        $stmt->execute([
            ':agency_id'      => $data['agency_id'],
            ':contract_id'    => $data['contract_id'],
            ':amount_due'     => $data['amount_due'],
            ':amount_paid'    => $data['amount_paid']    ?? 0,
            ':payment_date'   => $data['payment_date']   ?? null,
            ':due_date'       => $data['due_date'],
            ':period_month'   => $data['period_month'],
            ':period_year'    => $data['period_year'],
            ':status'         => $data['status']         ?? 'pending',
            ':payment_method' => $data['payment_method'] ?? 'cash',
            ':notes'          => $data['notes']          ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, int $agencyId, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE payments
             SET amount_paid    = :amount_paid,
                 payment_date   = :payment_date,
                 status         = :status,
                 payment_method = :payment_method,
                 notes          = :notes
             WHERE id = :id AND agency_id = :agency_id'
        );
        $stmt->execute([
            ':amount_paid'    => $data['amount_paid'],
            ':payment_date'   => $data['payment_date']   ?? null,
            ':status'         => $data['status']         ?? 'pending',
            ':payment_method' => $data['payment_method'] ?? 'cash',
            ':notes'          => $data['notes']          ?? null,
            ':id'             => $id,
            ':agency_id'      => $agencyId,
        ]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Liste les paiements avec les détails du contrat
     */
// Retourne le nombre total de paiements
    public function countAll(int $agencyId): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM payments 
            WHERE agency_id = ? AND deleted_at IS NULL'
        );
        $stmt->execute([$agencyId]);
        return (int) $stmt->fetchColumn();
    }

    // Retourne les paiements paginés
    public function findAllWithDetails(int $agencyId, int $limit = 25, int $offset = 0): array
    {
        $stmt = $this->db->prepare(
            'SELECT py.*,
                    CONCAT(t.first_name, " ", t.last_name) AS tenant_name,
                    p.title                                 AS property_title
            FROM payments py
            LEFT JOIN contracts c  ON c.id  = py.contract_id
            LEFT JOIN tenants   t  ON t.id  = c.tenant_id
            LEFT JOIN properties p ON p.id  = c.property_id
            WHERE py.agency_id = ? AND py.deleted_at IS NULL
            ORDER BY py.due_date DESC
            LIMIT ? OFFSET ?'
        );
        $stmt->execute([$agencyId, $limit, $offset]);
        return $stmt->fetchAll();
    }

    /**
     * Paiements en retard
     */
    public function findLate(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            'SELECT py.*,
                    CONCAT(t.first_name, " ", t.last_name) AS tenant_name,
                    p.title                                 AS property_title,
                    t.phone                                 AS tenant_phone
             FROM payments py
             LEFT JOIN contracts  c ON c.id = py.contract_id
             LEFT JOIN tenants    t ON t.id = c.tenant_id
             LEFT JOIN properties p ON p.id = c.property_id
             WHERE py.agency_id = ?
               AND py.status IN ("pending", "partial")
               AND py.due_date < CURDATE()
             ORDER BY py.due_date ASC'
        );
        $stmt->execute([$agencyId]);
        return $stmt->fetchAll();
    }

    /**
     * Total encaissé sur un mois
     */
    public function getTotalByMonth(
        int $agencyId,
        int $month,
        int $year
    ): float {
        $stmt = $this->db->prepare(
            'SELECT COALESCE(SUM(amount_paid), 0)
             FROM payments
             WHERE agency_id    = ?
               AND period_month = ?
               AND period_year  = ?
               AND status       = "paid"'
        );
        $stmt->execute([$agencyId, $month, $year]);
        return (float) $stmt->fetchColumn();
    }
}