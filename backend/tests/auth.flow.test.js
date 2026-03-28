const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

// sans ça le rate limiter bloque tous les tests avec des 429
jest.mock('express-rate-limit', () => () => (req, res, next) => next());

// utilisateur de test avec des credentials valides
const mockUser = {
  nom: 'Dupont',
  prenom: 'Alice',
  email: 'alice@test.com',
  username: 'alice',
  role: 'user',
  secretQuestion: 'Nom de votre animal ?',
  hashedPassword: bcrypt.hashSync('MonPass123', 10),
  hashedAnswer: bcrypt.hashSync('rex', 10)
};

jest.mock('../firebase', () => ({
  db: () => ({
    collection: () => ({
      doc: (username) => ({
        get: jest.fn().mockResolvedValue({
          exists: username === 'alice',
          id: username,
          data: () => mockUser
        }),
        create: jest.fn().mockResolvedValue({})
      }),
      where: () => ({
        limit: () => ({
          get: jest.fn().mockResolvedValue({ empty: true })
        })
      }),
      add: jest.fn().mockResolvedValue({ id: 'log-id' }),
      orderBy: () => ({
        limit: () => ({
          get: jest.fn().mockResolvedValue({ docs: [] })
        })
      })
    })
  })
}));

jest.mock('../utils/helpers', () => ({
  genererPin: jest.fn().mockReturnValue('654321'),
  validerPassword: jest.fn().mockReturnValue(null),
  envoyerPin: jest.fn().mockResolvedValue({}),
  avertirSiGmailIncomplet: jest.fn(),
  echapperHtml: (s) => String(s)
}));

jest.mock('../services/securityLogger', () => ({
  logEvent: jest.fn(),
  logAuthSuccess: jest.fn(),
  logAuthFailure: jest.fn(),
  logBruteForceDetected: jest.fn(),
  logSessionCreated: jest.fn(),
  logSessionExpired: jest.fn(),
  logSuspiciousIP: jest.fn(),
  detectBruteForce: jest.fn().mockResolvedValue(false),
  getRecentLogs: jest.fn().mockResolvedValue([]),
  getMetrics: jest.fn().mockResolvedValue({})
}));

const authRouter = require('../routes/auth');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));
  app.use('/api', authRouter);
  return app;
}

describe('Inscription', () => {
  let app;
  beforeEach(() => { app = createApp(); });

  test('retourne 400 si champs manquants', async () => {
    const res = await request(app).post('/api/register').send({ username: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  test('retourne 400 si email invalide', async () => {
    const res = await request(app).post('/api/register').send({
      nom: 'Test', prenom: 'Test', adresse: '1 rue test',
      username: 'testuser', email: 'pas-un-email',
      password: 'MonPass123', secretQuestion: 'Q?', secretAnswer: 'r'
    });
    expect(res.status).toBe(400);
  });

  test('retourne 201 si inscription valide', async () => {
    const res = await request(app).post('/api/register').send({
      nom: 'Dupont', prenom: 'Bob', adresse: '2 rue test',
      username: 'bob', email: 'bob@test.com',
      password: 'MonPass123', secretQuestion: 'Q?', secretAnswer: 'rep'
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toBeTruthy();
  });
});

describe('Login Step 1 - Mot de passe', () => {
  let app;
  beforeEach(() => { app = createApp(); });

  test('retourne 401 si utilisateur inexistant', async () => {
    const res = await request(app)
      .post('/api/login/step1')
      .send({ username: 'inconnu', password: 'MonPass123' });
    expect(res.status).toBe(401);
  });

  test('retourne 401 si mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/login/step1')
      .send({ username: 'alice', password: 'MauvaisPass1' });
    expect(res.status).toBe(401);
  });

  test('retourne 200 si identifiants corrects', async () => {
    const res = await request(app)
      .post('/api/login/step1')
      .send({ username: 'alice', password: 'MonPass123' });
    expect(res.status).toBe(200);
    expect(res.body.secretQuestion).toBe('Nom de votre animal ?');
  });

  test('retourne la question secrète au succès', async () => {
    const res = await request(app)
      .post('/api/login/step1')
      .send({ username: 'alice', password: 'MonPass123' });
    expect(res.body).toHaveProperty('secretQuestion');
  });
});

describe('Login Step 2 - Question secrète', () => {
  test('retourne 403 si étape 1 non complétée', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/login/step2')
      .send({ secretAnswer: 'rex' });
    expect(res.status).toBe(403);
  });

  test('retourne 200 si réponse correcte après step1', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/login/step1').send({ username: 'alice', password: 'MonPass123' });

    const res = await agent
      .post('/api/login/step2')
      .send({ secretAnswer: 'rex' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('emailMasque');
  });

  test('retourne 401 si mauvaise réponse', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent
      .post('/api/login/step1')
      .send({ username: 'alice', password: 'MonPass123' });

    const res = await agent
      .post('/api/login/step2')
      .send({ secretAnswer: 'mauvaisereponse' });

    expect(res.status).toBe(401);
  });
});

describe('Login Step 3 - Code OTP', () => {
  test('retourne 403 si étape 2 non complétée', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/login/step3')
      .send({ pin: '654321' });
    expect(res.status).toBe(403);
  });

  test('complète l\'authentification avec bon PIN', async () => {
    const app = createApp();
    const agent = request.agent(app);

    // Step 1
    await agent.post('/api/login/step1').send({ username: 'alice', password: 'MonPass123' });
    // Step 2
    await agent.post('/api/login/step2').send({ secretAnswer: 'rex' });
    // le mock de genererPin retourne toujours '654321'
    const res = await agent
      .post('/api/login/step3')
      .send({ pin: '654321' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe('alice');
  });

  test('retourne 401 si PIN incorrect', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent
      .post('/api/login/step1')
      .send({ username: 'alice', password: 'MonPass123' });

    await agent
      .post('/api/login/step2')
      .send({ secretAnswer: 'rex' });

    const res = await agent
      .post('/api/login/step3')
      .send({ pin: '000000' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/me', () => {
  test('retourne 401 si non authentifié', async () => {
    const app = createApp();
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  test('retourne les infos utilisateur après authentification complète', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/login/step1').send({ username: 'alice', password: 'MonPass123' });
    await agent.post('/api/login/step2').send({ secretAnswer: 'rex' });
    await agent.post('/api/login/step3').send({ pin: '654321' });

    const res = await agent.get('/api/me');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/logout', () => {
  test('retourne 200 et déconnecte la session', async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post('/api/login/step1').send({ username: 'alice', password: 'MonPass123' });
    await agent.post('/api/login/step2').send({ secretAnswer: 'rex' });
    await agent.post('/api/login/step3').send({ pin: '654321' });

    const res = await agent.post('/api/logout');
    expect(res.status).toBe(200);

    const meRes = await agent.get('/api/me');
    expect(meRes.status).toBe(401);
  });
});
