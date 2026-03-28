const { db } = require('../firebase');

class SecurityLogger {
  constructor() {
    // garde les events en mémoire aussi, utile pour les tests
    this.events = [];
  }

  logEvent(eventType, data) {
    const event = {
      timestamp: new Date().toISOString(),
      event_type: eventType,
      severity: this.getSeverity(eventType),
      source: 'auth-mfa-service',
      user: data.username || data.user || 'anonymous',
      ip: data.ip || data.clientIP || 'unknown',
      user_agent: data.userAgent || 'unknown',
      session_id: data.sessionId || 'none',
      details: {
        ...data,
        auth_step: data.step || 'unknown',
        factor: data.factor || 'none',
        duration_ms: data.duration || 0,
        success: data.success !== false
      },
      compliance: {
        gdpr: true,
        audit_ready: true,
        retention_days: 365
      }
    };

    this.events.push(event);
    console.log(JSON.stringify(event));
    this.saveToFirestore(event);

    return event;
  }

  getSeverity(eventType) {
    const niveaux = {
      AUTH_SUCCESS: 'info',
      AUTH_FAILURE: 'warning',
      MFA_ENROLLED: 'info',
      MFA_REVOKED: 'warning',
      ACCOUNT_LOCKED: 'critical',
      SESSION_CREATED: 'info',
      SESSION_EXPIRED: 'info',
      SUSPICIOUS_IP: 'critical',
      BRUTE_FORCE_DETECTED: 'critical',
      RATE_LIMIT_EXCEEDED: 'warning'
    };
    return niveaux[eventType] || 'info';
  }

  async saveToFirestore(event) {
    try {
      await db().collection('security_logs').add({ ...event, created_at: new Date() });
    } catch (err) {
      console.error('Impossible de sauvegarder le log dans Firestore:', err);
    }
  }

  logAuthSuccess(username, ip, sessionId, duration, factors) {
    return this.logEvent('AUTH_SUCCESS', {
      username, ip, sessionId, duration,
      factors: factors.join(','),
      success: true
    });
  }

  logAuthFailure(username, ip, factor, reason, step) {
    return this.logEvent('AUTH_FAILURE', { username, ip, factor, reason, step, success: false });
  }

  logSuspiciousIP(ip, username, reason) {
    return this.logEvent('SUSPICIOUS_IP', { ip, username, reason, threat_level: 'medium' });
  }

  logBruteForceDetected(ip, username, attemptCount, timeWindow) {
    return this.logEvent('BRUTE_FORCE_DETECTED', {
      ip, username,
      attempt_count: attemptCount,
      time_window_minutes: timeWindow,
      threat_level: 'high'
    });
  }

  logAccountLocked(username, ip, reason) {
    return this.logEvent('ACCOUNT_LOCKED', { username, ip, reason, action: 'account_locked' });
  }

  logSessionCreated(username, ip, sessionId) {
    return this.logEvent('SESSION_CREATED', { username, ip, sessionId });
  }

  logSessionExpired(username, sessionId, reason) {
    return this.logEvent('SESSION_EXPIRED', { username, sessionId, reason });
  }

  async getRecentLogs(limit = 100) {
    try {
      const snap = await db()
        .collection('security_logs')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Erreur récupération logs:', err);
      return [];
    }
  }

  async getMetrics(timeRange = '1h') {
    try {
      const debut = new Date(Date.now() - this.getTimeRangeMs(timeRange));
      const snap = await db()
        .collection('security_logs')
        .where('created_at', '>=', debut)
        .get();

      const logs = snap.docs.map(d => d.data());

      return {
        total_attempts: logs.length,
        successful_attempts: logs.filter(l => l.details.success).length,
        failed_attempts: logs.filter(l => !l.details.success).length,
        unique_users: [...new Set(logs.map(l => l.user))].length,
        unique_ips: [...new Set(logs.map(l => l.ip))].length,
        suspicious_activities: logs.filter(l => l.severity === 'critical').length,
        avg_auth_time: this.calculateAvgAuthTime(logs),
        events_by_type: this.groupEventsByType(logs),
        events_by_severity: this.groupEventsBySeverity(logs)
      };
    } catch (err) {
      console.error('Erreur métriques:', err);
      return {};
    }
  }

  getTimeRangeMs(range) {
    const table = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    };
    return table[range] || table['1h'];
  }

  calculateAvgAuthTime(logs) {
    const avec = logs.filter(l => l.details.duration_ms > 0);
    if (!avec.length) return 0;
    const total = avec.reduce((s, l) => s + l.details.duration_ms, 0);
    return Math.round(total / avec.length);
  }

  groupEventsByType(logs) {
    return logs.reduce((acc, l) => {
      acc[l.event_type] = (acc[l.event_type] || 0) + 1;
      return acc;
    }, {});
  }

  groupEventsBySeverity(logs) {
    return logs.reduce((acc, l) => {
      acc[l.severity] = (acc[l.severity] || 0) + 1;
      return acc;
    }, {});
  }

  async detectBruteForce(ip, username, windowMinutes = 5, maxAttempts = 5) {
    try {
      const depuis = new Date(Date.now() - windowMinutes * 60 * 1000);
      const snap = await db()
        .collection('security_logs')
        .where('ip', '==', ip)
        .where('event_type', '==', 'AUTH_FAILURE')
        .where('created_at', '>=', depuis)
        .get();

      if (snap.size >= maxAttempts) {
        this.logBruteForceDetected(ip, username, snap.size, windowMinutes);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erreur détection brute force:', err);
      return false;
    }
  }
}

module.exports = new SecurityLogger();
