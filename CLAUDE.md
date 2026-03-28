# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Moneto - Application de gestion financiere par enveloppes

Application web de gestion budgetaire personnelle basee sur la methode des enveloppes. Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS.

## Commandes essentielles

```bash
npm run dev      # Developpement (http://localhost:3000)
npm run build    # Build de production
npm start        # Serveur de production
npm run lint     # Verification ESLint
```

## Architecture technique

### Stack

- **Framework** : Next.js 15.5 (App Router) + React 19
- **State** : Zustand avec persistance IndexedDB (localforage)
- **Auth** : JWT custom (jose HS256, bcryptjs cout 12) avec refresh tokens
- **DB** : Neon Serverless PostgreSQL
- **Chiffrement** : AES-256-GCM cote serveur pour les donnees des plans
- **UI** : Tailwind CSS 4.1 + Framer Motion
- **Graphiques** : Recharts + D3 Sankey
- **Notifications** : react-hot-toast

### Authentification JWT custom

L'application utilise un systeme d'auth **entierement custom** (PAS Stack Auth, PAS Supabase Auth) :

- **jose** (HS256) pour la signature/verification des JWT
- **bcryptjs** (cout 12) pour le hachage des mots de passe
- **Refresh tokens** avec rotation automatique, hash SHA-256 stocke en DB (table `refresh_tokens`)
- **Access token** : 15 minutes, cookie httpOnly `moneto-session`
- **Refresh token** : 7 jours, cookie httpOnly `moneto-refresh`

Fichiers cles :
- `lib/auth/jwt.ts` - Signature/verification JWT, generation refresh tokens
- `lib/auth/cookies.ts` - Gestion des cookies (session + refresh)
- `lib/auth/password.ts` - Hachage/verification bcrypt
- `lib/auth/refresh-tokens.ts` - Operations DB refresh tokens (store, validate, revoke)
- `lib/auth/rate-limiter.ts` - Rate limiting en memoire (login 5/15min, signup 3/15min)
- `lib/auth/types.ts` - Types TypeScript auth

### Proxy API securise (`/api/neon-proxy`)

Toutes les operations DB passent par un proxy qui :
1. Verifie le JWT cote serveur
2. Whitelist d'operations SQL predefinies (pas de SQL brut)
3. Filtre automatiquement par `user_id`
4. Chiffre les donnees des plans en AES-256-GCM
5. Rejette les requetes > 1MB (status 413)
6. Limite a 25 plans par utilisateur

### Middleware et auto-refresh (`middleware.ts`)

Le middleware Next.js intercepte toutes les requetes vers les pages protegees :
1. Verifie l'access token JWT
2. Si expire -> appelle `/api/auth/refresh` en interne
3. Si refresh OK -> continue avec les nouveaux cookies
4. Si refresh echoue -> redirect vers `/auth/login`

L'auto-retry est aussi implemente dans :
- `lib/neon/client.ts` - Retry automatique sur 401 pour les appels API
- `components/auth/AuthProvider.tsx` - Retry sur 401 pour `/api/auth/me`

## Schema de base de donnees

```sql
-- Table users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp DEFAULT NOW()
);

-- Table monthly_plans (donnees chiffrees AES-256-GCM)
CREATE TABLE monthly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  plan_id text NOT NULL,
  name text,
  data text NOT NULL,  -- JSON chiffre
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- Table refresh_tokens
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  token_hash text UNIQUE NOT NULL,  -- SHA-256
  expires_at timestamp NOT NULL,     -- +7 jours
  revoked boolean DEFAULT false,
  created_at timestamp DEFAULT NOW()
);
```

Projet Neon : `shy-smoke-96043013`

## Structure du projet

```
app/
├── layout.tsx              # Root layout (HTML + body + providers)
├── loading.tsx             # Suspense boundary global
├── error.tsx               # Error boundary global
├── (main)/                 # Route group - pages protegees
│   ├── layout.tsx          # Layout avec AuthProvider
│   ├── layout-with-nav.tsx # Wrapper avec Navigation + OfflineBanner
│   ├── error.tsx           # Error boundary pages protegees
│   ├── dashboard/          # Liste des plans mensuels
│   ├── onboarding/         # Creation plan (revenus/depenses)
│   ├── repartition/        # Allocation en enveloppes
│   ├── visualisation/      # Graphiques et rapports PDF
│   ├── settings/           # Page parametres utilisateur
│   ├── profile/            # Page profil utilisateur
│   └── report-bug/         # Formulaire Formspree
├── api/
│   ├── auth/
│   │   ├── login/          # POST - bcrypt + JWT + refresh token
│   │   ├── signup/         # POST - validation + bcrypt + tokens
│   │   ├── logout/         # POST - revoque refresh token
│   │   ├── refresh/        # POST - rotation refresh token
│   │   └── me/             # GET - infos utilisateur
│   ├── neon-proxy/         # POST - proxy DB securise
│   └── report-bug/         # POST - envoi rapport bug
└── auth/                   # Pages publiques (login/signup)
    ├── layout.tsx
    ├── error.tsx
    ├── login/
    └── signup/

components/
├── auth/
│   ├── AuthProvider.tsx    # Provider auth avec auto-refresh
│   ├── AuthLayout.tsx      # Layout des pages auth
│   ├── LoginForm.tsx       # Formulaire de connexion
│   └── SignupForm.tsx      # Formulaire d'inscription
├── tutorial/               # Systeme de tutoriel complet
├── ConfirmModal.tsx        # Modal de confirmation reutilisable
├── OfflineBanner.tsx       # Bandeau hors-ligne
├── Navigation.tsx          # Sidebar desktop
├── MobileNav.tsx           # Header + drawer mobile
├── SankeyChart.tsx         # Diagramme de flux
├── WaterfallChart.tsx      # Diagramme waterfall
├── ToastProvider.tsx       # Provider react-hot-toast
└── ...

lib/
├── auth/                   # Systeme d'authentification complet
├── neon/
│   ├── client.ts           # Client Neon avec auto-retry
│   ├── db.ts               # Pool de connexion (max: 5)
│   ├── sync.ts             # Sync cloud avec batching
│   └── types.ts            # Types Neon
├── pdf/                    # Generation de rapports PDF
├── monitoring/             # Logger conditionnel (dev-only)
├── monthly-plan.ts         # Logique financiere principale
├── financial.ts            # Fonctions de calcul
├── storage.ts              # Service IndexedDB (localforage)
├── export-import.ts        # Import/export JSON
├── tutorial-data.ts        # Etapes du tutoriel
├── toast-notifications.ts  # Service de notifications toast
└── utils.ts                # Utilitaires generaux

store/index.ts              # Store Zustand + persistance
context/TutorialContext.tsx  # Etat global tutoriel
```

## Modeles d'utilisateurs

### Utilisateurs gratuits (local-only)
- Acces complet a toutes les fonctionnalites
- Donnees stockees en local (IndexedDB)
- Export/import manuel JSON

### Utilisateurs premium (cloud sync)
- Sync automatique via Neon PostgreSQL
- Multi-appareils
- Chiffrement AES-256-GCM des donnees

**Phase de test** : tous les comptes crees sont automatiquement "premium". Pas de systeme de paiement pour le moment.

## Synchronisation cloud

### Flux
1. **Login** : AuthProvider detecte l'utilisateur -> `syncWithCloud()` automatique
2. **Creation/modification** : locale immediate + upload debounce 500ms
3. **Batching** : 5 plans en parallele
4. **Conflits** : last-write-wins base sur `updated_at`, notification toast

### Stockage hybride
- **Local** (prioritaire) : IndexedDB via localforage, zero latence
- **Cloud** (arriere-plan) : Neon PostgreSQL, sync automatique pour premium

## Store Zustand (`store/index.ts`)

Gestion d'etat avec persistance IndexedDB :
- **Plans mensuels** (`MonthlyPlan[]`) : revenus fixes, depenses fixes, enveloppes
- **Calculs automatiques** : `calculatedResults` recalcule via `recalculatePlan()`
- **Enveloppes mixtes** : `percentage` (% du reste) ou `fixed` (montant fixe)
- **Etat utilisateur** : id, email, isPremium, isAuthenticated
- **Etat sync** : isSyncing, lastSyncAt, error

## Logique financiere (`lib/monthly-plan.ts`)

**Ordre de calcul** :
1. Total revenus fixes - total depenses fixes = disponible
2. Deduire les enveloppes fixes du disponible = reste pour les %
3. Calculer les montants des enveloppes en % sur ce reste
4. Solde final = disponible - (enveloppes fixes + enveloppes %)

**Fonctions cles** :
- `calculateAvailableAmount()` : revenus - depenses fixes
- `calculateAvailableForPercentage()` : apres deduction des enveloppes fixes
- `normalizeEnvelopePercentages()` : ajuste les % pour totaliser 100%
- `recalculateEnvelopeAmounts()` : recalcule les montants

## Layout et navigation

**Desktop** : Sidebar fixe a gauche (w-64), main content avec `md:ml-64`
**Mobile** : Header fixe (h-14) + drawer, main content avec `pt-14`

**IMPORTANT** : utiliser `min-h-screen` sur mobile, `md:h-screen` sur desktop pour eviter les problemes de scroll.

## Points d'attention

### Securite
- Rate limiting sur login (5/15min) et signup (3/15min)
- Protection timing attack (bcrypt constant-time + DUMMY_HASH)
- Messages d'erreur ambigus (pas d'enumeration d'emails)
- Security headers : X-Frame-Options, HSTS, CSP, Referrer-Policy, Permissions-Policy
- Cookies : httpOnly, secure en production, sameSite: lax
- Voir `SECURITY.md` pour le detail complet

### Validation des enveloppes
- Les enveloppes en % doivent totaliser 100% (tolerance 0.01)
- Les enveloppes fixes sont deduites AVANT le calcul des %
- `autoAdjustPercentages` dans settings pour normalisation auto

### Variables d'environnement requises
- `DATABASE_URL` - URL de connexion Neon PostgreSQL
- `JWT_SECRET` - Cle secrete JWT (min 32 caracteres)
- `PLAN_ENCRYPTION_KEY` - Cle AES-256 (64 caracteres hex)
- Voir `.env.example`
