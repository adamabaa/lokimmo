<?php
// app/Services/CacheService.php

declare(strict_types=1);

namespace App\Services;

/**
 * Cache fichier simple â€” pas besoin de Redis
 * Parfait pour hÃ©bergement partagÃ©
 */
class CacheService
{
    private static string $cacheDir = '';

    private static function getCacheDir(): string
    {
        if (empty(self::$cacheDir)) {
            self::$cacheDir = dirname(__DIR__, 2) . '/storage/cache';
            if (!is_dir(self::$cacheDir)) {
                mkdir(self::$cacheDir, 0755, true);
            }
        }
        return self::$cacheDir;
    }

    /**
     * Lire depuis le cache
     */
    public static function get(string $key): mixed
    {
        $file = self::getCacheDir() . '/' . md5($key) . '.cache';

        if (!file_exists($file)) return null;

        $data = unserialize(file_get_contents($file));

        // ExpirÃ© ?
        if ($data['expires_at'] < time()) {
            unlink($file);
            return null;
        }

        return $data['value'];
    }

    /**
     * Ã‰crire dans le cache
     * @param int $ttl DurÃ©e en secondes
     */
    public static function set(string $key, mixed $value, int $ttl = 300): void
    {
        $file = self::getCacheDir() . '/' . md5($key) . '.cache';
        file_put_contents($file, serialize([
            'value'      => $value,
            'expires_at' => time() + $ttl,
        ]));
    }

    /**
     * Supprimer une clÃ©
     */
    public static function forget(string $key): void
    {
        $file = self::getCacheDir() . '/' . md5($key) . '.cache';
        if (file_exists($file)) unlink($file);
    }

    /**
     * Supprimer toutes les clÃ©s d'un prÃ©fixe
     */
    public static function forgetByPrefix(string $prefix): void
    {
        $files = glob(self::getCacheDir() . '/*.cache');
        foreach ($files as $file) {
            $data = @unserialize(file_get_contents($file));
            if (isset($data['key']) && str_starts_with($data['key'], $prefix)) {
                unlink($file);
            }
        }
    }

    /**
     * Helper â€” lire ou calculer si absent
     */
    public static function remember(
        string   $key,
        int      $ttl,
        callable $callback
    ): mixed {
        $cached = self::get($key);
        if ($cached !== null) return $cached;

        $value = $callback();
        self::set($key, $value, $ttl);
        return $value;
    }
}