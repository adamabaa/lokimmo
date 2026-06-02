// frontend/src/utils/keepAlive.js

const BACKEND_URL = import.meta.env.VITE_API_URL

/**
 * Ping le backend toutes les 14 minutes pour éviter le cold start Render.
 * Render endort les services gratuits après 15 min d'inactivité.
 * On ping à 14 min pour avoir une marge de sécurité.
 */
export const startKeepAlive = () => {
  const ping = () => {
    fetch(`${BACKEND_URL}/api/ping`, { method: 'GET' })
      .catch(() => {
        // Silencieux — un ping raté n'est pas critique
        // Le prochain ping dans 14 min suffira
      })
  }

  // Ping immédiat au chargement de l'app
  // Réveille le serveur pendant que l'utilisateur voit la page de login
  ping()

  // Puis toutes les 14 minutes
  const interval = setInterval(ping, 14 * 60 * 1000)

  // Retourne une fonction de cleanup si nécessaire
  return () => clearInterval(interval)
}