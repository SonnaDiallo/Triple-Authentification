require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');

const { initFirebase } = require('./firebase');
const { avertirSiGmailIncomplet } = require('./utils/helpers');
const authRouter = require('./routes/auth');
const { router: logsRouter, logCapture } = require('./routes/logs');
const { router: securityRouter } = require('./routes/security');

// sans ça les sessions ne fonctionnent pas du tout
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET === 'remplace_par_une_chaine_longue_et_aleatoire') {
  console.error('\nSESSION_SECRET manquant dans .env — génère-en un avec :');
  console.error('node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());
app.use(cors({
  origin: isProd ? process.env.CORS_ORIGIN : 'http://localhost:5173',
  credentials: true
}));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 20 * 60 * 1000
  }
}));

app.use('/api', logCapture);

app.get('/', (_req, res) => {
  res.type('html').send(
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>API</title></head>' +
    '<body style="font-family:sans-serif;padding:1.5rem">' +
    '<h1>Serveur Triple Auth</h1>' +
    '<p>Les routes sont sous <code>/api/</code> — lance Vite sur <strong>localhost:5173</strong> pour l\'interface.</p>' +
    '</body></html>'
  );
});

app.use('/api', authRouter);
app.use('/api', logsRouter);
app.use('/api/security', securityRouter);

// health check pour Docker
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

function demarrer() {
  initFirebase();
  avertirSiGmailIncomplet();

  const host = process.env.HOST || '0.0.0.0';
  app.listen(PORT, host, () => {
    console.log(`\nServeur démarré → http://localhost:${PORT}/`);
    console.log('Interface → http://localhost:5173\n');
  });
}

try {
  demarrer();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
