<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Owner;
use App\Services\ValidationService;
use App\Services\LogService;
use App\Services\BillingService;

class OwnerController extends BaseController
{
    private Owner $ownerModel;

    public function __construct()
    {
        $this->ownerModel = new Owner();
    }

    // GET /api/owners
    public function index(Request $request): void
    {
        $this->authenticate($request);
        $owners = $this->ownerModel->findAllWithPropertyCount(
            $request->agencyId
        );
        Response::json($owners);
    }

    // GET /api/owners/{id}
    public function show(Request $request, array $params): void
    {
        $this->authenticate($request);
        $id    = $this->validateId($params['id']);
        $owner = $this->ownerModel->findById($id, $request->agencyId);

        if ($owner === null) {
            Response::notFound('PropriÃ©taire introuvable');
        }

        Response::json($owner);
    }

    // POST /api/owners
    public function store(Request $request): void
    {
        $user = $this->authenticate($request);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'first_name' => 'required|max:100',
            'last_name'  => 'required|max:100',
            'email'      => 'email|max:150',
            'phone'      => 'max:20',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        // â”€â”€ VÃ©rification limite plan â”€â”€
        $billing = new BillingService();
        $check   = $billing->canAddOwner($request->agencyId);

        if (!$check['allowed']) {
            Response::error($check['reason'], 403, [
                'upgrade' => $check['upgrade'] ?? false,
                'code'    => 'PLAN_LIMIT_REACHED',
            ]);
        }

        $id = $this->ownerModel->create(
            array_merge($data, ['agency_id' => $request->agencyId])
        );



        Response::json(
            $this->ownerModel->findById($id, $request->agencyId),
            'PropriÃ©taire crÃ©Ã©',
            201
        );
    }

    // PUT /api/owners/{id}
    public function update(Request $request, array $params): void
    {
        $this->authenticate($request);
        $id     = $this->validateId($params['id']);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'first_name' => 'required|max:100',
            'last_name'  => 'required|max:100',
            'email'      => 'email|max:150',
            'phone'      => 'max:20',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        if (!$this->ownerModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('PropriÃ©taire introuvable');
        }

        $this->ownerModel->update($id, $request->agencyId, $data);

        Response::json(
            $this->ownerModel->findById($id, $request->agencyId),
            'PropriÃ©taire mis Ã  jour'
        );
    }

    // DELETE /api/owners/{id}
    public function destroy(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id = $this->validateId($params['id']);

        if (!$this->ownerModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('PropriÃ©taire introuvable');
        }

        $this->ownerModel->softDelete($id, $request->agencyId);
        Response::json(null, 'PropriÃ©taire supprimÃ©');
    }

    public function setupPortal(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id   = $this->validateId($params['id']);
        $data = $request->all();

        $errors = ValidationService::validate($data, [
            'portal_email'    => 'required|email',
            'portal_password' => 'required|min:6',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        $pdo  = \App\Core\Database::getInstance();
        $stmt = $pdo->prepare(
            'UPDATE owners
            SET portal_email    = :email,
                portal_password = :password,
                portal_active   = 1
            WHERE id = :id AND agency_id = :agency_id'
        );
        $stmt->execute([
            ':email'     => $data['portal_email'],
            ':password'  => password_hash($data['portal_password'], PASSWORD_BCRYPT),
            ':id'        => $id,
            ':agency_id' => $request->agencyId,
        ]);

        LogService::log(
            $request->agencyId,
            $request->user['id'],
            'setup_owner_portal',
            "AccÃ¨s portail propriÃ©taire activÃ© ID {$id}"
        );

        Response::json(null, 'AccÃ¨s portail activÃ©');
    }

    public function disablePortal(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id = $this->validateId($params['id']);

        \App\Core\Database::getInstance()->prepare(
            'UPDATE owners SET portal_active = 0 WHERE id = ? AND agency_id = ?'
        )->execute([$id, $request->agencyId]);

        Response::json(null, 'AccÃ¨s portail dÃ©sactivÃ©');
    }
}