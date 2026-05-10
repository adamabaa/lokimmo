<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Model de base — mutualisé pour tous les modules
 * Chaque model hérite de celui-ci
 */
abstract class BaseModel
{
    protected PDO    $db;
    protected string $table;      // nom de la table
    protected string $primaryKey = 'id';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Trouve un enregistrement par ID et agency_id
     */
    public function findById(int $id, int $agencyId): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table}
             WHERE {$this->primaryKey} = ?
               AND agency_id = ?
               AND deleted_at IS NULL
             LIMIT 1"
        );
        $stmt->execute([$id, $agencyId]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Liste tous les enregistrements d'une agence
     */
    public function findAllByAgency(int $agencyId): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM {$this->table}
             WHERE agency_id = ?
               AND deleted_at IS NULL
             ORDER BY created_at DESC"
        );
        $stmt->execute([$agencyId]);
        return $stmt->fetchAll();
    }

    /**
     * Soft delete — ne supprime jamais vraiment
     */
    public function softDelete(int $id, int $agencyId): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE {$this->table}
             SET deleted_at = NOW()
             WHERE {$this->primaryKey} = ?
               AND agency_id = ?"
        );
        $stmt->execute([$id, $agencyId]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Vérifie qu'un enregistrement appartient bien à l'agence
     */
    public function belongsToAgency(int $id, int $agencyId): bool
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM {$this->table}
             WHERE {$this->primaryKey} = ?
               AND agency_id = ?
               AND deleted_at IS NULL"
        );
        $stmt->execute([$id, $agencyId]);
        return (int) $stmt->fetchColumn() > 0;
    }

    /**
     * Compte les enregistrements d'une agence
     */
    public function countByAgency(int $agencyId): int
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM {$this->table}
             WHERE agency_id = ?
               AND deleted_at IS NULL"
        );
        $stmt->execute([$agencyId]);
        return (int) $stmt->fetchColumn();
    }
}