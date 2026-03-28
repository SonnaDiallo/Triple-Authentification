const express = require('express');
const router = express.Router();

// les logs sont en mémoire, ça suffit pour une démo
const logsDatabase = [];

async function checkUserRole(username) {
  try {
    const { db } = require('../firebase');
    const col = process.env.FIRESTORE_USERS_COLLECTION || 'users';
    const doc = await db().collection(col).doc(username).get();
    if (!doc.exists) return false;
    return doc.data().role === 'admin';
  } catch (err) {
    console.error('checkUserRole erreur:', err);
    return false;
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.session.username) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  // accès direct si username est 'admin'
  if (req.session.username === 'admin') return next();

  checkUserRole(req.session.username)
    .then(ok => {
      if (!ok) return res.status(403).json({ error: 'Accès refusé - Admin requis' });
      next();
    })
    .catch(() => res.status(500).json({ error: 'Erreur serveur' }));
};

const logCapture = (req, res, next) => {
  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? { ...req.body, password: '[HIDDEN]' } : null,
    sessionId: req.sessionID,
    username: req.session?.username || 'anonymous'
  };

  logsDatabase.push(entry);

  // on garde max 1000 entrées sinon ça gonfle en mémoire
  if (logsDatabase.length > 1000) logsDatabase.shift();

  next();
};

router.get('/logs', requireAdmin, (req, res) => {
  const { limit = 50, level, search } = req.query;
  let result = [...logsDatabase];

  if (level) result = result.filter(l => l.url.includes(level.toLowerCase()));
  if (search) result = result.filter(l => JSON.stringify(l).toLowerCase().includes(search.toLowerCase()));

  const page = result.slice(-limit);
  res.json({ logs: page.reverse(), total: logsDatabase.length, filtered: result.length });
});

router.delete('/logs', requireAdmin, (req, res) => {
  logsDatabase.length = 0;
  res.json({ message: 'Logs vidés' });
});

router.get('/logs/export', requireAdmin, (req, res) => {
  const lignes = [
    'Timestamp,Method,URL,IP,Username,SessionID,UserAgent',
    ...logsDatabase.map(l =>
      `"${l.timestamp}","${l.method}","${l.url}","${l.ip}","${l.username}","${l.sessionId}","${l.userAgent}"`
    )
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
  res.send(lignes.join('\n'));
});

module.exports = { router, logCapture };
