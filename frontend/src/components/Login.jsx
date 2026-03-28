import { useState } from 'react';
import { loginStep1, loginStep2, loginStep3 } from '../api';
import { Champ, ChampMotDePasse, Erreur } from './Champ';
import BarreEtapes from './BarreEtapes';

// Formulaire de connexion en 3 étapes
// Étape 1 : mdp + username
// Étape 2 : question secrète  
// Étape 3 : code par email

// Étape 1 : vérification username + mot de passe
function Etape1({ onSucces }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  // Envoie le formulaire de la première étape
  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    
    console.log('Début étape 1 login');
    console.log('Username:', username);
    
    // Vérification rapide avant d'appeler le serveur
    if (!username.trim() || !password) { 
      console.log('Champs manquants');
      setErreur('Identifiant et mot de passe requis.'); 
      return; 
    }
    
    console.log('Appel API step1...');
    setChargement(true);
    try {
      // Vérification des identifiants
      const data = await loginStep1({ username, password });
      console.log('Etape 1 réussie, passage à étape 2');
      console.log('Question secrète reçue:', data.secretQuestion);
      
      // Sauvegarder le rôle pour l'accès aux logs plus tard
      if (data.userRole) {
        sessionStorage.setItem('userRole', data.userRole);
        console.log('Rôle utilisateur:', data.userRole);
      }
      
      // Ça a marché ! on passe à l'étape 2
      onSucces(data.secretQuestion);
    } catch (err) {
      console.log('Erreur étape 1:', err.message);
      // Message d'erreur pour l'utilisateur
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={soumettre}>
      <Champ 
        label="Nom d'utilisateur" 
        value={username} 
        onChange={setUsername} 
        placeholder="Votre identifiant" 
        autoComplete="username" 
      />
      <ChampMotDePasse 
        label="Mot de passe" 
        value={password} 
        onChange={setPassword} 
        placeholder="Votre mot de passe" 
        autoComplete="current-password" 
      />
      <Erreur message={erreur} />
      <button className="btn btn-principal" type="submit" disabled={chargement}>
        {chargement ? 'Vérification…' : 'Continuer'}
      </button>
    </form>
  );
}

// Étape 2 : validation de la question secrète
function Etape2({ question, onSucces }) {
  const [reponse, setReponse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  // Vérifie la réponse à la question secrète
  // Si c'est bon, envoie le code par email
  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    
    if (!reponse.trim()) { 
      setErreur('Veuillez saisir votre réponse.'); 
      return; 
    }
    
    setChargement(true);
    try {
      // Validation de la réponse et envoi du PIN
      const data = await loginStep2({ secretAnswer: reponse });
      onSucces(data.emailMasque); // Passer à l'étape 3
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={soumettre}>
      <div className="question-bloc">
        <p className="question-titre">Question de sécurité</p>
        <p className="question-texte">{question || 'Chargement...'}</p>
      </div>
      <Champ 
        label="Votre réponse" 
        value={reponse} 
        onChange={setReponse} 
        placeholder="Saisissez votre réponse" 
      />
      <Erreur message={erreur} />
      <button className="btn btn-principal" type="submit" disabled={chargement}>
        {chargement ? 'Envoi du code en cours…' : 'Continuer'}
      </button>
    </form>
  );
}

// Étape 3 : validation du code reçu par email
function Etape3({ emailMasque, onSucces }) {
  const [pin, setPin] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  // Dernière étape : vérification du code à 6 chiffres
  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    
    // Le code doit faire exactement 6 chiffres
    if (pin.length !== 6) { 
      setErreur('Le code PIN doit comporter 6 chiffres.'); 
      return; 
    }
    
    setChargement(true);
    try {
      // Vérification du PIN et connexion finale
      const data = await loginStep3({ pin });
      
      // Si c'est un admin, on redirige vers les logs
      const userRole = sessionStorage.getItem('userRole');
      if (userRole === 'admin') {
        console.log('Admin connecté, redirection vers les logs...');
        // Petite attente pour la redirection
        setTimeout(() => {
          window.location.href = '#logs';
          // Au cas où la redirection ne marche pas
          setTimeout(() => {
            if (window.location.hash !== '#logs') {
              window.location.reload();
            }
          }, 100);
        }, 500);
      }
      
      onSucces(data.user); // Connexion réussie !
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={soumettre}>
      <div className="question-bloc">
        <p className="question-titre">Code OTP à usage unique</p>
        <p className="question-texte">
          Un code à 6 chiffres a été envoyé à <strong>{emailMasque}</strong>.<br />
          Vérifiez aussi vos spams. Le code expire dans <strong>5 minutes</strong>.
        </p>
      </div>
      <Champ
        label="Code OTP (6 chiffres)"
        value={pin}
        onChange={v => { 
          // Uniquement les chiffres, max 6 caractères
          if (/^\d{0,6}$/.test(v)) setPin(v); 
        }}
        placeholder="000000"
      />
      <Erreur message={erreur} />
      <button className="btn btn-principal" type="submit" disabled={chargement}>
        {chargement ? 'Vérification…' : 'Valider'}
      </button>
    </form>
  );
}

// Composant principal qui gère les 3 étapes
export default function Login({ etape, setEtape, onInscription, onSucces, onRetour }) {
  // Données à garder entre les étapes
  const [questionSecrete, setQuestion] = useState('');
  const [emailMasque, setEmailMasque] = useState('');

  // Remet tout à zéro pour recommencer depuis le début
  const reinitialiser = () => { 
    console.log('Réinitialisation du processus');
    setEtape(1); 
    setQuestion(''); 
    setEmailMasque(''); 
  };

  return (
    <div className="carte">
      {/* Bouton de retour vers page d'accueil */}
      <button className="btn-retour" onClick={onRetour} title="Retour à l'accueil">←</button>
      
      <h1 className="titre">Connexion sécurisée</h1>
      <p className="sous-titre">Authentification en trois étapes</p>
      
      {/* Barre de progression */}
      <BarreEtapes etapeActuelle={etape} total={3} />
      <div className="separateur" />
      
      {/* Affiche l'étape en cours */}
      {etape === 1 && <Etape1 onSucces={q => { 
        console.log('Étape 1 -> Étape 2, question:', q);
        setQuestion(q); 
        setEtape(2); 
      }} />}
      {etape === 2 && <Etape2 question={questionSecrete} onSucces={em => { 
        console.log('Étape 2 -> Étape 3, email:', em);
        setEmailMasque(em); 
        setEtape(3); 
      }} />}
      {etape === 3 && <Etape3 emailMasque={emailMasque} onSucces={onSucces} />}
      
      {/* Actions supplémentaires */}
      {etape > 1 && <button className="btn btn-lien" onClick={reinitialiser}>← Recommencer depuis le début</button>}
      {etape === 1 && <button className="btn btn-lien" onClick={onInscription}>Pas encore de compte ? S'inscrire</button>}
    </div>
  );
}
