import React, { useState, useEffect } from 'react';
import './LogsViewer.css';

export default function LogsViewer({ onRetour }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [stats, setStats] = useState({ total: 0, filtered: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    const role = sessionStorage.getItem('userRole') || 'user';
    if (role !== 'admin') {
      setError('Accès refusé : droits administratifs requis');
      setLoading(false);
      return;
    }
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        limit: '100',
        ...(level && { level }),
        ...(search && { search })
      });
      
      const response = await fetch(`/api/logs?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('❌ Accès refusé : vous devez être connecté en tant qu\'administrateur');
          return;
        }
        if (response.status === 403) {
          setError('❌ Accès refusé : droits administratifs requis');
          return;
        }
        throw new Error('Erreur lors du chargement des logs');
      }
      
      const data = await response.json();
      
      setLogs(data.logs);
      setStats({ total: data.total, filtered: data.filtered });
    } catch (error) {
      console.error('Erreur chargement logs:', error);
      setError('Erreur de communication avec le serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = sessionStorage.getItem('userRole') || 'user';
    if (role === 'admin') fetchLogs();
  }, [level, search]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, search, level]);

  const clearLogs = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider tous les logs ?')) return;
    
    try {
      const response = await fetch('/api/logs', { method: 'DELETE' });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('❌ Accès refusé : droits administratifs requis');
          return;
        }
        throw new Error('Erreur lors du vidage des logs');
      }
      
      setLogs([]);
      setStats({ total: 0, filtered: 0 });
    } catch (error) {
      console.error('Erreur vidage logs:', error);
      setError('❌ Erreur lors du vidage des logs');
    }
  };

  const exportLogs = () => window.open('/api/logs/export', '_blank');

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getLogColor = (log) => {
    if (log.url.includes('error') || log.url.includes('401') || log.url.includes('500')) {
      return '#ef4444'; // rouge
    }
    if (log.url.includes('step') || log.url.includes('auth')) {
      return '#3b82f6'; // bleu
    }
    if (log.url.includes('register')) {
      return '#10b981'; // vert
    }
    return '#6b7280'; // gris
  };

  return (
    <div className="logs-viewer">
      <div className="logs-header">
        <button className="btn-retour" onClick={onRetour} title="Retour">←</button>
        
        <h2>Gestion des Logs</h2>
        
        {error && (
          <div className="error-message">
            Accès refusé : vous devez être connecté en tant qu\'administrateur
          </div>
        )}
        
        <div className="logs-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
            className="filter-select"
          >
            <option value="">Tous les logs</option>
            <option value="auth">Authentification</option>
            <option value="register">Inscription</option>
            <option value="error">Erreurs</option>
            <option value="step">Étapes</option>
            <option value="otp">Code OTP</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
          >
            {autoRefresh ? 'Auto-refresh' : 'Auto-refresh'}
          </button>
          
          <button onClick={exportLogs} className="export-btn">
            Exporter
          </button>
          
          <button onClick={clearLogs} className="clear-btn">
            Vider
          </button>
        </div>
        
        <div className="logs-stats">
          <span className="stat">
            Total: <strong>{stats.total}</strong>
          </span>
          <span className="stat">
            Filtrés: <strong>{stats.filtered}</strong>
          </span>
          <span className="stat">
            Auto-refresh: <strong>{autoRefresh ? 'ON' : 'OFF'}</strong>
          </span>
        </div>
      </div>

      <div className="logs-container">
        {loading ? (
          <div className="logs-loading">
            <div className="spinner"></div>
            <p>Chargement des logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="logs-empty">
            <p>Aucun log disponible</p>
          </div>
        ) : (
          <div className="logs-list">
            {logs.map((log) => (
              <div key={log.id} className="log-entry">
                <div className="log-time" style={{ color: getLogColor(log) }}>
                  {formatTime(log.timestamp)}
                </div>
                
                <div className="log-details">
                  <div className="log-main">
                    <span className="log-method" style={{ 
                      backgroundColor: getLogColor(log),
                      color: 'white' 
                    }}>
                      {log.method}
                    </span>
                    
                    <span className="log-url">
                      {log.url}
                    </span>
                    
                    <span className="log-username">
                      👤 {log.username}
                    </span>
                  </div>
                  
                  <div className="log-meta">
                    <span className="log-ip">
                      🌐 {log.ip}
                    </span>
                    
                    {log.body && (
                      <details className="log-body">
                        <summary>📋 Body</summary>
                        <pre>{JSON.stringify(log.body, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
