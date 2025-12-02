# 🎉 Migration Supabase → Neon + Stack Auth

## ✅ Étapes complétées

### Phase 1 : Préparation Neon
- [x] Schéma `monthly_plans` créé dans Neon PostgreSQL
- [x] 2 plans mensuels exportés et sauvegardés (`supabase-backup.json`)
- [x] Neon Auth provisionné avec Stack Auth

### Phase 2 : Remplacement du code
- [x] Dépendances installées (@stackframe/stack, @neondatabase/serverless)
- [x] Dépendances désinstallées (@supabase/supabase-js)
- [x] Modules créés : lib/neon/* (client, types, sync)
- [x] Module créé : lib/auth-stack/auth.ts
- [x] Stack Auth initialisé (stack.ts, handler routes)
- [x] Store Zustand adapté (tous les imports Neon)
- [x] Composants Auth adaptés (AuthProvider, LoginForm, SignupForm)
- [x] Variables d'environnement configurées (.env.local)

### Phase 4 : Nettoyage
- [x] Répertoire lib/supabase/ supprimé
- [x] Répertoire supabase/ supprimé
- [x] 3 commits créés avec historique propre

---

## 🔑 PROCHAINES ÉTAPES CRITIQUES

### 1. Obtenir vos clés Stack Auth

Vous devez récupérer les clés Stack Auth depuis votre console Neon ou Stack Auth :

**Option A : Via Neon Console**
1. Aller sur https://console.neon.tech
2. Sélectionner projet "Moneto" (shy-smoke-96043013)
3. Onglet "Authentication" ou "Integrations"
4. Copier les 3 clés Stack Auth

**Option B : Via Stack Auth Console**
1. Créer un compte sur https://app.stack-auth.com
2. Créer un nouveau projet (ou lier projet existant)
3. Aller dans "Settings" → "API Keys"
4. Copier les 3 clés

**Clés nécessaires :**
```env
NEXT_PUBLIC_STACK_PROJECT_ID=proj_...
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pk_...
STACK_SECRET_SERVER_KEY=sk_...
```

**Remplacer dans `.env.local` :** (lignes 6-8)

---

### 2. Créer votre compte utilisateur

Une fois les clés configurées :

```bash
npm run dev
```

1. Ouvrir http://localhost:3000/handler/sign-up
2. Créer un compte avec votre email
3. **Noter votre user_id Stack Auth** (visible dans console navigateur ou via Stack Auth dashboard)

---

### 3. Migrer vos 2 plans Supabase vers Neon

J'ai préparé le backup de vos plans dans `supabase-backup.json`.

**Plans à migrer :**
- Plan 2025-10 (plan_id: `plan-1759619591867-y8g2hxk`)
- Plan 2025-11 (plan_id: `plan-1762293770651-q5vzgil`)

**Script de migration :**

Je peux exécuter la migration SQL automatiquement pour vous ! Voici ce que je vais faire :

```sql
-- Remplacer YOUR_STACK_USER_ID par votre vrai user_id

INSERT INTO public.monthly_plans (id, user_id, plan_id, name, data, created_at, updated_at)
VALUES
(
  '88fad13a-568a-44ea-b957-830a4096eadf',
  'YOUR_STACK_USER_ID',
  'plan-1759619591867-y8g2hxk',
  'Plan 2025-10',
  '{"month":"2025-10","envelopes":[...],"fixedIncomes":[...],"fixedExpenses":[...]}'::jsonb,
  '2025-10-04 23:13:11.867+00',
  '2025-11-04 22:01:58.67676+00'
),
(
  '7cc79fb2-1185-4941-9a5d-cf34ca790a80',
  'YOUR_STACK_USER_ID',
  'plan-1762293770651-q5vzgil',
  'Plan 2025-11',
  '{"month":"2025-11","envelopes":[...],"fixedIncomes":[...],"fixedExpenses":[...]}'::jsonb,
  '2025-11-04 22:02:50.651+00',
  '2025-11-04 22:04:08.575174+00'
);
```

**⚠️ Donnez-moi juste votre user_id Stack Auth et je m'occupe du reste !**

---

### 4. Tester l'application

```bash
npm run dev
```

**Tests à effectuer :**

1. **Authentification**
   - [x] Créer compte → http://localhost:3000/handler/sign-up
   - [ ] Se connecter → http://localhost:3000/handler/sign-in
   - [ ] Vérifier session persistante (fermer/rouvrir navigateur)

2. **Téléchargement plans**
   - [ ] Ouvrir dashboard → http://localhost:3000/dashboard
   - [ ] Vérifier affichage des 2 plans migrés
   - [ ] Console : "Téléchargement réussi : 2 plans"

3. **Création nouveau plan**
   - [ ] Créer un nouveau plan via l'interface
   - [ ] Console : "Synchronisation réussie"
   - [ ] Vérifier dans Neon que le plan est inséré

4. **Synchronisation multi-onglets**
   - [ ] Ouvrir 2 onglets
   - [ ] Modifier un plan dans l'onglet 1
   - [ ] Vérifier mise à jour dans l'onglet 2

5. **Déconnexion**
   - [ ] Se déconnecter
   - [ ] Vérifier redirection
   - [ ] Plans locaux toujours accessibles

---

## 📊 Résumé technique

### Base de données

**Avant (Supabase) :**
- PostgreSQL 17.6.1
- Region : eu-west-3
- Table : monthly_plans (2 plans, 1 utilisateur)

**Après (Neon) :**
- PostgreSQL 17
- Region : aws-eu-central-1
- Connection : `postgresql://neondb_owner:***@ep-noisy-lake-ags9jlpc-pooler.c-2.eu-central-1.aws.neon.tech/neondb`
- Table : monthly_plans (0 plans pour l'instant, à migrer)

### Authentification

**Avant (Supabase Auth) :**
- Email/password
- Clé anon publique
- RLS intégré

**Après (Stack Auth via Neon Auth) :**
- Email/password (extensible OAuth)
- Composants pré-construits SignIn/SignUp
- Schema `neon_auth.users_sync` auto-créé
- user_id en TEXT (vs UUID Supabase)

### Architecture code

**Fichiers créés :**
- `lib/neon/client.ts` - Client Neon serverless
- `lib/neon/types.ts` - Types et conversions
- `lib/neon/sync.ts` - Logique synchronisation
- `lib/auth-stack/auth.ts` - Wrapper Stack Auth
- `stack/client.tsx` - Stack App client
- `stack/server.tsx` - Stack App serveur
- `app/handler/[...stack]/page.tsx` - Routes auth Stack

**Fichiers supprimés :**
- `lib/supabase/*` (4 fichiers)
- `supabase/migrations/*` (2 fichiers)

**Fichiers modifiés :**
- `store/index.ts` - 8 imports remplacés
- `components/auth/AuthProvider.tsx` - useUser hook
- `components/auth/LoginForm.tsx` - Composant <SignIn />
- `components/auth/SignupForm.tsx` - Composant <SignUp />
- `.env.local` - DATABASE_URL + clés Stack

---

## 🚨 Points d'attention

1. **Backup Supabase** : `supabase-backup.json` contient vos données originales
2. **Ne PAS supprimer le projet Supabase** avant validation complète en production
3. **Clés Stack Auth** : Obligatoires pour que l'app fonctionne
4. **user_id différent** : Supabase UUID ≠ Stack Auth TEXT
5. **Tests obligatoires** : Valider la synchronisation avant production

---

## 📝 Checklist finale

- [ ] Obtenir clés Stack Auth
- [ ] Configurer .env.local avec vraies clés
- [ ] Créer compte utilisateur Stack Auth
- [ ] Récupérer user_id Stack Auth
- [ ] Migrer 2 plans vers Neon (donnez-moi user_id)
- [ ] Tester authentification
- [ ] Tester téléchargement plans
- [ ] Tester création plan
- [ ] Tester synchronisation
- [ ] Build production : `npm run build`
- [ ] Déployer Vercel (si applicable)
- [ ] Mettre à jour variables d'environnement production

---

## 🆘 En cas de problème

**Rollback possible :**
```bash
git revert a711702  # Annuler nettoyage
git revert 839c494  # Annuler adaptation code
git revert 04efeb9  # Annuler Phase 1-2
npm install @supabase/supabase-js@^2.58.0
```

**Données Supabase toujours intactes !**

---

## 🎯 Prêt à continuer ?

**Dites-moi quand vous avez :**
1. Configuré les clés Stack Auth dans .env.local
2. Créé votre compte et récupéré votre user_id

**Et je pourrai :**
- Migrer automatiquement vos 2 plans dans Neon
- Vous guider dans les tests de validation
