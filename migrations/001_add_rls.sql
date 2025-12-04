-- Migration 001 : Activation du Row Level Security (RLS)
-- Date : 2025-12-04
-- Description : Sécurise l'accès aux données en garantissant que chaque utilisateur
--               ne peut accéder qu'à ses propres plans mensuels.

-- ============================================================================
-- ÉTAPE 1 : Activer RLS sur la table monthly_plans
-- ============================================================================

ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 2 : Créer les policies RLS
-- ============================================================================

-- Policy SELECT : Les utilisateurs ne peuvent voir que leurs propres plans
CREATE POLICY "users_select_own_plans"
  ON public.monthly_plans
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- Policy INSERT : Les utilisateurs ne peuvent insérer que pour eux-mêmes
CREATE POLICY "users_insert_own_plans"
  ON public.monthly_plans
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

-- Policy UPDATE : Les utilisateurs ne peuvent mettre à jour que leurs propres plans
CREATE POLICY "users_update_own_plans"
  ON public.monthly_plans
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true)::text)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

-- Policy DELETE : Les utilisateurs ne peuvent supprimer que leurs propres plans
CREATE POLICY "users_delete_own_plans"
  ON public.monthly_plans
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- ============================================================================
-- ÉTAPE 3 : Vérification de la configuration RLS
-- ============================================================================

-- Vérifier que RLS est bien activé
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'monthly_plans';

-- Lister toutes les policies créées
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'monthly_plans';

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
--
-- 1. Le RLS utilise current_setting('app.current_user_id') qui doit être défini
--    AVANT chaque requête via le proxy API Route /api/neon-proxy
--
-- 2. Le proxy doit exécuter cette commande avant chaque requête :
--    SET LOCAL app.current_user_id = '<user_id>';
--
-- 3. Pour désactiver RLS (rollback) :
--    ALTER TABLE public.monthly_plans DISABLE ROW LEVEL SECURITY;
--    DROP POLICY users_select_own_plans ON public.monthly_plans;
--    DROP POLICY users_insert_own_plans ON public.monthly_plans;
--    DROP POLICY users_update_own_plans ON public.monthly_plans;
--    DROP POLICY users_delete_own_plans ON public.monthly_plans;
--
-- 4. Les super-utilisateurs PostgreSQL (role cloud_admin) peuvent contourner RLS.
--    C'est normal et nécessaire pour les opérations d'administration.
--
-- ============================================================================
