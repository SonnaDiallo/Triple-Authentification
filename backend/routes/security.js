const express = require('express');
const securityLogger = require('../services/securityLogger');

const router = express.Router();

router.get('/metrics', async (req, res) => {
  try {
    const range = req.query.range || '1h';
    const metrics = await securityLogger.getMetrics(range);
    res.json({ success: true, data: metrics, timestamp: new Date().toISOString(), range });
  } catch (err) {
    console.error('Erreur métriques:', err);
    res.status(500).json({ success: false, error: 'Impossible de récupérer les métriques' });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    let logs = await securityLogger.getRecentLogs(limit);

    if (req.query.level) {
      logs = logs.filter(l => l.severity === req.query.level);
    }
    if (req.query.search) {
      const s = req.query.search.toLowerCase();
      logs = logs.filter(l =>
        l.user.toLowerCase().includes(s) || l.ip.includes(s) || l.event_type.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, data: logs, count: logs.length, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('Erreur logs sécurité:', err);
    res.status(500).json({ success: false, error: 'Erreur récupération logs' });
  }
});

router.get('/alerts', async (req, res) => {
  try {
    const metrics = await securityLogger.getMetrics(req.query.range || '1h');
    const alertes = [];

    if (metrics.failed_attempts > 20) {
      const taux = Math.round((metrics.failed_attempts / metrics.total_attempts) * 100);
      alertes.push({
        type: 'warning',
        message: `Taux d'échec élevé : ${taux}%`,
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    }

    if (metrics.suspicious_activities > 0) {
      alertes.push({
        type: 'danger',
        message: `${metrics.suspicious_activities} activités suspectes détectées`,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }

    if (metrics.avg_auth_time > 5000) {
      alertes.push({
        type: 'warning',
        message: `Authentification lente : ${metrics.avg_auth_time}ms en moyenne`,
        severity: 'low',
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, data: alertes, count: alertes.length });
  } catch (err) {
    console.error('Erreur alertes:', err);
    res.status(500).json({ success: false, error: 'Erreur récupération alertes' });
  }
});

router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    services: { database: 'connected', email: 'connected', auth: 'operational' }
  });
});

module.exports = { router };
