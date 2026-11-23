#!/usr/bin/env node
/**
 * Tests de recette rapides de l'API Finora (scénarios du cahier des charges §12).
 * Prérequis : API démarrée sur http://localhost:3000 et base `finora` importée.
 *
 *   node scripts/smoke-test.mjs
 */

const BASE = process.env.API_URL ?? 'http://localhost:3000/api';

let passed = 0;
const failures = [];

function check(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function call(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

const money = (value) => Math.round(Number(value) * 100) / 100;
const suffix = Math.random().toString(36).slice(2, 8);

async function main() {
  console.log(`\nFinora — tests de recette (${BASE})\n`);

  console.log('1. Authentification');
  const anonymous = await call('/reports/summary');
  check('requête sans jeton → 401', anonymous.status === 401, `reçu ${anonymous.status}`);
  check('format d’erreur { statusCode, message }', typeof anonymous.json?.message === 'string');

  const badLogin = await call('/auth/login', {
    method: 'POST',
    body: { email: 'demo@finora.app', password: 'mauvais-mot-de-passe' },
  });
  check('mot de passe erroné → 401', badLogin.status === 401, `reçu ${badLogin.status}`);

  const login = await call('/auth/login', {
    method: 'POST',
    body: { email: 'demo@finora.app', password: 'demo1234' },
  });
  check('connexion du compte de démonstration → 200', login.status === 200, `reçu ${login.status}`);
  const token = login.json?.token;
  check('jeton JWT renvoyé', typeof token === 'string' && token.split('.').length === 3);

  const me = await call('/auth/me', { token });
  check('profil accessible avec le jeton → 200', me.status === 200);
  check('email du profil', me.json?.email === 'demo@finora.app');

  console.log('\n2. Catégories');
  const categories = await call('/categories', { token });
  check('12 catégories de départ', categories.json?.length === 12, `${categories.json?.length} reçues`);

  const duplicate = await call('/categories', {
    method: 'POST',
    token,
    body: { name: 'alimentation', type: 'expense' },
  });
  check('catégorie en double → 409', duplicate.status === 409, `reçu ${duplicate.status}`);

  const created = await call('/categories', {
    method: 'POST',
    token,
    body: { name: `Animaux ${suffix}`, type: 'expense' },
  });
  check('création d’une catégorie → 201', created.status === 201, `reçu ${created.status}`);

  const alimentation = (categories.json ?? []).find((category) => category.name === 'Alimentation');
  const usedDelete = await call(`/categories/${alimentation?.id}`, { method: 'DELETE', token });
  check('suppression d’une catégorie utilisée → 409', usedDelete.status === 409, `reçu ${usedDelete.status}`);
  check('message de refus explicite', typeof usedDelete.json?.message === 'string');

  const removedCategory = await call(`/categories/${created.json?.id}`, { method: 'DELETE', token });
  check('suppression d’une catégorie libre → 204', removedCategory.status === 204, `reçu ${removedCategory.status}`);

  console.log('\n3. Transactions');
  const negative = await call('/transactions', {
    method: 'POST',
    token,
    body: { label: 'Montant négatif', amount: -42, type: 'expense', categoryId: alimentation?.id, date: '2026-11-08' },
  });
  check('montant négatif → 400', negative.status === 400, `reçu ${negative.status}`);
  check('message lisible pour le montant', /positif/i.test(negative.json?.message ?? ''));

  const mismatch = await call('/transactions', {
    method: 'POST',
    token,
    body: { label: 'Catégorie incompatible', amount: 25, type: 'income', categoryId: alimentation?.id, date: '2026-11-08' },
  });
  check('catégorie de dépense avec type revenu → 400', mismatch.status === 400, `reçu ${mismatch.status}`);

  const invalidDate = await call('/transactions', {
    method: 'POST',
    token,
    body: { label: 'Date invalide', amount: 25, type: 'expense', categoryId: alimentation?.id, date: '2026-02-31' },
  });
  check('date impossible → 400', invalidDate.status === 400, `reçu ${invalidDate.status}`);

  const creation = await call('/transactions', {
    method: 'POST',
    token,
    body: { label: `Test recette ${suffix}`, amount: 19.9, type: 'expense', categoryId: alimentation?.id, date: '2026-11-08' },
  });
  check('création d’une transaction → 201', creation.status === 201, `reçu ${creation.status}`);

  const filtered = await call('/transactions?type=expense&limit=5&page=1', { token });
  check('liste filtrée paginée → 200', filtered.status === 200 && Array.isArray(filtered.json?.items));
  check('pagination cohérente', filtered.json?.limit === 5 && filtered.json?.page === 1);

  const update = await call(`/transactions/${creation.json?.id}`, {
    method: 'PUT',
    token,
    body: { amount: 24.5 },
  });
  check('modification d’une transaction → 200', update.status === 200 && money(update.json?.amount) === 24.5);

  const removedTx = await call(`/transactions/${creation.json?.id}`, { method: 'DELETE', token });
  check('suppression d’une transaction → 204', removedTx.status === 204, `reçu ${removedTx.status}`);

  console.log('\n4. Budgets');
  const budgets = await call('/budgets?month=2026-11', { token });
  check('budgets du mois → 200', budgets.status === 200, `reçu ${budgets.status}`);
  check('dépensé et reste calculés', (budgets.json ?? []).every((budget) => typeof budget.spent === 'number' && typeof budget.remaining === 'number'));
  check('signal de dépassement disponible', (budgets.json ?? []).some((budget) => budget.ratio >= 1));

  const duplicateBudget = await call('/budgets', {
    method: 'POST',
    token,
    body: { categoryId: alimentation?.id, month: '2026-11', limit: 300 },
  });
  check('budget en double → 409', duplicateBudget.status === 409, `reçu ${duplicateBudget.status}`);

  const incomeCategory = (categories.json ?? []).find((category) => category.type === 'income');
  const incomeBudget = await call('/budgets', {
    method: 'POST',
    token,
    body: { categoryId: incomeCategory?.id, month: '2026-11', limit: 300 },
  });
  check('budget sur une catégorie de revenu → 400', incomeBudget.status === 400, `reçu ${incomeBudget.status}`);

  console.log('\n5. Rapports');
  const summary = await call('/reports/summary?month=2026-11', { token });
  check('bilan mensuel → 200', summary.status === 200, `reçu ${summary.status}`);
  check('revenus du mois', money(summary.json?.income) === 3870, `reçu ${summary.json?.income}`);
  check('dépenses du mois', money(summary.json?.expense) === 1266.19, `reçu ${summary.json?.expense}`);
  check('solde = revenus − dépenses', money(summary.json?.balance) === 2603.81, `reçu ${summary.json?.balance}`);
  check('répartition par catégorie', (summary.json?.byCategory ?? []).length > 0);
  check('somme des parts ≈ 1', Math.abs((summary.json?.byCategory ?? []).reduce((sum, slice) => sum + slice.share, 0) - 1) < 0.001);

  const trend = await call('/reports/trend?months=6&to=2026-11', { token });
  check('tendance sur 6 mois', (trend.json ?? []).length === 6);
  check('mois le plus récent en dernier', trend.json?.[5]?.month === '2026-11');

  const invalidMonth = await call('/reports/summary?month=2026-13', { token });
  check('mois invalide → 400', invalidMonth.status === 400, `reçu ${invalidMonth.status}`);

  console.log('\n6. Isolation entre utilisateurs');
  const outsiderEmail = `recette-${suffix}@finora.test`;
  const second = await call('/auth/register', {
    method: 'POST',
    body: { name: 'Utilisateur Test', email: outsiderEmail, password: 'motdepasse123' },
  });
  check('inscription d’un second compte → 201', second.status === 201, `reçu ${second.status}`);
  const secondToken = second.json?.token;

  const secondCategories = await call('/categories', { token: secondToken });
  check('catégories de départ du nouveau compte', secondCategories.json?.length === 12);

  const secondTransactions = await call('/transactions', { token: secondToken });
  check('aucune transaction visible du premier compte', secondTransactions.json?.total === 0);

  const foreign = await call(`/transactions/${filtered.json?.items?.[0]?.id}`, {
    method: 'PUT',
    token: secondToken,
    body: { amount: 1 },
  });
  check('modification d’une transaction tierce → 404', foreign.status === 404, `reçu ${foreign.status}`);

  console.log('\n7. Documentation');
  const docs = await fetch('http://localhost:3000/api/docs');
  check('Swagger UI accessible', docs.status === 200, `reçu ${docs.status}`);

  console.log(`\n${passed} vérifications réussies, ${failures.length} échec(s).`);
  if (failures.length > 0) {
    console.log('Échecs :');
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('\nErreur pendant les tests :', error.message);
  process.exitCode = 1;
});
