/**
 * Sanitise une chaîne pour affichage HTML
 */
export function sanitize(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

/**
 * Vérifie si le token JWT est expiré
 */
export function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

/**
 * Vérifie le token au démarrage de l'app
 */
export function checkTokenOnStartup() {
  const token = localStorage.getItem('lk_token')
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('lk_token')
    localStorage.removeItem('lk_user')
    localStorage.removeItem('lk_slug')
    return false
  }
  return !!token
}

/**
 * Génère un slug propre depuis un nom
 */
export function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprimer accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}