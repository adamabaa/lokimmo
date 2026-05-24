<?php

declare(strict_types=1);

namespace App\Core;

class Request
{
    private string $method;
    private string $uri;
    private array  $body;
    private array  $headers;

    public ?int   $agencyId = null;
    public ?array $user     = null;

    public function __construct()
    {
        $this->method  = strtoupper($_SERVER['REQUEST_METHOD']);
        $this->uri     = $this->parseUri();
        $this->body    = $this->parseBody();
        $this->headers = $this->parseHeaders();
    }

    public function getMethod(): string  { return $this->method; }
    public function getUri(): string     { return $this->uri; }
    public function all(): array         { return $this->body; }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    public function getHeader(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function getSubdomain(): ?string
    {
        $host  = $_SERVER['HTTP_HOST'] ?? '';
        $parts = explode('.', $host);
        return count($parts) >= 2 ? $parts[0] : null;
    }

    private function parseUri(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';

        // Supprimer les query strings
        $uri = strtok($uri, '?');

        // Supprimer le sous-dossier XAMPP du chemin
        // /lokimmo/backend/public/api/super/login → /api/super/login
        $basePath = str_replace(
            '\\', '/',
            dirname($_SERVER['SCRIPT_NAME'])
        );

        if ($basePath !== '/' && str_starts_with($uri, $basePath)) {
            $uri = substr($uri, strlen($basePath));
        }

        return rtrim($uri, '/') ?: '/';
    }

    private function parseBody(): array
    {
        if ($this->method === 'GET') {
            return $_GET;
        }

        $raw = file_get_contents('php://input');
        $decoded = [];
        
        if (!empty($raw)) {
            $decoded = json_decode($raw, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $decoded = [];
            }
        }

        // Vérifier que $_POST est un tableau et fusionner
        $postData = is_array($_POST) ? $_POST : [];
        $decodedData = is_array($decoded) ? $decoded : [];
        
        return array_merge($postData, $decodedData);
    }

    private function parseHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = $value;
            }
        }
        return $headers;
    }

    /**
     * Retourne une valeur sanitisée (protège contre XSS)
     */
    public function sanitized(string $key, mixed $default = null): mixed
    {
        $value = $this->body[$key] ?? $default;

        if (is_string($value)) {
            // Supprimer les espaces inutiles
            $value = trim($value);
            // Convertir les caractères spéciaux HTML
            $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        return $value;
    }

    /**
     * Retourne toutes les données sanitisées
     */
    public function sanitizedAll(): array
    {
        return array_map(function ($value) {
            if (is_string($value)) {
                return htmlspecialchars(trim($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            }
            return $value;
        }, $this->body);
    }
}