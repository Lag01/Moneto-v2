-- Migration 002: Suppression du champ month et génération des noms de plans
-- Date: 2025-01-04
-- Description: Convertit les anciens plans basés sur "month" vers le nouveau système avec "name"

-- Étape 1 : Ajouter une colonne temporaire pour extraire month depuis JSONB
ALTER TABLE public.monthly_plans ADD COLUMN IF NOT EXISTS month_temp TEXT;

-- Étape 2 : Extraire month depuis JSONB data
UPDATE public.monthly_plans
SET month_temp = data->>'month'
WHERE month_temp IS NULL;

-- Étape 3 : Générer les noms depuis month (format français : "Janvier 2025")
-- Si month existe dans JSONB, convertir en nom localisé
-- Sinon, utiliser le plan_id comme fallback
UPDATE public.monthly_plans
SET name = CASE
  WHEN month_temp IS NOT NULL AND month_temp ~ '^\d{4}-\d{2}$' THEN
    -- Format YYYY-MM détecté, convertir en "Mois Année"
    INITCAP(
      to_char(
        to_date(month_temp || '-01', 'YYYY-MM-DD'),
        'TMMonth YYYY'
      )
    )
  WHEN month_temp IS NOT NULL THEN
    -- Format non standard, utiliser tel quel avec préfixe
    'Plan ' || month_temp
  ELSE
    -- Pas de month, utiliser un nom basé sur l'ID du plan
    'Plan ' || substring(plan_id, 6, 13)
END
WHERE name IS NULL OR name LIKE 'Plan %';

-- Étape 4 : Supprimer le champ month du JSONB data
UPDATE public.monthly_plans
SET data = data - 'month'
WHERE data ? 'month';

-- Étape 5 : Supprimer la colonne temporaire
ALTER TABLE public.monthly_plans DROP COLUMN IF EXISTS month_temp;

-- Vérification : Afficher un échantillon des plans migrés
SELECT
  plan_id,
  name,
  created_at,
  updated_at,
  jsonb_object_keys(data) as data_keys
FROM public.monthly_plans
ORDER BY created_at DESC
LIMIT 5;

-- Statistiques de migration
SELECT
  COUNT(*) as total_plans,
  COUNT(CASE WHEN name IS NOT NULL AND name NOT LIKE 'Plan %' THEN 1 END) as plans_with_custom_name,
  COUNT(CASE WHEN name LIKE 'Plan %' THEN 1 END) as plans_with_default_name
FROM public.monthly_plans;
