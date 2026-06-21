<?php
declare(strict_types=1);
define('BASE_PATH', __DIR__);

// 1. Helpers
require_once BASE_PATH . '/app/Core/helpers.php';
loadEnv(BASE_PATH . '/.env');

// 2. Autoload
if (file_exists(BASE_PATH . '/vendor/autoload.php')) {
    require_once BASE_PATH . '/vendor/autoload.php';
}

// 3. Core
require_once BASE_PATH . '/app/Core/Database.php';
require_once BASE_PATH . '/app/Core/Request.php';
require_once BASE_PATH . '/app/Core/Response.php';
require_once BASE_PATH . '/app/Core/Router.php';

// 4. Services
require_once BASE_PATH . '/app/Services/JwtService.php';
require_once BASE_PATH . '/app/Services/ValidationService.php';
require_once BASE_PATH . '/app/Services/RateLimiter.php';

// 5. Models
require_once BASE_PATH . '/app/Models/BaseModel.php';
require_once BASE_PATH . '/app/Models/User.php';
require_once BASE_PATH . '/app/Models/Agency.php';

// CLI formatting
$green = "\033[32m";
$red = "\033[31m";
$yellow = "\033[33m";
$reset = "\033[0m";

echo "=== LOKIMMO AUTOMATED TEST RUNNER ===\n\n";

$tests_passed = 0;
$tests_failed = 0;

$assertTest = function (string $name, callable $test) use (&$tests_passed, &$tests_failed, $green, $red, $reset) {
    try {
        $result = $test();
        if ($result === true) {
            echo "{$green}[PASS]{$reset} {$name}\n";
            $tests_passed++;
        } else {
            echo "{$red}[FAIL]{$reset} {$name} (Returned false)\n";
            $tests_failed++;
        }
    } catch (\Throwable $e) {
        echo "{$red}[FAIL]{$reset} {$name} (Threw exception: " . $e->getMessage() . ")\n";
        $tests_failed++;
    }
};

// Test 1: Database Connection
$assertTest("Database Connection Test", function() {
    $db = \App\Core\Database::getInstance();
    $stmt = $db->query("SELECT 1");
    $result = $stmt->fetchColumn();
    return $result === 1 || $result === "1";
});

// Test 2: JWT Service Generation & Decoding
$assertTest("JWT Service - Generate and Decode Agency Token", function() {
    $token = \App\Services\JwtService::generate(123, 456, 'admin');
    $decoded = \App\Services\JwtService::decode($token);
    return (int)$decoded['user_id'] === 123 && (int)$decoded['agency_id'] === 456 && $decoded['role'] === 'admin';
});

$assertTest("JWT Service - Generate and Decode Tenant Token", function() {
    $token = \App\Services\JwtService::generateTenant(789, 456);
    $decoded = \App\Services\JwtService::decodeTenant($token);
    return (int)$decoded['tenant_id'] === 789 && (int)$decoded['agency_id'] === 456 && $decoded['type'] === 'tenant';
});

// Test 3: Validation Service
$assertTest("Validation Service - Required Fields rule", function() {
    $errors = \App\Services\ValidationService::validate(
        ['name' => ''], 
        ['name' => 'required']
    );
    return !empty($errors['name']);
});

$assertTest("Validation Service - Valid Email rule", function() {
    $errorsValid = \App\Services\ValidationService::validate(
        ['email' => 'valid@domain.com'], 
        ['email' => 'email']
    );
    $errorsInvalid = \App\Services\ValidationService::validate(
        ['email' => 'invalid-email'], 
        ['email' => 'email']
    );
    return empty($errorsValid['email']) && !empty($errorsInvalid['email']);
});

$assertTest("Validation Service - String length min rule", function() {
    $errorsValid = \App\Services\ValidationService::validate(
        ['password' => 'supersecret123'], 
        ['password' => 'min:8']
    );
    $errorsInvalid = \App\Services\ValidationService::validate(
        ['password' => 'short'], 
        ['password' => 'min:8']
    );
    return empty($errorsValid['password']) && !empty($errorsInvalid['password']);
});

// Test 4: Rate Limiter
$assertTest("Rate Limiter - Limits hits appropriately", function() {
    $key = "test_rate_limiter_" . uniqid();
    // Allow up to 3 attempts
    $r1 = \App\Services\RateLimiter::check($key, 3, 600);
    $r2 = \App\Services\RateLimiter::check($key, 3, 600);
    $r3 = \App\Services\RateLimiter::check($key, 3, 600);
    $r4 = \App\Services\RateLimiter::check($key, 3, 600);
    
    echo "  -> Debug: r1=" . json_encode($r1) . ", r2=" . json_encode($r2) . ", r3=" . json_encode($r3) . ", r4=" . json_encode($r4) . "\n";
    
    // Clean up
    \App\Services\RateLimiter::reset($key);
    
    return $r1 === true && $r2 === true && $r3 === true && $r4 === false;
});

// Test 5: Querying Agencies (ReadOnly Model Check)
$assertTest("Model Query - Fetch Agency by Slug", function() {
    $agencyModel = new \App\Models\Agency();
    // Test that the 'aksum-immo' test agency exists in the database
    $exists = $agencyModel->slugExists('aksum-immo');
    return $exists === true;
});

echo "\n=== TEST RUN SUMMARY ===\n";
echo "Total Passed: {$tests_passed}\n";
echo "Total Failed: {$tests_failed}\n";

exit($tests_failed > 0 ? 1 : 0);
