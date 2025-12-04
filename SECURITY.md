# Sécurité de l'application Moneto

## Architecture de sécurité

### Proxy API sécurisé (`/api/neon-proxy`)

L'application utilise un **proxy API Route Next.js** pour sécuriser tous les accès à la base de données Neon :

1. **Vérification authentification** : Stack Auth vérifie le JWT côté serveur
2. **Filtrage automatique** : Toutes les requêtes sont filtrées par `user_id`
3. **Isolation client/serveur** : `DATABASE_URL` n'est jamais exposé côté client

### Flux de sécurité

```
Client Browser → /api/neon-proxy → Stack Auth verification → Neon PostgreSQL
                       ↓
                   user_id filter
```

**Étape par étape** :

1. Le client envoie une requête SQL via `fetch('/api/neon-proxy')`
2. Le proxy vérifie le JWT Stack Auth avec `stackServerApp.getUser()`
3. Si non authentifié → erreur 401
4. Si authentifié → remplace `__USER_ID__` par l'ID réel
5. Exécute la requête avec filtrage `WHERE user_id = ...`
6. Retourne uniquement les données de l'utilisateur

### Points de sécurité critiques

#### ✅ Sécurisé

- ✅ `DATABASE_URL` jamais exposé côté client
- ✅ Authentification Stack Auth obligatoire
- ✅ Filtrage user_id sur TOUTES les requêtes
- ✅ Paramètres échappés contre injection SQL
- ✅ Détection client/serveur automatique (`lib/neon/client.ts`)

#### ⚠️ À vérifier régulièrement

- ⚠️ Toutes les nouvelles requêtes DOIVENT inclure `WHERE user_id = $1`
- ⚠️ Ne jamais appeler `executeQuery()` sans filtrage user_id
- ⚠️ Les API Routes doivent vérifier `stackServerApp.getUser()`

### Row Level Security (RLS) - État actuel

**RLS non activé pour l'instant** par simplicité et maintenabilité.

Le proxy API offre une sécurité équivalente car :
- Vérification auth en amont (Stack Auth)
- Filtrage strict par user_id
- Pas d'accès direct à Neon depuis le client

**Option RLS future** : La migration `001_add_rls.sql` est disponible si nécessaire.

## Bonnes pratiques

### Écrire une requête sécurisée

```typescript
// ✅ BON : Utiliser __USER_ID__ qui sera remplacé automatiquement
const result = await executeQuery(
  'SELECT * FROM monthly_plans WHERE user_id = $1',
  ['__USER_ID__']
);

// ❌ MAUVAIS : Sans filtre user_id
const result = await executeQuery('SELECT * FROM monthly_plans');

// ❌ MAUVAIS : Passer manuellement un user_id (risque de manipulation)
const result = await executeQuery(
  'SELECT * FROM monthly_plans WHERE user_id = $1',
  [someUserId]
);
```

### Vérifier une nouvelle API Route

Toute nouvelle API Route qui accède à Neon doit :

```typescript
export async function POST(request: NextRequest) {
  // 1. Vérifier l'authentification
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 2. Utiliser user.id pour filtrer
  const result = await sql`
    SELECT * FROM monthly_plans
    WHERE user_id = ${user.id}
  `;

  return NextResponse.json(result);
}
```

## Tests de sécurité

### Tests manuels à effectuer

1. **Test isolation utilisateur** :
   - Créer 2 comptes Stack Auth
   - Créer des plans sur le compte A
   - Se connecter avec le compte B
   - Vérifier que les plans de A ne sont PAS visibles

2. **Test authentification requise** :
   - Se déconnecter
   - Essayer d'accéder à `/api/neon-proxy` directement
   - Vérifier erreur 401

3. **Test injection SQL** :
   - Essayer de passer des paramètres malveillants
   - Vérifier qu'ils sont correctement échappés

### Commande de test

```bash
# Test d'accès non autorisé
curl -X POST http://localhost:3000/api/neon-proxy \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM monthly_plans"}'

# Doit retourner 401 Unauthorized
```

## Checklist de sécurité avant déploiement

- [ ] `DATABASE_URL` définie uniquement côté serveur (.env.local NON commité)
- [ ] Proxy `/api/neon-proxy` teste avec succès l'auth Stack Auth
- [ ] Toutes les requêtes filtrent par `user_id`
- [ ] Tests d'isolation utilisateur réussis
- [ ] Pas d'appels directs à Neon depuis le client
- [ ] Variables d'environnement sécurisées sur Vercel
- [ ] Logs de sécurité activés en production
- [ ] Plan de réponse aux incidents documenté

## Ressources

- [Stack Auth Documentation](https://docs.stack-auth.com/)
- [Neon Security Best Practices](https://neon.tech/docs/security)
- [Next.js API Routes Security](https://nextjs.org/docs/api-routes/introduction)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Contact sécurité

En cas de découverte de faille de sécurité, contacter immédiatement l'équipe de développement.

**Date dernière révision** : 2025-12-04
