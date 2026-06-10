# Zythonomie

> Application mobile de découverte et de recommandation de bières artisanales.

L'utilisateur répond à un quiz de préférences gustatives (amertume, acidité, corps, etc.) et reçoit des recommandations personnalisées calculées par produit scalaire entre son profil de critères et les caractéristiques de chaque bière.

---

## Table des matières

1. [Stack technique](#stack-technique)
2. [Architecture du projet](#architecture-du-projet)
3. [Prérequis](#prérequis)
4. [Installation & démarrage](#installation--démarrage)
5. [Variables d'environnement](#variables-denvironnement)
6. [Modèle de données](#modèle-de-données)
7. [API REST — Endpoints](#api-rest--endpoints)
8. [Authentification](#authentification)
9. [Conventions de réponse](#conventions-de-réponse)
10. [Tests](#tests)
11. [État du MVP backend](#état-du-mvp-backend)
12. [Roadmap](#roadmap)

---

## Stack technique

| Couche            | Technologie                                           |
| ----------------- | ----------------------------------------------------- |
| Runtime           | Node.js 20+                                           |
| Framework         | Express 5 · TypeScript 6                              |
| ORM               | Prisma 6                                              |
| Base de données   | MySQL 8                                               |
| Validation        | Zod 4                                                 |
| Auth              | JWT (access token 15 min) + Refresh token (7 j)       |
| Sécurité          | bcrypt · Helmet · express-rate-limit · CORS           |
| Documentation API | Swagger UI (OpenAPI 3.0) — `/api-docs`                |
| Tests             | Vitest 4 · Supertest · @faker-js/faker                |
| Logs              | Morgan                                                |
| Frontend          | React Native · Expo · Zustand · Axios *(en cours)*    |

---

## Architecture du projet

```
Zythonomie/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 17 modèles, enums Role & QuizzSessionStatus
│   │   ├── seed.ts                # Dataset de développement
│   │   └── migrations/            # Historique des migrations Prisma
│   ├── src/
│   │   ├── app.ts                 # Montage Express — middlewares + routes
│   │   ├── server.ts              # Bootstrap HTTP
│   │   ├── controllers/           # Handlers HTTP (mapping request → service)
│   │   ├── services/              # Logique métier + accès Prisma
│   │   ├── routes/                # Déclaration des endpoints + schémas Zod
│   │   ├── middleware/
│   │   │   ├── authenticate.ts    # Vérification JWT Bearer
│   │   │   ├── require-admin.ts   # Garde rôle ADMIN
│   │   │   ├── require-owner-or-admin.ts  # Garde propriétaire ou ADMIN
│   │   │   ├── validate.ts        # Validation Zod (body / params / query)
│   │   │   └── error-handler.ts   # Capture globale des erreurs
│   │   ├── lib/
│   │   │   ├── prisma.ts          # Singleton PrismaClient
│   │   │   ├── http-error.ts      # Classe HttpError(status, code, message)
│   │   │   ├── response.ts        # Helpers sendSuccess / sendError
│   │   │   ├── paginate.ts        # Helper pagination
│   │   │   └── swagger.ts         # Configuration Swagger/OpenAPI
│   │   └── types/
│   │       └── api.ts             # Type ApiResponse<T>
│   └── tests/
│       ├── unit/                  # Tests unitaires services
│       ├── integration/           # Tests d'intégration HTTP (Supertest)
│       └── helpers/               # Factories & utilitaires de test
├── frontend/                      # React Native / Expo (squelette)
└── docs/
    └── PROJECT.md                 # Plan de projet détaillé
```

---

## Prérequis

- **Node.js** ≥ 20
- **MySQL** 8 (instance locale ou Docker)
- **npm** ≥ 10

---

## Installation & démarrage

```bash
# 1. Cloner le dépôt
git clone <repo-url>
cd Zythonomie/backend

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement (voir section suivante)
cp .env.example .env

# 4. Appliquer les migrations et générer le client Prisma
npm run prisma:migrate
npm run prisma:generate

# 5. Peupler la base avec les données de développement
npm run prisma:seed

# 6. Lancer le serveur en développement
npm run dev
```

Le serveur démarre sur `http://localhost:3000` par défaut.  
La documentation Swagger est accessible sur `http://localhost:3000/api-docs`.

### Scripts disponibles

| Commande                  | Description                                   |
| ------------------------- | --------------------------------------------- |
| `npm run dev`             | Démarrage en mode watch (nodemon + ts-node)   |
| `npm run build`           | Compilation TypeScript → `dist/`              |
| `npm start`               | Démarrage du build de production              |
| `npm test`                | Exécution des tests (vitest run)              |
| `npm run test:watch`      | Tests en mode watch                           |
| `npm run test:coverage`   | Rapport de couverture (v8)                    |
| `npm run prisma:migrate`  | Création et application d'une migration       |
| `npm run prisma:seed`     | Alimentation de la base de développement      |
| `npm run prisma:studio`   | Interface Prisma Studio                       |

---

## Variables d'environnement

Créer un fichier `.env` à la racine de `backend/` :

```env
# Base de données
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/zythonomie"

# Serveur
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET="votre_secret_access_token"
JWT_REFRESH_SECRET="votre_secret_refresh_token"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

---

## Modèle de données

Le schéma Prisma définit **17 modèles** organisés en 6 domaines :

```
AUTH          RefreshToken
USER          User
BEER          Beer · Brewery · BeerByBrewery · BeerByCategory
CATALOG       Category · Pairing
RATING        Rating
CRITERIA      Criterion · UserCriteria · BeerCriteria
QUIZ          Quizz · QuizzQuestion · QuestionChoice · QuizzSession · QuizzSessionAnswer
RECOMMENDATION  BeerRecommendedUser
```

### Décisions métier clés

| Règle | Détail |
|---|---|
| Soft delete | `deleted_at` sur `User`, `Beer`, `Rating` — aucune suppression physique de contenu |
| Unicité note | Une seule note active par couple `(user, beer)` — contrôlée au niveau service |
| Anonymisation | À la suppression d'un compte, l'e-mail est anonymisé (`deleted_<id>@deleted.invalid`) pour conserver la contrainte unique |
| Rôles | `USER` (défaut) et `ADMIN` via enum Prisma |

---

## API REST — Endpoints

Tous les endpoints (sauf `/health` et `/api/auth`) requièrent un **Bearer token JWT** dans l'en-tête `Authorization`.

### Auth — `/api/auth`

| Méthode | Chemin                  | Accès  | Description                              |
| ------- | ----------------------- | ------ | ---------------------------------------- |
| `POST`  | `/api/auth/register`    | Public | Inscription (hachage bcrypt automatique) |
| `POST`  | `/api/auth/login`       | Public | Connexion — retourne access + refresh token (rate-limité : 5 req/min) |
| `POST`  | `/api/auth/refresh`     | Public | Renouvellement de l'access token         |
| `GET`   | `/api/auth/me`          | Auth   | Profil de l'utilisateur connecté         |
| `POST`  | `/api/auth/logout`      | Auth   | Révocation du refresh token              |

### Utilisateurs — `/api/users`

| Méthode  | Chemin              | Accès          | Description                    |
| -------- | ------------------- | -------------- | ------------------------------ |
| `GET`    | `/api/users`        | ADMIN          | Liste paginée des utilisateurs |
| `POST`   | `/api/users`        | ADMIN          | Création d'un utilisateur      |
| `GET`    | `/api/users/:id`    | Owner ou ADMIN | Détail d'un utilisateur        |
| `PUT`    | `/api/users/:id`    | Owner ou ADMIN | Mise à jour partielle          |
| `DELETE` | `/api/users/:id`    | Owner ou ADMIN | Soft delete + anonymisation    |

### Bières — `/api/beers`

| Méthode  | Chemin                                   | Accès  | Description                                   |
| -------- | ---------------------------------------- | ------ | --------------------------------------------- |
| `GET`    | `/api/beers`                             | Auth   | Liste paginée (filtres : `alcool`, `breweryId`, `categoryId`) |
| `POST`   | `/api/beers`                             | ADMIN  | Création avec liaisons brewery/category        |
| `GET`    | `/api/beers/:id`                         | Auth   | Détail d'une bière                            |
| `PUT`    | `/api/beers/:id`                         | ADMIN  | Mise à jour partielle                         |
| `DELETE` | `/api/beers/:id`                         | ADMIN  | Soft delete                                   |
| `POST`   | `/api/beers/:id/breweries/:breweryId`    | ADMIN  | Associer une brasserie                        |
| `DELETE` | `/api/beers/:id/breweries/:breweryId`    | ADMIN  | Retirer une brasserie                         |
| `POST`   | `/api/beers/:id/categories/:categoryId`  | ADMIN  | Associer une catégorie                        |
| `DELETE` | `/api/beers/:id/categories/:categoryId`  | ADMIN  | Retirer une catégorie                         |

### Brasseries — `/api/breweries`

| Méthode  | Chemin                  | Accès  | Description            |
| -------- | ----------------------- | ------ | ---------------------- |
| `GET`    | `/api/breweries`        | Auth   | Liste paginée          |
| `POST`   | `/api/breweries`        | ADMIN  | Création               |
| `GET`    | `/api/breweries/:id`    | Auth   | Détail                 |
| `PUT`    | `/api/breweries/:id`    | ADMIN  | Mise à jour partielle  |
| `DELETE` | `/api/breweries/:id`    | ADMIN  | Suppression physique   |

### Catégories — `/api/categories`

| Méthode  | Chemin                  | Accès  | Description                              |
| -------- | ----------------------- | ------ | ---------------------------------------- |
| `GET`    | `/api/categories`       | Auth   | Liste hiérarchique (auto-référence)      |
| `POST`   | `/api/categories`       | ADMIN  | Création                                 |
| `GET`    | `/api/categories/:id`   | Auth   | Détail                                   |
| `PUT`    | `/api/categories/:id`   | ADMIN  | Mise à jour partielle                    |
| `DELETE` | `/api/categories/:id`   | ADMIN  | Suppression                              |

### Accords mets-bières — `/api/pairings`

| Méthode  | Chemin              | Accès  | Description  |
| -------- | ------------------- | ------ | ------------ |
| `GET`    | `/api/pairings`     | Auth   | Liste        |
| `POST`   | `/api/pairings`     | ADMIN  | Création     |
| `GET`    | `/api/pairings/:id` | Auth   | Détail       |
| `PUT`    | `/api/pairings/:id` | ADMIN  | Mise à jour  |
| `DELETE` | `/api/pairings/:id` | ADMIN  | Suppression  |

### Notes — `/api/ratings`

| Méthode  | Chemin               | Accès          | Description                                         |
| -------- | -------------------- | -------------- | --------------------------------------------------- |
| `GET`    | `/api/ratings`       | Auth           | Liste des notes (filtres : `userId`, `beerId`)      |
| `POST`   | `/api/ratings`       | Auth           | Création (1 seule note active par couple user/beer) |
| `GET`    | `/api/ratings/:id`   | Auth           | Détail                                              |
| `PUT`    | `/api/ratings/:id`   | Owner ou ADMIN | Mise à jour                                         |
| `DELETE` | `/api/ratings/:id`   | Owner ou ADMIN | Soft delete                                         |

### Critères — `/api/criteria`

| Méthode  | Chemin               | Accès  | Description                                  |
| -------- | -------------------- | ------ | -------------------------------------------- |
| `GET`    | `/api/criteria`      | Auth   | Liste de tous les critères (public)          |
| `POST`   | `/api/criteria`      | ADMIN  | Création                                     |
| `GET`    | `/api/criteria/:id`  | Auth   | Détail                                       |
| `PUT`    | `/api/criteria/:id`  | ADMIN  | Mise à jour                                  |
| `DELETE` | `/api/criteria/:id`  | ADMIN  | Suppression (bloqué si critère en usage)     |

### Critères utilisateur — `/api/user-criteria`

| Méthode | Chemin                                       | Accès          | Description                          |
| ------- | -------------------------------------------- | -------------- | ------------------------------------ |
| `GET`   | `/api/user-criteria/:userId`                 | Owner ou ADMIN | Profil de critères d'un utilisateur  |
| `PUT`   | `/api/user-criteria/:userId/:criterionId`    | Owner ou ADMIN | Upsert d'un score (0–5)              |

### Critères bière — `/api/beer-criteria`

| Méthode | Chemin                                      | Accès  | Description                    |
| ------- | ------------------------------------------- | ------ | ------------------------------ |
| `GET`   | `/api/beer-criteria/:beerId`                | Auth   | Critères d'une bière           |
| `PUT`   | `/api/beer-criteria/:beerId/:criterionId`   | ADMIN  | Upsert d'un score admin (0–5)  |

### Quiz — `/api/quizzes`

| Méthode  | Chemin              | Accès  | Description                              |
| -------- | ------------------- | ------ | ---------------------------------------- |
| `GET`    | `/api/quizzes`      | Auth   | Liste des quiz                           |
| `POST`   | `/api/quizzes`      | ADMIN  | Création avec questions et choix imbriqués |
| `GET`    | `/api/quizzes/:id`  | Auth   | Détail complet (questions + choix)       |

### Questions — `/api/quizz-questions`

| Méthode  | Chemin                       | Accès  | Description                                     |
| -------- | ---------------------------- | ------ | ----------------------------------------------- |
| `GET`    | `/api/quizz-questions`       | Auth   | Liste                                           |
| `POST`   | `/api/quizz-questions`       | ADMIN  | Création                                        |
| `GET`    | `/api/quizz-questions/:id`   | Auth   | Détail                                          |
| `PUT`    | `/api/quizz-questions/:id`   | ADMIN  | Mise à jour                                     |
| `DELETE` | `/api/quizz-questions/:id`   | ADMIN  | Suppression (bloqué si des réponses existent)   |

### Choix de réponse — `/api/question-choices`

| Méthode  | Chemin                        | Accès  | Description                                     |
| -------- | ----------------------------- | ------ | ----------------------------------------------- |
| `GET`    | `/api/question-choices`       | Auth   | Liste                                           |
| `POST`   | `/api/question-choices`       | ADMIN  | Création                                        |
| `GET`    | `/api/question-choices/:id`   | Auth   | Détail                                          |
| `PUT`    | `/api/question-choices/:id`   | ADMIN  | Mise à jour                                     |
| `DELETE` | `/api/question-choices/:id`   | ADMIN  | Suppression (bloqué si des réponses existent)   |

### Sessions de quiz — `/api/quizz-sessions`

| Méthode | Chemin                             | Accès | Description                                                       |
| ------- | ---------------------------------- | ----- | ----------------------------------------------------------------- |
| `POST`  | `/api/quizz-sessions`              | Auth  | Démarrer une session (`status: IN_PROGRESS`)                      |
| `GET`   | `/api/quizz-sessions/:id`          | Auth  | Progression en cours (questions répondues / total)                |
| `POST`  | `/api/quizz-sessions/:id/answers`  | Auth  | Soumettre une réponse question par question                       |
| `PUT`   | `/api/quizz-sessions/:id/complete` | Auth  | Clôturer la session → upsert automatique des `UserCriteria`       |

Le passage à `COMPLETED` déclenche le calcul de la **moyenne pondérée** des `note_value` des choix sélectionnés pour chaque critère, puis un upsert en base.

### Recommandations — `/api/recommendations`

| Méthode | Chemin                                  | Accès          | Description                                                   |
| ------- | --------------------------------------- | -------------- | ------------------------------------------------------------- |
| `GET`   | `/api/recommendations/user/:userId`     | Owner ou ADMIN | Recommandations triées par score décroissant                  |
| `POST`  | `/api/recommendations/refresh/:userId`  | Owner ou ADMIN | Recalcul complet (produit scalaire normalisé) + persistance   |

**Algorithme** : pour chaque bière active, calcul de `Σ(score_user_i × score_beer_i) / nb_critères_communs`. Les bières sans critère commun reçoivent un score de 0. Les résultats sont persistés dans `BeerRecommendedUser` via transaction atomique (delete-all + insert).

### Health — `/health`

| Méthode | Chemin    | Description                    |
| ------- | --------- | ------------------------------ |
| `GET`   | `/health` | Vérification de l'état du service |

---

## Authentification

Le système utilise une paire **access token / refresh token** :

- **Access token** : JWT signé avec `JWT_SECRET`, durée 15 minutes, transporté en `Authorization: Bearer <token>`.
- **Refresh token** : UUID stocké en base (`refresh_token`), durée 7 jours, révocable à la déconnexion.
- **Rate limiting** : l'endpoint `/api/auth/login` est limité à **5 requêtes par minute** par IP.
- Les mots de passe sont hachés avec **bcrypt** (12 rounds) à l'inscription et à la mise à jour.

### Flux d'authentification

```
POST /api/auth/register  → création compte (mot de passe haché)
POST /api/auth/login     → { accessToken, refreshToken }
  ↓  (access token expiré)
POST /api/auth/refresh   → { accessToken }  (refresh token valide requis)
POST /api/auth/logout    → révocation du refresh token
```

---

## Conventions de réponse

Toutes les réponses suivent le type `ApiResponse<T>` :

```typescript
// Succès
{ "success": true, "data": <payload> }

// Erreur
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }

// Erreur de validation (422)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation échouée",
    "details": [{ "field": "mail", "message": "Invalid email" }]
  }
}
```

### Codes d'erreur métier

| Code                   | Status HTTP | Signification                             |
| ---------------------- | ----------- | ----------------------------------------- |
| `UNAUTHORIZED`         | 401         | Token absent ou invalide                  |
| `TOKEN_EXPIRED`        | 401         | Access token expiré                       |
| `FORBIDDEN`            | 403         | Accès refusé (rôle insuffisant)           |
| `NOT_FOUND`            | 404         | Ressource introuvable                     |
| `CONFLICT`             | 409         | Violation de contrainte d'unicité         |
| `VALIDATION_ERROR`     | 422         | Données de la requête invalides           |
| `TOO_MANY_REQUESTS`    | 429         | Limite de débit dépassée                  |

---

## Tests

```bash
# Lancer tous les tests
npm test

# Mode watch
npm run test:watch

# Rapport de couverture HTML + JSON (v8)
npm run test:coverage
```

Les tests d'intégration utilisent la **même base de données** avec des **transactions rollback** pour isoler chaque test sans réinitialiser le schéma entre les suites.

### Couverture actuelle

| Métrique   | Score    |
|------------|----------|
| Statements | **84,37%** |
| Branches   | **70,71%** |
| Functions  | **87,71%** |
| Lines      | **84,44%** |

**Tests** : **260 tests passants** (27 fichiers)
- **Intégration** : 14 fichiers (140 tests)
- **Unitaires** : 13 fichiers (120 tests)

---

## État du MVP backend

### Modules implémentés

| Module            | Service | Controller | Routes | Tests | Particularités                                         |
| ----------------- | :-----: | :--------: | :----: | :---: | ------------------------------------------------------ |
| Auth              |    ✓    |     ✓      |   ✓    |  ✓   | Register · Login · Refresh · Logout · /me             |
| User              |    ✓    |     ✓      |   ✓    |  ✓   | CRUD · soft delete · anonymisation mail               |
| Beer              |    ✓    |     ✓      |   ✓    |  ✓   | CRUD · soft delete · filtres · liaisons brewery/category |
| Brewery           |    ✓    |     ✓      |   ✓    |  ✓   | CRUD complet                                           |
| Category          |    ✓    |     ✓      |   ✓    |  ✓   | CRUD · hiérarchie auto-référente                       |
| Pairing           |    ✓    |     ✓      |   ✓    |  ✓   | CRUD complet                                           |
| Rating            |    ✓    |     ✓      |   ✓    |  ✓   | CRUD · soft delete · règle 1 note active/couple        |
| Criterion         |    ✓    |     ✓      |   ✓    |  ✓   | CRUD · DELETE bloqué si en usage                       |
| UserCriteria      |    ✓    |     ✓      |   ✓    |  ✓   | Upsert · score borné [0, 5]                            |
| BeerCriteria      |    ✓    |     ✓      |   ✓    |  ✓   | Upsert admin · score borné [0, 5]                      |
| Quiz              |    ✓    |     ✓      |   ✓    |  ✓   | CRUD · création imbriquée questions + choix            |
| QuizzQuestion     |    ✓    |     ✓      |   ✓    |  ✓   | CRUD admin · DELETE bloqué si réponses enregistrées    |
| QuestionChoice    |    ✓    |     ✓      |   ✓    |  ✓   | CRUD admin · DELETE bloqué si réponses enregistrées    |
| QuizzSession      |    ✓    |     ✓      |   ✓    |  ✓   | Start → answer → complete · auto-upsert UserCriteria   |
| Recommendation    |    ✓    |     ✓      |   ✓    |  ✓   | GET + refresh · produit scalaire normalisé             |

### Fondations techniques

- **Sécurité** : Helmet, CORS, rate-limiting sur `/login`, bcrypt pour les mots de passe
- **Validation** : middleware générique `validate(schema, source)` — Zod 4 sur body, params et query
- **Erreurs uniformes** : `HttpError(status, code, message)` capturée globalement par `errorHandler`
- **Réponses uniformes** : `sendSuccess(res, status, data)` sur tous les endpoints
- **Pagination** : helper `paginate()` sur tous les endpoints de liste
- **Prisma select explicite** : aucun champ `password` exposé dans les réponses
- **Documentation API** : Swagger UI auto-générée depuis les annotations JSDoc des routes
- **Seed de développement** : 5 utilisateurs, 8 bières, 25 critères, 1 quiz complet avec sessions

### Ce qui reste à faire

| Priorité | Sujet                                                          | Statut      |
| -------- | -------------------------------------------------------------- | ----------- |
| Haute    | Pagination sur les endpoints restants                          | À faire     |
| Moyenne  | Frontend React Native (Expo) — navigation + écrans            | À faire     |
| Basse    | Pipeline CI/CD GitHub Actions                                  | À faire     |

---

## Roadmap

| Phase | Description                          | Statut      |
| ----- | ------------------------------------ | ----------- |
| 1     | Recommandation complète (algo + flow)| ✅ Terminé  |
| 2     | Tests automatisés (Vitest)           | ✅ Terminé  |
| 3     | Authentification JWT                 | ✅ Terminé  |
| 4     | Rôles & permissions (ADMIN / USER)   | ✅ Terminé  |
| 5     | Pagination                           | ✅ Terminé  |
| 6     | Sécurité & qualité (Helmet, rate-limit, bcrypt) | ✅ Terminé |
| 7     | Documentation API (Swagger)          | ✅ Terminé  |
| 8     | CI/CD GitHub Actions                 | ⏳ À faire  |
| 9     | Frontend React Native / Expo         | ⏳ À faire  |
| 10    | README & onboarding                  | ✅ Terminé  |

---

## Licence

ISC
