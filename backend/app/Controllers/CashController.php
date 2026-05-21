<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Services\ValidationService;
use App\Services\LogService;

class CashController extends BaseController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function todaySession(Request $request): void
    {
        $user = $this->authenticate($request);
        $this->requireCashier($request);

        $stmt = $this->db->prepare(
            "SELECT s.*,
                    u.first_name, u.last_name,
                    COALESCE((
                        SELECT SUM(amount) FROM cash_operations
                        WHERE session_id = s.id AND type = 'income'
                          AND status = 'validated'
                    ), 0) AS total_income,
                    COALESCE((
                        SELECT SUM(amount) FROM cash_operations
                        WHERE session_id = s.id AND type = 'expense'
                          AND status = 'validated'
                    ), 0) AS total_expense
             FROM cash_sessions s
             LEFT JOIN users u ON u.id = s.user_id
             WHERE s.agency_id = ? AND s.user_id = ?
               AND s.date = CURDATE()
             LIMIT 1"
        );
        $stmt->execute([$request->agencyId, $user['id']]);
        $session = $stmt->fetch();

        Response::json($session ?: null);
    }

    public function openSession(Request $request): void
    {
        $user = $this->authenticate($request);
        $this->requireCashier($request);

        $stmt = $this->db->prepare(
            'SELECT id FROM cash_sessions
             WHERE agency_id = ? AND user_id = ? AND date = CURDATE()'
        );
        $stmt->execute([$request->agencyId, $user['id']]);
        if ($stmt->fetch()) {
            Response::error("Caisse déjà ouverte aujourd'hui", 400);
        }

        $data = $request->all();

        $this->db->prepare(
            'INSERT INTO cash_sessions
                (agency_id, user_id, date, opening_balance, notes)
             VALUES (?, ?, CURDATE(), ?, ?)'
        )->execute([
            $request->agencyId,
            $user['id'],
            $data['opening_balance'] ?? 0,
            $data['notes'] ?? null,
        ]);

        $id = $this->db->lastInsertId();

        LogService::log(
            $request->agencyId,
            $user['id'],
            'open_cash_session',
            "Ouverture caisse — solde : " . ($data['opening_balance'] ?? 0) . " FCFA"
        );

        $stmt = $this->db->prepare('SELECT * FROM cash_sessions WHERE id = ?');
        $stmt->execute([$id]);
        Response::json($stmt->fetch(), 'Caisse ouverte', 201);
    }

    public function closeSession(Request $request, array $params): void
    {
        $user = $this->authenticate($request);
        $this->requirePrincipalCashier($request);

        $id   = $this->validateId($params['id']);
        $data = $request->all();

        $stmt = $this->db->prepare(
            "SELECT * FROM cash_sessions
             WHERE id = ? AND agency_id = ? AND status = 'open' LIMIT 1"
        );
        $stmt->execute([$id, $request->agencyId]);
        $session = $stmt->fetch();

        if (!$session) {
            Response::notFound('Session introuvable ou déjà clôturée');
        }

        $stmt2 = $this->db->prepare(
            "SELECT
                COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
             FROM cash_operations
             WHERE session_id = ? AND status = 'validated'"
        );
        $stmt2->execute([$id]);
        $totals = $stmt2->fetch();

        $closingBalance = $session['opening_balance']
            + $totals['income']
            - $totals['expense'];

        $this->db->prepare(
            "UPDATE cash_sessions
             SET status = 'closed',
                 closing_balance = ?,
                 notes = ?,
                 closed_at = NOW()
             WHERE id = ?"
        )->execute([
            $data['closing_balance'] ?? $closingBalance,
            $data['notes'] ?? null,
            $id,
        ]);

        LogService::log(
            $request->agencyId,
            $user['id'],
            'close_cash_session',
            "Clôture caisse — solde : {$closingBalance} FCFA"
        );

        $stmt3 = $this->db->prepare('SELECT * FROM cash_sessions WHERE id = ?');
        $stmt3->execute([$id]);
        Response::json($stmt3->fetch(), 'Caisse clôturée');
    }

    public function sessions(Request $request): void
    {
        $user = $this->authenticate($request);
        $this->requireCashier($request);

        $isPrincipal = in_array($user['role'], ['admin', 'caissier_principal']);

        $sql = "SELECT s.*,
                       CONCAT(u.first_name, ' ', u.last_name) AS cashier_name,
                       u.role AS cashier_role,
                       COALESCE((
                           SELECT SUM(amount) FROM cash_operations
                           WHERE session_id = s.id AND type = 'income'
                             AND status = 'validated'
                       ), 0) AS total_income,
                       COALESCE((
                           SELECT SUM(amount) FROM cash_operations
                           WHERE session_id = s.id AND type = 'expense'
                             AND status = 'validated'
                       ), 0) AS total_expense
                FROM cash_sessions s
                LEFT JOIN users u ON u.id = s.user_id
                WHERE s.agency_id = ?";
        $params = [$request->agencyId];

        if (!$isPrincipal) {
            $sql    .= ' AND s.user_id = ?';
            $params[] = $user['id'];
        }

        $sql .= ' ORDER BY s.date DESC, s.created_at DESC LIMIT 30';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        Response::json($stmt->fetchAll());
    }

    public function operations(Request $request): void
    {
        $user = $this->authenticate($request);
        $this->requireCashier($request);

        $isPrincipal = in_array($user['role'], ['admin', 'caissier_principal']);
        $sessionId   = $_GET['session_id'] ?? null;

        $sql = "SELECT o.*,
                       CONCAT(u.first_name, ' ', u.last_name) AS cashier_name,
                       p.title AS property_title,
                       CONCAT(t.first_name, ' ', t.last_name) AS tenant_name
                FROM cash_operations o
                LEFT JOIN users      u ON u.id = o.user_id
                LEFT JOIN properties p ON p.id = o.property_id
                LEFT JOIN tenants    t ON t.id = o.tenant_id
                WHERE o.agency_id = ?";
        $params = [$request->agencyId];

        if ($sessionId) {
            $sql    .= ' AND o.session_id = ?';
            $params[] = (int) $sessionId;
        }

        if (!$isPrincipal) {
            $sql    .= ' AND o.user_id = ?';
            $params[] = $user['id'];
        }

        $sql .= ' ORDER BY o.created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        Response::json($stmt->fetchAll());
    }

    public function addOperation(Request $request): void
    {
        $user   = $this->authenticate($request);
        $this->requireCashier($request);

        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'type'        => 'required',
            'category'    => 'required',
            'amount'      => 'required',
            'description' => 'required|max:255',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        $stmt = $this->db->prepare(
            "SELECT id FROM cash_sessions
             WHERE agency_id = ? AND user_id = ?
               AND date = CURDATE() AND status = 'open'
             LIMIT 1"
        );
        $stmt->execute([$request->agencyId, $user['id']]);
        $session = $stmt->fetch();

        if (!$session) {
            Response::error("Aucune caisse ouverte. Ouvrez d'abord votre caisse.", 400);
        }

        $isPrincipal = in_array($user['role'], ['admin', 'caissier_principal']);
        $status      = $isPrincipal ? 'validated' : 'pending';

        $this->db->prepare(
            'INSERT INTO cash_operations
                (agency_id, session_id, user_id, type, category,
                 amount, description, reference, property_id,
                 tenant_id, payment_method, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $request->agencyId,
            $session['id'],
            $user['id'],
            $data['type'],
            $data['category'],
            $data['amount'],
            $data['description'],
            $data['reference']      ?? null,
            $data['property_id']    ?? null,
            $data['tenant_id']      ?? null,
            $data['payment_method'] ?? 'cash',
            $status,
        ]);

        $id = $this->db->lastInsertId();

        LogService::log(
            $request->agencyId,
            $user['id'],
            'cash_operation',
            "{$data['type']} — {$data['amount']} FCFA — {$data['description']}"
        );

        $stmt2 = $this->db->prepare('SELECT * FROM cash_operations WHERE id = ?');
        $stmt2->execute([$id]);
        Response::json(
            $stmt2->fetch(),
            $isPrincipal ? 'Opération enregistrée' : 'Opération en attente de validation',
            201
        );
    }

    public function validateOperation(Request $request, array $params): void
    {
        $user = $this->authenticate($request);
        $this->requirePrincipalCashier($request);

        $id = $this->validateId($params['id']);

        $this->db->prepare(
            "UPDATE cash_operations
             SET status = 'validated',
                 validated_by = ?,
                 validated_at = NOW()
             WHERE id = ? AND agency_id = ? AND status = 'pending'"
        )->execute([$user['id'], $id, $request->agencyId]);

        LogService::log(
            $request->agencyId,
            $user['id'],
            'validate_cash_operation',
            "Validation opération ID {$id}"
        );

        Response::json(null, 'Opération validée');
    }

    public function rejectOperation(Request $request, array $params): void
    {
        $user = $this->authenticate($request);
        $this->requirePrincipalCashier($request);

        $id = $this->validateId($params['id']);

        $this->db->prepare(
            "UPDATE cash_operations
             SET status = 'rejected'
             WHERE id = ? AND agency_id = ? AND status = 'pending'"
        )->execute([$id, $request->agencyId]);

        Response::json(null, 'Opération rejetée');
    }

    public function summary(Request $request): void
    {
        $user = $this->authenticate($request);
        $this->requireCashier($request);

        $isPrincipal = in_array($user['role'], ['admin', 'caissier_principal']);
        $userFilter  = $isPrincipal ? '' : 'AND o.user_id = ' . (int) $user['id'];

        $stmt = $this->db->prepare(
            "SELECT
                COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) as income_today,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense_today,
                COUNT(*) as operations_today
             FROM cash_operations o
             LEFT JOIN cash_sessions s ON s.id = o.session_id
             WHERE o.agency_id = ?
               AND DATE(o.created_at) = CURDATE()
               AND o.status = 'validated'
               {$userFilter}"
        );
        $stmt->execute([$request->agencyId]);
        $today = $stmt->fetch();

        $stmt2 = $this->db->prepare(
            "SELECT
                COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) as income_month,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense_month
             FROM cash_operations o
             WHERE o.agency_id = ?
               AND MONTH(o.created_at) = MONTH(NOW())
               AND YEAR(o.created_at)  = YEAR(NOW())
               AND o.status = 'validated'
               {$userFilter}"
        );
        $stmt2->execute([$request->agencyId]);
        $month = $stmt2->fetch();

        $pending = 0;
        if ($isPrincipal) {
            $stmt3 = $this->db->prepare(
                "SELECT COUNT(*) FROM cash_operations
                 WHERE agency_id = ? AND status = 'pending'"
            );
            $stmt3->execute([$request->agencyId]);
            $pending = (int) $stmt3->fetchColumn();
        }

        Response::json([
            'today'   => $today,
            'month'   => $month,
            'pending' => $pending,
        ]);
    }

    public function dailyReport(Request $request, array $params): void
    {
        $user = $this->authenticate($request);
        $this->requireCashier($request);

        $isPrincipal = in_array($user['role'], ['admin', 'caissier_principal']);
        $date        = $params['date'] ?? date('Y-m-d');

        $sql = "SELECT o.*,
                       CONCAT(u.first_name, ' ', u.last_name) AS cashier_name,
                       p.title AS property_title,
                       CONCAT(t.first_name, ' ', t.last_name) AS tenant_name
                FROM cash_operations o
                LEFT JOIN users      u ON u.id = o.user_id
                LEFT JOIN properties p ON p.id = o.property_id
                LEFT JOIN tenants    t ON t.id = o.tenant_id
                WHERE o.agency_id = ?
                  AND DATE(o.created_at) = ?
                  AND o.status = 'validated'";
        $params_arr = [$request->agencyId, $date];

        if (!$isPrincipal) {
            $sql         .= ' AND o.user_id = ?';
            $params_arr[] = $user['id'];
        }

        $sql .= ' ORDER BY o.created_at ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params_arr);
        $operations = $stmt->fetchAll();

        $totalIncome  = array_sum(array_column(
            array_filter($operations, fn($o) => $o['type'] === 'income'), 'amount'
        ));
        $totalExpense = array_sum(array_column(
            array_filter($operations, fn($o) => $o['type'] === 'expense'), 'amount'
        ));

        Response::json([
            'date'          => $date,
            'operations'    => $operations,
            'total_income'  => $totalIncome,
            'total_expense' => $totalExpense,
            'net'           => $totalIncome - $totalExpense,
        ]);
    }

    private function requireCashier(Request $request): void
    {
        $user    = $request->user ?? [];
        $role    = $user['role'] ?? '';
        $allowed = ['admin', 'caissier_principal', 'caissier_secondaire'];

        if (!in_array($role, $allowed)) {
            Response::forbidden('Accès réservé aux caissiers');
        }
    }

    private function requirePrincipalCashier(Request $request): void
    {
        $user = $request->user ?? [];
        $role = $user['role'] ?? '';

        if (!in_array($role, ['admin', 'caissier_principal'])) {
            Response::forbidden('Accès réservé au caissier principal');
        }
    }
}