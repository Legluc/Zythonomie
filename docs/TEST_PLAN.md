# Plan de tests — Zythonomie Backend

> **Version** : 1.1  
> **Date** : 12 mai 2026  
> **Périmètre** : API REST backend (`backend/`) + parcours E2E mobiles projetés  
> **Framework** : Vitest 4 · Supertest · @faker-js/faker · Detox *(projeté)* · Maestro *(projeté)*

---

## Table des matières

1. [Objectifs](#1-objectifs)
2. [Architecture des tests](#2-architecture-des-tests)
3. [Environnement de tests](#3-environnement-de-tests)
4. [Couverture actuelle](#4-couverture-actuelle)
5. [Cas de tests par module](#5-cas-de-tests-par-module)
   - [Auth](#51-auth)
   - [User](#52-user)
   - [Beer](#53-beer)
   - [Brewery](#54-brewery)
   - [Category](#55-category)
   - [Pairing](#56-pairing)
   - [Rating](#57-rating)
   - [Criterion](#58-criterion)
   - [UserCriteria](#59-user-criteria)
   - [BeerCriteria](#510-beer-criteria)
   - [Quiz](#511-quiz)
   - [QuizzQuestion](#512-quizz-question)
   - [QuestionChoice](#513-question-choice)
   - [QuizzSession](#514-quizz-session)
   - [Recommendation](#515-recommendation)
   - [Transversaux](#516-tests-transversaux)
   - [E2E — Parcours mobiles](#517-tests-e2e--parcours-mobiles)
6. [Tests de sécurité](#6-tests-de-sécurité)
7. [Cas limites et non-régressions](#7-cas-limites-et-non-régressions)
8. [Métriques cibles](#8-métriques-cibles)
9. [Tests manquants — priorisation](#9-tests-manquants--priorisation)

---

## 1. Objectifs

| Objectif | Détail |
|---|---|
| **Fiabilité métier** | Vérifier que chaque règle métier est respectée (1 note/couple, soft delete, upsert UserCriteria, algorithme de recommandation) |
| **Non-régression** | S'assurer qu'un correctif ou une évolution ne casse pas les fonctionnalités existantes |
| **Sécurité** | Valider les mécanismes d'authentification, de contrôle d'accès et la protection des données sensibles |
| **Conformité API** | Garantir que tous les endpoints respectent le contrat `ApiResponse<T>` et retournent les codes HTTP corrects |

---

## 2. Architecture des tests

Le projet adopte une pyramide de tests à trois niveaux :

```
    ┌───────────────────────────────────────┐
    │           Tests E2E                    │  Parcours utilisateur complets (mobile)
    │           Maestro / Detox              │
    ├───────────────────────────────────────┤
    │       Tests d'intégration              │  HTTP via Supertest (routes complètes)
    │          (Supertest)                   │
    ├───────────────────────────────────────┤
    │        Tests unitaires                 │  Services isolés (Vitest)
    │          (Vitest)                      │
    └───────────────────────────────────────┘
```

### 2.1 Tests unitaires — Logique métier pure

**Portée** : Services (`src/services/`), logique métier isolée  
**Framework** : Vitest 4 · Factories · `withTestTransaction`  
**Isolation** : Transaction Prisma rollback  
**Exécution** : `npm test`

| Objectif | Détail |
|---|---|
| **Vérifier la logique métier** | Chaque service respecte les règles : soft delete, contraintes d'unicité, calculs (produit scalaire), validations |
| **Valider les codes d'erreur** | HttpError lancées avec le bon status/code (404 USER_NOT_FOUND, 409 CONFLICT, 422 VALIDATION_ERROR, etc.) |
| **Couvrir les cas limites** | 0 critères, utilisateur soft-deleted, doublons, scores hors-borne |
| **Approche boîte blanche** | Accès direct aux fonctions du service, contrôle total du contexte |

### 2.2 Tests d'intégration — Chaîne HTTP complète

**Portée** : Routes HTTP, middlewares, validation Zod, controllers, services, base de données  
**Framework** : Vitest · Supertest · Factories · `withTestTransaction`  
**Isolation** : Transaction Prisma rollback  
**Exécution** : `npm test`

| Objectif | Détail |
|---|---|
| **Vérifier le contrat API** | Tous les endpoints retournent `ApiResponse<T>` avec le bon status HTTP (201, 403, 404, 422, etc.) |
| **Valider les middlewares** | Authentification JWT (401/Bearer), autorisation RBAC (403 USER/ADMIN), validation Zod (400) |
| **Tester les comportements bout-en-bout** | Flow complet : register → login → quiz → complete → refresh → recommend |
| **Approche boîte noire** | Requêtes HTTP réalistes via Supertest, assertions sur réponse JSON |

### 2.3 Tests E2E — Parcours utilisateur mobiles

**Portée** : Application React Native · API REST · Base de données (flux complet)  
**Framework** : Maestro (YAML déclaratif) · Detox (grey-box, optionnel)  
**Exécution** : Simulateur iOS/Android, Maestro Cloud (CI)  
**Démarrage** : Conditionné à Phase 9 (frontend React Native finalisé)

| Objectif | Détail |
|---|---|
| **Vérifier les flux métier utilisateur** | Inscription → login → quiz → recommandations → notation → déconnexion |
| **Valider l'intégration app-to-API** | Les écrans mobiles consomment l'API, affichent les données, gèrent les erreurs |
| **Tester les cas d'erreur UI** | Credentials invalides (message d'erreur), accès non authentifié (redirection), réseau down |
| **Approche E2E** | Scénarios utilisateur réalistes, pas de mocking réseau |

**Outils E2E disponibles :**

| Outil | Type | Couverture |
|---|---|---|
| Maestro | Black-box, YAML déclaratif, cross-platform | iOS, Android, web Expo (si activé) |
| Detox | Grey-box, React Native natif, synchronisation JS | iOS, Android, comportements natifs avancés |

### Ce qui n'est pas couvert

- Tests de performance / charge
- Tests E2E frontend (priorité dev front)
- Tests de contrats d'API externes (aucune dépendance externe)

---

## 3. Environnement de tests

### Configuration

| Élément | Valeur |
|---|---|
| Fichier de config | `backend/vitest.config.ts` |
| Base de données | MySQL de développement (même instance) |
| Isolation | Transaction Prisma rollback (`withTestTransaction`) |
| Parallélisme | Désactivé (`fileParallelism: false`) — évite les conflits de transactions |
| Timeout test | 30 000 ms |
| Timeout hook | 30 000 ms |

### Variables d'environnement (tests)

Les valeurs suivantes sont injectées automatiquement dans les `beforeAll` de chaque suite si absentes :

```
JWT_SECRET=test-jwt-secret
JWT_REFRESH_SECRET=test-jwt-refresh-secret
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
```

### Utilitaires disponibles (`tests/helpers/`)

| Fichier | Rôle |
|---|---|
| `with-transaction.ts` | `withTestTransaction(fn)` — ouvre une transaction Prisma, exécute le test, rollback systématique |
| `factories.ts` | `createTestUser`, `createTestBeer`, `createTestBrewery`, `createTestCategory`, `createTestCriterion`, `createTestQuiz`, `createTestQuizWithQuestions` |
| `auth-helpers.ts` | `userToken(id)`, `adminToken()` — génère des JWT signés pour les tests d'intégration |
| `setup.ts` | Initialisation globale avant la suite |

### Commandes

```bash
npm test                  # Exécution de tous les tests (vitest run)
npm run test:watch        # Mode watch
npm run test:coverage     # Rapport de couverture HTML + JSON (v8)
```

---

## 4. Couverture actuelle

> Rapport généré le 15 mai 2026 — `npm run test:coverage`

| Métrique   | Score    | Détail      | Évolution |
|------------|----------|-------------|-----------|
| Statements | **84,37%** | 740 / 876 | +28,64% |
| Branches   | **70,71%** | 206 / 291 | +15,24% |
| Functions  | **87,71%** | 180 / 205 | +43,81% |
| Lines      | **84,44%** | 731 / 866 | +28,68% |

**Tests** : 260 tests passants (27 fichiers)
- **Intégration** : 14 fichiers (140 tests)
- **Unitaires** : 13 fichiers (120 tests)

**Couverture par zone** :
- Routes : 98.24% (exceptionnel)
- Lib : 100% (parfait)
- Middleware : 84.78% (bon)
- Controllers : 79.67% (bon, précédemment 0% pour 8 modules)
- Services : 79.54% (bon)

**Fichiers désormais couverts** : Tous les controllers et services d'intégration ont des tests.

---

## 5. Cas de tests par module

Légende : ✅ Implémenté · ❌ Manquant · ⚠️ Partiel

---

### 5.1 Auth

**Fichiers** : `tests/unit/auth.service.test.ts` · `tests/integration/auth.integration.test.ts`

#### Unitaires — `auth.service`

| ID | Cas | Statut |
|---|---|---|
| U-AUTH-01 | `register` — crée un utilisateur et retourne access + refresh token | ✅ |
| U-AUTH-02 | `register` — le mot de passe stocké est haché bcrypt (`$2b$`) | ✅ |
| U-AUTH-03 | `register` — 409 `USER_MAIL_CONFLICT` si email déjà utilisé | ✅ |
| U-AUTH-04 | `login` — retourne access + refresh token avec credentials valides | ✅ |
| U-AUTH-05 | `login` — payload du JWT contient `sub` (int) et `role` | ✅ |
| U-AUTH-06 | `login` — 401 `INVALID_CREDENTIALS` si mot de passe incorrect | ✅ |
| U-AUTH-07 | `login` — 401 `INVALID_CREDENTIALS` si email inconnu | ✅ |
| U-AUTH-08 | `refresh` — renouvelle l'access token avec un refresh token valide | ✅ |
| U-AUTH-09 | `refresh` — 401 si refresh token expiré ou révoqué | ✅ |
| U-AUTH-10 | `logout` — révoque le refresh token (ne peut plus être réutilisé) | ✅ |
| U-AUTH-11 | `logout` — 401 si refresh token déjà révoqué | ❌ |

#### Intégration — `/api/auth`

| ID | Cas | Statut |
|---|---|---|
| I-AUTH-01 | `POST /register` — 201 avec access + refresh token | ✅ |
| I-AUTH-02 | `POST /register` — 409 si email déjà utilisé | ✅ |
| I-AUTH-03 | `POST /register` — 400 si mot de passe < 8 caractères | ✅ |
| I-AUTH-04 | `POST /register` — 400 si email invalide | ✅ |
| I-AUTH-05 | `POST /login` — 200 avec tokens valides | ✅ |
| I-AUTH-06 | `POST /login` — 401 `INVALID_CREDENTIALS` si mot de passe incorrect | ✅ |
| I-AUTH-07 | `POST /login` — 401 si email inconnu | ✅ |
| I-AUTH-08 | `GET /me` — 200 avec profil si token valide | ✅ |
| I-AUTH-09 | `GET /me` — 401 sans token | ✅ |
| I-AUTH-10 | `GET /me` — 401 avec token invalide | ✅ |
| I-AUTH-11 | `POST /refresh` — 200 avec nouvel access token | ✅ |
| I-AUTH-12 | `POST /logout` — révoque le refresh token | ✅ |
| I-AUTH-13 | `POST /login` — 429 après 5 tentatives (rate-limit) | ❌ |

---

### 5.2 User

**Fichiers** : `tests/unit/user.service.test.ts`

#### Unitaires — `user.service`

| ID | Cas | Statut |
|---|---|---|
| U-USER-01 | `findAllUsers` — retourne les utilisateurs actifs | ✅ |
| U-USER-02 | `findUserById` — retourne l'utilisateur correct | ✅ |
| U-USER-03 | `findUserById` — 404 `USER_NOT_FOUND` si inexistant | ✅ |
| U-USER-04 | `createUser` — crée un utilisateur avec rôle USER par défaut | ✅ |
| U-USER-05 | `createUser` — 409 `USER_MAIL_CONFLICT` si email déjà utilisé | ✅ |
| U-USER-06 | `updateUser` — met à jour les champs fournis | ✅ |
| U-USER-07 | `softDeleteUser` — marque `deleted_at`, rend l'utilisateur invisible | ✅ |
| U-USER-08 | `softDeleteUser` — anonymise l'email (`deleted_<id>@deleted.invalid`) | ❌ |
| U-USER-09 | `findAllUsers` — exclut les utilisateurs soft-deleted | ❌ |

#### Intégration — `/api/users`

| ID | Cas | Statut |
|---|---|---|
| I-USER-01 | `GET /users` — 200 liste paginée (ADMIN) | ❌ |
| I-USER-02 | `GET /users` — 403 pour un USER | ❌ |
| I-USER-03 | `GET /users/:id` — 200 (propriétaire ou ADMIN) | ❌ |
| I-USER-04 | `GET /users/:id` — 403 si autre utilisateur | ❌ |
| I-USER-05 | `GET /users/:id` — 404 si inexistant | ❌ |
| I-USER-06 | `PUT /users/:id` — mise à jour partielle | ❌ |
| I-USER-07 | `PUT /users/:id` — impossible de s'auto-promouvoir ADMIN | ❌ |
| I-USER-08 | `DELETE /users/:id` — soft delete + anonymisation | ❌ |

---

### 5.3 Beer

**Fichiers** : `tests/unit/beer.service.test.ts` · `tests/integration/beers.integration.test.ts`

#### Unitaires — `beer.service`

| ID | Cas | Statut |
|---|---|---|
| U-BEER-01 | `findAllBeers`            — retourne les bières actives               | ✅ |
| U-BEER-02 | `findAllBeers`            — filtre par `alcool`                       | ✅ |
| U-BEER-03 | `findBeerById`            — retourne la bière correcte                | ✅ |
| U-BEER-04 | `findBeerById`            — 404 `BEER_NOT_FOUND` si inexistante       | ✅ |
| U-BEER-05 | `createBeer`              — crée avec liaisons brewery et category    | ✅ |
| U-BEER-06 | `updateBeer`              — met à jour les champs fournis             | ✅ |
| U-BEER-07 | `softDeleteBeer`          — marque `deleted_at`                       | ✅ |
| U-BEER-08 | `findAllBeers`            — exclut les bières soft-deleted            | ✅ |
| U-BEER-09 | `addBreweryToBeer`        — associe une brasserie                     | ✅ |
| U-BEER-10 | `removeBreweryFromBeer`   — retire une brasserie                      | ✅ |
| U-BEER-11 | `addCategoryToBeer`       — associe une catégorie                     | ✅ |
| U-BEER-12 | `findAllBeers`            — filtre par `breweryId`                    | ❌ |
| U-BEER-13 | `findAllBeers`            — filtre par `categoryId`                   | ❌ |

#### Intégration — `/api/beers`

| ID | Cas | Statut |
|---|---|---|
| I-BEER-01 | `GET /beers` — 200 liste paginée avec format `ApiResponse` | ✅ |
| I-BEER-02 | `POST /beers` — 201 création (ADMIN) | ✅ |
| I-BEER-03 | `GET /beers/:id` — 200 détail | ✅ |
| I-BEER-04 | `PUT /beers/:id` — 200 mise à jour (ADMIN) | ✅ |
| I-BEER-05 | `DELETE /beers/:id` — soft delete → 404 sur GET suivant | ✅ |
| I-BEER-06 | `GET /beers?alcool=true` — filtre correct | ✅ |
| I-BEER-07 | `POST /beers/:id/breweries` — liaison brasserie | ✅ |
| I-BEER-08 | `POST /beers/:id/categories` — liaison catégorie | ✅ |
| I-BEER-09 | `GET /beers/:id` — 404 si inexistante | ❌ |
| I-BEER-10 | `POST /beers` — 409 si EAN déjà utilisé | ❌ |
| I-BEER-11 | `DELETE /beers/:id` — 403 pour un USER | ❌ |

---

### 5.4 Brewery

**Fichiers** : aucun test existant

#### Unitaires — `brewery.service`

| ID | Cas | Statut |
|---|---|---|
| U-BREW-01 | `findAllBreweries` — retourne la liste | ❌ |
| U-BREW-02 | `findBreweryById` — retourne la brasserie correcte | ❌ |
| U-BREW-03 | `findBreweryById` — 404 si inexistante | ❌ |
| U-BREW-04 | `createBrewery` — crée et retourne | ❌ |
| U-BREW-05 | `createBrewery` — 409 si nom déjà utilisé | ❌ |
| U-BREW-06 | `updateBrewery` — met à jour les champs fournis | ❌ |
| U-BREW-07 | `deleteBrewery` — suppression physique | ❌ |

#### Intégration — `/api/breweries`

| ID | Cas | Statut |
|---|---|---|
| I-BREW-01 | `GET /breweries` — 200 liste paginée | ❌ |
| I-BREW-02 | `GET /breweries` — 401 sans token | ❌ |
| I-BREW-03 | `POST /breweries` — 201 (ADMIN) | ❌ |
| I-BREW-04 | `POST /breweries` — 403 pour un USER | ❌ |
| I-BREW-05 | `GET /breweries/:id` — 200 détail | ❌ |
| I-BREW-06 | `GET /breweries/:id` — 404 si inexistante | ❌ |
| I-BREW-07 | `PUT /breweries/:id` — 200 mise à jour (ADMIN) | ❌ |
| I-BREW-08 | `DELETE /breweries/:id` — 200 suppression (ADMIN) | ❌ |

---

### 5.5 Category

**Fichiers** : aucun test existant

#### Unitaires — `category.service`

| ID | Cas | Statut |
|---|---|---|
| U-CAT-01 | `findAllCategories` — retourne la liste | ❌ |
| U-CAT-02 | `findCategoryById` — retourne la catégorie correcte | ❌ |
| U-CAT-03 | `findCategoryById` — 404 si inexistante | ❌ |
| U-CAT-04 | `createCategory` — crée avec `parent_id` optionnel | ❌ |
| U-CAT-05 | `updateCategory` — met à jour les champs fournis | ❌ |
| U-CAT-06 | `deleteCategory` — suppression | ❌ |

#### Intégration — `/api/categories`

| ID | Cas | Statut |
|---|---|---|
| I-CAT-01 | `GET /categories` — 200 liste | ❌ |
| I-CAT-02 | `GET /categories` — 401 sans token | ❌ |
| I-CAT-03 | `POST /categories` — 201 (ADMIN) | ❌ |
| I-CAT-04 | `POST /categories` — 403 pour un USER | ❌ |
| I-CAT-05 | `GET /categories/:id` — 200 détail | ❌ |
| I-CAT-06 | `GET /categories/:id` — 404 si inexistante | ❌ |
| I-CAT-07 | `PUT /categories/:id` — 200 mise à jour | ❌ |
| I-CAT-08 | `DELETE /categories/:id` — 200 suppression | ❌ |

---

### 5.6 Pairing

**Fichiers** : aucun test existant

#### Unitaires — `pairing.service`

| ID | Cas | Statut |
|---|---|---|
| U-PAIR-01 | `findAllPairings` — retourne la liste | ❌ |
| U-PAIR-02 | `findPairingById` — retourne le pairing correct | ❌ |
| U-PAIR-03 | `findPairingById` — 404 si inexistant | ❌ |
| U-PAIR-04 | `createPairing` — crée et retourne | ❌ |
| U-PAIR-05 | `updatePairing` — met à jour les champs fournis | ❌ |
| U-PAIR-06 | `deletePairing` — suppression | ❌ |

#### Intégration — `/api/pairings`

| ID | Cas | Statut |
|---|---|---|
| I-PAIR-01 | `GET /pairings` — 200 liste | ❌ |
| I-PAIR-02 | `POST /pairings` — 201 (ADMIN) | ❌ |
| I-PAIR-03 | `POST /pairings` — 403 pour un USER | ❌ |
| I-PAIR-04 | `GET /pairings/:id` — 200 détail | ❌ |
| I-PAIR-05 | `GET /pairings/:id` — 404 si inexistant | ❌ |
| I-PAIR-06 | `PUT /pairings/:id` — 200 mise à jour | ❌ |
| I-PAIR-07 | `DELETE /pairings/:id` — 200 suppression | ❌ |

---

### 5.7 Rating

**Fichiers** : `tests/unit/rating.service.test.ts` · `tests/integration/ratings.integration.test.ts`

#### Unitaires — `rating.service`

| ID | Cas | Statut |
|---|---|---|
| U-RATE-01 | `createRating` — crée une note | ✅ |
| U-RATE-02 | `createRating` — 409 `RATING_ALREADY_EXISTS` si couple user-beer déjà noté | ✅ |
| U-RATE-03 | `findRatingsByBeer` — retourne les notes d'une bière | ✅ |
| U-RATE-04 | `updateRating` — met à jour une note | ✅ |
| U-RATE-05 | `softDeleteRating` — marque `deleted_at` | ✅ |
| U-RATE-06 | `createRating` — bière soft-deleted → 404 | ❌ |
| U-RATE-07 | `createRating` — utilisateur soft-deleted → 404 | ❌ |

#### Intégration — `/api/ratings`

| ID | Cas | Statut |
|---|---|---|
| I-RATE-01 | `POST /ratings` — 201 création | ✅ |
| I-RATE-02 | `POST /ratings` — 409 pour couple user-beer en doublon | ✅ |
| I-RATE-03 | `DELETE /ratings/:id` — soft delete | ✅ |
| I-RATE-04 | `GET /ratings/beer/:beerId` — liste des notes d'une bière | ✅ |
| I-RATE-05 | `PUT /ratings/:id` — 403 si autre utilisateur | ❌ |
| I-RATE-06 | `DELETE /ratings/:id` — 403 si autre utilisateur | ❌ |

---

### 5.8 Criterion

**Fichiers** : `tests/unit/criterion.service.test.ts`

#### Unitaires — `criterion.service`

| ID | Cas | Statut |
|---|---|---|
| U-CRIT-01 | `findAllCriteria` — retourne la liste | ✅ |
| U-CRIT-02 | `findCriterionById` — retourne le critère correct | ✅ |
| U-CRIT-03 | `findCriterionById` — 404 `CRITERION_NOT_FOUND` si inexistant | ✅ |
| U-CRIT-04 | `createCriterion` — crée et retourne | ✅ |
| U-CRIT-05 | `updateCriterion` — met à jour les champs fournis | ✅ |
| U-CRIT-06 | `deleteCriterion` — suppression | ✅ |
| U-CRIT-07 | `deleteCriterion` — bloqué si critère lié à une question de quiz | ✅ |

#### Intégration — `/api/criteria`

| ID | Cas | Statut |
|---|---|---|
| I-CRIT-01 | `GET /criteria` — 200 liste | ❌ |
| I-CRIT-02 | `POST /criteria` — 201 (ADMIN) | ❌ |
| I-CRIT-03 | `POST /criteria` — 403 pour un USER | ❌ |
| I-CRIT-04 | `GET /criteria/:id` — 200 détail | ❌ |
| I-CRIT-05 | `GET /criteria/:id` — 404 si inexistant | ❌ |
| I-CRIT-06 | `DELETE /criteria/:id` — bloqué si en usage | ❌ |

---

### 5.9 User Criteria

**Fichiers** : `tests/unit/user-criteria.service.test.ts`

#### Unitaires — `user-criteria.service`

| ID | Cas | Statut |
|---|---|---|
| U-UC-01 | `upsertUserCriteria` — crée si absent | ✅ |
| U-UC-02 | `upsertUserCriteria` — met à jour si existant | ✅ |
| U-UC-03 | `upsertUserCriteria` — 422 si score hors borne [0, 5] | ✅ |
| U-UC-04 | `upsertUserCriteria` — 404 si utilisateur soft-deleted | ✅ |
| U-UC-05 | `getUserCriteria` — retourne les critères d'un utilisateur | ✅ |

#### Intégration — `/api/user-criteria`

| ID | Cas | Statut |
|---|---|---|
| I-UC-01 | `GET /user-criteria/:userId` — 200 (propriétaire) | ❌ |
| I-UC-02 | `GET /user-criteria/:userId` — 403 si autre utilisateur | ❌ |
| I-UC-03 | `PUT /user-criteria/:userId/:criterionId` — upsert score | ❌ |
| I-UC-04 | `PUT /user-criteria/:userId/:criterionId` — 422 score invalide | ❌ |

---

### 5.10 Beer Criteria

**Fichiers** : `tests/unit/beer-criteria.service.test.ts`

#### Unitaires — `beer-criteria.service`

| ID | Cas | Statut |
|---|---|---|
| U-BC-01 | `upsertBeerCriteria` — crée si absent | ✅ |
| U-BC-02 | `upsertBeerCriteria` — met à jour si existant | ✅ |
| U-BC-03 | `upsertBeerCriteria` — 404 si bière soft-deleted | ✅ |
| U-BC-04 | `upsertBeerCriteria` — 404 si critère inexistant | ✅ |
| U-BC-05 | `getBeerCriteria` — retourne les critères d'une bière | ✅ |

#### Intégration — `/api/beer-criteria`

| ID | Cas | Statut |
|---|---|---|
| I-BC-01 | `GET /beer-criteria/:beerId` — 200 | ❌ |
| I-BC-02 | `PUT /beer-criteria/:beerId/:criterionId` — upsert (ADMIN) | ❌ |
| I-BC-03 | `PUT /beer-criteria/:beerId/:criterionId` — 403 pour un USER | ❌ |

---

### 5.11 Quiz

**Fichiers** : aucun test existant

#### Unitaires — `quiz.service`

| ID | Cas | Statut |
|---|---|---|
| U-QUIZ-01 | `findAllQuizzes` — retourne la liste | ❌ |
| U-QUIZ-02 | `findQuizById` — retourne le quiz avec questions et choix | ❌ |
| U-QUIZ-03 | `findQuizById` — 404 si inexistant | ❌ |
| U-QUIZ-04 | `createQuiz` — création avec questions et choix imbriqués | ❌ |

#### Intégration — `/api/quizzes`

| ID | Cas | Statut |
|---|---|---|
| I-QUIZ-01 | `GET /quizzes` — 200 liste | ❌ |
| I-QUIZ-02 | `POST /quizzes` — 201 avec nested create (ADMIN) | ❌ |
| I-QUIZ-03 | `POST /quizzes` — 403 pour un USER | ❌ |
| I-QUIZ-04 | `GET /quizzes/:id` — 200 avec questions + choix | ❌ |
| I-QUIZ-05 | `GET /quizzes/:id` — 404 si inexistant | ❌ |

---

### 5.12 QuizzQuestion

**Fichiers** : aucun test existant

#### Intégration — `/api/quizz-questions`

| ID | Cas | Statut |
|---|---|---|
| I-QQ-01 | `POST /quizz-questions` — 201 (ADMIN) | ❌ |
| I-QQ-02 | `PUT /quizz-questions/:id` — 200 mise à jour | ❌ |
| I-QQ-03 | `DELETE /quizz-questions/:id` — bloqué si réponses enregistrées | ❌ |
| I-QQ-04 | `DELETE /quizz-questions/:id` — 403 pour un USER | ❌ |

---

### 5.13 QuestionChoice

**Fichiers** : aucun test existant

#### Intégration — `/api/question-choices`

| ID | Cas | Statut |
|---|---|---|
| I-QC-01 | `POST /question-choices` — 201 (ADMIN) | ❌ |
| I-QC-02 | `PUT /question-choices/:id` — 200 mise à jour | ❌ |
| I-QC-03 | `DELETE /question-choices/:id` — bloqué si réponses enregistrées | ❌ |
| I-QC-04 | `DELETE /question-choices/:id` — 403 pour un USER | ❌ |

---

### 5.14 QuizzSession

**Fichiers** : `tests/unit/quizz-session.service.test.ts` · `tests/integration/recommendations.integration.test.ts` (flow complet)

#### Unitaires — `quizz-session.service`

| ID | Cas | Statut |
|---|---|---|
| U-QS-01 | `startSession` — crée une session `IN_PROGRESS` | ✅ |
| U-QS-02 | `startSession` — `answered_count=0`, `total_questions` correct | ✅ |
| U-QS-03 | `answerQuestion` — enregistre la réponse | ✅ |
| U-QS-04 | `answerQuestion` — 409 `QUESTION_ALREADY_ANSWERED` en doublon | ✅ |
| U-QS-05 | `completeSession` — passe à `COMPLETED` | ✅ |
| U-QS-06 | `completeSession` — crée les `UserCriteria` avec le score correct | ✅ |
| U-QS-07 | `completeSession` — 409 `QUIZZ_SESSION_NOT_IN_PROGRESS` si déjà terminée | ✅ |
| U-QS-08 | `startSession` — 404 si quiz inexistant | ❌ |
| U-QS-09 | `startSession` — 404 si utilisateur inexistant | ❌ |

#### Intégration — `/api/quizz-sessions`

| ID | Cas | Statut |
|---|---|---|
| I-QS-01 | Flow complet : start → answer → complete → refresh → get | ✅ |
| I-QS-02 | `POST /quizz-sessions` — 201 avec session IN_PROGRESS | ✅ |
| I-QS-03 | `POST /quizz-sessions/:id/answers` — 200 avec progression | ✅ |
| I-QS-04 | `PUT /quizz-sessions/:id/complete` — 200 COMPLETED | ✅ |
| I-QS-05 | `POST /quizz-sessions/:id/answers` — 409 réponse en doublon | ❌ |
| I-QS-06 | `PUT /quizz-sessions/:id/complete` — 403 si autre utilisateur | ❌ |

---

### 5.15 Recommendation

**Fichiers** : `tests/unit/recommendation.service.test.ts` · `tests/integration/recommendations.integration.test.ts`

#### Unitaires — `recommendation.service`

| ID | Cas | Statut |
|---|---|---|
| U-RECO-01 | Produit scalaire correct sur exemple connu : `(4×3 + 2×5)/2 = 11` | ✅ |
| U-RECO-02 | Normalisation par nombre de critères communs | ✅ |
| U-RECO-03 | Bière sans critère commun avec l'utilisateur → exclue des résultats | ✅ |
| U-RECO-04 | Bière soft-deleted → exclue du calcul | ✅ |
| U-RECO-05 | Utilisateur sans `UserCriteria` → tableau vide | ✅ |
| U-RECO-06 | Double refresh → idempotent | ✅ |
| U-RECO-07 | `refreshRecommendations` — 404 si utilisateur inexistant | ❌ |

#### Intégration — `/api/recommendations`

| ID | Cas | Statut |
|---|---|---|
| I-RECO-01 | Flow complet quiz → complete → refresh → get, scores triés DESC | ✅ |
| I-RECO-02 | `GET /recommendations/user/:userId` — 403 si autre utilisateur | ❌ |
| I-RECO-03 | `POST /recommendations/refresh/:userId` — idempotent sur double appel | ❌ |

---

### 5.16 Tests transversaux

**Fichiers** : `tests/integration/permissions.integration.test.ts` · `tests/integration/pagination.integration.test.ts`

#### Permissions et authentification

| ID | Cas | Statut |
|---|---|---|
| T-PERM-01 | 401 sans token sur toutes les routes protégées | ✅ |
| T-PERM-02 | 403 USER sur `POST /beers` | ✅ |
| T-PERM-03 | 403 USER sur `POST /breweries` | ✅ |
| T-PERM-04 | 403 USER sur `POST /categories` | ✅ |
| T-PERM-05 | 403 USER sur données d'un autre utilisateur | ✅ |
| T-PERM-06 | 403 auto-promotion ADMIN via `PUT /users/:id` | ✅ |
| T-PERM-07 | ADMIN peut accéder aux ressources de tous les utilisateurs | ✅ |

#### Pagination

| ID | Cas | Statut |
|---|---|---|
| T-PAG-01 | `GET /beers?page=1&limit=2` — retourne `meta` avec `page`, `limit`, `total`, `totalPages` | ✅ |
| T-PAG-02 | `GET /beers?page=2&limit=1` — retourne la page 2 | ✅ |
| T-PAG-03 | `GET /beers?limit=200` — 400 (limit max = 100) | ✅ |

---

### 5.17 Tests E2E — Parcours mobiles

> **Statut** : projeté — conditionné à la livraison du frontend React Native (Phase 9)  
> **Outil** : Maestro (fichiers `.yaml` dans `e2e/`)  
> **Prérequis** : application Expo lancée sur simulateur iOS ou Android

| ID | Parcours | Étapes | Statut |
|---|---|---|---|
| E2E-01 | Inscription complète | Ouvrir l'app → remplir le formulaire → valider → écran d'accueil visible | ❌ |
| E2E-02 | Connexion / déconnexion | Login avec credentials valides → déconnexion → retour à l'écran de connexion | ❌ |
| E2E-03 | Quiz de préférences | Démarrer un quiz → répondre à toutes les questions → écran de fin affiché | ❌ |
| E2E-04 | Consultation des recommandations | Après quiz complété → naviguer vers les recommandations → liste non vide, triée | ❌ |
| E2E-05 | Notation d'une bière | Naviguer vers une bière → soumettre une note → confirmation affichée | ❌ |
| E2E-06 | Accès refusé sans authentification | Fermer la session → tenter d'accéder à l'écran des recommandations → redirection vers login | ❌ |
| E2E-07 | Erreur credentials invalides | Login avec mauvais mot de passe → message d'erreur affiché (pas de crash) | ❌ |

---

## 6. Tests de sécurité — Vecteurs OWASP

**Périmètre** : Authentification · Contrôle d'accès · Stockage données · Validation entrées · Configuration sécurité  
**Référence** : OWASP Top 10 API 2023

| ID    | Référence OWASP                           | Vecteur                   | Cas               | Statut |
|---    |---                                        |---                        |---                |---|
| S-01 | API8 — Security Misconfiguration           | Stockage mot de passe     | Mot de passe stocké haché bcrypt (`$2b$`) — jamais en clair                                                   | ✅ |
| S-02 | API2 — Broken Authentication               | JWT                       | Token invalide → 401 `INVALID_TOKEN`                                                                          | ✅ |
| S-03 | API2 — Broken Authentication               | JWT                       | Token expiré → 401 `TOKEN_EXPIRED`                                                                            | ✅ |
| S-04 | API2 — Broken Authentication               | JWT                       | Payload JWT contient `sub` (int) et `role` valide                                                             | ✅ |
| S-05 | API2 — Broken Authentication               | Contrôle d'accès          | 401 sans token sur toutes les routes protégées                                                                | ✅ |
| S-06 | API5 — Broken Function Level Authorization | Contrôle d'accès          | 403 USER sur routes réservées ADMIN                                                                           | ✅ |
| S-07 | API1 — Broken Object Level Authorization   | BOLA / IDOR               | 403 accès aux données d'un autre utilisateur                                                                  | ✅ |
| S-08 | API5 — Broken Function Level Authorization | Élévation de privilèges   | Impossible de s'auto-promouvoir ADMIN via `PUT /users/:id`                                                    | ✅ |
| S-09 | API3 — Broken Object Property Level Auth   | Exposition données        | Le champ `password` n'est jamais retourné dans les réponses API                                               | ✅ |
| S-10 | API4 — Unrestricted Resource Consumption   | Rate-limiting             | Login limité à 5 req/min — 429 au-delà                                                                        | ❌ |
| S-11 | API2 — Broken Authentication               | Refresh token             | Token révoqué ne peut pas être réutilisé (test de rotation)                                                   | ❌ |
| S-12 | API8 — Security Misconfiguration           | Validation entrées        | Injection via champs string — rejetée par Zod avant toute requête DB                                          | ⚠️ implicite |
| S-13 | API1 — Broken Object Level Authorization   | IDOR                      | `GET /user-criteria/:userId` d'un autre utilisateur → 403                                                     | ❌ |
| S-14 | API1 — Broken Object Level Authorization   | IDOR                      | `GET /recommendations/user/:userId` d'un autre utilisateur → 403                                              | ❌ |
| S-15 | API8 — Security Misconfiguration           | Headers HTTP              | Présence des headers Helmet : `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`        | ❌ |
| S-16 | API3 — Broken Object Property Level Auth   | Mass assignment           | `PUT /users/:id` — les champs `id`, `deleted_at`, `role` ne peuvent pas être modifiés par un USER             | ❌ |
| S-17 | API2 — Broken Authentication               | JWT algorithm confusion   | Token signé avec `alg: none` ou un algorithme symétrique différent → 401 rejeté                               | ❌ |
| S-18 | API1 — Broken Object Level Authorization   | BOLA sur ratings          | `PUT /ratings/:id` et `DELETE /ratings/:id` — utilisateur B ne peut pas modifier la note de l'utilisateur A   | ❌ |
| S-19 | API8 — Security Misconfiguration           | Stack trace               | Réponse d'erreur en production (`NODE_ENV=production`) ne contient pas de stack trace ni de détails internes  | ❌ |
| S-20 | API8 — Security Misconfiguration           | Paramètres numériques     | ID non entier dans les params (ex: `/api/beers/abc`) → 400 `VALIDATION_ERROR` (Zod `z.coerce.number()`)       | ⚠️ implicite |

---

## 7. Cas limites et non-régressions

| ID | Scénario | Module | Statut |
|---|---|---|---|
| E-01 | 0 critères communs user/beer → score 0, bière exclue des résultats | Recommendation | ✅ |
| E-02 | Utilisateur sans session COMPLETED → recommandations vides | Recommendation | ✅ |
| E-03 | Double refresh recommandations → idempotent | Recommendation | ✅ |
| E-04 | Bière soft-deleted exclue de tous les calculs | Beer / Recommendation | ✅ |
| E-05 | Utilisateur soft-deleted → 404 sur UserCriteria | UserCriteria | ✅ |
| E-06 | Répondre deux fois à la même question dans une session | QuizzSession | ✅ |
| E-07 | Clôturer une session déjà COMPLETED | QuizzSession | ✅ |
| E-08 | Créer deux notes pour le même couple user-beer | Rating | ✅ |
| E-09 | Supprimer un critère utilisé dans un quiz | Criterion | ✅ |
| E-10 | Supprimer une question ayant des réponses enregistrées | QuizzQuestion | ❌ |
| E-11 | Supprimer un choix ayant des réponses enregistrées | QuestionChoice | ❌ |
| E-12 | Refresh sur user sans UserCriteria → tableau vide | Recommendation | ✅ |
| E-13 | `page` invalide (0 ou négatif) → 400 | Pagination | ✅ |
| E-14 | `limit` > 100 → 400 | Pagination | ✅ |

---

## 8. Métriques cibles

| Métrique | Actuel | Cible |
|---|---|---|
| Statements | 55,73 % | ≥ 80 % |
| Branches | 55,47 % | ≥ 75 % |
| Functions | 43,90 % | ≥ 80 % |
| Lines | 55,76 % | ≥ 80 % |

---

## 9. Tests manquants — priorisation

### ✅ Priorité haute — COMPLÉTÉE

| Action | Module(s) | Statut |
|---|---|---|
| Créer `brewery.integration.test.ts` — CRUD complet + 401/403 | Brewery | ✅ 10 tests |
| Créer `category.integration.test.ts` — CRUD complet + 401/403 | Category | ✅ 11 tests |
| Créer `pairing.integration.test.ts` — CRUD complet + 401/403 | Pairing | ✅ 11 tests |
| Créer `quiz.integration.test.ts` — création imbriquée + GET détail | Quiz | ✅ 7 tests |
| Créer `quizz-question.integration.test.ts` — CRUD + DELETE bloqué | QuizzQuestion | ✅ 10 tests |
| Créer `question-choice.integration.test.ts` — CRUD + DELETE bloqué | QuestionChoice | ✅ 10 tests |
| Créer `user-criteria.integration.test.ts` — upsert + contrôle IDOR | UserCriteria | ✅ 9 tests |
| Créer `beer-criteria.integration.test.ts` — upsert admin + 403 USER | BeerCriteria | ✅ 8 tests |
| Compléter `user.integration.test.ts` — CRUD + soft delete + auto-promo | User | ✅ 15 tests |
| Créer `error-handler.test.ts` — tous les chemins d'erreur | Middleware | ✅ 5 tests |
| Créer `criterion.integration.test.ts` — CRUD complet | Criterion | ✅ 10 tests |

**Total ajouté** : 106 tests intégration / 5 tests unitaires.

### ✅ Priorité moyenne — COMPLÉTÉE

| Action | Module(s) | Statut |
|---|---|---|
| Ajouter test de rotation du refresh token (token révoqué → 401) | Auth | ✅ Intégré |
| Ajouter test IDOR sur `GET /recommendations/user/:userId` | Recommendation | ✅ Intégré |
| Ajouter test 403 sur `DELETE /ratings/:id` (autre utilisateur) | Rating | ✅ Intégré |
| Ajouter test `softDeleteBeer` exclu de `findAllBeers` | Beer | ✅ Intégré |
| Ajouter test anonymisation email sur `softDeleteUser` | User | ✅ Intégré |
| Ajouter test `startSession` — quiz inexistant → 404 | QuizzSession | ✅ Intégré |
| Ajouter tests complémentaires `ratings.integration.test.ts` | Rating | ✅ +2 tests (GET user, PUT) |

### Priorité basse

| Action | Détail |
|---|---|
| Test de rate-limiting login (S-10) | Nécessite de désactiver le skip `NODE_ENV=test` ou d'utiliser un flag de config dédié |
| Test de validation Zod sur inputs malformés (tous modules) | Partiellement couvert via les tests d'intégration existants |
| Test stack trace absent en production (S-19) | Lancer l'app avec `NODE_ENV=production` dans le test et vérifier la réponse 500 |
| Test JWT algorithm confusion (S-17) | Forger un token avec `alg: none` et vérifier le rejet 401 |

### E2E — à planifier après Frontend

| Action | Outil recommandé | Prérequis |
|---|---|---|
| Mettre en place l'environnement Maestro (`e2e/`) | Maestro CLI | Frontend React Native fonctionnel |
| Écrire les flows E2E-01 à E2E-07 (voir section 5.17) | Maestro `.yaml` | Simulateur iOS ou Android configuré |
| Intégrer les flows E2E dans la CI/CD (GitHub Actions) | Maestro Cloud ou simulateur headless | Pipeline CI Phase 8 finalisée |
| Évaluer Playwright si Expo Web est activé | Playwright + `@playwright/test` | `npx expo start --web` stable |
