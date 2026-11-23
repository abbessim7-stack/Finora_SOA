# Finora — gestion de budget personnel

Application web de suivi de budget, réalisée pour l'atelier SOA : un **service
RESTful documenté** (NestJS + MySQL) et un **client React** responsive en
français.

- Suivre revenus et dépenses, classés par catégorie.
- Fixer des plafonds mensuels par catégorie et voir leur consommation.
- Obtenir un bilan mensuel, une répartition des dépenses et une évolution sur 6 mois.

![Palette](https://img.shields.io/badge/palette-bleu%20nuit%20%2B%20violet-8b76ff) ![Stack](https://img.shields.io/badge/stack-React%2018%20%C2%B7%20NestJS%20%C2%B7%20MySQL-4fd8a4)

---

## 1. Contenu du dépôt

```
finora/
├── web/                 Client React 18 + Vite (React Router, TypeScript)
│   └── src/
│       ├── pages/       Connexion, Inscription, Tableau de bord, Transactions,
│       │                Budgets, Catégories
│       ├── components/  Coquille applicative, graphiques SVG, dialogues, UI
│       ├── lib/         Client API, client de démonstration, formats français
│       └── styles.css   Design system (tokens, composants, responsive)
├── api/                 Service NestJS (JWT, validation, Swagger, mysql2)
│   └── src/
│       ├── auth/        Inscription, connexion, profil, suppression de compte
│       ├── categories/  CRUD + règles d'unicité et d'utilisation
│       ├── transactions/ CRUD + filtres et pagination
│       ├── budgets/     Plafonds mensuels + dépensé / reste
│       ├── reports/     Bilan mensuel et tendance
│       └── common/      Garde JWT globale, filtre d'erreurs, helpers
└── database/
    ├── schema.sql       Tables, contraintes, index, vue monthly_summary
    └── seed.sql         Données de démonstration (compte demo@finora.app)
```

## 2. Démarrage rapide

Le client peut fonctionner en mode démonstration sans MySQL. Dans cette copie,
`web/.env.local` active le mode API afin que les données soient enregistrées dans
MySQL via le service NestJS.

```bash
cd web
npm install
npm run dev          # http://127.0.0.1:5300
```

En mode API, créez un compte depuis l'écran d'inscription. Le compte de démo
est également disponible après l'import de `database/seed.sql` :
**demo@finora.app / demo1234**.

## 3. Stack complète (Laragon + MySQL)

Prérequis : Node.js 18+, Laragon avec MySQL 8 (ou MariaDB 10.5+).

### 3.1 Base de données

1. Démarrer Laragon, puis **Démarrer tout** (MySQL).
2. Importer `database/schema.sql` puis `database/seed.sql` dans HeidiSQL.
   Le schéma crée la base `Finora_db`.
   Les deux scripts sont idempotents.
3. Pour une base Finora déjà existante, exécuter aussi `database/admin-migration.sql`
   afin d'ajouter les rôles, l'état des comptes et les statistiques quotidiennes d'activité.

### 3.2 API

```bash
cd api
cp .env.example .env      # déjà présent en local, à adapter si besoin
npm install
npm run start:dev         # http://localhost:3001/api
```

- Documentation Swagger : <http://localhost:3001/api/docs>
- Vérification : `curl http://localhost:3001/api/reports/summary` renvoie `401`
  sans jeton, ce qui est le comportement attendu.

### 3.3 Client branché sur l'API

`web/.env.local` :

```env
VITE_API_MODE=http
```

puis `npm run dev`. Le proxy Vite envoie `/api` vers `http://localhost:3001`.

Variables d'environnement de l'API : `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`.
Aucun secret n'est stocké dans le code : `api/.env` est ignoré par Git.

## 4. Contrat d'API

Préfixe `/api`. Toutes les routes exigent `Authorization: Bearer <jeton>`, sauf
l'inscription et la connexion. Format d'erreur unique :
`{ "statusCode": 400, "message": "texte lisible" }`.

| Méthode | Route | Description |
| --- | --- | --- |
| POST | `/auth/register` | Créer un compte (+ catégories de départ) |
| POST | `/auth/login` | Connexion, renvoie un JWT |
| POST | `/auth/activity` | Enregistrer l’activité récente du compte connecté |
| GET / PUT | `/auth/me` | Lire / modifier le profil connecté |
| DELETE | `/auth/me` | Supprimer son compte et ses données |
| GET / POST | `/categories` | Lister / créer |
| PUT / DELETE | `/categories/:id` | Modifier / supprimer (refus si utilisée) |
| GET | `/transactions` | Filtres `type`, `categoryId`, `month`, `from`, `to`, `search`, `page`, `limit` |
| GET / POST | `/transactions`, `/transactions/:id` | Lire / créer |
| PUT / DELETE | `/transactions/:id` | Modifier / supprimer |
| GET | `/budgets?month=AAAA-MM` | Budgets avec `spent`, `remaining`, `ratio` |
| POST | `/budgets` | Créer un plafond (catégorie de dépense uniquement) |
| PUT / DELETE | `/budgets/:id` | Modifier / supprimer |
| GET | `/reports/summary?month=AAAA-MM` | Revenus, dépenses, solde, répartition |
| GET | `/reports/trend?months=6&to=AAAA-MM` | Évolution mensuelle |

### Administration

L'espace `/admin` est la page d'accueil des comptes ayant le rôle `admin`.
L'API expose `GET /admin/overview`, `GET /admin/users` (recherche et pagination)
et `PATCH /admin/users/:id` (rôle ou activation). Toutes ces routes sont protégées
côté serveur. Le dernier admin actif ne peut pas être rétrogradé ou désactivé,
et un admin ne peut pas se désactiver ou se rétrograder lui-même. Les statistiques
quotidiennes comptent les comptes connectés distincts et le temps actif estimé
(onglet visible avec une activité récente; l’inactivité de plus de deux minutes
n’est pas comptée). Elles commencent après le déploiement du suivi. L’espace admin
n'expose pas les budgets ni les transactions individuelles.

## 5. Règles métier implémentées

- Montants en `DECIMAL(12,2)` côté MySQL, positifs et contrôlés à la validation.
- Catégorie obligatoirement du même type que la transaction (vérifié par l'API,
  clé étrangère composite `(category_id, user_id)` en base).
- Deux catégories ne peuvent pas partager un nom pour un même type (409).
- Une catégorie utilisée par des transactions ne peut pas être supprimée (409,
  message explicite).
- Un seul budget par catégorie et par mois (409), catégories de dépense only.
- Isolation stricte : chaque requête est filtrée par `user_id` issu du jeton,
  jamais d'un identifiant fourni par le client.
- Suppression de compte : transactions → budgets → catégories → compte, dans une
  transaction SQL.

## 6. Vérifications effectuées

```bash
cd web && npm run build       # TypeScript strict + build de production Vite
cd api && npm run build       # compilation NestJS
node scripts/smoke-test.mjs   # 41 tests de recette sur l'API démarrée
```

Le script `scripts/smoke-test.mjs` rejoue les scénarios du cahier des charges §12
contre une base réelle : sans jeton (401), connexion et JWT, catégories par défaut,
unicité (409), suppression d'une catégorie utilisée (409), montant négatif ou date
impossible (400), CRUD et pagination des transactions, budgets avec dépensé /
reste / dépassement (409 sur doublon, 400 sur catégorie de revenu), bilan et
tendance, isolation entre deux utilisateurs (404), Swagger.

Dernière exécution : **41 vérifications réussies, 0 échec**.

> Sur la machine de développement, une base `finora` plus ancienne (prototype du
> 3 novembre, colonne `budgets.amount`) existait déjà : elle a été sauvegardée dans
> `database/backup/finora-prototype-2026-11-03.sql` avant d'être recréée avec le
> schéma v1.1. `finora` contient donc uniquement le jeu de démonstration.

## 7. Design

Direction artistique : bleu nuit (`#07070f`) et violet (`#8b76ff`), vert pour les
revenus (`#4fd8a4`), corail pour les dépenses (`#ff8078`). Typographies
**Fraunces** (titres et chiffres) et **Manrope** (interface).

- Graphiques en SVG natif (anneau, barres + courbe, sparkline) : aucune
  dépendance de charting, animations en `transform` / `opacity`.
- Courbes d'accélération personnalisées, durées sous 300 ms pour l'interface,
  `:active` à `scale(0.97)`, entrées décalées de 50 ms.
- Navigation latérale sur ordinateur, barre d'onglets fixe sur téléphone,
  formulaires accessibles (labels, focus visible, `aria`).
- `prefers-reduced-motion` respecté.

## 8. Suites possibles

Alertes par email, transactions récurrentes, objectifs d'épargne, import CSV,
multi-devises, conteneurisation Docker (séance 6) et tests automatisés en
intégration continue.
