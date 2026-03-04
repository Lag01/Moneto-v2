-- Migration : Changer la colonne data de jsonb à text pour supporter le chiffrement
-- IMPORTANT : Exécuter cette requête AVANT de déployer le chiffrement

-- Étape 1 : Convertir jsonb → text
ALTER TABLE public.monthly_plans ALTER COLUMN data TYPE text USING data::text;

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'monthly_plans' AND column_name = 'data';
