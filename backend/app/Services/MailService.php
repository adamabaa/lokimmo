<?php

declare(strict_types=1);

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class MailService
{
    /**
     * Envoie un email
     */
    public static function send(
        string $toEmail,
        string $toName,
        string $subject,
        string $htmlBody,
        string $textBody = ''
    ): bool {
        try {
            $mail = new PHPMailer(true);

            // Serveur SMTP
            $mail->isSMTP();
            $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('MAIL_USERNAME', '');
            $mail->Password   = env('MAIL_PASSWORD', '');
           $mail->SMTPSecure = env('MAIL_ENCRYPTION', 'tls') === 'tls'
            ? PHPMailer::ENCRYPTION_STARTTLS
            : PHPMailer::ENCRYPTION_SMTPS;   
            $mail->Port       = (int) env('MAIL_PORT', 587);

            // ExpÃ©diteur
            $mail->setFrom(
                env('MAIL_FROM_ADDRESS', 'noreply@lokimmo.com'),
                env('MAIL_FROM_NAME',    'Lokimmo')
            );

            // Destinataire
            $mail->addAddress($toEmail, $toName);

            // Contenu
            $mail->isHTML(true);
            $mail->CharSet = 'UTF-8';
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $textBody ?: strip_tags($htmlBody);

            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log("MailService Error: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Envoie un email depuis un template
     */
    public static function sendTemplate(
        string $toEmail,
        string $toName,
        string $subject,
        string $template,
        array  $vars = [],
        array  $agencyConfig = []
    ): bool {
        $html = self::renderTemplate($template, $vars, $agencyConfig);
        return self::send($toEmail, $toName, $subject, $html);
    }

    /**
     * Rend un template email HTML
     */
    private static function renderTemplate(
        string $template,
        array  $vars,
        array  $agency
    ): string {
        $primaryColor = $agency['primary_color'] ?? '#d4a853';
        $agencyName   = $agency['name']          ?? 'Lokimmo';
        $logoUrl      = $agency['logo_url']       ?? null;

        $logoHtml = $logoUrl
            ? "<img src='" . env('APP_URL') . $logoUrl . "' style='height:40px;object-fit:contain' alt='{$agencyName}' />"
            : "<span style='font-size:24px;font-weight:bold;color:{$primaryColor}'>{$agencyName}</span>";

        // Remplacer les variables
        $content = $template;
        foreach ($vars as $key => $value) {
            $content = str_replace("{{$key}}", $value, $content);
        }

        return "
        <!DOCTYPE html>
        <html lang='fr'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>{$agencyName}</title>
        </head>
        <body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif'>
            <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:40px 0'>
                <tr>
                    <td align='center'>
                        <table width='600' cellpadding='0' cellspacing='0'
                            style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)'>

                            <!-- Header -->
                            <tr>
                                <td style='background:{$primaryColor};padding:24px 32px;text-align:center'>
                                    {$logoHtml}
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style='padding:32px'>
                                    {$content}
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style='background:#f9f9f9;padding:20px 32px;text-align:center;
                                    border-top:1px solid #e0e0e0;font-size:12px;color:#999'>
                                    {$agencyName} â€” Powered by Lokimmo<br>
                                    <a href='#' style='color:{$primaryColor}'>Se dÃ©sabonner</a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>";
    }
}