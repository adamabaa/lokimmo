export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—'
  
  const num = parseFloat(amount)
  if (isNaN(num)) return '—'

  // Formater manuellement pour éviter les problèmes d'encodage FCFA
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)

  return `${formatted} FCFA`
}