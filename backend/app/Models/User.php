<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

class User
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByEmail(string $email, int $agencyId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, agency_id, first_name, last_name,
                    email, password, role, is_active
             FROM users
             WHERE email = ?
               AND agency_id = ?
               AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([$email, $agencyId]);
        return $stmt->fetch() ?: null;
    }

    public function findById(int $id, int $agencyId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, agency_id, first_name, last_name,
                    email, role, is_active, created_at
             FROM users
             WHERE id = ?
               AND agency_id = ?
               AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([$id, $agencyId]);
        return $stmt->fetch() ?: null;
    }

    public function findAllByAgency(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email,
                    role, is_active, created_at
             FROM users
             WHERE agency_id = ?
               AND deleted_at IS NULL
             ORDER BY created_at DESC'
        );
        $stmt->execute([$agencyId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO users
                (agency_id, first_name, last_name, email, password, role)
             VALUES
                (:agency_id, :first_name, :last_name, :email, :password, :role)'
        );
        $stmt->execute([
            ':agency_id'  => $data['agency_id'],
            ':first_name' => $data['first_name'],
            ':last_name'  => $data['last_name'],
            ':email'      => $data['email'],
            ':password'   => password_hash(
                $data['password'],
                PASSWORD_BCRYPT,
                ['cost' => 12]
            ),
            ':role'       => $data['role'] ?? 'agent',
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function updateLastLogin(int $id): void
    {
        $stmt = $this->db->prepare(
            'UPDATE users SET last_login = NOW() WHERE id = ?'
        );
        $stmt->execute([$id]);
    }

    public function emailExists(
        string $email,
        int $agencyId,
        ?int $excludeId = null
    ): bool {
        $sql    = 'SELECT COUNT(*) FROM users
                   WHERE email = ? AND agency_id = ? AND deleted_at IS NULL';
        $params = [$email, $agencyId];

        if ($excludeId !== null) {
            $sql     .= ' AND id != ?';
            $params[] = $excludeId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function softDelete(int $id, int $agencyId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE users SET deleted_at = NOW()
            WHERE id = ? AND agency_id = ?'
        );
        $stmt->execute([$id, $agencyId]);
        return $stmt->rowCount() > 0;
    }
}