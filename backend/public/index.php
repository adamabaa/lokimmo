<?php
declare(strict_types=1);
define('BASE_PATH', dirname(__DIR__));

// Autoloader Composer — remplace TOUS les require_once Core/Controllers/Models/Middlewares/Services.
// Pourquoi ça marche sans se soucier de l'ordre (BaseModel avant les autres, etc.) :
// PSR-4 charge une classe à la demande, au moment où PHP la rencontre réellement
// (ex: dans Router::dispatch() → class_exists($fqcn)), pas au chargement du fichier.
require_once BASE_PATH . '/vendor/autoload.php';

// Fonctions globales (loadEnv, etc.) — pas une classe, donc pas concerné par PSR-4
require_once BASE_PATH . '/app/Core/helpers.php';

// Démarrage
loadEnv(BASE_PATH . '/.env');
App\Core\App::run();