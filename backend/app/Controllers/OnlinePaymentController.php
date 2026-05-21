<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Services\CinetPayService;
use App\Services\LogService;
use App\Services\NotificationMailService;

class OnlinePaymentController extends BaseController
{
    private \PDO            $db;
    private CinetPayService $cinetpay;

    public function __construct()
    {
        $this->db       = Database::getInstance();
        $this->cinetpay = new CinetPayService();
    }

    /**
     * POST /api/online-payments/initiate
     */
    public function initiate(Request $request): void
    {
        $user = $this->authenticate($request);
        $data = $request->all();

        if (empty($data['payment_id'])) {
            Response::error('payment_id requis', 422);
        }

        // RÃ©cupÃ©rer le paiement
        $stmt = $this->db->prepare(
            'SELECT py.*, t.first_name, t.last_name, t.email, t.phone,
                    p.title AS property_title,
                    a.name AS agency_name, a.primary_color,
                    a.slug AS agency_slug
             FROM payments py
             LEFT JOIN contracts  c ON c.id = py.contract_id
             LEFT JOIN tenants    t ON t.id = c.tenant_id
             LEFT JOIN properties p ON p.id = c.property_id
             LEFT JOIN agencies   a ON a.id = py.agency_id
             WHERE py.id = ? AND py.agency_id = ?
             LIMIT 1'
        );
        $stmt->execute([$data['payment_id'], $request->agencyId]);
        $payment = $stmt->fetch();

        if (!$payment) Response::notFound('Paiement introuvable');
        if ($payment['status'] === 'paid') {
            Response::error('Ce paiement est dÃ©jÃ  rÃ©glÃ©', 400);
        }

        // GÃ©nÃ©rer un ID transaction unique
        $transactionId = 'LK-' . $request->agencyId . '-' . $data['payment_id'] . '-' . time();

        $amount      = (float) $payment['amount_due'];
        $description = "Loyer {$payment['property_title']} "
            . "{$payment['period_month']}/{$payment['period_year']}";

        $appUrl    = env('APP_URL', 'http://localhost:5173');
        $returnUrl = "{$appUrl}/payments/confirm?transaction_id={$transactionId}";
        $notifyUrl = env('BACKEND_URL', 'http://localhost/lokimmo/backend/public')
            . '/api/online-payments/notify';

        // Initier avec CinetPay
        $result = $this->cinetpay->initiatePayment(
            $transactionId,
            $amount,
            $description,
            $returnUrl,
            $notifyUrl,
            $payment['first_name'] ?? 'Client',
            $payment['last_name']  ?? '',
            $payment['email']      ?? '',
            $payment['phone']      ?? '',
        );

        if (!$result) {
            Response::error('Impossible d\'initialiser le paiement CinetPay', 500);
        }

        // Enregistrer en base
        $this->db->prepare(
            'INSERT INTO online_payments
                (agency_id, payment_id, contract_id, tenant_id,
                 amount, description, provider, provider_token,
                 checkout_url, metadata)
             VALUES (?, ?, ?, ?, ?, ?, "cinetpay", ?, ?, ?)'
        )->execute([
            $request->agencyId,
            $payment['id'],
            $payment['contract_id'],
            $payment['tenant_id'] ?? null,
            $amount,
            $description,
            $transactionId,
            $result['payment_url'],
            json_encode($result['response']),
        ]);

        LogService::log(
            $request->agencyId,
            $user['id'],
            'initiate_online_payment',
            "Paiement CinetPay initiÃ© : {$amount} FCFA"
        );

        Response::json([
            'transaction_id' => $transactionId,
            'payment_url'    => $result['payment_url'],
        ], 'Paiement initiÃ©');
    }

    /**
     * POST /api/online-payments/verify
     * VÃ©rifier aprÃ¨s retour utilisateur
     */
    public function verify(Request $request): void
    {
        $data = $request->all();

        if (empty($data['transaction_id'])) {
            Response::error('transaction_id requis', 422);
        }

        $result = $this->cinetpay->checkPayment($data['transaction_id']);

        if (!$result) {
            Response::error('Impossible de vÃ©rifier le paiement', 500);
        }

        // RÃ©cupÃ©rer la transaction en base
        $stmt = $this->db->prepare(
            'SELECT * FROM online_payments WHERE provider_token = ? LIMIT 1'
        );
        $stmt->execute([$data['transaction_id']]);
        $onlinePayment = $stmt->fetch();

        if (!$onlinePayment) Response::notFound('Transaction introuvable');

        if ($result['is_paid'] && $onlinePayment['status'] !== 'completed') {
            $this->markAsPaid($onlinePayment, $data['transaction_id']);
        }

        Response::json([
            'status'  => $result['status'],
            'is_paid' => $result['is_paid'],
            'amount'  => $onlinePayment['amount'],
            'paid_at' => $onlinePayment['paid_at'],
            'method'  => $result['payment_method'],
        ]);
    }

    /**
     * POST /api/online-payments/notify
     * Webhook CinetPay â€” appelÃ© automatiquement par CinetPay
     */
    public function notify(Request $request): void
    {
        $transactionId = $_POST['cpm_trans_id']   ?? $request->input('cpm_trans_id');
        $status        = $_POST['cpm_result']      ?? $request->input('cpm_result');

        if (empty($transactionId)) {
            http_response_code(400);
            echo 'KO'; exit;
        }

        // VÃ©rifier avec l'API
        $result = $this->cinetpay->checkPayment($transactionId);

        if ($result && $result['is_paid']) {
            $stmt = $this->db->prepare(
                'SELECT * FROM online_payments WHERE provider_token = ? LIMIT 1'
            );
            $stmt->execute([$transactionId]);
            $onlinePayment = $stmt->fetch();

            if ($onlinePayment && $onlinePayment['status'] !== 'completed') {
                $this->markAsPaid($onlinePayment, $transactionId);
            }
        }

        echo 'OK'; exit;
    }

    /**
     * GET /api/online-payments
     */
    public function index(Request $request): void
    {
        $this->authenticate($request);

        $stmt = $this->db->prepare(
            'SELECT op.*,
                    CONCAT(t.first_name, " ", t.last_name) AS tenant_name,
                    p.title AS property_title
             FROM online_payments op
             LEFT JOIN contracts  c ON c.id = op.contract_id
             LEFT JOIN tenants    t ON t.id = c.tenant_id
             LEFT JOIN properties p ON p.id = c.property_id
             WHERE op.agency_id = ?
             ORDER BY op.created_at DESC
             LIMIT 100'
        );
        $stmt->execute([$request->agencyId]);

        Response::json($stmt->fetchAll());
    }

    /**
     * Marquer un paiement comme rÃ©glÃ©
     */
    private function markAsPaid(array $onlinePayment, string $transactionId): void
    {
        // Mettre Ã  jour online_payments
        $this->db->prepare(
            'UPDATE online_payments
             SET status = "completed", paid_at = NOW()
             WHERE provider_token = ?'
        )->execute([$transactionId]);

        // Mettre Ã  jour payments
        if ($onlinePayment['payment_id']) {
            $this->db->prepare(
                'UPDATE payments
                 SET status         = "paid",
                     amount_paid    = amount_due,
                     payment_date   = NOW(),
                     payment_method = "mobile_money"
                 WHERE id = ?'
            )->execute([$onlinePayment['payment_id']]);
        }

        // Email confirmation locataire
        try {
            $stmt = $this->db->prepare(
                'SELECT t.first_name, t.last_name, t.email, t.phone,
                        p.title AS property_title,
                        py.period_month, py.period_year,
                        py.amount_due AS amount_paid,
                        NOW() AS payment_date,
                        a.name, a.phone AS agency_phone,
                        a.primary_color, a.logo_url
                 FROM online_payments op
                 LEFT JOIN payments   py ON py.id = op.payment_id
                 LEFT JOIN contracts  c  ON c.id  = op.contract_id
                 LEFT JOIN tenants    t  ON t.id  = c.tenant_id
                 LEFT JOIN properties p  ON p.id  = c.property_id
                 LEFT JOIN agencies   a  ON a.id  = op.agency_id
                 WHERE op.provider_token = ? LIMIT 1'
            );
            $stmt->execute([$transactionId]);
            $details = $stmt->fetch();

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
                        'name'          => $details['name'],
                        'phone'         => $details['agency_phone'],
                        'primary_color' => $details['primary_color'],
                        'logo_url'      => $details['logo_url'],
                    ]
                );
            }
        } catch (\Exception $e) {
            error_log("markAsPaid email error: {$e->getMessage()}");
        }
    }
}