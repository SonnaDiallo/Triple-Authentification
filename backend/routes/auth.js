const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const { db } = require('../firebase');
const { genererPin, validerPassword, envoyerPin } = require('../utils/helpers');
const { enregistrerPin, verifierPin } = require('../services/pin');
const securityLogger = require('../services/securityLogger');

const router = express.Router();
const USERS = process.env.FIRESTORE_USERS_COLLECTION || 'users';

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans une minute.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives d'inscription. Réessayez dans une minute." }
});

async function getUserByUsername(username) {
  if (!username) return null;
  console.log(`[AUTH] Recherche: ${username}`);
  const snap = await db().collection(USERS).doc(username.trim().toLowerCase()).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function emailDejaUtilise(emailLower) {
  const q = await db().collection(USERS).where('email', '==', emailLower).limit(1).get();
  return !q.empty;
}

function estDejaExistantFirestore(err) {
  return err.code === 6 || err.code === 'already-exists';
}

function estFirestoreDesactive(err) {
  return err.code === 7 || err.reason === 'SERVICE_DISABLED' ||
    (typeof err.details === 'string' && err.details.includes('Cloud Firestore API'));
}

function reponseFirestoreIndispo(res, err) {
  if (!estFirestoreDesactive(err)) return false;
  console.error('Firestore inaccessible — vérifie la console Firebase.');
  res.status(503).json({
    error: "Firestore n'est pas disponible. Active l'API et crée une base dans la console Firebase."
  });
  return true;
}

router.post('/register', registerLimiter, async (req, res) => {
  const { nom, prenom, adresse, username, email, password, secretQuestion, secretAnswer } = req.body;

  if (!nom || !prenom || !adresse || !username || !email || !password || !secretQuestion || !secretAnswer) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  const errMdp = validerPassword(password);
  if (errMdp) return res.status(400).json({ error: errMdp });

  const usernameKey = username.trim().toLowerCase();
  const emailLower = email.trim().toLowerCase();

  try {
    if (await emailDejaUtilise(emailLower)) {
      return res.status(409).json({ error: 'Cette adresse email est déjà enregistrée.' });
    }

    // coût 12 pour le mot de passe, 10 pour la réponse (moins critique)
    const hashedPassword = await bcrypt.hash(password, 12);
    const hashedAnswer = await bcrypt.hash(secretAnswer.toLowerCase().trim(), 10);

    await db().collection(USERS).doc(usernameKey).create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      adresse: adresse.trim(),
      username: usernameKey,
      email: emailLower,
      hashedPassword,
      secretQuestion: secretQuestion.trim(),
      hashedAnswer,
      createdAt: new Date().toISOString()
    });

    console.log('[REGISTER] Compte créé:', usernameKey);
    return res.status(201).json({ message: 'Compte créé avec succès.' });
  } catch (err) {
    if (reponseFirestoreIndispo(res, err)) return;
    if (estDejaExistantFirestore(err)) {
      return res.status(409).json({ error: "Nom d'utilisateur déjà utilisé." });
    }
    console.error('[REGISTER] Erreur:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/login/step1', loginLimiter, async (req, res) => {
  const t0 = Date.now();
  const ip = req.ip || req.connection.remoteAddress;
  const { username, password } = req.body;

  let user;
  try {
    user = await getUserByUsername(username);
  } catch (err) {
    if (reponseFirestoreIndispo(res, err)) return;
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }

  // message identique que l'utilisateur existe ou non, pour ne pas aider l'attaquant
  if (!user) {
    securityLogger.logAuthFailure(username, ip, 'password', 'user_not_found', 'step1');
    const bf = await securityLogger.detectBruteForce(ip, username);
    if (bf) securityLogger.logSuspiciousIP(ip, username, 'multiple_failed_attempts');
    return res.status(401).json({ error: 'Identifiants incorrects.' });
  }

  const ok = await bcrypt.compare(password, user.hashedPassword);
  if (!ok) {
    securityLogger.logAuthFailure(username, ip, 'password', 'invalid_password', 'step1');
    const bf = await securityLogger.detectBruteForce(ip, username);
    if (bf) securityLogger.logSuspiciousIP(ip, username, 'multiple_failed_attempts');
    return res.status(401).json({ error: 'Identifiants incorrects.' });
  }

  req.session.authStep = 1;
  req.session.username = user.username;
  req.session.userRole = user.role || 'user';

  securityLogger.logEvent('AUTH_STEP_SUCCESS', {
    username, ip,
    userAgent: req.get('User-Agent') || 'unknown',
    sessionId: req.sessionID,
    step: 'step1',
    factor: 'password',
    success: true,
    duration: Date.now() - t0
  });

  return res.json({
    message: 'Étape 1 validée.',
    secretQuestion: user.secretQuestion,
    userRole: user.role || 'user'
  });
});

router.post('/login/step2', loginLimiter, async (req, res) => {
  if (req.session.authStep !== 1) return res.status(403).json({ error: 'Accès refusé.' });

  let user;
  try {
    user = await getUserByUsername(req.session.username);
  } catch (err) {
    if (reponseFirestoreIndispo(res, err)) return;
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
  if (!user) return res.status(401).json({ error: 'Session invalide.' });

  const ok = await bcrypt.compare(req.body.secretAnswer?.toLowerCase().trim(), user.hashedAnswer);
  if (!ok) return res.status(401).json({ error: 'Réponse incorrecte.' });

  const pin = genererPin();
  try {
    await envoyerPin(user.email, user.prenom, pin);
    enregistrerPin(user.username, pin);
    req.session.authStep = 2;
    const emailMasque = user.email.replace(/(.{2}).+(@.+)/, '$1***$2');
    return res.json({ message: 'Code envoyé.', emailMasque });
  } catch (err) {
    console.error('[EMAIL]', err.message);
    return res.status(500).json({
      error: "Envoi d'email impossible. Vérifie GMAIL_PASS dans .env (mot de passe d'application Google, 16 caractères)."
    });
  }
});

router.post('/login/step3', loginLimiter, async (req, res) => {
  const t0 = Date.now();
  const ip = req.ip || req.connection.remoteAddress;

  if (req.session.authStep !== 2) return res.status(403).json({ error: 'Accès refusé.' });

  let user;
  try {
    user = await getUserByUsername(req.session.username);
  } catch (err) {
    if (reponseFirestoreIndispo(res, err)) return;
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
  if (!user) return res.status(401).json({ error: 'Session invalide.' });

  const result = verifierPin(user.username, req.body.pin);
  if (!result.ok) {
    securityLogger.logAuthFailure(req.session.username, ip, 'otp', result.error, 'step3');
    return res.status(401).json({ error: result.error });
  }

  req.session.authStep = 3;
  req.session.authenticated = true;

  securityLogger.logAuthSuccess(req.session.username, ip, req.sessionID, Date.now() - t0, ['password', 'secret_question', 'otp']);
  securityLogger.logSessionCreated(req.session.username, ip, req.sessionID);

  return res.json({
    message: 'Authentification réussie.',
    user: { nom: user.nom, prenom: user.prenom, username: user.username, email: user.email }
  });
});

router.get('/me', (req, res) => {
  if (!req.session.authenticated) return res.status(401).json({ error: 'Non authentifié.' });
  return res.json({ username: req.session.username });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Déconnexion réussie.' }));
});

module.exports = router;
