<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Models\SuperAdmin;
use App\Models\Agency;
use App\Models\User;
use App\Services\JwtService;
use App\Services\ValidationService;
use App\Middlewares\SuperAdminMiddleware;
use App\Services\LogService;
use App\Services\BillingService;

class SuperAdminController extends BaseController
{
    private SuperAdmin $superAdminModel;
    private Agency     $agencyModel;
    private User       $userModel;

    public function __construct()
    {
        $this->superAdminModel = new SuperAdmin();
        $this->agencyModel     = new Agency();
        $this->userModel       = new User();
    }

    /**
     * POST /api/super/login
     */
    public function login(Request $request): void
    {
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        $superAdmin = $this->superAdminModel->findByEmail($data['email']);

        if ($superAdmin === null || !password_verify($data['password'], $superAdmin['password'])) {
            Response::unauthorized('Email ou mot de passe incorrect');
        }

        if (!(bool) $superAdmin['is_active']) {
            Response::forbidden('Compte dÃ©sactivÃ©');
        }

        $this->superAdminModel->updateLastLogin($superAdmin['id']);
        $token = JwtService::generateSuperAdmin($superAdmin['id']);

        LogService::logSuperAdmin(
            $superAdmin['id'],
            'super_admin_login',
            "Connexion Super Admin : {$superAdmin['email']}"
        );

        Response::json([
            'token'       => $token,
            'super_admin' => [
                'id'         => $superAdmin['id'],
                'first_name' => $superAdmin['first_name'],
                'last_name'  => $superAdmin['last_name'],
                'email'      => $superAdmin['email'],
                'type'       => 'super_admin',
            ],
        ], 'Connexion Super Admin rÃ©ussie');

    }

    /**
     * GET /api/super/me
     */
    public function me(Request $request): void
    {
        $superAdmin = SuperAdminMiddleware::handle($request);
        Response::json($superAdmin);
    }

    /**
     * GET /api/super/stats
     */
    public function stats(Request $request): void
    {
        SuperAdminMiddleware::handle($request);
        Response::json($this->agencyModel->getGlobalStats());
    }

    /**
     * GET /api/super/agencies
     */
    public function agencies(Request $request): void
    {
        SuperAdminMiddleware::handle($request);
        Response::json($this->agencyModel->findAllWithStats());
    }

    /**
     * GET /api/super/agencies/{id}
     * DÃ©tails complets d'une agence
     */
    public function showAgency(Request $request, array $params): void
    {
        SuperAdminMiddleware::handle($request);
        $id     = $this->validateId($params['id']);
        $agency = $this->agencyModel->findById($id);

        if ($agency === null) {
            Response::notFound('Agence introuvable');
        }

        // RÃ©cupÃ©rer les users, biens et contrats de l'agence
        $pdo = Database::getInstance();

        $users = $pdo->prepare(
            'SELECT id, first_name, last_name, email, role, is_active, created_at
             FROM users WHERE agency_id = ? AND deleted_at IS NULL
             ORDER BY created_at DESC'
        );
        $users->execute([$id]);

        $properties = $pdo->prepare(
            'SELECT id, title, type, city, rent_amount, status
             FROM properties WHERE agency_id = ? AND deleted_at IS NULL
             ORDER BY created_at DESC LIMIT 10'
        );
        $properties->execute([$id]);

        $contracts = $pdo->prepare(
            'SELECT c.id, c.rent_amount, c.status, c.start_date,
                    p.title AS property_title,
                    CONCAT(t.first_name," ",t.last_name) AS tenant_name
             FROM contracts c
             LEFT JOIN properties p ON p.id = c.property_id
             LEFT JOIN tenants    t ON t.id = c.tenant_id
             WHERE c.agency_id = ? AND c.deleted_at IS NULL
             ORDER BY c.created_at DESC LIMIT 10'
        );
        $contracts->execute([$id]);

        Response::json([
            'agency'     => $agency,
            'users'      => $users->fetchAll(),
            'properties' => $properties->fetchAll(),
            'contracts'  => $contracts->fetchAll(),
        ]);
    }

    /**
     * POST /api/super/agencies
     * CrÃ©er une agence + son admin depuis le Super Admin
     */
    public function createAgency(Request $request): void
    {
        $superAdmin = SuperAdminMiddleware::handle($request);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'agency_name' => 'required|max:150',
            'agency_slug' => 'required|max:100',
            'first_name'  => 'required|max:100',
            'last_name'   => 'required|max:100',
            'email'       => 'required|email|max:150',
            'password'    => 'required|min:8',
            'plan'        => 'in:free,starter,pro',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        if ($this->agencyModel->slugExists($data['agency_slug'])) {
            Response::error('Ce slug est dÃ©jÃ  pris', 409);
        }

        // CrÃ©er l'agence
        $agencyId = $this->agencyModel->create([
            'name'  => $data['agency_name'],
            'slug'  => $data['agency_slug'],
            'email' => $data['email'],
        ]);

        // Mettre Ã  jour le plan si spÃ©cifiÃ©
        if (!empty($data['plan'])) {
            $this->agencyModel->update($agencyId, [
                'name'  => $data['agency_name'],
                'email' => $data['email'],
                'plan'  => $data['plan'],
            ]);
        }

        // CrÃ©er l'admin de l'agence
        $userId = $this->userModel->create([
            'agency_id'  => $agencyId,
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'email'      => $data['email'],
            'password'   => $data['password'],
            'role'       => 'admin',
        ]);

        Response::json([
            'agency_id' => $agencyId,
            'user_id'   => $userId,
            'agency'    => $this->agencyModel->findById($agencyId),
        ], 'Agence crÃ©Ã©e avec succÃ¨s', 201);

        LogService::logSuperAdmin(
            $superAdmin['id'],
            'create_agency',
            "CrÃ©ation agence : {$data['agency_name']}",
            $agencyId
        );
    }

    /**
     * PUT /api/super/agencies/{id}
     * Modifier une agence
     */
    public function updateAgency(Request $request, array $params): void
    {
        SuperAdminMiddleware::handle($request);
        $id     = $this->validateId($params['id']);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'name'  => 'required|max:150',
            'email' => 'required|email',
            'plan'  => 'in:free,starter,pro',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        if ($this->agencyModel->findById($id) === null) {
            Response::notFound('Agence introuvable');
        }

        $this->agencyModel->update($id, $data);
        Response::json($this->agencyModel->findById($id), 'Agence mise Ã  jour');
    }

    /**
     * PUT /api/super/agencies/{id}/toggle
     * Activer / DÃ©sactiver une agence
     */
    public function toggleAgency(Request $request, array $params): void
    {
        $superAdmin = SuperAdminMiddleware::handle($request);
        $id = $this->validateId($params['id']);

        if (!$this->agencyModel->toggleStatus($id)) {
            Response::notFound('Agence introuvable');
        }

        $agency = $this->agencyModel->findById($id);
        $status = $agency['is_active'] ? 'activÃ©e' : 'dÃ©sactivÃ©e';
        Response::json($agency, "Agence {$status}");

        LogService::logSuperAdmin(
            $superAdmin['id'],
            'toggle_agency',
            "Agence {$id} : " . ($agency['is_active'] ? 'activÃ©e' : 'dÃ©sactivÃ©e'),
            $id
        );
    }

    /**
     * DELETE /api/super/agencies/{id}
     * Soft delete d'une agence
     */
    public function deleteAgency(Request $request, array $params): void
    {
        $superAdmin = SuperAdminMiddleware::handle($request);
        $id     = $this->validateId($params['id']);
        $agency = $this->agencyModel->findById($id);

        if ($agency === null) {
            Response::notFound('Agence introuvable');
        }

        $pdo  = Database::getInstance();

        // Soft delete l'agence
        $pdo->prepare('UPDATE agencies SET is_active = 0 WHERE id = ?')
            ->execute([$id]);

        // DÃ©sactiver tous les users de l'agence
        $pdo->prepare('UPDATE users SET is_active = 0 WHERE agency_id = ?')
            ->execute([$id]);

        Response::json(null, 'Agence supprimÃ©e');

        LogService::logSuperAdmin(
            $superAdmin['id'],
            'delete_agency',
            "Suppression agence ID {$id}",
            $id
        );
    }

    /**
     * PUT /api/super/agencies/{id}/reset-password
     * RÃ©initialiser le mot de passe de l'admin d'une agence
     */
    public function resetAdminPassword(Request $request, array $params): void
    {
        SuperAdminMiddleware::handle($request);
        $id     = $this->validateId($params['id']);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'password' => 'required|min:8',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        $pdo  = Database::getInstance();

        // Trouver l'admin de l'agence
        $stmt = $pdo->prepare(
            'SELECT id FROM users
             WHERE agency_id = ? AND role = "admin"
               AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([$id]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::notFound('Admin de l\'agence introuvable');
        }

        // Mettre Ã  jour le mot de passe
        $hash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo->prepare('UPDATE users SET password = ? WHERE id = ?')
            ->execute([$hash, $admin['id']]);

        Response::json(null, 'Mot de passe rÃ©initialisÃ©');
    }

    /**
     * PUT /api/super/agencies/{id}/plan
     * Changer le plan d'une agence
     */
    public function changePlan(Request $request, array $params): void
    {
    $superAdmin = SuperAdminMiddleware::handle($request);
    $id         = $this->validateId($params['id']);
    $data       = $request->all();

    if (empty($data['plan'])) {
        Response::error('Plan requis', 422);
    }

    $billing = new BillingService();
    $changed = $billing->changePlan($id, $data['plan']);

    if (!$changed) {
        Response::error('Plan introuvable', 404);
    }

    // Mettre aussi Ã  jour le champ plan dans agencies
    $pdo = \App\Core\Database::getInstance();
    $pdo->prepare(
        'UPDATE agencies SET plan = ? WHERE id = ?'
    )->execute([$data['plan'], $id]);

    LogService::logSuperAdmin(
        $superAdmin['id'],
        'change_plan',
        "Plan agence ID {$id} changÃ© en : {$data['plan']}",
        $id
    );

    Response::json(null, 'Plan mis Ã  jour');
    }
}