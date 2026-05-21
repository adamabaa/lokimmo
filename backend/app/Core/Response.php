<?php

declare(strict_types=1);

namespace App\Core;

class Response
{
    public static function json(
        mixed $data = null,
        string $message = 'OK',
        int $status = 200
    ): void {
        self::send(['success' => true,  'message' => $message, 'data'   => $data], $status);
    }

    public static function error(
        string $message,
        int $status = 400,
        array $errors = []
    ): void {
        self::send(['success' => false, 'message' => $message, 'errors' => $errors], $status);
    }

    public static function unauthorized(string $message = 'Non autorisÃ©'): void
    {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'AccÃ¨s interdit'): void
    {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Ressource introuvable'): void
    {
        self::error($message, 404);
    }

    private static function send(array $payload, int $status): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}