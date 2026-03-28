# Moneto - Rapport de Projet

## Description

Application web de gestion financière personnelle basée sur la méthode des enveloppes budgétaires. Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS.

## Fonctionnalités

### Gestion des plans mensuels
- Création, modification, suppression et copie de plans mensuels
- Revenus fixes et dépenses fixes par plan
- Calcul automatique du solde disponible

### Système d'enveloppes
- Enveloppes en pourcentage ou montant fixe
- Suivi des dépenses par enveloppe
- Normalisation automatique des pourcentages

### Visualisations
- Diagramme Sankey (flux revenus vers enveloppes)
- Diagramme Waterfall (évolution du solde)
- Graphiques Recharts interactifs
- Génération de rapports PDF A4

### Authentification et cloud (V2.16)
- Auth custom JWT (bcryptjs + jose)
- Sync cloud via Neon PostgreSQL
- Chiffrement AES-256-GCM des données utilisateur
- Rate limiting sur login/signup
- Mode gratuit (local-only) et premium (cloud sync)

### Sécurité (V2.17 - Audit mars 2026)
- Rate limiting en mémoire sur les routes auth (5 tentatives login / 3 signup par 15 min)
- Protection timing attack sur login (bcrypt constant-time)
- Protection contre l'énumération d'emails au signup
- Security headers (X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy, **Content-Security-Policy**)
- Validation email RFC 5322 simplifiée
- Complexité mot de passe (majuscule + minuscule + chiffre, 8-128 caractères)
- Logger conditionnel (logs dev-only, pas d'exposition en production)
- **Limite de taille des requêtes** (1MB max sur neon-proxy)
- **Refresh tokens** avec rotation automatique (access token 15min, refresh token 7 jours en DB)

### UX Améliorations (V2.18 - mars 2026)
- **Modals de confirmation** personnalisées (remplace les `confirm()` natifs)
- **Error boundaries** (pages d'erreur gracieuses avec bouton "Réessayer")
- **Indicateur hors-ligne** (bandeau persistant quand la connexion est coupée)
- **Toast Undo** pour la suppression de plans (5s pour annuler)
- **Clavier numérique** sur mobile pour tous les champs de montant (`inputMode="decimal"`)
- `.env.example` fourni pour les nouveaux développeurs

### Page Paramètres (V2.19 - mars 2026)
- **Préférences financières** : devise (EUR, USD, GBP, CHF, CAD), format des nombres (locale), jour de début de mois
- **Préférences d'affichage** : thème (système/clair/sombre), graphique par défaut (Sankey/Waterfall), tri des plans (date/nom/montant)
- **Données et stockage** : export JSON complet, import avec validation, suppression de toutes les données locales, statut de synchronisation cloud
- **Notifications** : activation/désactivation des notifications toast
- **Toggle graphique** sur la page visualisation (Sankey ou Waterfall)
- **Tri dynamique** des plans sur le dashboard selon les préférences
- Paramètres persistés localement (IndexedDB), modifications appliquées immédiatement

### Tutoriel interactif
- Modal de bienvenue
- Tutoriel pas-à-pas avec données d'exemple
- Bandeau mobile minimisable

### PWA
- Installation sur mobile
- Cache offline des assets
- Service worker

## Architecture technique

- **Framework** : Next.js 15.5 (App Router) + React 19
- **State** : Zustand avec persistance IndexedDB (localforage)
- **Auth** : JWT custom (jose HS256, bcryptjs coût 12)
- **DB** : Neon Serverless PostgreSQL
- **Chiffrement** : AES-256-GCM côté serveur
- **UI** : Tailwind CSS 4.1 + Framer Motion
- **Graphiques** : Recharts + D3 Sankey

## Dernière mise à jour

28 mars 2026 - Page Paramètres centralisée + export/import + toggle graphique
