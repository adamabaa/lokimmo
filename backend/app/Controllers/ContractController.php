<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Contract;
use App\Models\Property;
use App\Models\Tenant;
use App\Services\ValidationService;

class ContractController extends BaseController
{
    private Contract $contractModel;
    private Property $propertyModel;
    private Tenant   $tenantModel;

    public function __construct()
    {
        $this->contractModel = new Contract();
        $this->propertyModel = new Property();
        $this->tenantModel   = new Tenant();
    }

    // GET /api/contracts
    public function index(Request $request): void
    {
        $this->authenticate($request);
        $contracts = $this->contractModel->findAllWithDetails(
            $request->agencyId
        );
        Response::json($contracts);
    }

    // GET /api/contracts/{id}
    public function show(Request $request, array $params): void
    {
        $this->authenticate($request);
        $id       = $this->validateId($params['id']);
        $contract = $this->contractModel->findById($id, $request->agencyId);

        if ($contract === null) {
            Response::notFound('Contrat introuvable');
        }

        Response::json($contract);
    }

    // POST /api/contracts
    public function store(Request $request): void
    {
        $this->authenticate($request);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'property_id' => 'required|numeric',
            'tenant_id'   => 'required|numeric',
            'start_date'  => 'required',
            'rent_amount' => 'required|numeric',
            'payment_day' => 'numeric',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        // VÃ©rifier que le bien appartient Ã  l'agence
        if (!$this->propertyModel->belongsToAgency(
            (int) $data['property_id'],
            $request->agencyId
        )) {
            Response::notFound('Bien introuvable');
        }

        // VÃ©rifier que le locataire appartient Ã  l'agence
        if (!$this->tenantModel->belongsToAgency(
            (int) $data['tenant_id'],
            $request->agencyId
        )) {
            Response::notFound('Locataire introuvable');
        }

        $id = $this->contractModel->create(
            array_merge($data, ['agency_id' => $request->agencyId])
        );

        // Marquer le bien comme louÃ©
        $this->contractModel->markPropertyAsRented(
            (int) $data['property_id']
        );

        Response::json(
            $this->contractModel->findById($id, $request->agencyId),
            'Contrat crÃ©Ã©',
            201
        );
    }

    // PUT /api/contracts/{id}
    public function update(Request $request, array $params): void
    {
        $this->authenticate($request);
        $id     = $this->validateId($params['id']);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'rent_amount' => 'required|numeric',
            'status'      => 'in:active,expired,terminated',
            'payment_day' => 'numeric',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        if (!$this->contractModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Contrat introuvable');
        }

        $this->contractModel->update($id, $request->agencyId, $data);

        Response::json(
            $this->contractModel->findById($id, $request->agencyId),
            'Contrat mis Ã  jour'
        );
    }

    // DELETE /api/contracts/{id}
    public function destroy(Request $request, array $params): void
    {
        $this->requireAdmin($request);
        $id = $this->validateId($params['id']);

        if (!$this->contractModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Contrat introuvable');
        }

        $this->contractModel->softDelete($id, $request->agencyId);
        Response::json(null, 'Contrat supprimÃ©');
    }
}