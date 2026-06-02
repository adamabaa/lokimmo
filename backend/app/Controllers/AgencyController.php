<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Agency;
use App\Services\ValidationService;

class AgencyController extends BaseController
{
    private Agency $agencyModel;

    public function __construct()
    {
        $this->agencyModel = new Agency();
    }

    /**
     * GET /api/agency/profile
     */
    public function profile(Request $request): void
    {
        $this->authenticate($request);
        $agency = $this->agencyModel->findByIdFull($request->agencyId);

        if (!$agency) {
            Response::notFound('Agence introuvable');
            exit; // ← stop l'exécution après la réponse d'erreur
        }

        Response::json($agency);
    }

    /**
     * PUT /api/agency/profile
     */
    public function updateProfile(Request $request): void
    {
        $this->requireAdmin($request);
        $body = $request->all();

        // ── Whitelist explicite des champs modifiables ──────────
        // On n'accepte QUE ces champs — un attaquant ne peut pas
        // modifier plan, is_active, agency_id ou d'autres champs sensibles
        $allowed = [
            'name', 'email', 'phone', 'address', 'city',
            'description', 'primary_color', 'secondary_color',
            'website', 'facebook', 'instagram',
        ];
        $data = array_intersect_key($body, array_flip($allowed));

        if (empty($data)) {
            Response::error('Aucun champ valide fourni', 422);
            exit;
        }

        // ── Validation des champs texte ──────────────────────────
        $errors = ValidationService::validate($data, [
            'name'    => 'sometimes|max:150',
            'email'   => 'sometimes|email|max:150',
            'phone'   => 'sometimes|max:20',
            'address' => 'sometimes|max:255',
            'city'    => 'sometimes|max:100',
            'website' => 'sometimes|max:255',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
            exit;
        }

        // ── Validation couleurs hex ──────────────────────────────
        foreach (['primary_color', 'secondary_color'] as $colorField) {
            if (!empty($data[$colorField]) &&
                !preg_match('/^#[0-9A-Fa-f]{6}$/', $data[$colorField])) {
                Response::error("$colorField invalide (format attendu: #RRGGBB)", 422);
                exit;
            }
        }

        $this->agencyModel->updateProfile($request->agencyId, $data);
        $agency = $this->agencyModel->findByIdFull($request->agencyId);

        Response::json($agency, 'Profil mis à jour');
    }

    /**
     * POST /api/agency/logo
     */
    public function uploadLogo(Request $request): void
    {
        $this->requireAdmin($request);

        if (empty($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
            Response::error('Aucun fichier envoyé ou erreur upload', 400);
            exit;
        }

        $file    = $_FILES['logo'];
        $maxSize = 2 * 1024 * 1024; // 2MB

        // ── Vérification taille ──────────────────────────────────
        if ($file['size'] > $maxSize) {
            Response::error('Fichier trop volumineux (2MB maximum)', 422);
            exit;
        }

        // ── Vérification MIME réelle avec finfo ──────────────────
        // On ne fait pas confiance à $file['type'] qui vient du navigateur
        // finfo lit les magic bytes du fichier lui-même
        $finfo        = new \finfo(FILEINFO_MIME_TYPE);
        $realMimeType = $finfo->file($file['tmp_name']);
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

        if (!in_array($realMimeType, $allowedMimes, true)) {
            Response::error('Format non autorisé (JPG, PNG, WEBP, SVG uniquement)', 422);
            exit;
        }

        // ── Extension basée sur le MIME réel, pas le nom du fichier ──
        // Évite les attaques type "malware.php.jpg"
        $mimeToExt = [
            'image/jpeg'    => 'jpg',
            'image/png'     => 'png',
            'image/webp'    => 'webp',
            'image/svg+xml' => 'svg',
        ];
        $ext = $mimeToExt[$realMimeType];

        // ── Création du dossier si nécessaire ────────────────────
        $uploadDir = BASE_PATH . '/public/uploads/logos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // ── Nom de fichier sécurisé ──────────────────────────────
        // On n'utilise pas le nom original — on génère un nom propre
        $filename = 'agency_' . $request->agencyId . '_' . time() . '.' . $ext;
        $path     = $uploadDir . $filename;

        // ── Supprime l'ancien logo pour éviter l'accumulation ────
        $current = $this->agencyModel->findByIdFull($request->agencyId);
        if (!empty($current['logo_url'])) {
            $oldPath = BASE_PATH . '/public' . $current['logo_url'];
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        if (!move_uploaded_file($file['tmp_name'], $path)) {
            Response::error('Erreur lors de l\'upload', 500);
            exit;
        }

        $logoUrl = '/uploads/logos/' . $filename;
        $this->agencyModel->updateLogo($request->agencyId, $logoUrl);

        Response::json(['logo_url' => $logoUrl], 'Logo mis à jour');
    }
}