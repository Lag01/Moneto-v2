-- Script de rollback pour annuler la migration month → name
-- À exécuter UNIQUEMENT si la migration échoue

-- ⚠️ IMPORTANT : Ce script suppose que vous avez un backup JSON récent

-- Étape 1 : Désactiver RLS temporairement (si activé)
ALTER TABLE public.monthly_plans DISABLE ROW LEVEL SECURITY;

-- Étape 2 : Supprimer les policies RLS (si créées)
DROP POLICY IF EXISTS "Users can manage their own plans" ON public.monthly_plans;
DROP POLICY IF EXISTS "Users can view their own plans" ON public.monthly_plans;
DROP POLICY IF EXISTS "Users can insert their own plans" ON public.monthly_plans;
DROP POLICY IF EXISTS "Users can update their own plans" ON public.monthly_plans;
DROP POLICY IF EXISTS "Users can delete their own plans" ON public.monthly_plans;

-- Étape 3 : Restaurer la colonne name avec le format d'origine
-- (Les noms seront "Plan YYYY-MM" au lieu des noms localisés)
UPDATE public.monthly_plans
SET name = 'Plan ' || (data->>'month')
WHERE data->>'month' IS NOT NULL;

-- Étape 4 : Ré-ajouter month dans data JSONB (depuis name si possible)
-- Note : Cette étape est approximative, le backup JSON sera plus fiable
UPDATE public.monthly_plans
SET data = jsonb_set(
  data,
  '{month}',
  to_jsonb(
    CASE
      WHEN name ~ '^\d{4}-\d{2}$' THEN name
      ELSE substring(name FROM '\d{4}-\d{2}')
    END
  )
)
WHERE data->>'month' IS NULL;

-- Étape 5 : Vérification
SELECT
  user_id,
  plan_id,
  name,
  data->>'month' as month,
  created_at
FROM public.monthly_plans
LIMIT 10;

-- Afficher les statistiques
SELECT
  COUNT(*) as total_plans,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(CASE WHEN data->>'month' IS NULL THEN 1 END) as plans_sans_month
FROM public.monthly_plans;

-- ⚠️ IMPORTANT : Pour une restauration complète, utilisez plutôt :
-- 1. Supprimez toutes les données : TRUNCATE public.monthly_plans;
-- 2. Restaurez depuis le backup JSON en utilisant INSERT INTO
-- 3. Exemple :
--    INSERT INTO public.monthly_plans (id, user_id, plan_id, name, data, created_at, updated_at)
--    VALUES (...données du backup...)
