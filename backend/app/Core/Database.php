<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $instance = null;

    public static function getInstance(): PDO
    {
        if (self::$instance !== null) {
            // Vérifier si la connexion est toujours active
            try {
                self::$instance->query('SELECT 1');
            } catch (PDOException) {
                self::$instance = null; // Reconnexion
            }
        }

        if (self::$instance === null) {
            $host    = env('DB_HOST', 'localhost');
            $port    = env('DB_PORT', '3306');
            $name    = env('DB_NAME', '');
            $user    = env('DB_USER', 'root');
            $pass    = env('DB_PASS', '');

            $dsn = "mysql:host={$host};port={$port}"
                 . ";dbname={$name};charset=utf8mb4";

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_TIMEOUT            => 5,
                    PDO::ATTR_PERSISTENT         => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND =>
                        "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci,
                         time_zone = '+00:00'",
                ]);
            } catch (PDOException $e) {
                error_log("DB Connection failed: " . $e->getMessage());
                http_response_code(503);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Service temporairement indisponible',
                ]);
                exit;
            }
        }

        return self::$instance;
    }

    public static function reset(): void
    {
        self::$instance = null;
    }
}