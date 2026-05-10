<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\MailService;
use App\Services\SmsService;

class NotificationSettingsController extends BaseController
{
    /**
     * POST /api/notifications/test-email
     * Tester l'envoi d'email
     */
    public function testEmail(Request $request): void
    {
        $this->requireAdmin($request);
        $data = $request->all();

        if (empty($data['email'])) {
            Response::error('Email requis', 422);
        }

        $sent = MailService::send(
            $data['email'],
            'Test',
            'Test email Lokimmo',
            '<h2>Test email</h2><p>Votre configuration email fonctionne correctement !</p>'
        );

        if ($sent) {
            Response::json(null, 'Email envoyé avec succès');
        } else {
            Response::error('Erreur envoi email — vérifiez votre configuration SMTP', 500);
        }
    }

    /**
     * POST /api/notifications/test-sms
     * Tester l'envoi de SMS
     */
    public function testSms(Request $request): void
    {
        $this->requireAdmin($request);
        $data = $request->all();

        if (empty($data['phone'])) {
            Response::error('Numéro requis', 422);
        }

        $sent = SmsService::send(
            $data['phone'],
            'Test SMS Lokimmo — Votre configuration SMS fonctionne !'
        );

        if ($sent) {
            Response::json(null, 'SMS envoyé avec succès');
        } else {
            Response::error('Erreur envoi SMS — vérifiez votre configuration', 500);
        }
    }
}