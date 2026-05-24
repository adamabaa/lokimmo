<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Services\ValidationService;
use App\Services\LogService;

class ExpenseController extends BaseController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * GET /api/expenses?property_id=X
     */
    public function index(Request $request): void
    {
        $this->authenticate($request);
        $propertyId = $request->input('property_id');

        $sql    = 'SELECT e.*, p.title AS property_title
                   FROM property_expenses e
                   LEFT JOIN properties p ON p.id = e.property_id
                   WHERE e.agency_id = ? AND e.deleted_at IS NULL';
        $params = [$request->agencyId];

        if ($propertyId) {
            $sql    .= ' AND e.property_id = ?';
            $params[] = (int) $propertyId;
        }

        $sql .= ' ORDER BY e.expense_date DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        Response::json($stmt->fetchAll());
    }

    /**
     * POST /api/expenses
     */
    public function store(Request $request): void
    {
        $user   = $this->authenticate($request);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'property_id'  => 'required',
            'title'        => 'required|max:150',
            'amount'       => 'required',
            'expense_date' => 'required',
            'category'     => 'required',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        // Vérifier que le bien appartient à l'agence avant l'insert
        $stmt = $this->db->prepare(
            'SELECT id FROM properties WHERE id = ? AND agency_id = ? AND deleted_at IS NULL'
        );
        $stmt->execute([$data['property_id'], $request->agencyId]);
        if (!$stmt->fetch()) {
            Response::notFound('Bien introuvable');
        }

        $stmt = $this->db->prepare(
            'INSERT INTO property_expenses
                (agency_id, property_id, title, amount, category, expense_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $request->agencyId,
            $data['property_id'],
            $data['title'],
            $data['amount'],
            $data['category'],
            $data['expense_date'],
            $data['notes'] ?? null,
        ]);

        $id = $this->db->lastInsertId();

        LogService::log(
            $request->agencyId,
            $user['id'],
            'create_expense',
            "Dépense créée : {$data['title']} — {$data['amount']} FCFA",
            'expense',
            (int) $id
        );

        Response::json(['id' => $id], 'Dépense enregistrée', 201);
    }

    /**
     * PUT /api/expenses/{id}
     */
    public function update(Request $request, array $params): void
    {
        $user = $this->authenticate($request);
        $id   = $this->validateId($params['id']);
        $data = $request->all();

        $errors = ValidationService::validate($data, [
            'title'        => 'sometimes|max:150',
            'amount'       => 'sometimes',
            'category'     => 'sometimes',
            'expense_date' => 'sometimes',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        $allowed = ['title', 'amount', 'category', 'expense_date', 'notes'];
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

        $sql = 'UPDATE property_expenses SET ' . implode(', ', $sets)
            . ' WHERE id = :id AND agency_id = :agency_id AND deleted_at IS NULL';

        $this->db->prepare($sql)->execute($params2);

        LogService::log(
            $request->agencyId,
            $user['id'],
            'update_expense',
            "Dépense modifiée ID {$id}"
        );

        Response::json(null, 'Dépense mise à jour');
    }

    /**
     * DELETE /api/expenses/{id}
     */
    public function destroy(Request $request, array $params): void
    {
        $user = $this->authenticate($request);
        $id   = $this->validateId($params['id']);

        $this->db->prepare(
            'UPDATE property_expenses
             SET deleted_at = NOW()
             WHERE id = ? AND agency_id = ?'
        )->execute([$id, $request->agencyId]);

        LogService::log(
            $request->agencyId,
            $user['id'],
            'delete_expense',
            "Dépense supprimée ID {$id}"
        );

        Response::json(null, 'Dépense supprimée');
    }
}