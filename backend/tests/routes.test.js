const request = require('supertest');
const express = require('express');
const session = require('express-session');

jest.mock('../firebase', () => ({
  db: () => ({
    collection: () => ({
      doc: () => ({
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockResolvedValue({}),
      }),
      where: () => ({
        limit: () => ({
          get: jest.fn().mockResolvedValue({ empty: true })
        })
      }),
      add: jest.fn().mockResolvedValue({ id: 'test-id' }),
      orderBy: () => ({
        limit: () => ({
          get: jest.fn().mockResolvedValue({ docs: [] })
        })
      })
    })
  }),
  initFirebase: jest.fn()
}));

jest.mock('../utils/helpers', () => ({
  genererPin: jest.fn().mockReturnValue('123456'),
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
  detectBruteForce: jest.fn().mockResolvedValue(false),
  getRecentLogs: jest.fn().mockResolvedValue([]),
  getMetrics: jest.fn().mockResolvedValue({
    total_attempts: 0,
    successful_attempts: 0,
    failed_attempts: 0,
    unique_users: 0,
    suspicious_activities: 0,
    avg_auth_time: 0
  })
}));

const authRouter = require('../routes/auth');
const { router: securityRouter } = require('../routes/security');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));
  app.use('/api', authRouter);
  app.use('/api/security', securityRouter);
  app.get('/api/health', (req, res) => res.json({ status: 'healthy' }));
  return app;
}

let app;

beforeEach(() => {
  app = createApp();
});

describe('GET /api/health', () => {
  test('retourne 200 avec status healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('POST /api/register', () => {
  test('retourne une erreur si champs manquants', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'test' });
    expect(res.status).toBe(400);
  });

  test('contient un message d\'erreur', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({});
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/login/step1', () => {
  test('retourne 401 si username manquant', async () => {
    const res = await request(app)
      .post('/api/login/step1')
      .send({ password: 'MonPass1' });
    expect(res.status).toBe(401);
  });

  test('retourne 401 si password manquant', async () => {
    const res = await request(app)
      .post('/api/login/step1')
      .send({ username: 'alice' });
    expect(res.status).toBe(401);
  });

  test('retourne 401 pour un utilisateur inconnu', async () => {
    const res = await request(app)
      .post('/api/login/step1')
      .send({ username: 'inconnu', password: 'MonPass1' });
    expect(res.status).toBe(401);
  });

  test('retourne un body JSON', async () => {
    const res = await request(app)
      .post('/api/login/step1')
      .send({ username: 'test', password: 'test' });
    expect(res.headers['content-type']).toMatch(/json/);
  });
});

describe('POST /api/login/step2', () => {
  test('retourne une erreur si étape 1 non complétée', async () => {
    const res = await request(app)
      .post('/api/login/step2')
      .send({ answer: 'ma réponse' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/login/step3', () => {
  test('retourne une erreur si étape 2 non complétée', async () => {
    const res = await request(app)
      .post('/api/login/step3')
      .send({ pin: '123456' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('GET /api/me', () => {
  test('retourne 401 si non connecté', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/logout', () => {
  test('retourne 200', async () => {
    const res = await request(app).post('/api/logout');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/security/metrics', () => {
  test('retourne 200 avec des métriques', async () => {
    const res = await request(app).get('/api/security/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

describe('GET /api/security/logs', () => {
  test('retourne 200 avec des logs', async () => {
    const res = await request(app).get('/api/security/logs');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

describe('GET /api/security/alerts', () => {
  test('retourne 200 avec des alertes', async () => {
    const res = await request(app).get('/api/security/alerts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

describe('GET /api/security/health', () => {
  test('retourne un statut de santé', async () => {
    const res = await request(app).get('/api/security/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  });
});
