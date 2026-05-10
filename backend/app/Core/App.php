<?php

declare(strict_types=1);

namespace App\Core;

use App\Middlewares\TenantMiddleware;

class App
{
    public static function run(): void
    {
        // Gestion erreurs globale
        self::registerErrorHandlers();

        // OPTIONS géré par .htaccess — on sort juste si ça passe quand même
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        // Headers sécurité uniquement (pas CORS)
        self::setSecurityHeaders();

        $request = new Request();
        TenantMiddleware::handle($request);

        $router = new Router();
        require_once BASE_PATH . '/routes/api.php';
        $router->resolve($request);
    }

    private static function registerErrorHandlers(): void
    {
        set_error_handler(function(int $errno, string $errstr): bool {
            error_log("PHP Error [{$errno}]: {$errstr}");
            return true;
        });

        set_exception_handler(function(\Throwable $e): void {
            error_log("Uncaught Exception: " . $e->getMessage()
                . " in " . $e->getFile() . ":" . $e->getLine());

            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
            }
            echo json_encode([
                'success' => false,
                'message' => 'Erreur serveur interne',
                'errors'  => [],
            ]);
            exit;
        });

        register_shutdown_function(function(): void {
            $error = error_get_last();
            if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR])) {
                error_log("Fatal Error: " . $error['message']);
                if (!headers_sent()) {
                    http_response_code(500);
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode([
                        'success' => false,
                        'message' => 'Erreur serveur interne',
                        'errors'  => [],
                    ]);
                }
            }
        });
    }

    private static function setSecurityHeaders(): void
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header_remove('X-Powered-By');

        if (env('APP_ENV') === 'production') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
    }
}