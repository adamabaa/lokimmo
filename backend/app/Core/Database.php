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
            try {
                self::$instance->query('SELECT 1');
            } catch (PDOException) {
                self::$instance = null;
            }
        }

        if (self::$instance === null) {
            $host = env('DB_HOST', 'localhost');
            $port = env('DB_PORT', '3306');
            $name = env('DB_NAME', '');
            $user = env('DB_USER', 'root');
            $pass = env('DB_PASS', '');
            $ssl  = env('DB_SSL', 'false') === 'true';

            $dsn = "mysql:host={$host};port={$port}"
                 . ";dbname={$name};charset=utf8mb4";

            // Options PDO de base
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_TIMEOUT            => 10,
                PDO::ATTR_PERSISTENT         => false,
                PDO::MYSQL_ATTR_INIT_COMMAND =>
                    "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci,
                     time_zone = '+00:00'",
            ];

            // SSL requis par Aiven en production
            if ($ssl) {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
                // Si tu as le CA certificate d'Aiven téléchargé :
                // $options[PDO::MYSQL_ATTR_SSL_CA] = BASE_PATH . '/config/aiven-ca.pem';
            }

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
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