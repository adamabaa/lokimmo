<?php

namespace App\Controllers;

use App\Core\Response;

class PingController {
    public function index(): void {
        Response::json(['status' => 'ok', 'timestamp' => time()]);
    }
}