import { useEffect, useState } from 'react';
import LoginHistory from './LoginHistory';

export default function SuccesMessage({ user, onLogout }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    setAnimateIn(true);
    setShowConfetti(true);
    
    // Vérifier si admin
    const role = sessionStorage.getItem('userRole') || 'user';
    setUserRole(role);
    
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showHistory) {
    return <LoginHistory onRetour={() => setShowHistory(false)} />;
  }

  return (
    <>
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      <div className={`carte ${animateIn ? 'animate-success' : ''}`}>
        <button className="btn-retour" onClick={onLogout} title="Se déconnecter">←</button>
        
        <div className="succes-bloc">
          <div className="succes-icone grand animate-checkmark">OK</div>
          
          <div className="success-title-section">
            <h1 className="success-title">Authentification Réussie !</h1>
            <div className="success-subtitle">Bienvenue dans votre espace sécurisé</div>
          </div>

          <div className="user-welcome">
            <div className="user-avatar">
              <span className="avatar-text">
                {user.prenom?.[0]?.toUpperCase()}{user.nom?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="user-info">
              <div className="user-name">
                <strong>{user.prenom} {user.nom}</strong>
              </div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>

          <div className="security-status">
            <div className="status-header">
              <span className="status-icon">Lock</span>
              <span className="status-text">Session sécurisée activée</span>
            </div>
            
            <div className="verification-steps">
              <div className="step-item verified">
                <span className="step-icon">PWD</span>
                <span className="step-text">Mot de passe vérifié</span>
                <span className="step-check">OK</span>
              </div>
              <div className="step-item verified">
                <span className="step-icon">?</span>
                <span className="step-text">Question secrète validée</span>
                <span className="step-check">OK</span>
              </div>
              <div className="step-item verified">
                <span className="step-icon">MAIL</span>
                <span className="step-text">Code email confirmé</span>
                <span className="step-check">OK</span>
              </div>
            </div>
          </div>

          <div className="success-actions">
            {userRole === 'admin' && (
              <button 
                className="btn btn-secondaire" 
                onClick={() => setShowHistory(true)}
              >
                📊 Voir l'historique
              </button>
            )}
            <button className="btn btn-danger" onClick={onLogout}>
              Se déconnecter
            </button>
          </div>

          <div className="security-footer">
            <div className="security-badge">
              <span className="badge-icon">Shield</span>
              <span className="badge-text">Triple authentification activée</span>
            </div>
            <div className="session-info">
              Session active • Protocole sécurisé
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
