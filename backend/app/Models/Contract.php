<?php

declare(strict_types=1);

namespace App\Models;

class Contract extends BaseModel
{
    protected string $table = 'contracts';

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO contracts
                (agency_id, property_id, tenant_id, start_date,
                 end_date, rent_amount, deposit_amount,
                 payment_day, status, notes)
             VALUES
                (:agency_id, :property_id, :tenant_id, :start_date,
                 :end_date, :rent_amount, :deposit_amount,
                 :payment_day, :status, :notes)'
        );
        $stmt->execute([
            ':agency_id'      => $data['agency_id'],
            ':property_id'    => $data['property_id'],
            ':tenant_id'      => $data['tenant_id'],
            ':start_date'     => $data['start_date'],
            ':end_date'       => $data['end_date']       ?? null,
            ':rent_amount'    => $data['rent_amount'],
            ':deposit_amount' => $data['deposit_amount'] ?? null,
            ':payment_day'    => $data['payment_day']    ?? 5,
            ':status'         => $data['status']         ?? 'active',
            ':notes'          => $data['notes']          ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, int $agencyId, array $data): bool
    {
        $allowed = [
            'end_date', 'rent_amount', 'deposit_amount',
            'payment_day', 'status', 'notes'
        ];

        $sets   = [];
        $params = [':id' => $id, ':agency_id' => $agencyId];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[]              = "{$field} = :{$field}";
                $params[":{$field}"] = $data[$field];
            }
        }

        if (empty($sets)) {
            return false;
        }

        $sql = 'UPDATE contracts SET ' . implode(', ', $sets)
            . ' WHERE id = :id AND agency_id = :agency_id AND deleted_at IS NULL';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }
    public function findAllWithDetails(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            "SELECT c.*,
                    p.title                                    AS property_title,
                    p.address                                  AS property_address,
                    CONCAT(t.first_name, ' ', t.last_name)    AS tenant_name,
                    t.phone                                    AS tenant_phone
             FROM contracts c
             LEFT JOIN properties p ON p.id = c.property_id
             LEFT JOIN tenants    t ON t.id = c.tenant_id
             WHERE c.agency_id = ?
               AND c.deleted_at IS NULL
             ORDER BY c.created_at DESC"
        );
        $stmt->execute([$agencyId]);
        return $stmt->fetchAll();
    }

    public function findActive(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            "SELECT c.*,
                    p.title                                 AS property_title,
                    CONCAT(t.first_name, ' ', t.last_name) AS tenant_name
             FROM contracts c
             LEFT JOIN properties p ON p.id = c.property_id
             LEFT JOIN tenants    t ON t.id = c.tenant_id
             WHERE c.agency_id = ?
               AND c.status = 'active'
               AND c.deleted_at IS NULL
             ORDER BY c.start_date DESC"
        );
        $stmt->execute([$agencyId]);
        return $stmt->fetchAll();
    }

    public function markPropertyAsRented(int $propertyId): void
    {
        $this->db->prepare(
            "UPDATE properties SET status = 'rented' WHERE id = ?"
        )->execute([$propertyId]);
    }
}