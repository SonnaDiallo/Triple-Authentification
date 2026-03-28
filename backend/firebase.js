const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function initFirebase() {
  if (admin.apps.length) return;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    return;
  }

  const relOrAbs = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!relOrAbs) {
    throw new Error(
      'Firebase : définissez GOOGLE_APPLICATION_CREDENTIALS ou FIREBASE_SERVICE_ACCOUNT_PATH (voir .env.example).'
    );
  }

  const jsonPath = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(__dirname, relOrAbs);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(
      `Fichier compte de service introuvable : ${jsonPath}\n` +
        'Télécharge la clé JSON (Firebase > Paramètres > Comptes de service) et enregistre-la sous ce chemin.'
    );
  }
  const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

function db() {
  return admin.firestore();
}

module.exports = { initFirebase, db };
