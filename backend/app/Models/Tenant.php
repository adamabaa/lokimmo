<?php

declare(strict_types=1);

namespace App\Models;

class Tenant extends BaseModel
{
    protected string $table = 'tenants';

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO tenants
                (agency_id, first_name, last_name, email, phone,
                 id_card_number, profession, monthly_income, notes)
             VALUES
                (:agency_id, :first_name, :last_name, :email, :phone,
                 :id_card_number, :profession, :monthly_income, :notes)'
        );
        $stmt->execute([
            ':agency_id'      => $data['agency_id'],
            ':first_name'     => $data['first_name'],
            ':last_name'      => $data['last_name'],
            ':email'          => $data['email']          ?? null,
            ':phone'          => $data['phone']          ?? null,
            ':id_card_number' => $data['id_card_number'] ?? null,
            ':profession'     => $data['profession']     ?? null,
            ':monthly_income' => $data['monthly_income'] ?? null,
            ':notes'          => $data['notes']          ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, int $agencyId, array $data): bool
    {
        $allowed = [
            'first_name', 'last_name', 'email', 'phone',
            'id_card_number', 'profession', 'monthly_income', 'notes'
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

        $sql = 'UPDATE tenants SET ' . implode(', ', $sets)
            . ' WHERE id = :id AND agency_id = :agency_id AND deleted_at IS NULL';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }
}