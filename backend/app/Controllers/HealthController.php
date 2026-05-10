<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;

class HealthController extends BaseController
{
  
public function hash(Request $request): void
{
    $password = 'password';
    $hash     = password_hash($password, PASSWORD_BCRYPT);
    $verify   = password_verify($password, $hash);

    Response::json([
        'hash'   => $hash,
        'verify' => $verify,
    ]);
}
}