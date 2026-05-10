<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Models\Payment;
use App\Models\Contract;
use App\Services\ValidationService;
use App\Services\LogService;
use App\Services\NotificationMailService;
use App\Services\CashSyncService;

class PaymentController extends BaseController
{
    private Payment  $paymentModel;
    private Contract $contractModel;
    private \PDO     $db;

    public function __construct()
    {
        $this->paymentModel  = new Payment();
        $this->contractModel = new Contract();
        $this->db            = Database::getInstance();
    }

    // GET /api/payments
    public function index(Request $request): void
    {
        $this->authenticate($request);

        $page   = max(1, (int) ($_GET['page']  ?? 1));
        $limit  = min(50, (int) ($_GET['limit'] ?? 25));
        $offset = ($page - 1) * $limit;

        $countStmt = $this->db->prepare(
            'SELECT COUNT(*) FROM payments
            WHERE agency_id = ? AND deleted_at IS NULL'
        );
        $countStmt->execute([$request->agencyId]);
        $total = (int) $countStmt->fetchColumn();

        $payments = $this->paymentModel->findAllWithDetails(
            $request->agencyId,
            $limit,
            $offset
        );

        Response::json([
            'data'        => $payments,
            'total'       => $total,
            'page'        => $page,
            'total_pages' => (int) ceil($total / $limit),
        ]);
    }

    // GET /api/payments/{id}
    public function show(Request $request, array $params): void
    {
        $this->authenticate($request);
        $id      = $this->validateId($params['id']);
        $payment = $this->paymentModel->findById($id, $request->agencyId);

        if ($payment === null) {
            Response::notFound('Paiement introuvable');
        }

        Response::json($payment);
    }

    // POST /api/payments
    public function store(Request $request): void
    {
        $user   = $this->authenticate($request);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'contract_id'  => 'required|numeric',
            'amount_due'   => 'required|numeric',
            'due_date'     => 'required',
            'period_month' => 'required|numeric',
            'period_year'  => 'required|numeric',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        // Vérifier que le contrat appartient à l'agence
        if (!$this->contractModel->belongsToAgency(
            (int) $data['contract_id'],
            $request->agencyId
        )) {
            Response::notFound('Contrat introuvable');
        }

        $id = $this->paymentModel->create(
            array_merge($data, ['agency_id' => $request->agencyId])
        );

        // Sync caisse si payé directement à la création
        if (($data['status'] ?? '') === 'paid') {
            CashSyncService::syncPayment(
                (int) $id,
                $request->agencyId,
                $user['id']
            );
        }

        LogService::log(
            $request->agencyId,
            $user['id'],
            'create_payment',
            "Paiement créé — contrat ID {$data['contract_id']}",
            'payment',
            (int) $id
        );

        Response::json(
            $this->paymentModel->findById($id, $request->agencyId),
            'Paiement enregistré',
            201
        );
    }

    // PUT /api/payments/{id}
    public function update(Request $request, array $params): void
    {
        $user   = $this->authenticate($request);
        $id     = $this->validateId($params['id']);
        $data   = $request->all();

        $errors = ValidationService::validate($data, [
            'amount_paid' => 'required|numeric',
            'status'      => 'in:pending,paid,partial,late',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        if (!$this->paymentModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Paiement introuvable');
        }

        // 1. Récupérer l'ancien statut AVANT update
        $stmt = $this->db->prepare(
            'SELECT status FROM payments WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        $oldPayment = $stmt->fetch() ?: [];
        $oldStatus  = $oldPayment['status'] ?? '';

        // 2. Faire l'update
        $this->paymentModel->update($id, $request->agencyId, $data);

        $newStatus = $data['status'] ?? '';

        // 3. Sync caisse — payé pour la première fois
        if ($newStatus === 'paid' && $oldStatus !== 'paid') {
            CashSyncService::syncPayment(
                $id,
                $request->agencyId,
                $user['id']
            );
        }

        // 4. Désync caisse — remis en attente
        if ($oldStatus === 'paid' && $newStatus !== 'paid') {
            CashSyncService::unsyncPayment($id);
        }

        // 5. Email confirmation si nouveau statut = paid
        if ($newStatus === 'paid' && $oldStatus !== 'paid') {
            try {
                $stmt2 = $this->db->prepare(
                    'SELECT py.*, t.first_name, t.last_name, t.email, t.phone,
                            p.title AS property_title,
                            a.name AS agency_name,
                            a.phone AS agency_phone,
                            a.primary_color, a.logo_url
                     FROM payments py
                     LEFT JOIN contracts  c ON c.id = py.contract_id
                     LEFT JOIN tenants    t ON t.id = c.tenant_id
                     LEFT JOIN properties p ON p.id = c.property_id
                     LEFT JOIN agencies   a ON a.id = py.agency_id
                     WHERE py.id = ? LIMIT 1'
                );
                $stmt2->execute([$id]);
                $details = $stmt2->fetch();

                if ($details && !empty($details['email'])) {
                    NotificationMailService::sendPaymentConfirmation(
                        [
                            'first_name' => $details['first_name'],
                            'last_name'  => $details['last_name'],
                            'email'      => $details['email'],
                            'phone'      => $details['phone'],
                        ],
                        $details,
                        ['title' => $details['property_title']],
                        [
                            'name'          => $details['agency_name'],
                            'phone'         => $details['agency_phone'],
                            'primary_color' => $details['primary_color'],
                            'logo_url'      => $details['logo_url'],
                        ]
                    );
                }
            } catch (\Exception $e) {
                error_log("Email confirmation error: " . $e->getMessage());
            }
        }

        // 6. Log AVANT Response
        LogService::log(
            $request->agencyId,
            $user['id'],
            'update_payment',
            "Paiement ID {$id} mis à jour — statut : {$newStatus}",
            'payment',
            $id
        );

        Response::json(
            $this->paymentModel->findById($id, $request->agencyId),
            'Paiement mis à jour'
        );
    }

    // DELETE /api/payments/{id}
    public function destroy(Request $request, array $params): void
    {
        $user = $this->requireAdmin($request);
        $id   = $this->validateId($params['id']);

        if (!$this->paymentModel->belongsToAgency($id, $request->agencyId)) {
            Response::notFound('Paiement introuvable');
        }

        // Désync caisse avant suppression
        CashSyncService::unsyncPayment($id);

        LogService::log(
            $request->agencyId,
            $user['id'],
            'delete_payment',
            "Paiement ID {$id} supprimé",
            'payment',
            $id
        );

        $this->paymentModel->softDelete($id, $request->agencyId);
        Response::json(null, 'Paiement supprimé');
    }
}