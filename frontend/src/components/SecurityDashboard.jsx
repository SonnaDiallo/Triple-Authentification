import { useState, useEffect } from 'react';
import { securityAPI } from '../api/security';
import './SecurityDashboard.css';

export default function SecurityDashboard({ user, onLogout }) {
  const [metrics, setMetrics] = useState({
    totalAttempts: 0,
    successRate: 0,
    failureRate: 0,
    activeSessions: 0,
    blockedIPs: 0,
    suspiciousActivity: 0,
    avgAuthTime: 0,
    serviceHealth: 'healthy'
  });

  const [attempts, setAttempts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const metricsData = await securityAPI.getMetrics(refreshInterval === 5000 ? '5m' : '15m');
        const alertsData = await securityAPI.getAlerts();
        const logsData = await securityAPI.getLogs({ limit: 10 });

        setMetrics({
          totalAttempts: metricsData.total_attempts || 0,
          successRate: metricsData.successful_attempts ? 
            Math.round((metricsData.successful_attempts / metricsData.total_attempts) * 100) : 0,
          failureRate: metricsData.failed_attempts ? 
            Math.round((metricsData.failed_attempts / metricsData.total_attempts) * 100) : 0,
          activeSessions: metricsData.unique_users || 0,
          blockedIPs: metricsData.suspicious_activities || 0,
          suspiciousActivity: metricsData.suspicious_activities || 0,
          avgAuthTime: metricsData.avg_auth_time || 0,
          serviceHealth: metricsData.suspicious_activities > 5 ? 'warning' : 'healthy'
        });

        setAlerts(alertsData);
        setAttempts(logsData.map(log => ({
          id: log.id,
          timestamp: new Date(log.timestamp),
          username: log.user,
          ip: log.ip,
          status: log.details.success ? 'success' : 'failure',
          factor: log.details.factor || 'unknown',
          duration: log.details.duration_ms || 0
        })));
        
      } catch (error) {
        console.error('Erreur récupération données:', error);
        // si le backend est pas dispo on affiche des zéros plutôt que de tout casser
        setMetrics({
          totalAttempts: 0,
          successRate: 0,
          failureRate: 0,
          activeSessions: 0,
          blockedIPs: 0,
          suspiciousActivity: 0,
          avgAuthTime: 0,
          serviceHealth: 'warning'
        });
        setAlerts([{
          type: 'warning',
          message: 'Erreur de connexion au service de monitoring',
          timestamp: new Date()
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status) => {
    if (status === 'success') return '#10b981';
    if (status === 'failure') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#6b7280';
  };

  const getHealthColor = (health) => {
    if (health === 'healthy') return '#10b981';
    if (health === 'warning') return '#f59e0b';
    if (health === 'critical') return '#ef4444';
    return '#6b7280';
  };

  if (loading) {
    return <div className="loading">Chargement du dashboard...</div>;
  }

  return (
    <div className="security-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Tableau de Bord Sécurité</h1>
          <p>Monitoring temps réel de l'authentification multi-facteurs</p>
        </div>
        <div className="dashboard-controls">
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="refresh-select"
          >
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
          <button className="btn btn-danger" onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-section">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert alert-${alert.type}`}>
              <span className="alert-icon">
              {alert.type === 'danger' ? '!' : '?'}
            </span>
              <span className="alert-message">{alert.message}</span>
              <span className="alert-time">
                {alert.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">Auth</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.totalAttempts}</div>
            <div className="metric-label">Tentatives totales</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">OK</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.successRate}%</div>
            <div className="metric-label">Taux de succès</div>
          </div>
          <div className="metric-sparkline positive">↑</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">KO</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.failureRate}%</div>
            <div className="metric-label">Taux d'échec</div>
          </div>
          <div className="metric-sparkline negative">↓</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">S</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.activeSessions}</div>
            <div className="metric-label">Sessions actives</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">X</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.blockedIPs}</div>
            <div className="metric-label">IPs bloquées</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">!</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.suspiciousActivity}</div>
            <div className="metric-label">Activités suspectes</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">T</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.avgAuthTime}ms</div>
            <div className="metric-label">Temps moyen</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">H</div>
          <div className="metric-content">
            <div className="metric-value" style={{ color: getHealthColor(metrics.serviceHealth) }}>
              {metrics.serviceHealth === 'healthy' ? 'OK' : '?'}
            </div>
            <div className="metric-label">Santé service</div>
          </div>
        </div>
      </div>

      <div className="recent-attempts">
        <h2>Tentatives d'authentification récentes</h2>
        <div className="attempts-table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Utilisateur</th>
                <th>IP</th>
                <th>Statut</th>
                <th>Facteur</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map(attempt => (
                <tr key={attempt.id}>
                  <td>{attempt.timestamp.toLocaleTimeString()}</td>
                  <td>{attempt.username}</td>
                  <td>{attempt.ip}</td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(attempt.status) }}
                    >
                      {attempt.status === 'success' ? 'OK' : 'ERR'} {attempt.status}
                    </span>
                  </td>
                  <td>{attempt.factor}</td>
                  <td>{attempt.duration}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="audit-events">
        <h2>Événements d'audit récents</h2>
        <div className="events-list">
          {[
            { type: 'AUTH_SUCCESS', user: 'admin', ip: '192.168.1.100', time: '14:32:15' },
            { type: 'AUTH_FAILURE', user: 'unknown', ip: '192.168.1.200', time: '14:31:45', reason: 'Invalid password' },
            { type: 'SUSPICIOUS_IP', user: '-', ip: '192.168.1.105', time: '14:30:22', reason: 'Multiple failures' },
            { type: 'SESSION_CREATED', user: 'jean.dupont', ip: '192.168.1.102', time: '14:29:30' },
          ].map((event, i) => (
            <div key={i} className="event-item">
              <span className="event-type">{event.type}</span>
              <span className="event-user">{event.user}</span>
              <span className="event-ip">{event.ip}</span>
              <span className="event-time">{event.time}</span>
              {event.reason && <span className="event-reason">{event.reason}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
