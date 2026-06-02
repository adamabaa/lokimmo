import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/global.css'
import { startKeepAlive } from './utils/keepAlive.js'

// Démarre le ping keep-alive dès le chargement de l'app
// Réveille Render avant même que l'utilisateur clique sur "Connexion"
startKeepAlive()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)