# Sécurité de l'application Moneto

## Architecture de sécurité

### Authentification JWT custom

L'application utilise un système d'authentification custom basé sur :
- **jose** (HS256) pour la signature/vérification des JWT
- **bcryptjs** (coût 12) pour le hachage des mots de passe
- **Refresh tokens** avec rotation automatique, stockés en DB (table `refresh_tokens`)

### Flux d'authentification

```
Login/Signup → bcrypt verify → Access Token (15min) + Refresh Token (7j)
                                      ↓
                               Cookie httpOnly
                                      ↓
Request → middleware.ts → Verify JWT → OK → Route
                              ↓
                          Expiré ? → /api/auth/refresh → Rotation token → OK
                              ↓
                          Invalide → Redirect /auth/login
```

### Tokens

| Token | Durée | Stockage | Révocation |
|-------|-------|----------|------------|
| Access token (JWT) | 15 minutes | Cookie httpOnly `moneto-session` | Expire naturellement |
| Refresh token (opaque) | 7 jours | Cookie httpOnly `moneto-refresh` + hash SHA-256 en DB | Révoqué au logout ou à la rotation |

### Proxy API sécurisé (`/api/neon-proxy`)

Toutes les opérations DB passent par un proxy qui :

1. **Vérifie le JWT** côté serveur via `verifyJWT()`
2. **Whitelist d'opérations** : seules 5 opérations SQL prédéfinies sont autorisées (pas de SQL brut)
3. **Filtrage automatique** par `user_id` sur chaque requête
4. **Chiffrement AES-256-GCM** des données des plans au repos
5. **Limite de taille** : requêtes > 1MB rejetées (status 413)
6. **Limite de plans** : max 25 plans par utilisateur

### Points de sécurité

#### Implémenté

- `DATABASE_URL` jamais exposé côté client
- JWT vérifié côté serveur sur chaque requête
- Filtrage `user_id` sur TOUTES les requêtes DB
- Requêtes paramétrées (protection injection SQL via `postgres` lib)
- Rate limiting sur login (5/15min) et signup (3/15min)
- Protection timing attack (bcrypt constant-time + DUMMY_HASH)
- Messages d'erreur ambigus (pas d'énumération d'emails)
- Validation mot de passe (8-128 chars, majuscule + minuscule + chiffre)
- Security headers : X-Frame-Options, X-Content-Type-Options, HSTS, CSP, Referrer-Policy, Permissions-Policy
- Cookies : `httpOnly`, `secure` en production, `sameSite: lax`

#### À améliorer

- Rate limiter en mémoire (non persistant entre déploiements serverless)
- Pas de RLS au niveau PostgreSQL (sécurité uniquement via le proxy)
- Pas de vérification d'email à l'inscription
- Pas de flux de réinitialisation de mot de passe

## Écrire une nouvelle API Route sécurisée

```typescript
import { verifyJWT } from '@/lib/auth/jwt';
import { SESSION_COOKIE } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
  }

  // Utiliser payload.userId pour filtrer les données
  const db = getSqlClient();
  const result = await db`
    SELECT * FROM monthly_plans WHERE user_id = ${payload.userId}
  `;
}
```

## Tests de sécurité manuels

1. **Isolation utilisateur** : créer 2 comptes, vérifier qu'un compte ne voit pas les données de l'autre
2. **Accès non authentifié** : appeler `/api/neon-proxy` sans cookie → doit retourner 401
3. **Token expiré** : attendre 15min, vérifier que le refresh automatique fonctionne
4. **Logout** : vérifier que le refresh token est révoqué en DB après déconnexion

## Checklist avant déploiement

- [ ] `DATABASE_URL`, `JWT_SECRET`, `PLAN_ENCRYPTION_KEY` définis en variables d'environnement Vercel
- [ ] `.env.local` dans `.gitignore` (vérifié)
- [ ] Toutes les requêtes filtrent par `user_id`
- [ ] Tests d'isolation utilisateur réussis
- [ ] Rate limiting fonctionnel

## Ressources

- [Neon Security Best Practices](https://neon.tech/docs/security)
- [Next.js API Routes Security](https://nextjs.org/docs/api-routes/introduction)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

**Date dernière révision** : 2026-03-27
