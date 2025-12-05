/**
 * Script de backup des données Neon
 *
 * Ce script exporte toutes les données de la table monthly_plans
 * avant d'effectuer des migrations potentiellement destructrices.
 *
 * Usage:
 *   npm run backup
 */

import { config } from 'dotenv';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

// Charger les variables d'environnement depuis .env.local
config({ path: '.env.local' });

async function backupNeonData() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL non définie dans les variables d\'environnement');
    process.exit(1);
  }

  console.log('🔄 Connexion à Neon...');
  const sql = postgres(databaseUrl, {
    ssl: 'require',
  });

  try {
    // Récupérer toutes les données
    console.log('📥 Récupération des données...');
    const plans = await sql`
      SELECT
        id,
        user_id,
        plan_id,
        name,
        data,
        created_at,
        updated_at
      FROM public.monthly_plans
      ORDER BY created_at DESC
    `;

    console.log(`✅ ${plans.length} plans récupérés`);

    // Créer le nom du fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const backupDir = path.join(process.cwd(), 'backups');
    const backupFile = path.join(backupDir, `neon-backup-${timestamp}.json`);

    // Créer le dossier backups s'il n'existe pas
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Sauvegarder les données
    const backupData = {
      timestamp: new Date().toISOString(),
      database: 'Neon PostgreSQL',
      table: 'monthly_plans',
      count: plans.length,
      data: plans,
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log(`💾 Backup sauvegardé : ${backupFile}`);
    console.log(`📊 Statistiques :`);
    console.log(`   - Total plans : ${plans.length}`);

    // Compter plans par utilisateur
    const userCounts = plans.reduce((acc, plan) => {
      acc[plan.user_id] = (acc[plan.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`   - Utilisateurs : ${Object.keys(userCounts).length}`);
    Object.entries(userCounts).forEach(([userId, count]) => {
      console.log(`     • ${userId.substring(0, 8)}... : ${count} plans`);
    });

    console.log('✅ Backup terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du backup :', error);
    process.exit(1);
  }
}

// Exécuter le backup
backupNeonData();
