<?php

declare(strict_types=1);

namespace App\Core;

class Router
{
    private array  $routes             = [];
    private string $currentPrefix      = '';
    private array  $currentMiddlewares = [];

    // ── Enregistrement des routes ─────────────────────────────────────────────

    public function get(string $uri, string $action, array $middlewares = []): void
    {
        $this->add('GET', $uri, $action, $middlewares);
    }

    public function post(string $uri, string $action, array $middlewares = []): void
    {
        $this->add('POST', $uri, $action, $middlewares);
    }

    public function put(string $uri, string $action, array $middlewares = []): void
    {
        $this->add('PUT', $uri, $action, $middlewares);
    }

    public function patch(string $uri, string $action, array $middlewares = []): void
    {
        $this->add('PATCH', $uri, $action, $middlewares);
    }

    public function delete(string $uri, string $action, array $middlewares = []): void
    {
        $this->add('DELETE', $uri, $action, $middlewares);
    }

    // ── Groupes de routes ─────────────────────────────────────────────────────

    public function group(string $prefix, array $middlewares, callable $callback): void
    {
        $previousPrefix      = $this->currentPrefix;
        $previousMiddlewares = $this->currentMiddlewares;

        $this->currentPrefix      = $previousPrefix . $prefix;
        $this->currentMiddlewares = array_merge($previousMiddlewares, $middlewares);

        $callback($this);

        $this->currentPrefix      = $previousPrefix;
        $this->currentMiddlewares = $previousMiddlewares;
    }

    // ── Résolution de la requête ──────────────────────────────────────────────

    public function resolve(Request $request): void
    {
        $method = $request->getMethod();
        $uri    = $request->getUri();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $params = $this->matchUri($route['uri'], $uri);

            if ($params !== null) {
                $this->runMiddlewares($route['middlewares'], $request);
                $this->dispatch($route['action'], $request, $params);
                return;
            }
        }

        Response::notFound('Route introuvable');
    }

    // ── Méthodes privées ──────────────────────────────────────────────────────

    private function add(string $method, string $uri, string $action, array $middlewares): void
    {
        $this->routes[] = [
            'method'      => $method,
            'uri'         => $this->currentPrefix . $uri,
            'action'      => $action,
            'middlewares' => array_merge($this->currentMiddlewares, $middlewares),
        ];
    }

    private function matchUri(string $pattern, string $uri): ?array
    {
        $regex = preg_replace('/\{([a-zA-Z_]+)\}/', '([^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        if (!preg_match($regex, $uri, $matches)) {
            return null;
        }

        preg_match_all('/\{([a-zA-Z_]+)\}/', $pattern, $names);

        $params = [];
        foreach ($names[1] as $i => $name) {
            $params[$name] = $matches[$i + 1];
        }

        return $params;
    }

    private function runMiddlewares(array $middlewares, Request $request): void
    {
        foreach ($middlewares as $name) {
            $fqcn = "App\\Middlewares\\{$name}";

            if (!class_exists($fqcn)) {
                Response::error("Middleware {$name} introuvable", 500);
                exit;
            }

            $middleware = new $fqcn();

            if (!method_exists($middleware, 'handle')) {
                Response::error("Middleware {$name} : méthode handle() absente", 500);
                exit;
            }

            $middleware->handle($request);
        }
    }

    private function dispatch(string $action, Request $request, array $params): void
    {
        [$class, $method] = explode('@', $action);
        $fqcn = "App\\Controllers\\{$class}";

        if (!class_exists($fqcn)) {
            Response::error("Controller {$class} introuvable", 500);
            exit;
        }

        $controller = new $fqcn();

        if (!method_exists($controller, $method)) {
            Response::error("Méthode {$method} introuvable dans {$class}", 500);
            exit;
        }

        $controller->$method($request, $params);
    }
}