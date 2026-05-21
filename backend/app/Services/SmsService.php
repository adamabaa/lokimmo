<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Service SMS via Africa's Talking
 * Parfait pour le SÃ©nÃ©gal (Orange, Free, Expresso)
 */
class SmsService
{
    /**
     * Envoie un SMS
     */
    public static function send(string $phone, string $message): bool
    {
        $username = env('AT_USERNAME', 'sandbox');
        $apiKey   = env('AT_API_KEY',  '');

        if (empty($apiKey)) {
            error_log("SmsService: AT_API_KEY non configurÃ©");
            return false;
        }

        // Formater le numÃ©ro (SÃ©nÃ©gal +221)
        $phone = self::formatPhone($phone);

        try {
            $url  = $username === 'sandbox'
                ? 'https://api.sandbox.africastalking.com/version1/messaging'
                : 'https://api.africastalking.com/version1/messaging';

            $data = http_build_query([
                'username' => $username,
                'to'       => $phone,
                'message'  => $message,
                'from'     => env('AT_SENDER_ID', 'Lokimmo'),
            ]);

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $data,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => [
                    'Accept: application/json',
                    "apiKey: {$apiKey}",
                    'Content-Type: application/x-www-form-urlencoded',
                ],
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode >= 200 && $httpCode < 300) {
                $result = json_decode($response, true);
                return ($result['SMSMessageData']['Recipients'][0]['status'] ?? '') === 'Success';
            }

            error_log("SmsService Error: HTTP {$httpCode} â€” {$response}");
            return false;

        } catch (\Exception $e) {
            error_log("SmsService Error: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Formate le numÃ©ro au format international
     */
    private static function formatPhone(string $phone): string
    {
        // Supprimer espaces et tirets
        $phone = preg_replace('/[\s\-\(\)]/', '', $phone);

        // SÃ©nÃ©gal : 7X XXX XX XX â†’ +2217X XXX XX XX
        if (preg_match('/^(7[0-9]{8})$/', $phone)) {
            return '+221' . $phone;
        }

        // DÃ©jÃ  au format international
        if (str_starts_with($phone, '+')) {
            return $phone;
        }

        // Ajouter +221 par dÃ©faut
        return '+221' . ltrim($phone, '0');
    }
}