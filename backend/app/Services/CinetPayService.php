<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Service de paiement CinetPay
 * Wave, Orange Money, MTN, Moov, Carte bancaire
 * Doc : https://docs.cinetpay.com
 */
class CinetPayService
{
    private const BASE_URL = 'https://api-checkout.cinetpay.com/v2';

    private string $apiKey;
    private string $siteId;
    private string $mode;

    public function __construct()
    {
        $this->apiKey = env('CINETPAY_API_KEY', '');
        $this->siteId = env('CINETPAY_SITE_ID', '');
        $this->mode   = env('CINETPAY_MODE',    'TEST');
    }

    /**
     * Initier un paiement â€” retourne l'URL de paiement
     */
    public function initiatePayment(
        string $transactionId,
        float  $amount,
        string $description,
        string $returnUrl,
        string $notifyUrl,
        string $customerName,
        string $customerSurname,
        string $customerEmail,
        string $customerPhone,
        string $currency = 'XOF'
    ): ?array {
        $payload = [
            'apikey'          => $this->apiKey,
            'site_id'         => $this->siteId,
            'transaction_id'  => $transactionId,
            'amount'          => (int) $amount,
            'currency'        => $currency,
            'description'     => $description,
            'return_url'      => $returnUrl,
            'notify_url'      => $notifyUrl,
            'customer_name'   => $customerName,
            'customer_surname'=> $customerSurname,
            'customer_email'  => $customerEmail,
            'customer_phone_number' => $customerPhone,
            'customer_address'=> 'Dakar',
            'customer_city'   => 'Dakar',
            'customer_country'=> 'SN',
            'customer_state'  => 'SN',
            'customer_zip_code'=> '00000',
            'channels'        => 'ALL', // Wave, OM, MTN, Carte...
            'metadata'        => $transactionId,
            'lang'            => 'fr',
            'invoice_data'    => [
                'RÃ©fÃ©rence' => $transactionId,
            ],
        ];

        $response = $this->request('POST', '/payment', $payload);

        if (!$response) return null;

        if (($response['code'] ?? '') !== '201') {
            error_log('CinetPay initiate error: ' . json_encode($response));
            return null;
        }

        return [
            'payment_token' => $response['data']['payment_token'] ?? null,
            'payment_url'   => $response['data']['payment_url']   ?? null,
            'response'      => $response,
        ];
    }

    /**
     * VÃ©rifier le statut d'un paiement
     */
    public function checkPayment(string $transactionId): ?array
    {
        $payload = [
            'apikey'         => $this->apiKey,
            'site_id'        => $this->siteId,
            'transaction_id' => $transactionId,
        ];

        $response = $this->request('POST', '/payment/check', $payload);

        if (!$response) return null;

        return [
            'code'           => $response['code']                   ?? null,
            'status'         => $response['data']['status']         ?? null,
            'amount'         => $response['data']['amount']         ?? null,
            'currency'       => $response['data']['currency']       ?? null,
            'payment_method' => $response['data']['payment_method'] ?? null,
            'description'    => $response['data']['description']    ?? null,
            'is_paid'        => ($response['data']['status'] ?? '') === 'ACCEPTED',
            'raw'            => $response,
        ];
    }

    /**
     * RequÃªte HTTP
     */
    private function request(string $method, string $endpoint, array $data = []): ?array
    {
        $url = self::BASE_URL . $endpoint;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
            ],
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST,      true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$response) {
            error_log("CinetPay request failed: {$endpoint}");
            return null;
        }

        return json_decode($response, true);
    }
}