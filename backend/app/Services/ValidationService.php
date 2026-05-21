<?php

declare(strict_types=1);

namespace App\Services;

class ValidationService
{
    public static function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $ruleString) {
            $fieldRules = explode('|', $ruleString);
            $value      = $data[$field] ?? null;

            foreach ($fieldRules as $rule) {
                $error = self::applyRule($field, $value, $rule, $data);
                if ($error !== null) {
                    $errors[$field][] = $error;
                    break;
                }
            }
        }

        return $errors;
    }

    private static function applyRule(
        string $field,
        mixed $value,
        string $rule,
        array $data
    ): ?string {
        $parts     = explode(':', $rule, 2);
        $ruleName  = $parts[0];
        $ruleParam = $parts[1] ?? null;

        return match ($ruleName) {

            'required' => (
                $value === null || $value === '' || $value === []
            ) ? "Le champ {$field} est obligatoire" : null,

            'email' => (
                $value !== null && $value !== '' &&
                !filter_var($value, FILTER_VALIDATE_EMAIL)
            ) ? "Le champ {$field} doit Ãªtre un email valide" : null,

            'min' => (
                $value !== null && $value !== '' &&
                strlen((string) $value) < (int) $ruleParam
            ) ? "Le champ {$field} doit contenir au moins {$ruleParam} caractÃ¨res" : null,

            'max' => (
                $value !== null && $value !== '' &&
                strlen((string) $value) > (int) $ruleParam
            ) ? "Le champ {$field} ne doit pas dÃ©passer {$ruleParam} caractÃ¨res" : null,

            'numeric' => (
                $value !== null && $value !== '' && !is_numeric($value)
            ) ? "Le champ {$field} doit Ãªtre un nombre" : null,

            'in' => (
                $value !== null && $value !== '' &&
                !in_array($value, explode(',', $ruleParam ?? ''), true)
            ) ? "La valeur du champ {$field} n'est pas autorisÃ©e" : null,

            'confirmed' => (
                $value !== ($data["{$field}_confirmation"] ?? null)
            ) ? "La confirmation du champ {$field} ne correspond pas" : null,

            'slug' => (
                $value !== null && $value !== '' &&
                !preg_match('/^[a-z0-9-]+$/', (string) $value)
            ) ? "Le champ {$field} ne peut contenir que des lettres minuscules, chiffres et tirets" : null,

            'phone' => (
                $value !== null && $value !== '' &&
                !preg_match('/^[0-9+\s()-]{6,20}$/', (string) $value)
            ) ? "Le champ {$field} n'est pas un numÃ©ro valide" : null,

            'color' => (
                $value !== null && $value !== '' &&
                !preg_match('/^#[0-9A-Fa-f]{6}$/', (string) $value)
            ) ? "Le champ {$field} doit Ãªtre une couleur hexadÃ©cimale valide (#RRGGBB)" : null,

            'url' => (
                $value !== null && $value !== '' &&
                !filter_var($value, FILTER_VALIDATE_URL)
            ) ? "Le champ {$field} doit Ãªtre une URL valide" : null,

            'date' => (
                $value !== null && $value !== '' &&
                !strtotime((string) $value)
            ) ? "Le champ {$field} doit Ãªtre une date valide" : null,

            'integer' => (
                $value !== null && $value !== '' &&
                !ctype_digit((string) $value)
            ) ? "Le champ {$field} doit Ãªtre un entier positif" : null,

            default => null,
        };
    }
}