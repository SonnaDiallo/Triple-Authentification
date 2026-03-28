import { useState } from 'react';
import { register } from '../api';
import { Champ, ChampMotDePasse, Erreur } from './Champ';

const QUESTIONS = [
  "Quel est le prénom de votre meilleur(e) ami(e) d'enfance ?",
  "Quel est le nom de votre premier animal de compagnie ?",
  "Dans quelle ville êtes-vous né(e) ?",
  "Quel est le modèle de votre première voiture ?",
  "Quel est le prénom de votre grand-mère maternelle ?",
];

export default function Inscription({ onRetour }) {
  const [form, setForm] = useState({
    nom: '', prenom: '', adresse: '',
    username: '', email: '', password: '',
    secretQuestion: QUESTIONS[0], secretAnswer: ''
  });
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  const maj = champ => val => setForm(f => ({ ...f, [champ]: val }));

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    
    // Validation des champs
    const champVides = Object.values(form).some(v => !v.trim());
    if (champVides) { 
      setErreur('Veuillez remplir tous les champs.'); 
      return; 
    }
    
    // Validation email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErreur('Adresse email invalide.');
      return;
    }
    
    // Validation mot de passe plus robuste
    if (form.password.length < 8) {
      setErreur('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    
    setChargement(true);
    try {
      await register(form);
      setSucces(true);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  if (succes) {
    return (
      <div className="carte">
        <button className="btn-retour" onClick={onRetour} title="Retour à l'accueil">←</button>
        <div className="succes-bloc">
          <div className="succes-icone">✓</div>
          <h2>Compte créé !</h2>
          <p>Votre compte a bien été enregistré. Vous pouvez maintenant vous connecter.</p>
          <button className="btn btn-principal" onClick={onRetour}>Se connecter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="carte large">
      <button className="btn-retour" onClick={onRetour} title="Retour à l'accueil">←</button>
      <h1 className="titre">Créer un compte</h1>
      <p className="sous-titre">Un code OTP à 6 chiffres vous sera envoyé par email.</p>

      <form onSubmit={soumettre}>
        <div className="groupe-deux">
          <Champ label="Prénom"  value={form.prenom}  onChange={maj('prenom')}  placeholder="Jean" />
          <Champ label="Nom"     value={form.nom}     onChange={maj('nom')}     placeholder="Dupont" />
        </div>

        <Champ label="Adresse postale" value={form.adresse} onChange={maj('adresse')} placeholder="12 rue de la Paix, 75001 Paris" />

        <div className="groupe-deux">
          <Champ label="Nom d'utilisateur" value={form.username} onChange={maj('username')} placeholder="jean.dupont" />
          <Champ label="Adresse email" type="email" value={form.email} onChange={maj('email')} placeholder="jean@gmail.com" />
        </div>

        <ChampMotDePasse
          label="Mot de passe"
          value={form.password}
          onChange={maj('password')}
          placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
          autoComplete="new-password"
        />

        <div className="separateur" />

        <div className="champ">
          <label className="champ-label">Question secrète <span className="requis">*</span></label>
          <select className="champ-input" value={form.secretQuestion} onChange={e => maj('secretQuestion')(e.target.value)}>
            {QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>

        <Champ label="Réponse secrète" value={form.secretAnswer} onChange={maj('secretAnswer')} placeholder="Votre réponse" />

        <Erreur message={erreur} />

        <button className="btn btn-principal" type="submit" disabled={chargement}>
          {chargement ? 'Inscription en cours…' : 'Créer mon compte'}
        </button>
      </form>

      <button className="btn btn-lien" onClick={onRetour}>Déjà inscrit ? Se connecter</button>
    </div>
  );
}
