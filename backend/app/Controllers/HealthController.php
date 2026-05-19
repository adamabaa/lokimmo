<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;

class HealthController extends BaseController
{
    public function index(Request $request): void
    {
        try {
            // Vérifier la connexion DB
            $db = Database::getInstance();
            $db->query("SELECT 1");

            Response::json([
                'success' => true,
                'status'  => 'ok',
                'message' => 'Lokimmo API is running',
                'version' => '1.0.0',
                'env'     => env('APP_ENV', 'unknown'),
            ]);
        } catch (\Exception $e) {
            Response::json([
                'success' => false,
                'status'  => 'error',
                'message' => 'Database connection failed',
            ], 500);
        }
    }
}