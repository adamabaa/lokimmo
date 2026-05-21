<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Tenant;
use App\Services\ValidationService;
use App\Services\LogService;
use App\Services\NotificationMailService;
use App\Services\BillingService;

class TenantController extends BaseController
{
    private Tenant $tenantModel;

    public function __construct()
    {
        $this->tenantModel = new Tenant();
    }

    // GET /api/tenants
    public function index(Request $request): void
    {
        $this->authenticate($request);
        $tenants = $this->tenantModel->findAllByAgency($request->agencyId);
        Response::json($tenants);
    }

    // GET /api/tenants/{id}
    public function show(Request $request, array $params): void
    {
        $this->authenticate($request);
        $id     = $this->validateId($params['id']);
        $tenant = $this->tenantModel->findById($id, $request->agencyId);

        if ($tenant === null) {
            Response::notFound('Locataire introuvable');
        }

        Response::json($tenant);
    }

    // POST /api/tenants
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
        $check   = $billing->canAddTenant($request->agencyId);

        if (!$check['allowed']) {
            Response::error($check['reason'], 403, [
                'upgrade' => $check['upgrade'] ?? false,
                'code'    => 'PLAN_LIMIT_REACHED',
            ]);
        }

        $id = $this->tenantModel->create(
            array_merge($data, ['agency_id' => $request->agencyId])
        );



        Response::json(
            $this->tenantModel->findById($id, $request->agencyId),
            'Locataire crÃ©Ã©',
            201
        );
    }

    // PUT /api/tenants/{id}
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

        if (!$this->tenantModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Locataire introuvable');
        }

        $this->tenantModel->update($id, $request->agencyId, $data);

        Response::json(
            $this->tenantModel->findById($id, $request->agencyId),
            'Locataire mis Ã  jour'
        );
    }

    // DELETE /api/tenants/{id}
    public function destroy(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id = $this->validateId($params['id']);

        if (!$this->tenantModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Locataire introuvable');
        }

        $this->tenantModel->softDelete($id, $request->agencyId);
        Response::json(null, 'Locataire supprimÃ©');
    }

    public function setupPortal(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id     = $this->validateId($params['id']);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'portal_email'    => 'required|email',
            'portal_password' => 'required|min:6',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        if (!$this->tenantModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Locataire introuvable');
        }

        $pdo  = \App\Core\Database::getInstance();
        $stmt = $pdo->prepare(
            'UPDATE tenants
            SET portal_email    = :email,
                portal_password = :password,
                portal_active   = 1
            WHERE id = :id AND agency_id = :agency_id'
        );
        $stmt->execute([
            ':email'     => $data['portal_email'],
            ':password' => password_hash($data['portal_password'], PASSWORD_BCRYPT),
            ':id'        => $id,
            ':agency_id' => $request->agencyId,
        ]);

        LogService::log(
            $request->agencyId,
            $request->user['id'],
            'setup_portal',
            "AccÃ¨s portail activÃ© pour locataire ID {$id}"
        );

        // RÃ©cupÃ©rer les infos agence + locataire pour l'email
        $pdo2   = \App\Core\Database::getInstance();
        $tenant = $pdo2->prepare(
            'SELECT * FROM tenants WHERE id = ? LIMIT 1'
        );
        $tenant->execute([$id]);
        $tenantData = $tenant->fetch() ?: [];

        $agency = $pdo2->prepare(
            'SELECT * FROM agencies WHERE id = ? LIMIT 1'
        );
        $agency->execute([$request->agencyId]);
        $agencyData = $agency->fetch() ?: [];

        $slug = $agencyData['slug'] ?? '';

        // Envoyer email avec identifiants
        NotificationMailService::sendPortalAccess(
            $tenantData,
            $data['portal_password'], // mot de passe en clair avant hachage
            $slug,
            $agencyData
        );

        Response::json(null, 'AccÃ¨s portail activÃ©');
    }

    /**
     * DELETE /api/tenants/{id}/portal
     * DÃ©sactiver l'accÃ¨s portail
     */
    public function disablePortal(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id = $this->validateId($params['id']);

        $pdo = \App\Core\Database::getInstance();
        $pdo->prepare(
            'UPDATE tenants SET portal_active = 0 WHERE id = ? AND agency_id = ?'
        )->execute([$id, $request->agencyId]);

        Response::json(null, 'AccÃ¨s portail dÃ©sactivÃ©');
    }
}