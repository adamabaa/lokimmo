<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Database;
use App\Middlewares\SuperAdminMiddleware;

class LogController extends BaseController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * GET /api/super/logs
     * Tous les logs — Super Admin seulement
     */
    public function index(Request $request): void
    {
        SuperAdminMiddleware::handle($request);

        $page    = max(1, (int) ($request->input('page', 1)))  ;
        $limit   = 20;
        $offset  = ($page - 1) * $limit;
        $action  = $request->input('action', '');
        $agency  = $request->input('agency_id', '');

        $where  = ['1=1'];
        $params = [];

        if (!empty($action)) {
            $where[]  = 'l.action = ?';
            $params[] = $action;
        }

        if (!empty($agency)) {
            $where[]  = 'l.agency_id = ?';
            $params[] = (int) $agency;
        }

        $whereStr = implode(' AND ', $where);

        // Total
        $countStmt = $this->db->prepare(
            "SELECT COUNT(*) FROM activity_logs l WHERE {$whereStr}"
        );
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        // Logs avec infos agence et user
        $stmt = $this->db->prepare(
            "SELECT
                l.*,
                a.name  AS agency_name,
                a.slug  AS agency_slug,
                CASE
                    WHEN l.user_type = 'super_admin' THEN
                        CONCAT(sa.first_name, ' ', sa.last_name)
                    ELSE
                        CONCAT(u.first_name, ' ', u.last_name)
                END AS user_name,
                CASE
                    WHEN l.user_type = 'super_admin' THEN sa.email
                    ELSE u.email
                END AS user_email
             FROM activity_logs l
             LEFT JOIN agencies    a  ON a.id  = l.agency_id
             LEFT JOIN users       u  ON u.id  = l.user_id AND l.user_type = 'agency_user'
             LEFT JOIN super_admins sa ON sa.id = l.user_id AND l.user_type = 'super_admin'
             WHERE {$whereStr}
             ORDER BY l.created_at DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        Response::json([
            'logs'        => $logs,
            'total'       => $total,
            'page'        => $page,
            'total_pages' => ceil($total / $limit),
        ]);
    }

    /**
     * GET /api/super/logs/stats
     * Statistiques des logs
     */
    public function stats(Request $request): void
    {
        SuperAdminMiddleware::handle($request);

        // Actions les plus fréquentes
        $stmt = $this->db->prepare(
            'SELECT action, COUNT(*) as count
             FROM activity_logs
             WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY action
             ORDER BY count DESC
             LIMIT 10'
        );
        $stmt->execute();
        $topActions = $stmt->fetchAll();

        // Connexions par jour (7 derniers jours)
        $stmt = $this->db->prepare(
            'SELECT DATE(created_at) as date, COUNT(*) as count
             FROM activity_logs
             WHERE action = "login"
               AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date ASC'
        );
        $stmt->execute();
        $loginsByDay = $stmt->fetchAll();

        // Agences les plus actives
        $stmt = $this->db->prepare(
            'SELECT a.name, a.slug, COUNT(l.id) as action_count
             FROM activity_logs l
             LEFT JOIN agencies a ON a.id = l.agency_id
             WHERE l.agency_id IS NOT NULL
               AND l.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY l.agency_id
             ORDER BY action_count DESC
             LIMIT 5'
        );
        $stmt->execute();
        $topAgencies = $stmt->fetchAll();

        // Total logs aujourd'hui
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM activity_logs WHERE DATE(created_at) = CURDATE()'
        );
        $stmt->execute();
        $todayCount = (int) $stmt->fetchColumn();

        Response::json([
            'top_actions'  => $topActions,
            'logins_by_day'=> $loginsByDay,
            'top_agencies' => $topAgencies,
            'today_count'  => $todayCount,
        ]);
    }

    /**
     * GET /api/super/logs/agency/{id}
     * Logs d'une agence spécifique
     */
    public function byAgency(Request $request, array $params): void
    {
        SuperAdminMiddleware::handle($request);
        $id    = $this->validateId($params['id']);
        $page  = max(1, (int) ($request->input('page', 1)));
        $limit = 20;
        $offset= ($page - 1) * $limit;

        $countStmt = $this->db->prepare(
            'SELECT COUNT(*) FROM activity_logs WHERE agency_id = ?'
        );
        $countStmt->execute([$id]);
        $total = (int) $countStmt->fetchColumn();

        $stmt = $this->db->prepare(
            "SELECT l.*,
                    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
                    u.email AS user_email,
                    u.role  AS user_role
             FROM activity_logs l
             LEFT JOIN users u ON u.id = l.user_id
             WHERE l.agency_id = ?
             ORDER BY l.created_at DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute([$id]);

        Response::json([
            'logs'        => $stmt->fetchAll(),
            'total'       => $total,
            'page'        => $page,
            'total_pages' => ceil($total / $limit),
        ]);
    }
}