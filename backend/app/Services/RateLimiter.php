<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/**
 * Rate Limiter basÃ© sur la base de donnÃ©es
 * ProtÃ¨ge les routes sensibles contre le brute force
 */
class RateLimiter
{
    /**
     * VÃ©rifie si la limite est atteinte
     *
     * @param string $key      Identifiant unique (ip + route)
     * @param int    $maxAttempts Nombre max de tentatives
     * @param int    $decaySeconds FenÃªtre de temps en secondes
     */
    public static function check(
        string $key,
        int    $maxAttempts  = 5,
        int    $decaySeconds = 60
    ): bool {
        self::createTableIfNeeded();;

        $pdo = Database::getInstance();

        // Nettoyer les anciennes entrÃ©es
        $pdo->prepare(
            'DELETE FROM rate_limits WHERE expires_at < NOW()'
        )->execute();

        // Compter les tentatives actuelles
        $stmt = $pdo->prepare(
            'SELECT attempts FROM rate_limits WHERE `key` = ? LIMIT 1'
        );
        $stmt->execute([$key]);
        $record = $stmt->fetch();

        if (!$record) {
            // PremiÃ¨re tentative
            $pdo->prepare(
                'INSERT INTO rate_limits (`key`, attempts, expires_at)
                 VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? SECOND))'
            )->execute([$key, $decaySeconds]);
            return true;
        }

        if ($record['attempts'] >= $maxAttempts) {
            return false; // Limite atteinte
        }

        // IncrÃ©menter
        $pdo->prepare(
            'UPDATE rate_limits SET attempts = attempts + 1, expires_at = expires_at WHERE `key` = ?'
        )->execute([$key]);

        return true;
    }

    /**
     * RÃ©initialise le compteur aprÃ¨s un succÃ¨s
     */
    public static function reset(string $key): void
    {
        try {
            Database::getInstance()
                ->prepare('DELETE FROM rate_limits WHERE `key` = ?')
                ->execute([$key]);
        } catch (\Exception $e) { /* silencieux */ }
    }

    /**
     * Retourne le nombre de secondes restantes avant reset
     */
    public static function retryAfter(string $key): int
    {
        try {
            $stmt = Database::getInstance()->prepare(
                'SELECT TIMESTAMPDIFF(SECOND, NOW(), expires_at) as remaining
                 FROM rate_limits WHERE `key` = ? LIMIT 1'
            );
            $stmt->execute([$key]);
            $record = $stmt->fetch() ?: [];
            return max(0, (int) ($record['remaining'] ?? 0));
        } catch (\Exception $e) {
            return 0;
        }
    }

    private static function createTableIfNeeded(): void
    {
        try {
            Database::getInstance()->exec(
                'CREATE TABLE IF NOT EXISTS rate_limits (
                    `key`       VARCHAR(255) NOT NULL PRIMARY KEY,
                    attempts    INT UNSIGNED NOT NULL DEFAULT 1,
                    expires_at  DATETIME     NOT NULL,
                    INDEX idx_expires (expires_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
            );
        } catch (\Exception $e) { /* silencieux */ }
    }
}