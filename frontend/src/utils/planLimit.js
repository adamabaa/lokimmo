/**
 * Vérifie si une erreur axios est une limite de plan
 */
export function isPlanLimit(error) {
  return (
    error?.response?.status === 403 &&
    error?.response?.data?.errors?.code === 'PLAN_LIMIT_REACHED'
  )
}

/**
 * Message d'erreur de limite de plan
 */
export function getPlanLimitMessage(error) {
  return error?.response?.data?.message || 'Limite de votre plan atteinte'
}