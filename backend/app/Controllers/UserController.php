<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Models\User;
use App\Services\ValidationService;
use App\Services\BillingService;

class UserController extends BaseController
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    // GET /api/users
    public function index(Request $request): void
    {
        $this->requireAdmin($request);
        $users = $this->userModel->findAllByAgency($request->agencyId);
        Response::json($users);
    }

    // POST /api/users
    public function store(Request $request): void
    {
        $this->requireAdmin($request);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'first_name' => 'required|max:100',
            'last_name'  => 'required|max:100',
            'email'      => 'required|email|max:150',
            'password'   => 'required|min:8|confirmed',
            'role'       => 'required|in:admin,agent,caissier_principal,caissier_secondaire',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        $billing = new BillingService();
        $check   = $billing->canAddUser($request->agencyId);

        if (!$check['allowed']) {
            Response::error($check['reason'], 403, [
                'upgrade' => $check['upgrade'] ?? false,
                'code'    => 'PLAN_LIMIT_REACHED',
            ]);
        }

        if ($this->userModel->emailExists($data['email'], $request->agencyId)) {
            Response::error('Cet email est déjà utilisé', 409);
        }

        $userId = $this->userModel->create([
            'agency_id'  => $request->agencyId,
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'email'      => $data['email'],
            'password'   => $data['password'],
            'role'       => $data['role'],
        ]);

        $user = $this->userModel->findById($userId, $request->agencyId);
        Response::json($user, 'Agent créé avec succès', 201);
    }

    // PUT /api/users/{id}
    public function update(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id     = $this->validateId($params['id']);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'first_name' => 'sometimes|max:100',
            'last_name'  => 'sometimes|max:100',
            'email'      => 'sometimes|email|max:150',
            'role'       => 'sometimes|in:admin,agent,caissier_principal,caissier_secondaire',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        if (!$this->userModel->findById($id, $request->agencyId)) {
            Response::notFound('Utilisateur introuvable');
        }

        // Vérifier email uniquement s'il est envoyé
        if (isset($data['email']) && $this->userModel->emailExists($data['email'], $request->agencyId, $id)) {
            Response::error('Cet email est déjà utilisé', 409);
        }

        $allowed = ['first_name', 'last_name', 'email', 'role'];
        $sets    = [];
        $params2 = [':id' => $id, ':agency_id' => $request->agencyId];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $sets[]               = "{$field} = :{$field}";
                $params2[":{$field}"] = $data[$field];
            }
        }

        if (empty($sets)) {
            Response::error('Aucune donnée à mettre à jour', 422);
        }

        $pdo = Database::getInstance();
        $pdo->prepare(
            'UPDATE users SET ' . implode(', ', $sets)
            . ' WHERE id = :id AND agency_id = :agency_id AND deleted_at IS NULL'
        )->execute($params2);

        Response::json(
            $this->userModel->findById($id, $request->agencyId),
            'Agent mis à jour'
        );
    }

    // PUT /api/users/{id}/toggle
    public function toggle(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id   = $this->validateId($params['id']);
        $user = $this->userModel->findById($id, $request->agencyId);

        if (!$user) {
            Response::notFound('Utilisateur introuvable');
        }

        if ($id === $request->user['id']) {
            Response::error('Vous ne pouvez pas désactiver votre propre compte', 400);
        }

        $pdo  = Database::getInstance();
        $stmt = $pdo->prepare(
            'UPDATE users
             SET is_active = IF(is_active = 1, 0, 1)
             WHERE id = ? AND agency_id = ?'
        );
        $stmt->execute([$id, $request->agencyId]);

        $updated = $this->userModel->findById($id, $request->agencyId);
        $status  = $updated['is_active'] ? 'activé' : 'désactivé';
        Response::json($updated, "Compte {$status}");
    }

    // PUT /api/users/{id}/reset-password
    public function resetPassword(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id     = $this->validateId($params['id']);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'password' => 'required|min:8|confirmed',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        if (!$this->userModel->findById($id, $request->agencyId)) {
            Response::notFound('Utilisateur introuvable');
        }

        $hash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $pdo  = Database::getInstance();
        $pdo->prepare(
            'UPDATE users SET password = ? WHERE id = ? AND agency_id = ?'
        )->execute([$hash, $id, $request->agencyId]);

        Response::json(null, 'Mot de passe réinitialisé');
    }

    // DELETE /api/users/{id}
    public function destroy(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id   = $this->validateId($params['id']);
        $user = $this->userModel->findById($id, $request->agencyId);

        if (!$user) {
            Response::notFound('Utilisateur introuvable');
        }

        if ($id === $request->user['id']) {
            Response::error('Vous ne pouvez pas supprimer votre propre compte', 400);
        }

        $this->userModel->softDelete($id, $request->agencyId);
        Response::json(null, 'Agent supprimé');
    }
}