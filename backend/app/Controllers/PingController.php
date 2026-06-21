<?php

namespace App\Controllers;

use App\Core\Response;

class PingController
{
    public function index(): void
    {
        // Utiliser la méthode success() qui est plus appropriée
        Response::success([
            'status' => 'ok',
            'timestamp' => time()
        ], 'Server is running');
    }
}