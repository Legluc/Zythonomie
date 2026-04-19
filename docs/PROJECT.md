# 🍺 Zythonomie — Plan de Projet

> **Document de référence** pour le développement de l'application Zythonomie.
> Chaque phase est séquentielle — la suivante ne démarre qu'une fois la précédente validée.
>
> **Dernière mise à jour** : 19 avril 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [État actuel du projet](#2-état-actuel-du-projet)
3. [Architecture technique](#3-architecture-technique)
4. [Roadmap](#4-roadmap)
   - [Phase 1 — Recommandation complète](#phase-1--recommandation-complète)
   - [Phase 2 — Tests automatisés](#phase-2--tests-automatisés-vitest)
   - [Phase 3 — Authentification sécurisée](#phase-3--authentification-sécurisée)
   - [Phase 4 — Rôles & permissions admin](#phase-4--rôles--permissions-admin)
   - [Phase 5 — Pagination](#phase-5--pagination)
   - [Phase 6 — Sécurité & qualité](#phase-6--sécurité--qualité)
   - [Phase 7 — Documentation API](#phase-7--documentation-api-swagger)
   - [Phase 8 — CI/CD](#phase-8--cicd-github-actions)
   - [Phase 9 — Frontend](#phase-9--frontend-react-native--expo)
   - [Phase 10 — README & onboarding](#phase-10--readme--onboarding)
5. [Conventions de code](#5-conventions-de-code)
6. [Décisions techniques](#6-décisions-techniques)

---

## 1. Vue d'ensemble

**Zythonomie** est une application mobile de découverte et de recommandation de bières artisanales. L'utilisateur répond à un quiz de préférences gustatives, et l'application lui recommande les bières les plus compatibles avec son profil grâce à un algorithme de compatibilité par produit scalaire.

### Stack technique

| Couche    | Technologie                                |
| --------- | ------------------------------------------ |
| Backend   | Node.js · Express 5 · TypeScript · Prisma  |
| Base      | MySQL                                      |
| Frontend  | React Native · Expo · Zustand · Axios      |
| Tests     | Vitest · Supertest                         |
| CI/CD     | GitHub Actions                             |
| Auth      | bcrypt · JWT (access + refresh token)      |

---

## 2. État actuel du projet

### ✅ Réalisé

| Module              | Service | Controller | Routes | Statut        |
| ------------------- | :-----: | :--------: | :----: | ------------- |
| User                |    ✓    |     ✓      |   ✓    | CRUD + soft delete |
| Beer                |    ✓    |     ✓      |   ✓    | CRUD + filtres + liaisons atomiques brewery/category |
| Brewery             |    ✓    |     ✓      |   ✓    | CRUD complet  |
| Category            |    ✓    |     ✓      |   ✓    | CRUD + hiérarchie auto-ref |
| Rating              |    ✓    |     ✓      |   ✓    | CRUD + règle 1 note/couple |
| Pairing             |    ✓    |     ✓      |   ✓    | CRUD + liaisons atomiques category |
| Criterion           |    ✓    |     ✓      |   ✓    | CRUD admin (GET public) |
| UserCriteria        |    ✓    |     ✓      |   ✓    | Upsert + validation score |
| BeerCriteria        |    ✓    |     ✓      |   ✓    | Upsert admin  |
| Quiz                |    ✓    |     ✓      |   ✓    | CRUD + nested create |
| QuizzSession        |    ✓    |     ✓      |   ✓    | Start → answer → complete → auto-upsert UserCriteria |
| QuizzQuestion       |    ✓    |     ✓      |   ✓    | CRUD admin, DELETE bloqué si réponses |
| QuestionChoice      |    ✓    |     ✓      |   ✓    | CRUD admin, DELETE bloqué si réponses |
| Recommendation      |    ✓    |     ✓      |   ✓    | GET + refresh (algo à modifier) |

### Fondations techniques en place

- `HttpError(status, code, message)` — erreurs métier uniformes
- `sendSuccess(res, status, data)` — réponses uniformes
- Middleware `validate(schema, source)` — validation Zod (body/params/query)
- Middleware `error-handler` — capture sync/async + format ApiResponse
- Middleware `require-admin` — **stub** (lit `X-User-Role` header, à remplacer en Phase 3)
- Prisma select explicite — jamais `*`, jamais `password` exposé
- Seed complet — 5 users, 8 bières, 27 critères, quiz avec questions/choix, sessions

### ❌ Manquant

- Mots de passe stockés en **clair** en DB (critique)
- Aucune authentification JWT
- Aucun test automatisé
- Aucune pagination
- Frontend = squelette vide (template Expo par défaut)
- Algo de recommandation actuel = distance au lieu du produit scalaire demandé

---

## 3. Architecture technique

```
backend/
├── prisma/
│   ├── schema.prisma          # 17 modèles, enums Role + QuizzSessionStatus
│   ├── seed.ts                # Dataset de développement
│   └── migrations/
├── src/
│   ├── app.ts                 # Montage Express + middleware + routes
│   ├── server.ts              # Bootstrap HTTP
│   ├── lib/
│   │   ├── prisma.ts          # Singleton PrismaClient
│   │   ├── http-error.ts      # Classe HttpError
│   │   └── response.ts        # Helpers sendSuccess / sendError
│   ├── middleware/
│   │   ├── error-handler.ts   # Capture globale des erreurs
│   │   ├── validate.ts        # Validation Zod générique
│   │   └── require-admin.ts   # Stub admin → sera remplacé Phase 3
│   ├── services/              # Logique métier + accès Prisma
│   ├── controllers/           # Mapping HTTP ↔ service
│   ├── routes/                # Déclaration endpoints + validation schemas
│   └── types/
│       └── api.ts             # ApiResponse<T> type
└── tests/                     # (Phase 2)
    ├── unit/
    ├── integration/
    └── helpers/

frontend/
├── App.tsx                    # (Phase 9)
├── services/apiClient.ts     # Axios configuré
├── constants/api.ts
├── store/                     # Zustand (à créer)
├── components/                # (à créer)
└── hooks/                     # (à créer)
```

### Endpoints montés (15 préfixes)

```
/health
/api/users
/api/beers
/api/ratings
/api/quizzes
/api/quizz-sessions
/api/recommendations
/api/breweries
/api/categories
/api/pairings
/api/criteria
/api/user-criteria
/api/beer-criteria
/api/quizz-questions
/api/question-choices
```

---

## 4. Roadmap

---

### Phase 1 — Recommandation complète

> **Objectif** : Le parcours complet fonctionne de bout en bout — un utilisateur lance un quiz, répond aux questions, et reçoit ses recommandations de bières.

#### 1.1 Modifier l'algorithme de recommandation

**Fichier** : `backend/src/services/recommendation.service.ts`

L'algorithme actuel utilise une **distance** (`1 - |diff|/5`). Le remplacer par un **produit scalaire normalisé** :

```
score = Σ(score_user_critère_i × score_beer_critère_i) / nombre_critères_communs
```

- Pour chaque bière active (non soft-deleted) :
  1. Récupérer les critères communs entre `UserCriteria` et `BeerCriteria`
  2. Calculer `Σ(score_user × score_beer)` sur ces critères communs
  3. Normaliser : diviser par le nombre de critères communs
  4. Si 0 critères communs → score = 0 (la bière n'est pas recommandable)
- Trier par score décroissant
- Persister dans `BeerRecommendedUser` via transaction (delete all + create)

#### 1.2 Vérifier le flow complet

Parcours à valider manuellement :

```
POST   /api/quizz-sessions                    → start session (status: IN_PROGRESS)
POST   /api/quizz-sessions/:id/answers         → répondre question par question
PUT    /api/quizz-sessions/:id/complete         → marque COMPLETED + auto-upsert UserCriteria
POST   /api/recommendations/refresh/:userId     → calcul produit scalaire → persist scores
GET    /api/recommendations/user/:userId        → résultats triés DESC
```

#### 1.3 Cas limites à valider

| Scénario | Comportement attendu |
| --- | --- |
| 0 critères communs user/beer | `score_compatibility = 0` |
| Utilisateur sans session complétée | Tableau vide (pas de UserCriteria) |
| Bière soft-deleted | Exclue du calcul |
| Refresh sur user inexistant | 404 USER_NOT_FOUND |
| Refresh sur user sans critères | Tableau vide |
| Double refresh | Idempotent — résultats identiques |

#### 1.4 Vérification du seed

- Les 27 critères sont bien en DB
- Chaque bière a des `BeerCriteria` pour tous les critères
- Au moins 2 users ont des `UserCriteria` (sessions COMPLETED dans le seed)
- Le quiz contient les 27 questions avec choix et `note_value`

**✅ Definition of Done Phase 1** :
- [ ] Algo modifié et compilé sans erreur
- [ ] Flow complet testé manuellement (start → answer → complete → refresh → get)
- [ ] Scores cohérents (produit scalaire vérifié sur un exemple à la main)
- [ ] Cas limites validés

---

### Phase 2 — Tests automatisés (Vitest)

> **Objectif** : Couverture de tests unitaires et d'intégration sur la fonctionnalité de recommandation, puis extension aux autres modules.

#### 2.1 Setup

- Installer `vitest`, `@vitest/coverage-v8`, `supertest`, `@types/supertest`
- Créer `vitest.config.ts` à la racine de `backend/`
- Utiliser la **même DB** avec **transactions rollback** pour l'isolation

#### 2.2 Helper de test transactionnel

```typescript
// backend/tests/helpers/with-transaction.ts
// Ouvre une transaction Prisma, injecte le client transactionnel, rollback après le test
async function withTestTransaction(fn: (tx: PrismaTransactionClient) => Promise<void>): Promise<void>
```

#### 2.3 Fixture factories

```typescript
// backend/tests/helpers/factories.ts
createTestUser(overrides?)    → User
createTestBeer(overrides?)    → Beer
createTestCriterion(overrides?) → Criterion
createTestQuiz(overrides?)    → Quizz (avec questions + choices)
```

#### 2.4 Tests unitaires services

| Fichier test | Cas à couvrir |
| --- | --- |
| `criterion.service.test.ts` | CRUD complet · 409 si critère en usage · 404 si inexistant |
| `user-criteria.service.test.ts` | Upsert · score bornes [0, 5] → 422 si hors-borne · user supprimé → 404 |
| `beer-criteria.service.test.ts` | Upsert · beer supprimée → 404 · critère inexistant → 404 |
| `recommendation.service.test.ts` | Produit scalaire correct sur exemple connu · 0 critères communs → score 0 · normalisation juste · bière soft-deleted exclue |
| `quizz-session.service.test.ts` | Start → answer → complete → UserCriteria créés · doublon réponse → rejet · session déjà complétée → erreur |
| `rating.service.test.ts` | Création OK · doublon couple user-beer → 409 · soft delete · update |
| `user.service.test.ts` | CRUD · mail unique → 409 · soft delete + anonymisation |
| `beer.service.test.ts` | CRUD · filtres · liaisons atomiques brewery/category · soft delete |

#### 2.5 Tests d'intégration HTTP

| Fichier test | Scénarios |
| --- | --- |
| `recommendations.integration.test.ts` | Flow complet quiz → reco via HTTP · codes 200/201/404/422 |
| `auth.integration.test.ts` | _(Phase 3)_ |
| `beers.integration.test.ts` | CRUD + filtres + liaisons · codes HTTP · format ApiResponse |
| `ratings.integration.test.ts` | Création + contrainte unicité + soft delete |

#### 2.6 Structure de fichiers

```
backend/
├── vitest.config.ts
└── tests/
    ├── helpers/
    │   ├── with-transaction.ts
    │   ├── factories.ts
    │   └── setup.ts
    ├── unit/
    │   ├── criterion.service.test.ts
    │   ├── user-criteria.service.test.ts
    │   ├── beer-criteria.service.test.ts
    │   ├── recommendation.service.test.ts
    │   ├── quizz-session.service.test.ts
    │   ├── rating.service.test.ts
    │   ├── user.service.test.ts
    │   └── beer.service.test.ts
    └── integration/
        ├── recommendations.integration.test.ts
        ├── beers.integration.test.ts
        └── ratings.integration.test.ts
```

**✅ Definition of Done Phase 2** :
- [ ] `npm run test` exécute tous les tests et passe au vert
- [ ] Chaque test est isolé (rollback — pas d'état partagé entre tests)
- [ ] Couverture ≥ 80% sur les services de recommandation
- [ ] Aucun test ne modifie la DB de développement de façon permanente
- [ ] Script `test` ajouté au `package.json`

---

### Phase 3 — Authentification sécurisée

> **Objectif** : Mots de passe hashés, JWT access + refresh, connexion sécurisée.

#### 3.1 Dépendances

```bash
npm install bcrypt jsonwebtoken
npm install -D @types/bcrypt @types/jsonwebtoken
```

#### 3.2 Hashage des mots de passe

**Fichier** : `backend/src/services/user.service.ts`

- `createUser()` : hasher le password avec bcrypt (12 rounds) avant `prisma.user.create()`
- `updateUser()` : si `input.password` fourni, hasher avant update
- **Migration one-shot** : script `backend/scripts/hash-existing-passwords.ts` pour re-hasher les passwords du seed en DB

#### 3.3 Nouveaux endpoints

| Méthode | Route | Description | Accès |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Inscription (hash + create user) | Public |
| POST | `/api/auth/login` | Connexion (bcrypt compare → JWT) | Public |
| POST | `/api/auth/refresh` | Refresh access token (rotation du refresh) | Public (avec refresh token) |
| GET | `/api/auth/me` | Profil de l'utilisateur connecté | Authentifié |
| POST | `/api/auth/logout` | Invalidation du refresh token | Authentifié |

#### 3.4 Tokens JWT

| Token | Durée | Payload | Stockage |
| --- | --- | --- | --- |
| Access token | 1h | `{ sub: userId, role: Role }` | Header `Authorization: Bearer <token>` |
| Refresh token | 7 jours | `{ sub: userId, jti: tokenId }` | Body de la requête `/refresh` |

- **Stockage refresh** : table `RefreshToken` en DB (id, userId, token, expiresAt, revokedAt)
- **Rotation** : chaque refresh invalide l'ancien token et en génère un nouveau
- **Migration Prisma** : ajouter model `RefreshToken` au schema

#### 3.5 Middleware `authenticate`

**Fichier** : `backend/src/middleware/authenticate.ts`

```
1. Extraire le header Authorization: Bearer <token>
2. Vérifier et décoder le JWT avec JWT_SECRET
3. Attacher req.user = { id, role } sur la requête
4. Si token absent → 401 UNAUTHORIZED
5. Si token expiré → 401 TOKEN_EXPIRED
6. Si token invalide → 401 INVALID_TOKEN
```

#### 3.6 Remplacement du stub `require-admin`

**Fichier** : `backend/src/middleware/require-admin.ts`

- Supprimer la lecture de `X-User-Role`
- Lire `req.user.role` (posé par `authenticate`)
- Si `role !== 'ADMIN'` → 403 FORBIDDEN

#### 3.7 Variables d'environnement

```env
JWT_SECRET=<clé secrète access token>
JWT_REFRESH_SECRET=<clé secrète refresh token>
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
```

**✅ Definition of Done Phase 3** :
- [ ] Aucun mot de passe en clair en DB
- [ ] Login retourne access + refresh token
- [ ] Refresh fonctionne avec rotation
- [ ] `GET /api/auth/me` retourne le profil avec un token valide
- [ ] Token expiré → 401
- [ ] Tests unitaires : hashage, login correct, login mauvais password, refresh, logout
- [ ] Tests intégration : flow register → login → me → refresh → logout

---

### Phase 4 — Rôles & permissions admin

> **Objectif** : Appliquer les middlewares d'authentification et d'autorisation sur tous les endpoints.

#### 4.1 Matrice d'accès

_Le scope admin précis sera défini ultérieurement par le porteur de projet._

Matrice indicative de départ :

| Route | Public | USER | ADMIN |
| --- | :---: | :---: | :---: |
| `GET /api/beers` | | ✓ | ✓ |
| `POST /api/beers` | | | ✓ |
| `PUT/DELETE /api/beers/:id` | | | ✓ |
| `GET /api/criteria` | | ✓ | ✓ |
| `POST/PATCH/DELETE /api/criteria` | | | ✓ |
| `GET /api/breweries` | | ✓ | ✓ |
| `POST/PUT/DELETE /api/breweries` | | | ✓ |
| `GET /api/categories` | | ✓ | ✓ |
| `POST/PUT/DELETE /api/categories` | | | ✓ |
| `GET /api/pairings` | | ✓ | ✓ |
| `POST/PUT/DELETE /api/pairings` | | | ✓ |
| `POST /api/ratings` | | ✓ | ✓ |
| `PUT/DELETE /api/ratings/:id` | | propriétaire | ✓ |
| `GET /api/recommendations/user/:id` | | propriétaire | ✓ |
| `POST /api/recommendations/refresh/:id` | | propriétaire | ✓ |
| `POST /api/quizz-sessions` | | ✓ | ✓ |
| Quiz CRUD | | | ✓ |


#### 4.2 Middleware `requireOwnerOrAdmin`

Pour les routes où l'utilisateur ne peut agir que sur ses propres données :

```
1. Si req.user.role === 'ADMIN' → next()
2. Si req.params.userId === req.user.id → next()
3. Sinon → 403 FORBIDDEN
```

#### 4.3 Application

- Passer sur chaque fichier de routes
- Ajouter `authenticate` → `requireAdmin` ou `requireOwnerOrAdmin` selon la matrice
- Les routes publiques (GET catalogue) restent sans middleware auth

**✅ Definition of Done Phase 4** :
- [ ] Matrice d'accès validée et documentée
- [ ] Middleware `requireOwnerOrAdmin` créé
- [ ] Tous les endpoints protégés selon la matrice
- [ ] Tests : 401 sans token, 403 USER sur route admin, 403 USER sur données d'un autre user
- [ ] Un USER ne peut pas se promouvoir ADMIN

---

### Phase 5 — Pagination

> **Objectif** : Éviter les réponses massives sur les listes en ajoutant la pagination côté API.

#### 5.1 Helper générique

**Fichier** : `backend/src/lib/paginate.ts`

```typescript
interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function paginate<T>(model, args, page, limit): Promise<PaginatedResult<T>>
```

#### 5.2 Paramètres

| Query param | Type | Défaut | Min | Max |
| --- | --- | --- | --- | --- |
| `page` | number | 1 | 1 | — |
| `limit` | number | 20 | 1 | 100 |

#### 5.3 Endpoints à paginer

- `GET /api/beers`
- `GET /api/users`
- `GET /api/ratings/beer/:id`, `GET /api/ratings/user/:id`
- `GET /api/recommendations/user/:userId`
- `GET /api/breweries`
- `GET /api/categories`
- `GET /api/pairings`
- `GET /api/question-choices/by-question/:id_quizz_question`
- `GET /api/quizz-sessions`

#### 5.4 Validation Zod

Schéma réutilisable :

```typescript
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

**✅ Definition of Done Phase 5** :
- [ ] Toutes les listes retournent `{ data: [...], meta: { page, limit, total, totalPages } }`
- [ ] `?page=0` → 422
- [ ] `?limit=200` → plafonné à 100 ou rejeté
- [ ] `?page=999` sur une petite table → `data: []` + meta cohérent
- [ ] Tests unitaires du helper `paginate`
- [ ] Tests intégration sur au moins 2 routes paginées

---

### Phase 6 — Sécurité & qualité

> **Objectif** : Durcir le backend avec les protections standards et améliorer l'expérience développeur.

#### 6.1 Helmet + Morgan

```bash
npm install helmet morgan
npm install -D @types/morgan
```

- `app.use(helmet())` — headers de sécurité HTTP
- `app.use(morgan('dev'))` en dev, `morgan('combined')` en prod

#### 6.2 Rate limiting sur le login

```bash
npm install express-rate-limit
```

```typescript
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 5,                 // 5 tentatives
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Trop de tentatives' } },
});
router.post('/login', loginLimiter, validate(loginSchema), loginHandler);
```

#### 6.3 `.env.example`

Créer à la racine de `backend/` :

```env
# Base de données
DATABASE_URL=mysql://user:password@localhost:3306/zythonomie

# Serveur
PORT=3000

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
```

#### 6.4 Amélioration des erreurs Zod

**Fichier** : `backend/src/middleware/validate.ts`

Formater les erreurs Zod en messages lisibles :

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Erreur de validation",
    "details": [
      { "field": "name", "message": "Le champ est requis" },
      { "field": "score", "message": "Doit être entre 0 et 5" }
    ]
  }
}
```

#### 6.5 Seed idempotent

**Fichier** : `backend/prisma/seed.ts`

- Remplacer les `create` par des `upsert` (clé : mail pour User, name pour Beer/Brewery/Criterion, etc.)
- Le seed peut être relancé sans erreur de doublon

**✅ Definition of Done Phase 6** :
- [ ] `helmet` actif (vérifiable via headers HTTP)
- [ ] `morgan` log les requêtes en dev
- [ ] Login bloqué après 5 tentatives/min
- [ ] `.env.example` présent et documenté
- [ ] Erreurs Zod formatées avec champs + messages lisibles
- [ ] `npx prisma db seed` relançable sans erreur

---

### Phase 7 — Documentation API (Swagger)

> **Objectif** : Documenter tous les endpoints REST via Swagger UI.

#### 7.1 Setup

```bash
npm install swagger-jsdoc swagger-ui-express
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

#### 7.2 Configuration

**Fichier** : `backend/src/lib/swagger.ts`

```typescript
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zythonomie API',
      version: '1.0.0',
      description: 'API de recommandation de bières',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});
```

#### 7.3 Montage

```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

#### 7.4 Annotations

Ajouter des commentaires JSDoc OpenAPI sur chaque route :

```typescript
/**
 * @openapi
 * /beers:
 *   get:
 *     summary: Liste des bières
 *     tags: [Beer]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Liste paginée des bières
 */
```

**✅ Definition of Done Phase 7** :
- [ ] `GET /api-docs` affiche Swagger UI
- [ ] Tous les endpoints documentés avec paramètres, body, réponses
- [ ] Modèles de réponse (ApiResponse, erreurs) décrits
- [ ] Authentification JWT testable depuis Swagger UI

---

### Phase 8 — CI/CD (GitHub Actions)

> **Objectif** : Automatiser le build et les tests à chaque push/PR.

#### 8.1 Workflow

**Fichier** : `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: zythonomie_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping -h localhost"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci
      - run: cd backend && npx prisma generate
      - run: cd backend && npx prisma db push
        env:
          DATABASE_URL: mysql://root:test@localhost:3306/zythonomie_test
      - run: cd backend && npm run build
      - run: cd backend && npm run test
        env:
          DATABASE_URL: mysql://root:test@localhost:3306/zythonomie_test
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret
```

#### 8.2 Badge

Ajouter dans le README :

```markdown
![CI](https://github.com/<user>/<repo>/actions/workflows/ci.yml/badge.svg)
```

**✅ Definition of Done Phase 8** :
- [ ] Push sur `main`/`develop` déclenche le workflow
- [ ] Build + tests passent en CI
- [ ] PR en erreur → merge bloqué (branch protection recommandée)
- [ ] Badge CI visible dans le README

---

### Phase 9 — Frontend (React Native / Expo)

> **Objectif** : Intégrer les maquettes et connecter le frontend à l'API.

_Les maquettes seront fournies ultérieurement._

#### 9.1 Architecture prévue

```
frontend/
├── App.tsx                     # Navigation principale
├── navigation/
│   ├── AppNavigator.tsx        # Stack/Tab navigation
│   └── AuthNavigator.tsx       # Login/Register
├── screens/
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── HomeScreen.tsx          # Liste bières
│   ├── BeerDetailScreen.tsx
│   ├── QuizScreen.tsx
│   ├── QuizResultScreen.tsx
│   ├── RecommendationsScreen.tsx
│   └── ProfileScreen.tsx
├── components/
│   ├── BeerCard.tsx
│   ├── QuizQuestion.tsx
│   ├── RecommendationCard.tsx
│   └── ui/                     # Boutons, inputs, loaders
├── store/
│   ├── useAuthStore.ts
│   ├── useBeersStore.ts
│   ├── useQuizStore.ts
│   └── useRecommendationStore.ts
├── services/
│   └── apiClient.ts            # Axios + interceptors JWT
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
└── constants/
    └── api.ts
```

#### 9.2 Interceptor Axios JWT

```typescript
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await useAuthStore.getState().refresh();
      return apiClient(error.config);
    }
    return Promise.reject(error);
  },
);
```

#### 9.3 Priorité des écrans

1. Login / Register
2. Accueil — liste des bières (paginée)
3. Détail bière (infos + critères + rating)
4. Quiz — parcours question par question
5. Résultats — recommandations triées
6. Profil utilisateur

#### 9.4 Dépendances à installer

```bash
npx expo install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install expo-secure-store   # stockage JWT sécurisé
```

**✅ Definition of Done Phase 9** :
- [ ] Navigation fonctionnelle (auth stack + main tabs)
- [ ] Login/Register connectés à l'API
- [ ] Liste bières paginée + détail
- [ ] Quiz jouable de A à Z → recommandations affichées
- [ ] Token stocké dans `expo-secure-store`
- [ ] Refresh automatique si access token expiré

---

### Phase 10 — README & onboarding

> **Objectif** : Permettre à n'importe quel développeur de cloner et lancer le projet en 5 minutes.

#### Contenu du `README.md` (racine du projet)

1. **En-tête** — Nom, description courte, badge CI
2. **Prérequis** — Node.js ≥ 22, MySQL 8, Expo CLI
3. **Installation**
   - Clone
   - Backend : `cd backend && npm install && cp .env.example .env` (éditer les variables)
   - `npx prisma generate && npx prisma migrate dev && npx prisma db seed`
   - `npm run dev`
   - Frontend : `cd frontend && npm install && npx expo start`
4. **Scripts disponibles**
   - `npm run dev` — serveur dev avec hot reload
   - `npm run build` — compilation TypeScript
   - `npm run test` — tests Vitest
   - `npx prisma studio` — interface visuelle DB
   - `npx prisma db seed` — peupler la DB
5. **Variables d'environnement** — Tableau avec description de chaque variable
6. **Architecture** — Arborescence simplifiée backend + frontend
7. **Endpoints API** — Lien vers Swagger UI (`/api-docs`)
8. **Contribution** — Conventions de branches, PR, commits
9. **Licence**

**✅ Definition of Done Phase 10** :
- [ ] `README.md` complet à la racine
- [ ] Un nouveau développeur peut installer et lancer en suivant le README seul
- [ ] Lien vers `/api-docs` (Swagger)
- [ ] Badge CI présent

---

## 5. Conventions de code

### Pattern uniforme service / controller / routes

```
Route (validation Zod + middlewares)
  → Controller (mapping HTTP ↔ service, pas de logique métier)
    → Service (accès Prisma + règles métier)
```

### Réponses API

**Succès** :
```json
{ "success": true, "data": { ... } }
```

**Erreur** :
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Description lisible" } }
```

### Erreurs métier

Toujours via `throw new HttpError(status, 'CODE', 'message')` :
- `400` — requête invalide
- `401` — non authentifié
- `403` — non autorisé (rôle insuffisant)
- `404` — ressource introuvable
- `409` — conflit (doublon, contrainte FK)
- `422` — validation échouée (score hors-borne, etc.)

### Prisma

- **Select explicite** — jamais `findMany()` sans `select`
- **Jamais exposer `password`** dans les réponses
- **Soft delete** via `deleted_at` sur User, Beer, Rating
- **Contraintes FK** : P2003/P2014 → HttpError 409

### Nommage

- Services : `findAll*()`, `find*ById()`, `create*()`, `update*()`, `delete*()`/`softDelete*()`
- Controllers : `get*()`, `post*()`, `put*()`/`patch*()`, `delete*Handler()`
- Routes : fichier = `<domaine>.routes.ts`
- Tests : `<domaine>.service.test.ts` / `<domaine>.integration.test.ts`

### Git

- Branches : `feature/<nom>`, `fix/<nom>`, `chore/<nom>`
- Commits : messages en français ou anglais, impératif, concis

---

## 6. Décisions techniques

| Sujet | Décision | Justification |
| --- | --- | --- |
| Algo recommandation | Produit scalaire normalisé | Demandé par le PO — reflète mieux la compatibilité que la distance |
| Authentification | JWT access (1h) + refresh (7j) | Sécurité + UX mobile (pas de re-login constant) |
| Hash passwords | bcrypt 12 rounds | Standard industrie, résistant au brute-force |
| Tests | Vitest + même DB + rollback | Simple, pas de DB séparée à maintenir |
| Pagination | Generic helper + Zod validation | Réutilisable sur tous les endpoints |
| Soft delete | User, Beer, Rating uniquement | Données sensibles ou avec historique — les tables de référence (Brewery, Category, Criterion) utilisent un hard delete avec protection FK |
| Rate limiting | Login uniquement (5/min/IP) | Protection brute-force sans complexité sur les autres routes |
| CI/CD | GitHub Actions + service MySQL | Environnement identique à la prod |
| Frontend state | Zustand | Léger, compatible React Native, déjà installé |
| Token storage mobile | expo-secure-store | Chiffré sur le device, recommandé par Expo |
