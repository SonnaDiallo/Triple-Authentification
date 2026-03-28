const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

function avertirSiGmailIncomplet() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('GMAIL_USER ou GMAIL_PASS manquant — les codes OTP ne pourront pas être envoyés');
  }
}

// crypto.randomInt est cryptographiquement sûr contrairement à Math.random
function genererPin() {
  return crypto.randomInt(100000, 1000000).toString();
}

function validerPassword(mdp) {
  if (mdp.length < 8) return 'Minimum 8 caractères requis.';
  if (!/[A-Z]/.test(mdp)) return 'Au moins une majuscule requise.';
  if (!/[0-9]/.test(mdp)) return 'Au moins un chiffre requis.';
  return null;
}

// pour éviter les XSS si jamais le prénom contient du HTML
function echapperHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function envoyerPin(email, prenom, pin) {
  const prenomSafe = echapperHtml(prenom);

  await transporter.sendMail({
    from: `"Triple Auth" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Votre code de connexion',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px">
        <h2 style="margin-top:0">Bonjour ${prenomSafe},</h2>
        <p>Voici votre code pour finaliser la connexion :</p>
        <div style="font-size:2rem;font-weight:700;letter-spacing:0.2em;color:#2563eb;text-align:center;padding:16px;background:#eff6ff;border-radius:8px">
          ${pin}
        </div>
        <p style="color:#6b7280;font-size:0.85rem;margin-top:12px">
          Valable 5 minutes. Ne le partagez pas.
        </p>
      </div>
    `
  });
}

module.exports = { transporter, avertirSiGmailIncomplet, genererPin, validerPassword, echapperHtml, envoyerPin };
