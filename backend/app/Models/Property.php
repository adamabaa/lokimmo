<?php

declare(strict_types=1);

namespace App\Models;

class Property extends BaseModel
{
    protected string $table = 'properties';

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO properties
                (agency_id, owner_id, title, type, address,
                 city, area_sqm, rent_amount, deposit_amount,
                 status, description)
             VALUES
                (:agency_id, :owner_id, :title, :type, :address,
                 :city, :area_sqm, :rent_amount, :deposit_amount,
                 :status, :description)'
        );
        $stmt->execute([
            ':agency_id'      => $data['agency_id'],
            ':owner_id'       => $data['owner_id'],
            ':title'          => $data['title'],
            ':type'           => $data['type']           ?? 'apartment',
            ':address'        => $data['address'],
            ':city'           => $data['city'],
            ':area_sqm'       => $data['area_sqm']       ?? null,
            ':rent_amount'    => $data['rent_amount'],
            ':deposit_amount' => $data['deposit_amount'] ?? null,
            ':status'         => $data['status']         ?? 'available',
            ':description'    => $data['description']    ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, int $agencyId, array $data): bool
    {
        $allowed = [
            'owner_id', 'title', 'type', 'address', 'city',
            'area_sqm', 'rent_amount', 'deposit_amount', 'status', 'description'
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

        $sql = 'UPDATE properties SET ' . implode(', ', $sets)
            . ' WHERE id = :id AND agency_id = :agency_id AND deleted_at IS NULL';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }

    public function findAllWithOwner(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            "SELECT p.*,
                    CONCAT(o.first_name, ' ', o.last_name) AS owner_name
             FROM properties p
             LEFT JOIN owners o ON o.id = p.owner_id
             WHERE p.agency_id = ?
               AND p.deleted_at IS NULL
             ORDER BY p.created_at DESC"
        );
        $stmt->execute([$agencyId]);
        return $stmt->fetchAll();
    }

    public function findAvailable(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            "SELECT p.*,
                    CONCAT(o.first_name, ' ', o.last_name) AS owner_name
             FROM properties p
             LEFT JOIN owners o ON o.id = p.owner_id
             WHERE p.agency_id = ?
               AND p.status = 'available'
               AND p.deleted_at IS NULL
             ORDER BY p.created_at DESC"
        );
        $stmt->execute([$agencyId]);
        return $stmt->fetchAll();
    }

    public function getStatsByAgency(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            "SELECT
                COUNT(*) as total,
                SUM(status = 'available')   as available,
                SUM(status = 'rented')      as rented,
                SUM(status = 'maintenance') as maintenance
             FROM properties
             WHERE agency_id = ?
               AND deleted_at IS NULL"
        );
        $stmt->execute([$agencyId]);
        return $stmt->fetch();
    }
}