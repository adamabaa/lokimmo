<?php

declare(strict_types=1);

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

class JwtService
{
    private const ALGORITHM = 'HS256';

    /**
     * Token pour un utilisateur d'agence
     */
    public static function generate(
        int $userId,
        int $agencyId,
        string $role
    ): string {
        $now = time();
        $payload = [
            'iss'       => env('APP_URL', 'http://localhost'),
            'iat'       => $now,
            'exp'       => $now + (int) env('JWT_EXPIRATION', 86400),
            'type'      => 'agency',
            'user_id'   => $userId,
            'agency_id' => $agencyId,
            'role'      => $role,
        ];
        return JWT::encode($payload, self::getSecret(), self::ALGORITHM);
    }

    /**
     * Token pour le Super Admin — secret différent
     */
    public static function generateSuperAdmin(int $superAdminId): string
    {
        $now = time();
        $payload = [
            'iss'            => env('APP_URL', 'http://localhost'),
            'iat'            => $now,
            'exp'            => $now + (int) env('JWT_EXPIRATION', 86400),
            'type'           => 'super_admin',
            'super_admin_id' => $superAdminId,
        ];
        return JWT::encode($payload, self::getSuperSecret(), self::ALGORITHM);
    }

    /**
     * Décoder un token agence
     */
    public static function decode(string $token): array
    {
        try {
            $decoded = JWT::decode(
                $token,
                new Key(self::getSecret(), self::ALGORITHM)
            );
            $payload = (array) $decoded;

            // Vérifier que c'est bien un token agence
            if (isset($payload['type']) && $payload['type'] !== 'agency') {
                throw new \RuntimeException('Type de token invalide');
            }

            // Vérifier expiration explicitement
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                throw new \RuntimeException('Token expiré');
            }

            return $payload;

        } catch (ExpiredException $e) {
            throw new \RuntimeException('Token expiré');
        } catch (\Exception $e) {
            throw new \RuntimeException('Token invalide');
        }
    }

    /**
     * Décoder un token super admin
     */
    public static function decodeSuperAdmin(string $token): array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::getSuperSecret(), self::ALGORITHM));
            $payload = (array) $decoded;

            if (($payload['type'] ?? '') !== 'super_admin') {
                throw new \RuntimeException('Token non valide');
            }

            return $payload;
        } catch (ExpiredException $e) {
            throw new \RuntimeException('Token expiré');
        } catch (\Exception $e) {
            throw new \RuntimeException('Token non valide');
        }
    }

    public static function extractFromHeader(?string $authHeader): ?string
    {
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }
        $token = trim(substr($authHeader, 7));
        return !empty($token) ? $token : null;
    }

    private static function getSecret(): string
    {
        $secret = env('JWT_SECRET', '');
        if (empty($secret)) {
            throw new \RuntimeException('JWT_SECRET non défini');
        }
        return $secret;
    }

    private static function getSuperSecret(): string
    {
        $secret = env('JWT_SUPER_SECRET', '');
        if (empty($secret)) {
            throw new \RuntimeException('JWT_SUPER_SECRET non défini');
        }
        return $secret;
    }

    /**
     * Token pour le portail locataire
     */
    public static function generateTenant(
        int $tenantId,
        int $agencyId
    ): string {
        $now = time();
        $payload = [
            'iss'       => env('APP_URL', 'http://localhost'),
            'iat'       => $now,
            'exp'       => $now + (int) env('JWT_EXPIRATION', 86400),
            'type'      => 'tenant',
            'tenant_id' => $tenantId,
            'agency_id' => $agencyId,
        ];
        return JWT::encode($payload, self::getSecret(), self::ALGORITHM);
    }

    /**
     * Décoder un token locataire
     */
    public static function decodeTenant(string $token): array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::getSecret(), self::ALGORITHM));
            $payload = (array) $decoded;
            if (($payload['type'] ?? '') !== 'tenant') {
                throw new \RuntimeException('Token non valide');
            }
            return $payload;
        } catch (ExpiredException $e) {
            throw new \RuntimeException('Token expiré');
        } catch (\Exception $e) {
            throw new \RuntimeException('Token non valide');
        }
    }

    public static function generateOwner(int $ownerId, int $agencyId): string
    {
        $now     = time();
        $payload = [
            'iss'      => env('APP_URL', 'http://localhost'),
            'iat'      => $now,
            'exp'      => $now + (int) env('JWT_EXPIRATION', 86400),
            'type'     => 'owner',
            'owner_id' => $ownerId,
            'agency_id'=> $agencyId,
        ];
        return JWT::encode($payload, self::getSecret(), self::ALGORITHM);
    }

    public static function decodeOwner(string $token): array
    {
        try {
            $decoded = JWT::decode($token, new Key(self::getSecret(), self::ALGORITHM));
            $payload = (array) $decoded;
            if (($payload['type'] ?? '') !== 'owner') {
                throw new \RuntimeException('Token non valide');
            }
            return $payload;
        } catch (ExpiredException $e) {
            throw new \RuntimeException('Token expiré');
        } catch (\Exception $e) {
            throw new \RuntimeException('Token non valide');
        }
    }

}