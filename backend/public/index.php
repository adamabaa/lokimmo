<?php
declare(strict_types=1);
define('BASE_PATH', dirname(__DIR__));

// 1. Helpers globaux
require_once BASE_PATH . '/app/Core/helpers.php';

// 2. Core
require_once BASE_PATH . '/app/Core/Database.php';
require_once BASE_PATH . '/app/Core/Request.php';
require_once BASE_PATH . '/app/Core/Response.php';
require_once BASE_PATH . '/app/Core/Router.php';
require_once BASE_PATH . '/app/Core/App.php';

// 3. Middlewares
require_once BASE_PATH . '/app/Middlewares/SuperAdminMiddleware.php';
require_once BASE_PATH . '/app/Middlewares/TenantMiddleware.php';
require_once BASE_PATH . '/app/Middlewares/AuthMiddleware.php';
require_once BASE_PATH . '/app/Middlewares/RoleMiddleware.php';
require_once BASE_PATH . '/app/Middlewares/TenantPortalMiddleware.php';
require_once BASE_PATH . '/app/Middlewares/OwnerPortalMiddleware.php';

// 4. Services 
require_once BASE_PATH . '/app/Services/JwtService.php';
require_once BASE_PATH . '/app/Services/ValidationService.php';
require_once BASE_PATH . '/app/Services/LogService.php';  
require_once BASE_PATH . '/app/Services/RateLimiter.php'; 
require_once BASE_PATH . '/app/Services/ScoreService.php';
require_once BASE_PATH . '/app/Services/MailService.php';
require_once BASE_PATH . '/app/Services/SmsService.php';
require_once BASE_PATH . '/app/Services/NotificationMailService.php';
require_once BASE_PATH . '/app/Services/CinetPayService.php';
require_once BASE_PATH . '/app/Services/BillingService.php';
require_once BASE_PATH . '/app/Services/CashSyncService.php';

// 5. Models
require_once BASE_PATH . '/app/Models/SuperAdmin.php';
require_once BASE_PATH . '/app/Models/BaseModel.php';
require_once BASE_PATH . '/app/Models/Agency.php';
require_once BASE_PATH . '/app/Models/User.php';
require_once BASE_PATH . '/app/Models/Owner.php';
require_once BASE_PATH . '/app/Models/Property.php';
require_once BASE_PATH . '/app/Models/Tenant.php';
require_once BASE_PATH . '/app/Models/Contract.php';
require_once BASE_PATH . '/app/Models/Payment.php';

// 6. Controllers
require_once BASE_PATH . '/app/Controllers/BaseController.php';
require_once BASE_PATH . '/app/Controllers/HealthController.php';
require_once BASE_PATH . '/app/Controllers/AuthController.php';
require_once BASE_PATH . '/app/Controllers/UserController.php';
require_once BASE_PATH . '/app/Controllers/OwnerController.php';
require_once BASE_PATH . '/app/Controllers/PropertyController.php';
require_once BASE_PATH . '/app/Controllers/TenantController.php';
require_once BASE_PATH . '/app/Controllers/ContractController.php';
require_once BASE_PATH . '/app/Controllers/PaymentController.php';
require_once BASE_PATH . '/app/Controllers/DashboardController.php';
require_once BASE_PATH . '/app/Controllers/SuperAdminController.php';
require_once BASE_PATH . '/app/Controllers/AgencyController.php';
require_once BASE_PATH . '/app/Controllers/NotificationController.php';
require_once BASE_PATH . '/app/Controllers/LogController.php';
require_once BASE_PATH . '/app/Controllers/TenantPortalController.php';
require_once BASE_PATH . '/app/Controllers/ScoreController.php';
require_once BASE_PATH . '/app/Controllers/OwnerPortalController.php';
require_once BASE_PATH . '/app/Controllers/ExpenseController.php';
require_once BASE_PATH . '/app/Controllers/NotificationSettingsController.php';
require_once BASE_PATH . '/app/Controllers/OnlinePaymentController.php';
require_once BASE_PATH . '/app/Controllers/BillingController.php';
require_once BASE_PATH . '/app/Controllers/CashController.php';

// 7. JWT via Composer
if (file_exists(BASE_PATH . '/vendor/autoload.php')) {
    require_once BASE_PATH . '/vendor/autoload.php';
}

// 8. Démarrage
loadEnv(BASE_PATH . '/.env');
App\Core\App::run();