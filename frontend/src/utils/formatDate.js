export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  }).format(date)
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(date)
}