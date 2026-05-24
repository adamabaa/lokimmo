<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\User;
use App\Models\Agency;
use App\Services\JwtService;
use App\Services\ValidationService;
use App\Services\LogService;
use App\Services\RateLimiter;


class AuthController extends BaseController
{
    private User   $userModel;
    private Agency $agencyModel;

    public function __construct()
    {
        $this->userModel   = new User();
        $this->agencyModel = new Agency();
    }

    /**
     * POST /api/auth/register
     * Crée une agence + son admin en une seule requête
     */
    public function register(Request $request): void
    {
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'agency_name' => 'required|max:150',
            'agency_slug' => 'required|max:100',
            'first_name'  => 'required|max:100',
            'last_name'   => 'required|max:100',
            'email'       => 'required|email|max:150',
            'password'    => 'required|min:8|confirmed',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        if ($this->agencyModel->slugExists($data['agency_slug'])) {
            Response::error('Ce nom d\'agence est déjà pris', 409);
        }

        $agencyId = $this->agencyModel->create([
            'name'  => $data['agency_name'],
            'slug'  => $data['agency_slug'],
            'email' => $data['email'],
        ]);

        $userId = $this->userModel->create([
            'agency_id'  => $agencyId,
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'email'      => $data['email'],
            'password'   => $data['password'],
            'role'       => 'admin',
        ]);

        $token = JwtService::generate($userId, $agencyId, 'admin');

        Response::json([
            'token' => $token,
            'user'  => [
                'id'         => $userId,
                'first_name' => $data['first_name'],
                'last_name'  => $data['last_name'],
                'email'      => $data['email'],
                'role'       => 'admin',
                'agency_id'  => $agencyId,
            ],
        ], 'Inscription réussie', 201);

        LogService::log(
            $agencyId,
            $userId,
            'register',
            "Création du compte agence {$data['agency_name']}"
        );
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request): void
    {
        $data = $request->all();

        $slug = $request->getHeader('x-agency-slug')
            ?? $data['slug']
            ?? null;

        if (empty($slug)) {
            Response::error('Slug de l\'agence requis', 400);
            exit;
        }

        $pdo  = \App\Core\Database::getInstance();
        $stmt = $pdo->prepare(
            'SELECT id, is_active FROM agencies WHERE slug = ? LIMIT 1'
        );
        $stmt->execute([$slug]);
        $agency = $stmt->fetch();

        if (!$agency) {
            Response::notFound("Agence '{$slug}' introuvable");
            exit;
        }

        if (!(bool) $agency['is_active']) {
            Response::error('Ce compte agence est désactivé', 403);
            exit;
        }

        $request->agencyId = (int) $agency['id'];

        $ip  = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $key = "login:{$ip}";

        if (!RateLimiter::check($key, 5, 60)) {
            $retryAfter = RateLimiter::retryAfter($key);
            header("Retry-After: {$retryAfter}");
            LogService::log(
                $request->agencyId,
                0,
                'brute_force_attempt',
                "Tentative de brute force depuis {$ip}"
            );
            Response::error(
                "Trop de tentatives. Réessayez dans {$retryAfter} secondes.",
                429
            );
            exit;
        }

        $errors = ValidationService::validate($data, [
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
            exit;
        }

        $user = $this->userModel->findByEmail(
            $data['email'],
            $request->agencyId
        );

        if ($user === null || !password_verify($data['password'], $user['password'])) {
            LogService::log(
                $request->agencyId,
                0,
                'login_failed',
                "Échec connexion pour : {$data['email']}"
            );
            Response::unauthorized('Email ou mot de passe incorrect');
            exit;
        }

        if (!(bool) $user['is_active']) {
            Response::forbidden('Votre compte a été désactivé');
            exit;
        }

        RateLimiter::reset($key);
        $this->userModel->updateLastLogin($user['id']);

        LogService::log(
            $request->agencyId,
            $user['id'],
            'login',
            "Connexion de {$user['first_name']} {$user['last_name']} ({$user['role']})"
        );

        $token = JwtService::generate(
            $user['id'],
            $user['agency_id'],
            $user['role']
        );

        Response::json([
            'token' => $token,
            'user'  => [
                'id'         => $user['id'],
                'first_name' => $user['first_name'],
                'last_name'  => $user['last_name'],
                'email'      => $user['email'],
                'role'       => $user['role'],
                'agency_id'  => $user['agency_id'],
            ],
        ], 'Connexion réussie');
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): void
    {
        $authUser = $this->authenticate($request);

        $user = $this->userModel->findById(
            $authUser['id'],
            $authUser['agency_id']
        );

        if ($user === null) {
            Response::notFound('Utilisateur introuvable');
        }

        Response::json($user);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): void
    {
        Response::json(null, 'Déconnexion réussie');
    }
}