import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

// Calcul de la force du mot de passe
function calculerForce(mdp) {
  if (!mdp) return { score: 0, message: '', couleur: '' };
  
  let score = 0;
  const messages = [];
  
  // Longueur
  if (mdp.length >= 8) score += 1;
  if (mdp.length >= 12) score += 1;
  
  // Complexité
  if (/[a-z]/.test(mdp)) score += 1;
  if (/[A-Z]/.test(mdp)) score += 1;
  if (/[0-9]/.test(mdp)) score += 1;
  if (/[^a-zA-Z0-9]/.test(mdp)) score += 1;
  
  // Messages
  if (mdp.length < 8) messages.push('8 caractères minimum');
  if (!/[a-z]/.test(mdp)) messages.push('minuscule');
  if (!/[A-Z]/.test(mdp)) messages.push('majuscule');
  if (!/[0-9]/.test(mdp)) messages.push('chiffre');
  if (!/[^a-zA-Z0-9]/.test(mdp)) messages.push('caractère spécial');
  
  let force = '';
  let couleur = '';
  
  if (score <= 2) {
    force = 'Faible';
    couleur = '#ef4444';
  } else if (score <= 4) {
    force = 'Moyen';
    couleur = '#f59e0b';
  } else {
    force = 'Fort';
    couleur = '#10b981';
  }
  
  return {
    score,
    force,
    couleur,
    messages: messages.length > 0 ? messages : ['Excellent mot de passe !']
  };
}

export default function IndicateurForceMdp({ password }) {
  const { addNotification } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  
  const force = calculerForce(password);
  const pourcentage = (force.score / 6) * 100;
  
  return (
    <div className="force-mdp-container">
      <div className="force-mdp-header">
        <div className="force-mdp-bar-container">
          <div 
            className="force-mdp-bar" 
            style={{ 
              width: `${pourcentage}%`,
              backgroundColor: force.couleur 
            }}
          />
        </div>
        <div 
          className="force-mdp-texte"
          style={{ color: force.couleur }}
        >
          {password ? force.force : ''}
        </div>
        {password && (
          <button
            className="force-mdp-details-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '▼' : '▶'}
          </button>
        )}
      </div>
      
      {showDetails && password && (
        <div className="force-mdp-details">
          <div className="force-mdp-score">
            Score : {force.score}/6
          </div>
          <div className="force-mdp-conseils">
            {force.messages.map((msg, i) => (
              <div key={i} className="force-mdp-conseil">
                {force.messages.length === 1 && force.messages[0] === 'Excellent mot de passe !' ? 
                  '✅ ' + msg : '❌ ' + msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
