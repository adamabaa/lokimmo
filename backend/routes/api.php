<?php

use App\Middlewares\AuthMiddleware;

$router->get('/api/ping', 'PingController@index');

// ── Santé de l'API ──────────────────────────────────────────
$router->get('/api/health', 'HealthController@index');

// ── Authentification (publiques) ────────────────────────────
$router->post('/api/auth/register', 'AuthController@register');
$router->post('/api/auth/login',    'AuthController@login');
$router->post('/api/auth/logout',   'AuthController@logout');
$router->get('/api/auth/me',        'AuthController@me');

// ── Super Admin (publiques) ──────────────────────────────────
$router->post('/api/super/login', 'SuperAdminController@login');

// ── Super Admin (protégées) — spécifiques AVANT génériques ──
$router->get('/api/super/me',                           'SuperAdminController@me');
$router->get('/api/super/stats',                        'SuperAdminController@stats');
$router->get('/api/super/logs',                         'LogController@index');
$router->get('/api/super/logs/stats',                   'LogController@stats');
$router->get('/api/super/logs/agency/{id}',             'LogController@byAgency');
$router->get('/api/super/agencies',                     'SuperAdminController@agencies');
$router->post('/api/super/agencies',                    'SuperAdminController@createAgency');
$router->get('/api/super/agencies/{id}',                'SuperAdminController@showAgency');
$router->put('/api/super/agencies/{id}/toggle',         'SuperAdminController@toggleAgency');
$router->put('/api/super/agencies/{id}/reset-password', 'SuperAdminController@resetAdminPassword');
$router->put('/api/super/agencies/{id}/plan',           'SuperAdminController@changePlan');
$router->put('/api/super/agencies/{id}',                'SuperAdminController@updateAgency');
$router->delete('/api/super/agencies/{id}',             'SuperAdminController@deleteAgency');

// ── Profil Agence ────────────────────────────────────────────
$router->get('/api/agency/profile',  'AgencyController@profile');
$router->put('/api/agency/profile',  'AgencyController@updateProfile');
$router->post('/api/agency/logo',    'AgencyController@uploadLogo');

// ── Dashboard ────────────────────────────────────────────────
$router->get('/api/dashboard/stats', 'DashboardController@stats');

// ── Utilisateurs / Agents ────────────────────────────────────
$router->get('/api/users',                     'UserController@index');
$router->post('/api/users',                    'UserController@store');
$router->put('/api/users/{id}/toggle',         'UserController@toggle');
$router->put('/api/users/{id}/reset-password', 'UserController@resetPassword');
$router->put('/api/users/{id}',                'UserController@update');
$router->delete('/api/users/{id}',             'UserController@destroy');

// ── Propriétaires — spécifiques AVANT génériques ─────────────
$router->get('/api/owners',                  'OwnerController@index');
$router->post('/api/owners',                 'OwnerController@store');
$router->put('/api/owners/{id}/portal',      'OwnerController@setupPortal');
$router->delete('/api/owners/{id}/portal',   'OwnerController@disablePortal');
$router->get('/api/owners/{id}',             'OwnerController@show');
$router->put('/api/owners/{id}',             'OwnerController@update');
$router->delete('/api/owners/{id}',          'OwnerController@destroy');

// ── Biens immobiliers ────────────────────────────────────────
$router->get('/api/properties',         'PropertyController@index');
$router->post('/api/properties',        'PropertyController@store');
$router->get('/api/properties/{id}',    'PropertyController@show');
$router->put('/api/properties/{id}',    'PropertyController@update');
$router->delete('/api/properties/{id}', 'PropertyController@destroy');

// ── Locataires — spécifiques AVANT génériques ────────────────
$router->get('/api/tenants',                 'TenantController@index');
$router->post('/api/tenants',                'TenantController@store');
$router->put('/api/tenants/{id}/portal',     'TenantController@setupPortal');
$router->delete('/api/tenants/{id}/portal',  'TenantController@disablePortal');
$router->get('/api/tenants/{id}',            'TenantController@show');
$router->put('/api/tenants/{id}',            'TenantController@update');
$router->delete('/api/tenants/{id}',         'TenantController@destroy');

// ── Contrats ─────────────────────────────────────────────────
$router->get('/api/contracts',         'ContractController@index');
$router->post('/api/contracts',        'ContractController@store');
$router->get('/api/contracts/{id}',    'ContractController@show');
$router->put('/api/contracts/{id}',    'ContractController@update');
$router->delete('/api/contracts/{id}', 'ContractController@destroy');

// ── Paiements ────────────────────────────────────────────────
$router->get('/api/payments',      'PaymentController@index');
$router->post('/api/payments',     'PaymentController@store');
$router->get('/api/payments/{id}', 'PaymentController@show');
$router->put('/api/payments/{id}', 'PaymentController@update');

// ── Notifications — spécifiques AVANT génériques ─────────────
$router->get('/api/notifications/count',     'NotificationController@count');
$router->get('/api/notifications/generate',  'NotificationController@generate');
$router->put('/api/notifications/read-all',  'NotificationController@markAllRead');
$router->get('/api/notifications',           'NotificationController@index');
$router->put('/api/notifications/{id}/read', 'NotificationController@markRead');

// ── Test notifications ────────────────────────────────────────
$router->post('/api/notifications/test-email', 'NotificationSettingsController@testEmail');
$router->post('/api/notifications/test-sms',   'NotificationSettingsController@testSms');

// ── Portail Locataire (public) ───────────────────────────────
$router->post('/api/portal/login',   'TenantPortalController@login');

// ── Portail Locataire (protégé) ──────────────────────────────
$router->get('/api/portal/me',       'TenantPortalController@me');
$router->get('/api/portal/contract', 'TenantPortalController@contract');
$router->get('/api/portal/payments', 'TenantPortalController@payments');
$router->get('/api/portal/agency',   'TenantPortalController@agency');

// ── Scores locatifs ──────────────────────────────────────────
$router->post('/api/scores/calculate-all',    'ScoreController@calculateAll');
$router->post('/api/scores/calculate/{id}',   'ScoreController@calculate');
$router->get('/api/scores/detail/{id}',       'ScoreController@detail');

// ── Dépenses ─────────────────────────────────────────────────
$router->get('/api/expenses',         'ExpenseController@index');
$router->post('/api/expenses',        'ExpenseController@store');
$router->put('/api/expenses/{id}',    'ExpenseController@update');
$router->delete('/api/expenses/{id}', 'ExpenseController@destroy');

// ── Portail Propriétaire (public) ────────────────────────────
$router->post('/api/owner-portal/login', 'OwnerPortalController@login');

// ── Portail Propriétaire (protégé) ───────────────────────────
$router->get('/api/owner-portal/me',                          'OwnerPortalController@me');
$router->get('/api/owner-portal/properties',                  'OwnerPortalController@properties');
$router->get('/api/owner-portal/properties/{id}/payments',    'OwnerPortalController@propertyPayments');
$router->get('/api/owner-portal/properties/{id}/expenses',    'OwnerPortalController@propertyExpenses');
$router->get('/api/owner-portal/summary',                     'OwnerPortalController@summary');
$router->get('/api/owner-portal/agency',                      'OwnerPortalController@agency');

// ── Portail Propriétaire — gestion depuis agence ─────────────
$router->put('/api/owners/{id}/portal',    'OwnerController@setupPortal');
$router->delete('/api/owners/{id}/portal', 'OwnerController@disablePortal');

// ── Paiements en ligne CinetPay ──────────────────────────────
$router->post('/api/online-payments/initiate', 'OnlinePaymentController@initiate');
$router->post('/api/online-payments/verify',   'OnlinePaymentController@verify');
$router->post('/api/online-payments/notify',   'OnlinePaymentController@notify');
$router->get('/api/online-payments',           'OnlinePaymentController@index');

// ── Facturation agence ───────────────────────────────────────
$router->get('/api/billing/plan',     'BillingController@currentPlan');
$router->get('/api/billing/invoices', 'BillingController@invoices');

// ── Facturation Super Admin ──────────────────────────────────
$router->get('/api/super/billing/plans',              'BillingController@plans');
$router->get('/api/super/billing/invoices',           'BillingController@allInvoices');
$router->post('/api/super/billing/invoices',          'BillingController@createInvoice');
$router->put('/api/super/billing/invoices/{id}/pay',  'BillingController@markPaid');
$router->get('/api/super/billing/stats',              'BillingController@stats');

// ── Caisse ───────────────────────────────────────────────────
$router->get('/api/cash/session/today',              'CashController@todaySession');
$router->post('/api/cash/session/open',              'CashController@openSession');
$router->post('/api/cash/session/{id}/close',        'CashController@closeSession');
$router->get('/api/cash/sessions',                   'CashController@sessions');
$router->get('/api/cash/operations',                 'CashController@operations');
$router->post('/api/cash/operations',                'CashController@addOperation');
$router->put('/api/cash/operations/{id}/validate',   'CashController@validateOperation');
$router->put('/api/cash/operations/{id}/reject',     'CashController@rejectOperation');
$router->get('/api/cash/summary',                    'CashController@summary');
$router->get('/api/cash/report/{date}',              'CashController@dailyReport');