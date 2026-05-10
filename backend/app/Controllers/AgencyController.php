<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Agency;
use App\Services\ValidationService;

/**
 * Gestion du profil de l'agence connectée
 */
class AgencyController extends BaseController
{
    private Agency $agencyModel;

    public function __construct()
    {
        $this->agencyModel = new Agency();
    }

    /**
     * GET /api/agency/profile
     * Retourne le profil complet de l'agence courante
     */
    public function profile(Request $request): void
    {
        $this->authenticate($request);
        $agency = $this->agencyModel->findByIdFull($request->agencyId);

        if (!$agency) {
            Response::notFound('Agence introuvable');
        }

        Response::json($agency);
    }

    /**
     * PUT /api/agency/profile
     * Mettre à jour le profil de l'agence
     */
    public function updateProfile(Request $request): void
    {
        $this->requireAdmin($request);
        $data   = $request->all();
        $errors = ValidationService::validate($data, [
            'name'  => 'required|max:150',
            'email' => 'required|email|max:150',
        ]);

        if (!empty($errors)) {
            Response::error('Données invalides', 422, $errors);
        }

        // Valider les couleurs hex
        if (!empty($data['primary_color']) && !preg_match('/^#[0-9A-Fa-f]{6}$/', $data['primary_color'])) {
            Response::error('Couleur primaire invalide (format: #RRGGBB)', 422);
        }

        if (!empty($data['secondary_color']) && !preg_match('/^#[0-9A-Fa-f]{6}$/', $data['secondary_color'])) {
            Response::error('Couleur secondaire invalide (format: #RRGGBB)', 422);
        }

        $this->agencyModel->updateProfile($request->agencyId, $data);
        $agency = $this->agencyModel->findByIdFull($request->agencyId);

        Response::json($agency, 'Profil mis à jour');
    }

    /**
     * POST /api/agency/logo
     * Upload du logo de l'agence
     */
    public function uploadLogo(Request $request): void
    {
        $this->requireAdmin($request);

        if (empty($_FILES['logo'])) {
            Response::error('Aucun fichier envoyé', 400);
        }

        $file      = $_FILES['logo'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        $maxSize   = 2 * 1024 * 1024; // 2MB

        if (!in_array($file['type'], $allowedTypes, true)) {
            Response::error('Format non autorisé (JPG, PNG, WEBP, SVG uniquement)', 422);
        }

        if ($file['size'] > $maxSize) {
            Response::error('Fichier trop volumineux (2MB maximum)', 422);
        }

        // Créer le dossier uploads si nécessaire
        $uploadDir = BASE_PATH . '/public/uploads/logos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Générer un nom unique
        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'agency_' . $request->agencyId . '_' . time() . '.' . $ext;
        $path     = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $path)) {
            Response::error('Erreur lors de l\'upload', 500);
        }

        $logoUrl = '/uploads/logos/' . $filename;
        $this->agencyModel->updateLogo($request->agencyId, $logoUrl);

        Response::json(['logo_url' => $logoUrl], 'Logo mis à jour');
    }
}