<?php

declare(strict_types=1);

namespace App\Models;

class Owner extends BaseModel
{
    protected string $table = 'owners';

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO owners
                (agency_id, first_name, last_name, email,
                 phone, address, id_card_number, notes)
             VALUES
                (:agency_id, :first_name, :last_name, :email,
                 :phone, :address, :id_card_number, :notes)'
        );
        $stmt->execute([
            ':agency_id'      => $data['agency_id'],
            ':first_name'     => $data['first_name'],
            ':last_name'      => $data['last_name'],
            ':email'          => $data['email']          ?? null,
            ':phone'          => $data['phone']          ?? null,
            ':address'        => $data['address']        ?? null,
            ':id_card_number' => $data['id_card_number'] ?? null,
            ':notes'          => $data['notes']          ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, int $agencyId, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE owners
             SET first_name     = :first_name,
                 last_name      = :last_name,
                 email          = :email,
                 phone          = :phone,
                 address        = :address,
                 id_card_number = :id_card_number,
                 notes          = :notes
             WHERE id = :id AND agency_id = :agency_id'
        );
        $stmt->execute([
            ':first_name'     => $data['first_name'],
            ':last_name'      => $data['last_name'],
            ':email'          => $data['email']          ?? null,
            ':phone'          => $data['phone']          ?? null,
            ':address'        => $data['address']        ?? null,
            ':id_card_number' => $data['id_card_number'] ?? null,
            ':notes'          => $data['notes']          ?? null,
            ':id'             => $id,
            ':agency_id'      => $agencyId,
        ]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Liste les propriÃ©taires avec le nombre de biens associÃ©s
     */
    public function findAllWithPropertyCount(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            'SELECT o.*,
                    COUNT(p.id) as property_count
             FROM owners o
             LEFT JOIN properties p
                    ON p.owner_id = o.id
                   AND p.deleted_at IS NULL
             WHERE o.agency_id = ?
               AND o.deleted_at IS NULL
             GROUP BY o.id
             ORDER BY o.created_at DESC'
        );
        $stmt->execute([$agencyId]);
        return $stmt->fetchAll();
    }
}