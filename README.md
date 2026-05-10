# Lokimmo 🏠

SaaS de gestion locative immobilière multi-agences pour l'Afrique de l'Ouest.

## Stack technique

- **Frontend** : React 18 + Vite + Bootstrap 5
- **Backend** : PHP 8 MVC REST API
- **Base de données** : MySQL

## Installation locale

### Backend

```bash
cd backend
cp .env.example .env
# Remplir les valeurs dans .env
composer install
```

Configurer Apache/XAMPP pour pointer vers `backend/public/`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Déploiement

- **Frontend** : Vercel (connecté à ce dépôt GitHub)
- **Backend** : InfinityFree (upload FTP manuel)

## Comptes de test (développement uniquement)

⚠️ Supprimer avant la production.

- Super admin : `superadmin@lokimmo.com`
- Admin agence : `adama@agence-dakar.com` (slug : `aksum-immo`)