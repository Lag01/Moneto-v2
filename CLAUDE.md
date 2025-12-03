# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 💰 Moneto - Application de gestion financière par enveloppes

Application web de gestion budgétaire personnelle basée sur la méthode des enveloppes. Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS.

## 🔄 Vision V2 - Gestion des comptes et synchronisation (V2.16)

### Objectif général
Système de comptes utilisateurs avec Neon + Stack Auth pour offrir une option de sauvegarde cloud et synchronisation multi-appareils aux utilisateurs premium, tout en conservant un mode 100% local pour les utilisateurs gratuits.

### Modèles d'utilisateurs

#### 👤 Utilisateurs gratuits (local-only)
- ✅ Accès complet à toutes les fonctionnalités de l'application
- 💾 Données stockées uniquement en local (IndexedDB/localStorage)
- 📥 Export/import manuel des données au format JSON
- 🚫 Aucune création de compte nécessaire
- 🔒 Données privées et hors-ligne par défaut

#### ⭐ Utilisateurs premium (cloud sync)
- ✅ Toutes les fonctionnalités des utilisateurs gratuits
- 👤 Création de compte via Stack Auth (email/password)
- ☁️ Sauvegarde automatique des plans mensuels sur Neon
- 🔄 Synchronisation automatique en temps réel multi-appareils
- 📤 Import automatique des données locales lors de la première connexion
- 🌐 Accès aux données depuis n'importe quel appareil
- 🔔 Notifications en temps réel des conflits et événements de sync

### Stratégie de développement actuelle

**Phase de test - Pas de système de paiement pour le moment**
- 🎯 Tous les comptes créés sont automatiquement considérés comme "premium"
- 🧪 Objectif : valider la logique de sauvegarde/synchronisation
- 💳 Le système de paiement sera implémenté dans une phase ultérieure

### Architecture technique V2

#### Base de données et authentification
- **Stack Auth** (@stackframe/stack) : système d'authentification moderne (email/password)
- **Neon Serverless PostgreSQL** : Base de données PostgreSQL serverless
- **Row Level Security (RLS)** : chaque utilisateur ne peut accéder qu'à ses propres données
- **react-hot-toast** : Notifications utilisateur en temps réel

#### Schéma de base de données (implémenté)
```sql
-- Table users (gérée par Stack Auth dans neon_auth.users_sync)

-- Table monthly_plans
CREATE TABLE public.monthly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,  -- ID Stack Auth
  plan_id text NOT NULL,   -- ID du plan (ex: "2025-01")
  name text,
  data jsonb NOT NULL,     -- Contenu complet du plan
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- Index pour performance
CREATE INDEX idx_monthly_plans_user_id ON monthly_plans(user_id);
CREATE INDEX idx_monthly_plans_updated_at ON monthly_plans(updated_at DESC);

-- RLS policies (à implémenter si nécessaire)
-- CREATE POLICY "Users can only access their own plans"
--   ON monthly_plans FOR ALL USING (user_id = current_user_id());
```

#### Stratégie de stockage hybride
1. **Stockage local** (prioritaire) :
   - IndexedDB via localforage (comme actuellement)
   - Lecture/écriture instantanée
   - Disponible hors-ligne

2. **Stockage cloud** (sync en arrière-plan pour premium) :
   - Upload automatique après chaque modification (debounced)
   - Download automatique au login sur un nouvel appareil
   - Résolution de conflits : last-write-wins (timestamp)

#### Extensions du Store Zustand

```typescript
interface AppState {
  // État existant
  monthlyPlans: MonthlyPlan[]
  calculatedResults: Record<string, CalculatedResults>

  // Nouveau : état utilisateur
  user: {
    id: string | null
    email: string | null
    isPremium: boolean  // Pour l'instant toujours true si connecté
    isAuthenticated: boolean
  } | null

  // Nouveau : état de synchronisation
  syncStatus: {
    isSyncing: boolean
    lastSyncAt: Date | null
    error: string | null
  }

  // Nouvelles actions
  setUser: (user: User | null) => void
  syncWithCloud: () => Promise<void>
  logout: () => Promise<void>
  importLocalDataToCloud: () => Promise<void>
}
```

#### Structure de fichiers (V2.16)

```
lib/
├── neon/
│   ├── client.ts           # Client Neon Serverless configuré
│   ├── sync.ts             # Logique de synchronisation avec batching
│   └── types.ts            # Types TypeScript pour Neon
├── auth-stack/
│   └── auth.ts             # Conversion Stack Auth → App types
├── toast-notifications.ts  # Service de notifications toast
│
app/
├── layout.tsx              # Root layout minimal (HTML + body)
├── (main)/                 # ⚠️ ROUTE GROUP - CRITIQUE pour Suspense
│   ├── layout.tsx          # Layout avec AuthProvider + Suspense
│   ├── dashboard/
│   ├── onboarding/
│   ├── repartition/
│   ├── visualisation/
│   ├── profile/
│   └── report-bug/
├── auth/                   # Pages publiques (pas de route group)
│   ├── login/page.tsx
│   └── signup/page.tsx
│
components/
├── auth/
│   ├── AuthProvider.tsx        # Provider avec useUser() hook
│   ├── StackProviders.tsx      # Wrapper Stack Auth
│   └── LocalDataMigrationModal.tsx
├── sync/
│   └── SyncIndicator.tsx       # Bouton de sync avec status
├── ToastProvider.tsx           # Provider react-hot-toast
│
stack/
├── client.tsx              # StackClientApp configuration
└── server.tsx              # StackServerApp (vide pour l'instant)
```

### ⚠️ Route Groups et Suspense - CRITIQUE

**Stack Auth nécessite une Suspense boundary pour fonctionner avec Next.js 15.**

La structure `app/(main)/` est **OBLIGATOIRE** :

```
app/
├── layout.tsx          # Root minimal (HTML + body + providers globaux)
├── loading.tsx         # Suspense boundary Next.js
├── (main)/
│   ├── layout.tsx      # AuthProvider avec <Suspense> ICI
│   └── pages...        # Toutes les pages protégées
└── auth/              # Pages publiques (login/signup)
```

**Pourquoi ?**
- `useUser()` de Stack Auth appelle `suspendIfSsr()` en interne
- Next.js ne wrap PAS automatiquement les root layouts dans Suspense
- Sans route group → `NoSuspenseBoundaryError`

**⚠️ NE JAMAIS** utiliser `useUser()` dans `app/layout.tsx` directement !

### Flux utilisateur prévu

#### Premier utilisateur (gratuit)
1. Arrivée sur l'app → accès direct sans compte
2. Utilisation normale avec stockage local
3. Possibilité de créer un compte à tout moment
4. Lors de la création : import automatique des données locales → cloud

#### Utilisateur premium (nouveau)
1. Création de compte
2. Connexion
3. Stockage local + sync cloud automatique
4. Sur un nouvel appareil : login → download des données cloud

#### Migration gratuit → premium
1. Utilisateur gratuit avec données locales
2. Création de compte
3. Import automatique : données locales → Neon
4. Désormais synchronisé sur tous les appareils

### 🔄 Flux de synchronisation (V2.16 - Implémenté)

#### Au login
1. `AuthProvider` détecte l'utilisateur via `useUser()` hook
2. Appel `syncWithCloud()` automatique (inclut download + upload)
3. Notification toast de succès avec nombre de plans synchronisés

#### À la création d'un plan
1. Création locale immédiate (Zustand)
2. Upload vers Neon en arrière-plan
3. Notification toast "Plan sauvegardé"

#### À la modification d'un plan
1. Modification locale immédiate
2. Debounce de 500ms
3. Sync automatique vers Neon (batching de 5 plans en parallèle)
4. Notification discrète en cas de succès

#### Résolution de conflits (last-write-wins)
1. Compare `updatedAt` timestamps
2. Version la plus récente gagne automatiquement
3. **Notification toast affichée** : "Conflit résolu - Version X conservée"
4. Aucune intervention utilisateur requise

### Points d'attention implémentés

#### ✅ Sécurité
- Variables d'environnement pour DATABASE_URL
- Stack Auth gère l'authentification sécurisée
- user_id vérifié dans toutes les requêtes

#### ✅ Performance
- **Batching** : 5 plans synchronisés en parallèle (gain ~40-50%)
- **Debounce** : 500ms pour éviter syncs excessifs
- **Optimistic updates** : UI instantanée, sync en arrière-plan
- **Cache local prioritaire** : zéro latence perçue

#### ✅ Expérience utilisateur
- **SyncIndicator** : Bouton flottant avec statut temps réel
- **Notifications toast** : Succès, erreurs, conflits
- **Messages d'erreur structurés** : code + message + détails
- **Sync manuelle** : Bouton dans le header
- **Export/import manuel** : Toujours disponible

#### ✅ Gestion des conflits
- **Stratégie** : last-write-wins basé sur `updated_at`
- **Notification automatique** : Toast avec nom du plan et version gagnante
- **Logs complets** : Console pour debug

### État actuel (V2.16)

✅ Migration Supabase → Neon **TERMINÉE**
✅ Structure route groups avec Suspense **FONCTIONNELLE**
✅ Synchronisation en temps réel avec batching **OPTIMISÉE**
✅ Notifications toast pour tous événements **IMPLÉMENTÉES**
✅ Tests et validation **RÉUSSIS**
✅ Build production **OK** (28 secondes)
   - Mettre en place les RLS policies
   - Configurer Supabase Auth

2. **Phase 2 : Client et authentification**
   - Installer `@supabase/supabase-js`
   - Créer le client Supabase
   - Implémenter les pages login/signup
   - Étendre le store Zustand pour l'état utilisateur

3. **Phase 3 : Service de synchronisation**
   - Créer `lib/supabase/sync.ts`
   - Implémenter upload/download des plans
   - Gérer la résolution de conflits
   - Ajouter le debouncing et l'optimistic update

4. **Phase 4 : Migration des données locales**
   - Créer la fonction d'import local → cloud
   - UI pour proposer l'import lors du premier login
   - Conserver les données locales après import (backup)

5. **Phase 5 : UI et indicateurs**
   - Composant SyncIndicator
   - Bouton "Se connecter pour sauvegarder" (pour utilisateurs gratuits)
   - Page de profil avec statut de sync
   - Messages d'erreur et feedback utilisateur

6. **Phase 6 : Tests et optimisation**
   - Tests de synchronisation multi-appareils
   - Tests de conflits
   - Tests de performance
   - Tests de migration local → cloud

## 🚀 Commandes essentielles

```bash
npm run dev      # Développement (http://localhost:3000)
npm run build    # Build de production
npm start        # Serveur de production
npm run lint     # Vérification ESLint
```

## 📐 Architecture globale

### Store Zustand centralisé (`store/index.ts`)

Gestion d'état avec persistance IndexedDB via localforage :

- **Plans mensuels** (`MonthlyPlan[]`) : revenus fixes, dépenses fixes, enveloppes d'allocation
- **Calculs automatiques** : `calculatedResults` recalculé via `recalculatePlan()`
- **Enveloppes mixtes** : types `percentage` (% du reste) ou `fixed` (montant fixe en euros)
- **Persistance** : auto-sauvegarde + réhydratation au chargement
- **Migration** : gestion des anciens formats (ajout automatique du type `percentage`)

### Système de tutoriel interactif

**Context** (`context/TutorialContext.tsx`) :
- État global : étape actuelle, bandeau étendu/réduit, modals
- Navigation automatique entre pages selon l'étape
- Données d'exemple pré-remplies pour la démo

**Composants** (`components/tutorial/`) :
- `TutorialBanner.tsx` : bandeau mobile minimisable (bulle flottante en bas à gauche)
- `TutorialOverlay.tsx` : overlay avec navigation au clavier (flèches, Entrée, Échap)
- `TutorialWelcomeModal.tsx` / `TutorialDisclaimerModal.tsx` : modals d'introduction
- `TutorialHighlight.tsx` : surlignage des éléments importants

**Padding dynamique** (`app/layout-with-nav.tsx:28`) :
- Mobile : `pb-20` (bandeau réduit) ou `pb-72` (bandeau étendu)
- Desktop : pas de padding (sidebar fixe)

### Logique financière (`lib/monthly-plan.ts`)

Fonctions de calcul :
- `calculateAvailableAmount()` : revenus - dépenses fixes
- `calculateAvailableForPercentage()` : après déduction des enveloppes fixes
- `normalizeEnvelopePercentages()` : ajuste les % pour totaliser 100% (ignore les enveloppes fixes)
- `recalculateEnvelopeAmounts()` : recalcule les montants selon les % et le reste disponible
- `validateMonthlyPlan()` : validation complète d'un plan

**Ordre de calcul** :
1. Total revenus fixes - total dépenses fixes = disponible
2. Déduire les enveloppes fixes du disponible = reste pour les %
3. Calculer les montants des enveloppes en % sur ce reste
4. Solde final = disponible - (enveloppes fixes + enveloppes %)

### Layout et navigation

**Desktop** (`components/Navigation.tsx`) :
- Sidebar fixe à gauche (w-64)
- Main content avec `md:ml-64`

**Mobile** (`components/MobileNav.tsx`) :
- Header fixe en haut (h-14)
- Drawer toggle pour le menu
- Main content avec `pt-14`

**Layout avec nav** (`app/layout-with-nav.tsx`) :
- Wrapper pour pages avec navigation
- Padding-bottom dynamique selon tutoriel
- ⚠️ IMPORTANT : utiliser `min-h-screen` sur mobile, `md:h-screen` sur desktop pour éviter les problèmes de scroll (voir section bugs résolus)

### Stockage et persistance

**IndexedDB via localforage** (`lib/storage.ts`) :
- Singleton `StorageService` pour opérations async
- Fallback localStorage côté serveur (SSR Next.js)
- Clé principale : `moneto-storage`
- Auto-sauvegarde Zustand via middleware `persist`

### PWA et offline

**Configuration** (`next.config.ts`) :
- `next-pwa` pour service worker
- Manifest dans `public/manifest.json`
- Icônes PWA dans `public/icons/`

## 🎨 Thème et design

- Mode sombre/clair : `next-themes` avec persistance localStorage
- Couleurs principales : emerald-500 (actions), blue-600 (liens), red-500 (dépenses)
- Animations : Framer Motion pour transitions fluides
- Mobile-first : breakpoints Tailwind (sm, md, lg)

## 📊 Visualisations

- **Recharts** (`components/`) : graphiques standards (bars, lines)
- **D3 Sankey** (`components/SankeyChart.tsx`) : flux revenus → enveloppes
- **D3 Waterfall** (`components/WaterfallChart.tsx`) : évolution du solde mensuel

## ⚠️ Points d'attention

### Import/Export de plans
- Format JSON via `lib/export-import.ts`
- Génération de nouveaux IDs à l'import pour éviter conflits
- Recalcul automatique après import (`recalculatePlan()`)

### Validation des enveloppes
- Les enveloppes en % doivent totaliser 100% (tolérance 0.01)
- Les enveloppes fixes sont déduites AVANT le calcul des %
- `autoAdjustPercentages` dans settings pour normalisation auto

### Migration de données
- Version du store : `version: 2` dans persist config
- `onRehydrateStorage` gère la migration des anciens formats
- Ajout automatique du champ `type` aux anciennes enveloppes

## 📁 Structure clés

```
app/
├── dashboard/          # Liste des plans mensuels
├── onboarding/         # Création plan (revenus/dépenses)
├── repartition/        # Allocation en enveloppes
├── visualisation/      # Graphiques et analyses
└── report-bug/         # Formulaire Formspree

components/
├── tutorial/           # Système de tutoriel complet
├── Navigation.tsx      # Sidebar desktop
├── MobileNav.tsx       # Header + drawer mobile
└── SankeyChart.tsx     # Diagramme de flux

lib/
├── monthly-plan.ts     # Logique financière principale
├── storage.ts          # Service IndexedDB
└── tutorial-data.ts    # Étapes du tutoriel

store/index.ts          # Store Zustand + persistance
context/TutorialContext.tsx  # État global tutoriel
```

## 🐛 Bugs résolus - Documentation technique

## Problème de scroll sur mobile (Octobre 2025)

### Symptômes
- Sur mobile, lors d'un swipe rapide vers le haut ou le bas, le scroll est bloqué avant d'atteindre le vrai haut/bas de la page
- L'utilisateur doit refaire un second scroll pour atteindre le vrai début/fin du contenu
- Donne l'impression d'un "mur invisible" qui limite artificiellement la hauteur de la page

### Cause identifiée
Dans `app/layout-with-nav.tsx`, l'utilisation de `h-screen` (hauteur fixe de 100vh) sur l'élément `<main>` combinée avec :
- `overflow-y-auto` pour créer une zone scrollable
- Un `padding-bottom` dynamique (`pb-20` ou `pb-72` selon l'état du bandeau de tutoriel)

Cette combinaison créait un décalage entre la hauteur fixe du conteneur et la hauteur réelle du contenu. Lors d'un swipe avec momentum/inertie, le navigateur mobile calculait mal la position finale du scroll.

### Solution appliquée
**Fichier modifié :** `app/layout-with-nav.tsx:28`

**Avant :**
```tsx
<main className={`h-screen overflow-y-auto ...`}>
```

**Après :**
```tsx
<main className={`min-h-screen md:h-screen overflow-y-auto ...`}>
```

**Explication :**
- Sur mobile : `min-h-screen` permet au conteneur de s'adapter à la hauteur réelle du contenu
- Sur desktop : `md:h-screen` conserve le comportement de hauteur fixe (nécessaire pour le layout avec sidebar)

### Notes importantes
- ⚠️ Ne jamais utiliser `h-screen` sur un conteneur scrollable sur mobile
- ⚠️ Toujours privilégier `min-h-screen` sur mobile quand le contenu a une hauteur variable
- ✅ Le bandeau de tutoriel continue de fonctionner correctement avec cette solution
- ✅ Le scroll est maintenant fluide et naturel sur mobile

### Comment tester
1. Ouvrir l'application sur un appareil mobile (ou simulateur mobile)
2. Faire un swipe rapide vers le bas sur une longue page
3. Vérifier que le scroll atteint bien le bas de la page sans blocage
4. Faire un swipe rapide vers le haut
5. Vérifier que le scroll atteint bien le haut de la page sans blocage
