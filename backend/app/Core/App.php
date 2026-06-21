<?php

declare(strict_types=1);

namespace App\Core;

use App\Middlewares\TenantMiddleware;

class App
{
    public static function run(): void
    {
        // 1. Gestion erreurs globale
        self::registerErrorHandlers();

        // 2. CORS — doit être avant tout le reste
        self::setCorsHeaders();

        // 3. OPTIONS preflight — répondre et sortir
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        // 4. Headers sécurité
        self::setSecurityHeaders();

        // 5. Requête + middleware tenant
        $request = new Request();
        TenantMiddleware::handle($request);

        // 6. Router
        $router = new Router();
        self::loadRoutes($router);
        $router->resolve($request);
    }

    /**
     * Charge api.php en injectant $router dans son scope.
     * Évite le problème de variable inaccessible dans require
     * appelé depuis une méthode statique.
     */
    private static function loadRoutes(Router $router): void
    {
        require BASE_PATH . '/routes/api.php';
    }

    private static function setCorsHeaders(): void
    {
        $allowedOrigins = [];
        
        $frontendUrl = env('FRONTEND_URL');
        if ($frontendUrl) {
            $allowedOrigins[] = trim($frontendUrl);
        }
        
        $originsEnv = env('ALLOWED_ORIGINS');
        if ($originsEnv) {
            $originsList = explode(',', $originsEnv);
            foreach ($originsList as $orig) {
                $allowedOrigins[] = trim($orig);
            }
        }
        
        $allowedOrigins = array_unique(array_filter($allowedOrigins));
        
        // Si aucun n'est configuré, fallback en développement
        if (empty($allowedOrigins)) {
            $allowedOrigins[] = 'http://localhost:5173';
        }

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (empty($origin) && env('APP_ENV') !== 'production') {
            header('Access-Control-Allow-Origin: *');
        } elseif (in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Agency-Slug');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }

    private static function registerErrorHandlers(): void
    {
        set_error_handler(function (int $errno, string $errstr): bool {
            error_log("PHP Error [{$errno}]: {$errstr}");
            return true;
        });

        set_exception_handler(function (\Throwable $e): void {
            error_log(
                "Uncaught Exception: " . $e->getMessage()
                . " in " . $e->getFile() . ":" . $e->getLine()
            );
            
            $isProd = env('APP_ENV') === 'production';
            
            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
            }
            
            $response = [
                'success' => false,
                'message' => $isProd ? 'Erreur serveur interne' : $e->getMessage(),
                'errors'  => [],
            ];
            
            if (!$isProd) {
                $response['file'] = $e->getFile();
                $response['line'] = $e->getLine();
                $response['trace'] = explode("\n", $e->getTraceAsString());
            }
            
            echo json_encode($response);
            exit;
        });

        register_shutdown_function(function (): void {
            $error = error_get_last();
            if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR])) {
                error_log("Fatal Error: " . $error['message']);
                $isProd = env('APP_ENV') === 'production';
                
                if (!headers_sent()) {
                    http_response_code(500);
                    header('Content-Type: application/json; charset=utf-8');
                    
                    $response = [
                        'success' => false,
                        'message' => $isProd ? 'Erreur serveur interne' : $error['message'],
                        'errors'  => [],
                    ];
                    
                    if (!$isProd) {
                        $response['file'] = $error['file'];
                        $response['line'] = $error['line'];
                    }
                    
                    echo json_encode($response);
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