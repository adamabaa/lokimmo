<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/**
 * Service de journalisation des actions
 * AppelÃ© depuis les controllers aprÃ¨s chaque action importante
 */
class LogService

{
    /**
     * Enregistre une action utilisateur agence
     */
    public static function log(
        int     $agencyId,
        int     $userId,
        string  $action,
        string  $description = '',
        ?string $entity      = null,
        ?int    $entityId    = null
    ): void {
        try {
            $pdo  = Database::getInstance();
            $stmt = $pdo->prepare(
                'INSERT INTO activity_logs
                    (agency_id, user_id, user_type, action, entity, entity_id, description, ip_address)
                 VALUES (?, ?, "agency_user", ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $agencyId,
                $userId,
                $action,
                $entity,
                $entityId,
                $description,
                self::getIp(),
            ]);
        } catch (\Exception $e) {
            // Les logs ne doivent jamais faire planter l'app
        }
    }

    /**
     * Enregistre une action super admin
     */
    public static function logSuperAdmin(
        int    $superAdminId,
        string $action,
        string $description = '',
        ?int   $agencyId    = null
    ): void {
        try {
            $pdo  = Database::getInstance();
            $stmt = $pdo->prepare(
                'INSERT INTO activity_logs
                    (agency_id, user_id, user_type, action, description, ip_address)
                 VALUES (?, ?, "super_admin", ?, ?, ?)'
            );
            $stmt->execute([
                $agencyId,
                $superAdminId,
                $action,
                $description,
                self::getIp(),
            ]);
        } catch (\Exception $e) {
            // Silencieux
        }
    }

    private static function getIp(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['HTTP_CLIENT_IP']
            ?? $_SERVER['REMOTE_ADDR']
            ?? 'unknown';
    }
}