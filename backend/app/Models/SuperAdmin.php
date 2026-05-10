<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

class SuperAdmin
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email, password, is_active
             FROM super_admins
             WHERE email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        return $stmt->fetch() ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, first_name, last_name, email, is_active, last_login, created_at
             FROM super_admins WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function updateLastLogin(int $id): void
    {
        $this->db->prepare('UPDATE super_admins SET last_login = NOW() WHERE id = ?')
                 ->execute([$id]);
    }
}