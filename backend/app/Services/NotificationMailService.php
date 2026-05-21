<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Service de notifications email/SMS mÃ©tier
 * Tous les templates de notifications Lokimmo
 */
class NotificationMailService
{
    /**
     * Email + SMS â€” Loyer en retard
     */
    public static function sendLatePayment(
        array $tenant,
        array $payment,
        array $property,
        array $agency
    ): void {
        $subject = "[{$agency['name']}] Rappel â€” Loyer en retard";

        $template = "
        <h2 style='color:#e5534b;margin:0 0 16px'>âš ï¸ Rappel de loyer</h2>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            Bonjour <strong>{tenant_name}</strong>,
        </p>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            Nous vous rappelons que votre loyer du mois de <strong>{month}</strong>
            pour le bien <strong>{property_title}</strong> est en retard.
        </p>

        <table width='100%' cellpadding='0' cellspacing='0'
            style='background:#fff8f0;border:1px solid #ffd0a0;border-radius:8px;padding:20px;margin:24px 0'>
            <tr>
                <td style='font-size:13px;color:#666;padding:4px 0'>Montant dÃ»</td>
                <td align='right' style='font-size:15px;font-weight:bold;color:#e5534b'>{amount_due}</td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:4px 0'>Date d'Ã©chÃ©ance</td>
                <td align='right' style='font-size:13px;color:#666'>{due_date}</td>
            </tr>
        </table>

        <p style='font-size:14px;color:#555;line-height:1.6'>
            Veuillez rÃ©gulariser votre situation au plus tÃ´t.
            Pour toute question, contactez votre agence au <strong>{agency_phone}</strong>.
        </p>

        <div style='margin-top:24px;padding:16px;background:#f5f5f5;border-radius:8px;font-size:13px;color:#777'>
            ðŸ“± Consultez votre espace locataire :<br>
            <a href='{portal_url}' style='color:{primary_color}'>{portal_url}</a>
        </div>";

        $vars = [
            'tenant_name'    => "{$tenant['first_name']} {$tenant['last_name']}",
            'month'          => $payment['period_month'] ?? '',
            'property_title' => $property['title'] ?? '',
            'amount_due'     => number_format((float)($payment['amount_due'] ?? 0), 0, ',', ' ') . ' FCFA',
            'due_date'       => $payment['due_date'] ?? '',
            'agency_phone'   => $agency['phone'] ?? '',
            'primary_color'  => $agency['primary_color'] ?? '#d4a853',
            'portal_url'     => env('APP_URL', 'http://localhost:5173') . '/tenant/login',
        ];

        // Email
        if (!empty($tenant['email'])) {
            MailService::sendTemplate(
                $tenant['email'],
                "{$tenant['first_name']} {$tenant['last_name']}",
                $subject,
                $template,
                $vars,
                $agency
            );
        }

        // SMS
        if (!empty($tenant['phone'])) {
            $smsText = "Rappel {$agency['name']} : Votre loyer de {$vars['amount_due']} "
                . "est en retard. Veuillez regulariser rapidement. "
                . "Contactez-nous : {$agency['phone']}";
            SmsService::send($tenant['phone'], $smsText);
        }
    }

    /**
     * Email â€” Confirmation paiement reÃ§u
     */
    public static function sendPaymentConfirmation(
        array $tenant,
        array $payment,
        array $property,
        array $agency
    ): void {
        $subject = "[{$agency['name']}] Paiement reÃ§u â€” Merci";

        $template = "
        <h2 style='color:#3ecf8e;margin:0 0 16px'>âœ… Paiement confirmÃ©</h2>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            Bonjour <strong>{tenant_name}</strong>,
        </p>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            Nous avons bien reÃ§u votre paiement de loyer.
        </p>

        <table width='100%' cellpadding='0' cellspacing='0'
            style='background:#f0faf5;border:1px solid #a0e0c0;border-radius:8px;padding:20px;margin:24px 0'>
            <tr>
                <td style='font-size:13px;color:#666;padding:4px 0'>Bien</td>
                <td align='right' style='font-size:13px;color:#333'>{property_title}</td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:4px 0'>PÃ©riode</td>
                <td align='right' style='font-size:13px;color:#333'>{month}</td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:4px 0'>Montant payÃ©</td>
                <td align='right' style='font-size:15px;font-weight:bold;color:#3ecf8e'>{amount_paid}</td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:4px 0'>Date</td>
                <td align='right' style='font-size:13px;color:#666'>{payment_date}</td>
            </tr>
        </table>

        <p style='font-size:14px;color:#555;line-height:1.6'>
            Vous pouvez tÃ©lÃ©charger votre quittance depuis votre espace locataire.
        </p>

        <div style='text-align:center;margin:28px 0'>
            <a href='{portal_url}'
                style='background:{primary_color};color:#fff;padding:12px 28px;
                border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px'>
                AccÃ©der Ã  mon espace
            </a>
        </div>";

        $vars = [
            'tenant_name'    => "{$tenant['first_name']} {$tenant['last_name']}",
            'property_title' => $property['title'] ?? '',
            'month'          => $payment['period_month'] ?? '',
            'amount_paid'    => number_format((float)($payment['amount_paid'] ?? 0), 0, ',', ' ') . ' FCFA',
            'payment_date'   => $payment['payment_date'] ?? '',
            'primary_color'  => $agency['primary_color'] ?? '#d4a853',
            'portal_url'     => env('APP_URL', 'http://localhost:5173') . '/tenant/login',
        ];

        if (!empty($tenant['email'])) {
            MailService::sendTemplate(
                $tenant['email'],
                "{$tenant['first_name']} {$tenant['last_name']}",
                $subject,
                $template,
                $vars,
                $agency
            );
        }
    }

    /**
     * Email â€” Contrat expirant bientÃ´t
     */
    public static function sendContractExpiring(
        array $tenant,
        array $contract,
        array $agency
    ): void {
        $subject = "[{$agency['name']}] Votre contrat expire bientÃ´t";

        $template = "
        <h2 style='color:{primary_color};margin:0 0 16px'>ðŸ“„ Contrat arrivant Ã  expiration</h2>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            Bonjour <strong>{tenant_name}</strong>,
        </p>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            Votre contrat de location pour le bien <strong>{property_title}</strong>
            expire le <strong>{end_date}</strong>.
        </p>
        <p style='font-size:14px;color:#555;line-height:1.6'>
            Veuillez contacter votre agence pour le renouveler ou organiser votre dÃ©part.
        </p>

        <div style='margin:24px 0;padding:16px;background:#fff8e6;border:1px solid #ffd080;border-radius:8px'>
            <strong style='color:#d4a853'>ðŸ“ž Contactez votre agence :</strong><br>
            <span style='color:#555'>{agency_name} â€” {agency_phone}</span>
        </div>";

        $vars = [
            'tenant_name'    => "{$tenant['first_name']} {$tenant['last_name']}",
            'property_title' => $contract['property_title'] ?? '',
            'end_date'       => $contract['end_date'] ?? '',
            'agency_name'    => $agency['name'] ?? '',
            'agency_phone'   => $agency['phone'] ?? '',
            'primary_color'  => $agency['primary_color'] ?? '#d4a853',
        ];

        if (!empty($tenant['email'])) {
            MailService::sendTemplate(
                $tenant['email'],
                "{$tenant['first_name']} {$tenant['last_name']}",
                $subject,
                $template,
                $vars,
                $agency
            );
        }

        // SMS bref
        if (!empty($tenant['phone'])) {
            $smsText = "{$agency['name']} : Votre contrat pour {$vars['property_title']} "
                . "expire le {$vars['end_date']}. Contactez-nous : {$vars['agency_phone']}";
            SmsService::send($tenant['phone'], $smsText);
        }
    }

    /**
     * Email â€” AccÃ¨s portail locataire
     */
    public static function sendPortalAccess(
        array  $tenant,
        string $password,
        string $slug,
        array  $agency
    ): void {
        $subject = "[{$agency['name']}] Votre accÃ¨s au portail locataire";

        $template = "
        <h2 style='color:{primary_color};margin:0 0 16px'>ðŸ  Bienvenue sur votre espace locataire</h2>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            Bonjour <strong>{tenant_name}</strong>,
        </p>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            Votre agence <strong>{agency_name}</strong> vous a ouvert un accÃ¨s
            Ã  votre espace locataire personnel.
        </p>

        <table width='100%' cellpadding='0' cellspacing='0'
            style='background:#f5f5f5;border-radius:8px;padding:20px;margin:24px 0'>
            <tr>
                <td style='font-size:13px;color:#666;padding:6px 0'>Lien de connexion</td>
                <td align='right'>
                    <a href='{portal_url}' style='color:{primary_color};font-weight:bold'>{portal_url}</a>
                </td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:6px 0'>Slug agence</td>
                <td align='right' style='font-size:13px;font-weight:bold;color:#333'>{slug}</td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:6px 0'>Email</td>
                <td align='right' style='font-size:13px;color:#333'>{email}</td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:6px 0'>Mot de passe temporaire</td>
                <td align='right' style='font-size:15px;font-weight:bold;
                    color:{primary_color};letter-spacing:2px'>{password}</td>
            </tr>
        </table>

        <div style='text-align:center;margin:28px 0'>
            <a href='{portal_url}'
                style='background:{primary_color};color:#fff;padding:12px 28px;
                border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px'>
                AccÃ©der Ã  mon espace
            </a>
        </div>

        <p style='font-size:12px;color:#999;text-align:center'>
            Pensez Ã  changer votre mot de passe Ã  la premiÃ¨re connexion.
        </p>";

        $vars = [
            'tenant_name'   => "{$tenant['first_name']} {$tenant['last_name']}",
            'agency_name'   => $agency['name'] ?? '',
            'portal_url'    => env('APP_URL', 'http://localhost:5173') . '/tenant/login',
            'slug'          => $slug,
            'email'         => $tenant['portal_email'] ?? $tenant['email'] ?? '',
            'password'      => $password,
            'primary_color' => $agency['primary_color'] ?? '#d4a853',
        ];

        if (!empty($tenant['email'])) {
            MailService::sendTemplate(
                $tenant['portal_email'] ?? $tenant['email'],
                "{$tenant['first_name']} {$tenant['last_name']}",
                $subject,
                $template,
                $vars,
                $agency
            );
        }
    }

    /**
     * Email â€” AccÃ¨s portail propriÃ©taire
     */
    public static function sendOwnerPortalAccess(
        array  $owner,
        string $password,
        string $slug,
        array  $agency
    ): void {
        $subject = "[{$agency['name']}] Votre accÃ¨s au portail propriÃ©taire";

        $template = "
        <h2 style='color:{primary_color};margin:0 0 16px'>ðŸ¢ Bienvenue sur votre espace propriÃ©taire</h2>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            Bonjour <strong>{owner_name}</strong>,
        </p>
        <p style='font-size:15px;color:#333;line-height:1.6'>
            <strong>{agency_name}</strong> vous a ouvert un accÃ¨s Ã  votre espace propriÃ©taire
            oÃ¹ vous pouvez suivre vos biens, revenus et dÃ©penses.
        </p>

        <table width='100%' cellpadding='0' cellspacing='0'
            style='background:#f5f5f5;border-radius:8px;padding:20px;margin:24px 0'>
            <tr>
                <td style='font-size:13px;color:#666;padding:6px 0'>Lien de connexion</td>
                <td align='right'>
                    <a href='{portal_url}' style='color:{primary_color};font-weight:bold'>{portal_url}</a>
                </td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:6px 0'>Slug agence</td>
                <td align='right' style='font-size:13px;font-weight:bold;color:#333'>{slug}</td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:6px 0'>Email</td>
                <td align='right' style='font-size:13px;color:#333'>{email}</td>
            </tr>
            <tr>
                <td style='font-size:13px;color:#666;padding:6px 0'>Mot de passe</td>
                <td align='right' style='font-size:15px;font-weight:bold;
                    color:{primary_color};letter-spacing:2px'>{password}</td>
            </tr>
        </table>

        <div style='text-align:center;margin:28px 0'>
            <a href='{portal_url}'
                style='background:{primary_color};color:#fff;padding:12px 28px;
                border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px'>
                AccÃ©der Ã  mon espace
            </a>
        </div>";

        $vars = [
            'owner_name'    => "{$owner['first_name']} {$owner['last_name']}",
            'agency_name'   => $agency['name'] ?? '',
            'portal_url'    => env('APP_URL', 'http://localhost:5173') . '/owner/login',
            'slug'          => $slug,
            'email'         => $owner['portal_email'] ?? $owner['email'] ?? '',
            'password'      => $password,
            'primary_color' => $agency['primary_color'] ?? '#d4a853',
        ];

        if (!empty($owner['email'])) {
            MailService::sendTemplate(
                $owner['portal_email'] ?? $owner['email'],
                "{$owner['first_name']} {$owner['last_name']}",
                $subject,
                $template,
                $vars,
                $agency
            );
        }
    }
}