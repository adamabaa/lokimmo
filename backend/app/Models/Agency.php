<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

class Agency
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, slug, email, is_active
             FROM agencies WHERE slug = ? LIMIT 1'
        );
        $stmt->execute([$slug]);
        return $stmt->fetch() ?: null;
    }

    public function slugExists(string $slug): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM agencies WHERE slug = ?'
        );
        $stmt->execute([$slug]);
        return (int) $stmt->fetchColumn() > 0;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO agencies (name, slug, email)
             VALUES (:name, :slug, :email)'
        );
        $stmt->execute([
            ':name'  => $data['name'],
            ':slug'  => $data['slug'],
            ':email' => $data['email'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Liste toutes les agences avec leurs stats
     * Utilisé par le Super Admin
     */
    public function findAllWithStats(): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                a.*,
                COUNT(DISTINCT u.id)  AS users_count,
                COUNT(DISTINCT p.id)  AS properties_count,
                COUNT(DISTINCT c.id)  AS contracts_count
             FROM agencies a
             LEFT JOIN users      u ON u.agency_id = a.id AND u.deleted_at IS NULL
             LEFT JOIN properties p ON p.agency_id = a.id AND p.deleted_at IS NULL
             LEFT JOIN contracts  c ON c.agency_id = a.id AND c.status = 'active'
             GROUP BY a.id
             ORDER BY a.created_at DESC'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Trouver une agence par ID
     */
    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM agencies WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Activer ou désactiver une agence
     */
    public function toggleStatus(int $id): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE agencies
             SET is_active = IF(is_active = 1, 0, 1)
             WHERE id = ?'
        );
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Mettre à jour une agence
     */
    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE agencies
             SET name = :name, email = :email, plan = :plan
             WHERE id = :id'
        );
        $stmt->execute([
            ':name'  => $data['name'],
            ':email' => $data['email'],
            ':plan'  => $data['plan'] ?? 'free',
            ':id'    => $id,
        ]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Stats globales pour le dashboard Super Admin
     */
    public function getGlobalStats(): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                COUNT(*)                           AS total_agencies,
                SUM(is_active = 1)                 AS active_agencies,
                SUM(is_active = 0)                 AS inactive_agencies,
                (SELECT COUNT(*) FROM users
                  WHERE deleted_at IS NULL)         AS total_users,
                (SELECT COUNT(*) FROM properties
                  WHERE deleted_at IS NULL)         AS total_properties,
                (SELECT COUNT(*) FROM contracts
                  WHERE status = 'active')          AS total_contracts,
                (SELECT COALESCE(SUM(amount_paid),0)
                  FROM payments
                  WHERE status = 'paid'
                    AND period_year = YEAR(NOW()))  AS annual_revenue
             FROM agencies'
        );
        $stmt->execute();
        return $stmt->fetch();
    }

    public function findByIdFull(int $id): ?array
        {
            $stmt = $this->db->prepare(
                'SELECT id, name, slug, email, phone, address, website,
                        primary_color, secondary_color, logo_url,
                        plan, is_active, created_at
                FROM agencies WHERE id = ? LIMIT 1'
            );
            $stmt->execute([$id]);
            return $stmt->fetch() ?: null;
        }

        /**
         * Mettre à jour le profil d'une agence
         */
    public function updateProfile(int $id, array $data): bool
        {
            $stmt = $this->db->prepare(
                'UPDATE agencies
                SET name            = :name,
                    email           = :email,
                    phone           = :phone,
                    address         = :address,
                    website         = :website,
                    primary_color   = :primary_color,
                    secondary_color = :secondary_color
                WHERE id = :id'
            );
            $stmt->execute([
                ':name'            => $data['name'],
                ':email'           => $data['email'],
                ':phone'           => $data['phone']           ?? null,
                ':address'         => $data['address']         ?? null,
                ':website'         => $data['website']         ?? null,
                ':primary_color'   => $data['primary_color']   ?? '#d4a853',
                ':secondary_color' => $data['secondary_color'] ?? '#0f1117',
                ':id'              => $id,
            ]);
            return $stmt->rowCount() >= 0;
        }

        /**
         * Mettre à jour le logo
         */
    public function updateLogo(int $id, string $logoUrl): void
        {
            $this->db->prepare(
                'UPDATE agencies SET logo_url = ? WHERE id = ?'
            )->execute([$logoUrl, $id]);
        }
}
