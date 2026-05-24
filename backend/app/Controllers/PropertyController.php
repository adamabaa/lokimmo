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

        $billing = new BillingService();
        $check   = $billing->canAddProperty($request->agencyId);
        if (!$check['allowed']) {
            Response::error($check['reason'], 403, [
                'upgrade' => $check['upgrade'] ?? false,
                'code'    => 'PLAN_LIMIT_REACHED',
            ]);
        }

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
            Response::error('Données invalides', 422, $errors);
        }

        if (!$this->ownerModel->belongsToAgency(
            (int) $data['owner_id'],
            $request->agencyId
        )) {
            Response::notFound('Propriétaire introuvable');
        }

        $id = $this->propertyModel->create(
            array_merge($data, ['agency_id' => $request->agencyId])
        );

        LogService::log(
            $request->agencyId,
            $user['id'],
            'create_property',
            "Création du bien : {$data['title']}",
            'property',
            (int) $id
        );

        Response::json(
            $this->propertyModel->findById($id, $request->agencyId),
            'Bien créé',
            201
        );
    }

    // PUT /api/properties/{id}
    // PUT /api/properties/{id}
    public function update(Request $request, array $params): void
    {
        $user = $this->authenticate($request);
        $id   = $this->validateId($params['id']);
        $data = $request->all();

        // "sometimes" = valider le champ SEULEMENT s'il est présent dans la requête
        $errors = ValidationService::validate($data, [
            'owner_id'    => 'sometimes|numeric',
            'title'       => 'sometimes|max:200',
            'address'     => 'sometimes',
            'city'        => 'sometimes|max:100',
            'rent_amount' => 'sometimes|numeric',
            'type'        => 'sometimes|in:apartment,house,office,land,commercial',
            'status'      => 'sometimes|in:available,rented,maintenance',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        if (!$this->propertyModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Bien introuvable');
        }

        $this->propertyModel->update($id, $request->agencyId, $data);

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
            'Bien mis à jour'
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

        LogService::log(
            $request->agencyId,
            $user['id'],
            'delete_property',
            "Suppression du bien ID {$id}",
            'property',
            $id
        );

        $this->propertyModel->softDelete($id, $request->agencyId);
        Response::json(null, 'Bien supprimé');
    }
}