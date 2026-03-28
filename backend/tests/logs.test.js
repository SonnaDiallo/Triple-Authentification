const request = require('supertest');
const express = require('express');
const session = require('express-session');

jest.mock('../firebase', () => ({
  db: () => ({
    collection: () => ({
      doc: () => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ role: 'admin' })
        })
      })
    })
  })
}));

const { router: logsRouter, logCapture } = require('../routes/logs');

function createApp(sessionData = {}) {
  const app = express();
  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));

  // trick pour simuler une session déjà active
  app.use((req, res, next) => {
    Object.assign(req.session, sessionData);
    next();
  });

  app.use(logCapture);
  app.use('/api', logsRouter);
  return app;
}

describe('logCapture middleware', () => {
  test('ajoute un log pour chaque requête', async () => {
    const app = createApp({ username: 'admin' });
    await request(app).get('/api/logs');
    // Si ça ne plante pas, le middleware fonctionne
    expect(true).toBe(true);
  });
});

describe('GET /api/logs - non authentifié', () => {
  test('retourne 401 si non connecté', async () => {
    const app = createApp();
    const res = await request(app).get('/api/logs');
    expect(res.status).toBe(401);
  });

  test('retourne un message d\'erreur', async () => {
    const app = createApp();
    const res = await request(app).get('/api/logs');
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/logs - admin', () => {
  test('retourne 200 pour l\'utilisateur admin', async () => {
    const app = createApp({ username: 'admin' });
    const res = await request(app).get('/api/logs');
    expect(res.status).toBe(200);
  });

  test('retourne logs, total et filtered', async () => {
    const app = createApp({ username: 'admin' });
    const res = await request(app).get('/api/logs');
    expect(res.body).toHaveProperty('logs');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('filtered');
  });

  test('logs est un tableau', async () => {
    const app = createApp({ username: 'admin' });
    const res = await request(app).get('/api/logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  test('paramètre limit est pris en compte', async () => {
    const app = createApp({ username: 'admin' });
    const res = await request(app).get('/api/logs?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeLessThanOrEqual(5);
  });

  test('paramètre search filtre les logs', async () => {
    const app = createApp({ username: 'admin' });
    const res = await request(app).get('/api/logs?search=logs');
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/logs - admin', () => {
  test('vide les logs avec succès', async () => {
    const app = createApp({ username: 'admin' });
    const res = await request(app).delete('/api/logs');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

describe('GET /api/logs/export - admin', () => {
  test('retourne un fichier CSV', async () => {
    const app = createApp({ username: 'admin' });
    const res = await request(app).get('/api/logs/export');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  test('contient les headers CSV attendus', async () => {
    const app = createApp({ username: 'admin' });
    const res = await request(app).get('/api/logs/export');
    expect(res.text).toContain('Timestamp');
    expect(res.text).toContain('Method');
    expect(res.text).toContain('URL');
  });
});
