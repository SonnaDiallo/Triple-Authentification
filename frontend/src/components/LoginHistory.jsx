import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import './LoginHistory.css';

export default function LoginHistory({ onRetour }) {
  const { addNotification } = useApp();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, success, failed

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Simulation de données - dans un vrai projet, ça viendrait de votre API
      const mockHistory = [
        {
          id: 1,
          username: 'admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'success',
          step: 'completed'
        },
        {
          id: 2,
          username: 'admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'failed',
          step: 'step3',
          error: 'Code PIN invalide'
        },
        {
          id: 3,
          username: 'jean.dupont',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          ip: '192.168.1.105',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          status: 'success',
          step: 'completed'
        },
        {
          id: 4,
          username: 'unknown',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          ip: '192.168.1.200',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
          status: 'failed',
          step: 'step1',
          error: 'Identifiants incorrects'
        }
      ];

      // Filtrer selon le statut
      const filtered = filter === 'all' ? mockHistory : 
        mockHistory.filter(h => h.status === filter);

      setHistory(filtered);
      addNotification('Historique chargé', 'info');
    } catch (error) {
      addNotification('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getStatusIcon = (status) => {
    return status === 'success' ? '✅' : '❌';
  };

  const getStatusColor = (status) => {
    return status === 'success' ? '#10b981' : '#ef4444';
  };

  const getStepLabel = (step) => {
    const labels = {
      'step1': 'Étape 1: Mdp',
      'step2': 'Étape 2: Question',
      'step3': 'Étape 3: PIN',
      'completed': 'Terminé'
    };
    return labels[step] || step;
  };

  if (loading) {
    return (
      <div className="carte">
        <button className="btn-retour" onClick={onRetour} title="Retour">←</button>
        <h1 className="titre">Historique des connexions</h1>
        <div className="loading-container">
          <div className="loading-spinner">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="carte large">
      <button className="btn-retour" onClick={onRetour} title="Retour">←</button>
      
      <h1 className="titre">Historique des connexions</h1>
      <p className="sous-titre">Surveillance des tentatives de connexion</p>

      {/* Filtres */}
      <div className="history-filters">
        <button 
          className="btn btn-secondaire" 
          onClick={() => setShowHistory(true)}
        >
          Voir l'historique
        </button>
        <button 
          className={`filter-btn ${filter === 'success' ? 'active' : ''}`}
          onClick={() => setFilter('success')}
        >
          Succès ({history.filter(h => h.status === 'success').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
          onClick={() => setFilter('failed')}
        >
          Échecs ({history.filter(h => h.status === 'failed').length})
        </button>
      </div>

      <div className="separateur" />

      {/* Liste des tentatives */}
      <div className="history-list">
        {history.length === 0 ? (
          <div className="history-empty">
            <p>Aucune tentative trouvée</p>
          </div>
        ) : (
          history.map(attempt => (
            <div key={attempt.id} className="history-item">
              <div className="history-header">
                <div className="history-user">
                  <span className="history-username">{attempt.username}</span>
                  <span 
                    className="history-status"
                    style={{ color: getStatusColor(attempt.status) }}
                  >
                    {getStatusIcon(attempt.status)} {attempt.status === 'success' ? 'Succès' : 'Échec'}
                  </span>
                </div>
                <div className="history-time">
                  {formatDate(attempt.timestamp)}
                </div>
              </div>
              
              <div className="history-details">
                <div className="history-detail">
                  <span className="detail-label">IP:</span>
                  <span className="detail-value">{attempt.ip}</span>
                </div>
                <div className="history-detail">
                  <span className="detail-label">Étape:</span>
                  <span className="detail-value">{getStepLabel(attempt.step)}</span>
                </div>
                {attempt.error && (
                  <div className="history-detail">
                    <span className="detail-label">Erreur:</span>
                    <span className="detail-value error">{attempt.error}</span>
                  </div>
                )}
                <div className="history-detail">
                  <span className="detail-label">Appareil:</span>
                  <span className="detail-value device">{attempt.userAgent.split(' ')[0]}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="separateur" />

      <button className="btn btn-secondaire" onClick={loadHistory}>
        🔄 Actualiser
      </button>
    </div>
  );
}
