// stockage en mémoire des codes OTP — pas besoin de Redis pour une démo
const pinsActifs = new Map();

// 5 minutes ça me semble raisonnable, assez long pour lire l'email
const PIN_TTL = 5 * 60 * 1000;

function enregistrerPin(username, pin) {
  pinsActifs.set(username, { pin, expireAt: Date.now() + PIN_TTL });
}

function verifierPin(username, pinSaisi) {
  const data = pinsActifs.get(username);

  if (!data) {
    return { ok: false, error: 'Aucun code actif. Repassez par la question secrète.' };
  }

  if (Date.now() > data.expireAt) {
    pinsActifs.delete(username);
    return { ok: false, error: "Code expiré. Recommencez à l'étape du code email." };
  }

  if (pinSaisi !== data.pin) {
    return { ok: false, error: 'Code incorrect.' };
  }

  // on le supprime direct après usage, c'est un code à usage unique
  pinsActifs.delete(username);
  return { ok: true };
}

module.exports = { enregistrerPin, verifierPin };
