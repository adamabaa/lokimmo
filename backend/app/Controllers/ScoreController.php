<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\ScoreService;
use App\Services\LogService;

class ScoreController extends BaseController
{
    private ScoreService $scoreService;

    public function __construct()
    {
        $this->scoreService = new ScoreService();
    }

    /**
     * POST /api/scores/calculate/{id}
     * Calculer le score d'un locataire
     */
    public function calculate(Request $request, array $params): void
    {
        $this->authenticate($request);
        $id    = $this->validateId($params['id']);
        $score = $this->scoreService->calculate($id, $request->agencyId);

        LogService::log(
            $request->agencyId,
            $request->user['id'],
            'calculate_score',
            "Score calculÃ© pour locataire ID {$id} : {$score}/100"
        );

        Response::json(['score' => $score], "Score calculÃ© : {$score}/100");
    }

    /**
     * GET /api/scores/detail/{id}
     * DÃ©tail du score d'un locataire
     */
    public function detail(Request $request, array $params): void
    {
        $this->authenticate($request);
        $id     = $this->validateId($params['id']);
        $detail = $this->scoreService->getDetail($id, $request->agencyId);

        // Calculer le total
        $total = array_sum([
            $detail['payment_history'],
            $detail['income_ratio'],
            $detail['punctuality'],
            $detail['seniority'],
            $detail['profile'],
        ]);

        Response::json([
            'total'  => $total,
            'detail' => $detail,
        ]);
    }

    /**
     * POST /api/scores/calculate-all
     * Calculer les scores de tous les locataires
     */
    public function calculateAll(Request $request): void
    {
        $this->requireAdmin($request);
        $results = $this->scoreService->calculateAll($request->agencyId);

        LogService::log(
            $request->agencyId,
            $request->user['id'],
            'calculate_all_scores',
            'Recalcul scores de tous les locataires'
        );

        Response::json([
            'updated' => count($results),
            'scores'  => $results,
        ], count($results) . ' scores mis Ã  jour');
    }
}