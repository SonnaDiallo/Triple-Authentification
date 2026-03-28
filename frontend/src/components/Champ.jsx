import { useState } from 'react';

/* ── Icônes œil ──────────────────────────────────────────────── */
function IcOeilOuvert() {
  return (
    <svg className="champ-motdepasse-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IcOeilBarre() {
  return (
    <svg className="champ-motdepasse-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/* ── Champ texte ──────────────────────────────────────────────── */
export function Champ({ label, type = 'text', value, onChange, placeholder, required = true, autoComplete = 'off' }) {
  return (
    <div className="champ">
      <label className="champ-label">{label}{required && <span className="requis"> *</span>}</label>
      <input
        className="champ-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

/* ── Champ mot de passe avec toggle ──────────────────────────── */
export function ChampMotDePasse({ label, value, onChange, placeholder, required = true, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="champ">
      <label className="champ-label">{label}{required && <span className="requis"> *</span>}</label>
      <div className="champ-motdepasse-wrap">
        <input
          className="champ-input champ-input-motdepasse"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="champ-motdepasse-toggle"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {visible ? <IcOeilBarre /> : <IcOeilOuvert />}
        </button>
      </div>
    </div>
  );
}

/* ── Message d'erreur ────────────────────────────────────────── */
export function Erreur({ message }) {
  if (!message) return null;
  return <p className="erreur-msg">{message}</p>;
}
