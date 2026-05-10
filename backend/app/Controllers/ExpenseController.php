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

        $sql = 'SELECT e.*,
               p.title AS property_title,
               p.city  AS property_city
        FROM property_expenses e
        LEFT JOIN properties p ON p.id = e.property_id
        WHERE e.agency_id = ? AND e.deleted_at IS NULL';

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

        $stmt = $this->db->prepare(
            'SELECT id FROM properties WHERE id = ? AND agency_id = ? AND deleted_at IS NULL'
        );
        $stmt->execute([$data['property_id'], $request->agencyId]);
        if (!$stmt->fetch()) Response::notFound('Bien introuvable');

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

        $stmt = $this->db->prepare(
            'UPDATE property_expenses
             SET title        = :title,
                 amount       = :amount,
                 category     = :category,
                 expense_date = :date,
                 notes        = :notes
             WHERE id = :id AND agency_id = :agency_id AND deleted_at IS NULL'
        );
        $stmt->execute([
            ':title'     => $data['title'],
            ':amount'    => $data['amount'],
            ':category'  => $data['category'],
            ':date'      => $data['expense_date'],
            ':notes'     => $data['notes'] ?? null,
            ':id'        => $id,
            ':agency_id' => $request->agencyId,
        ]);

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