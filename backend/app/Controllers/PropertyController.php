<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Property;
use App\Models\Owner;
use App\Services\ValidationService;
use App\Services\LogService;
use App\Services\BillingService;

class PropertyController extends BaseController
{
    private Property $propertyModel;
    private Owner    $ownerModel;

    public function __construct()
    {
        $this->propertyModel = new Property();
        $this->ownerModel    = new Owner();
    }

    // GET /api/properties
    public function index(Request $request): void
    {
        $this->authenticate($request);
        $properties = $this->propertyModel->findAllWithOwner(
            $request->agencyId
        );
        Response::json($properties);
    }

    // GET /api/properties/{id}
    public function show(Request $request, array $params): void
    {
        $this->authenticate($request);
        $id       = $this->validateId($params['id']);
        $property = $this->propertyModel->findById($id, $request->agencyId);

        if ($property === null) {
            Response::notFound('Bien introuvable');
        }

        Response::json($property);
    }

    // POST /api/properties
    public function store(Request $request): void
    {
        $user = $this->authenticate($request);

        // 1. VÃ©rification limite plan
        $billing = new BillingService();
        $check   = $billing->canAddProperty($request->agencyId);
        if (!$check['allowed']) {
            Response::error($check['reason'], 403, [
                'upgrade' => $check['upgrade'] ?? false,
                'code'    => 'PLAN_LIMIT_REACHED',
            ]);
        }

        // 2. Validation
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'owner_id'    => 'required|numeric',
            'title'       => 'required|max:200',
            'address'     => 'required',
            'city'        => 'required|max:100',
            'rent_amount' => 'required|numeric',
            'type'        => 'in:apartment,house,office,land,commercial',
            'status'      => 'in:available,rented,maintenance',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        // 3. VÃ©rifier propriÃ©taire agence
        if (!$this->ownerModel->belongsToAgency(
            (int) $data['owner_id'],
            $request->agencyId
        )) {
            Response::notFound('PropriÃ©taire introuvable');
        }

        // 4. CrÃ©er
        $id = $this->propertyModel->create(
            array_merge($data, ['agency_id' => $request->agencyId])
        );

        // 5. Log AVANT Response
        LogService::log(
            $request->agencyId,
            $user['id'],
            'create_property',
            "CrÃ©ation du bien : {$data['title']}",
            'property',
            (int) $id
        );

        // 6. RÃ©ponse
        Response::json(
            $this->propertyModel->findById($id, $request->agencyId),
            'Bien crÃ©Ã©',
            201
        );
    }

    // PUT /api/properties/{id}
    public function update(Request $request, array $params): void
    {
        $user = $this->authenticate($request);
        $id   = $this->validateId($params['id']);
        $data = $request->all();

        $errors = ValidationService::validate($data, [
            'owner_id'    => 'required|numeric',
            'title'       => 'required|max:200',
            'address'     => 'required',
            'city'        => 'required|max:100',
            'rent_amount' => 'required|numeric',
            'type'        => 'in:apartment,house,office,land,commercial',
            'status'      => 'in:available,rented,maintenance',
        ]);

        if (!empty($errors)) {
            Response::error('DonnÃ©es invalides', 422, $errors);
        }

        if (!$this->propertyModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Bien introuvable');
        }

        $this->propertyModel->update($id, $request->agencyId, $data);

        // Log AVANT Response
        LogService::log(
            $request->agencyId,
            $user['id'],
            'update_property',
            "Modification du bien ID {$id}",
            'property',
            $id
        );

        Response::json(
            $this->propertyModel->findById($id, $request->agencyId),
            'Bien mis Ã  jour'
        );
    }

    // DELETE /api/properties/{id}
    public function destroy(Request $request, array $params): void
    {
        $user = $this->requireAdmin($request);
        $id   = $this->validateId($params['id']);

        if (!$this->propertyModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Bien introuvable');
        }

        // Log AVANT suppression
        LogService::log(
            $request->agencyId,
            $user['id'],
            'delete_property',
            "Suppression du bien ID {$id}",
            'property',
            $id
        );

        $this->propertyModel->softDelete($id, $request->agencyId);
        Response::json(null, 'Bien supprimÃ©');
    }
}