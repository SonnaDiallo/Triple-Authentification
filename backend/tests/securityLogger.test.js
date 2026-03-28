// Mock Firestore pour éviter les vraies connexions
jest.mock('../firebase', () => ({
  db: () => ({
    collection: () => ({
      add: jest.fn().mockResolvedValue({ id: 'test-id' }),
      orderBy: () => ({
        limit: () => ({
          get: jest.fn().mockResolvedValue({ docs: [] })
        })
      }),
      where: () => ({
        get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
        where: () => ({
          get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
          where: () => ({
            get: jest.fn().mockResolvedValue({ size: 0, docs: [] })
          })
        })
      })
    })
  })
}));

const logger = require('../services/securityLogger');

describe('SecurityLogger.getSeverity', () => {

  test('AUTH_SUCCESS retourne info', () => {
    expect(logger.getSeverity('AUTH_SUCCESS')).toBe('info');
  });

  test('AUTH_FAILURE retourne warning', () => {
    expect(logger.getSeverity('AUTH_FAILURE')).toBe('warning');
  });

  test('BRUTE_FORCE_DETECTED retourne critical', () => {
    expect(logger.getSeverity('BRUTE_FORCE_DETECTED')).toBe('critical');
  });

  test('ACCOUNT_LOCKED retourne critical', () => {
    expect(logger.getSeverity('ACCOUNT_LOCKED')).toBe('critical');
  });

  test('SUSPICIOUS_IP retourne critical', () => {
    expect(logger.getSeverity('SUSPICIOUS_IP')).toBe('critical');
  });

  test('événement inconnu retourne info par défaut', () => {
    expect(logger.getSeverity('INCONNU')).toBe('info');
  });
});

describe('SecurityLogger.logEvent', () => {
  beforeEach(() => {
    logger.events = [];
  });

  test('crée un événement avec les bons champs', () => {
    const event = logger.logEvent('AUTH_SUCCESS', {
      username: 'alice',
      ip: '127.0.0.1',
      success: true
    });

    expect(event.event_type).toBe('AUTH_SUCCESS');
    expect(event.user).toBe('alice');
    expect(event.ip).toBe('127.0.0.1');
    expect(event.severity).toBe('info');
    expect(event.source).toBe('auth-mfa-service');
    expect(event.timestamp).toBeDefined();
  });

  test('utilise "anonymous" si pas de username', () => {
    const event = logger.logEvent('AUTH_FAILURE', { ip: '10.0.0.1' });
    expect(event.user).toBe('anonymous');
  });

  test('utilise "unknown" si pas d\'IP', () => {
    const event = logger.logEvent('AUTH_FAILURE', { username: 'bob' });
    expect(event.ip).toBe('unknown');
  });

  test('ajoute l\'événement en mémoire', () => {
    logger.logEvent('SESSION_CREATED', { username: 'alice' });
    logger.logEvent('SESSION_CREATED', { username: 'bob' });
    expect(logger.events).toHaveLength(2);
  });

  test('inclut les champs de conformité', () => {
    const event = logger.logEvent('AUTH_SUCCESS', { username: 'test' });
    expect(event.compliance.gdpr).toBe(true);
    expect(event.compliance.audit_ready).toBe(true);
    expect(event.compliance.retention_days).toBe(365);
  });

  test('success est true par défaut', () => {
    const event = logger.logEvent('AUTH_SUCCESS', { username: 'test' });
    expect(event.details.success).toBe(true);
  });

  test('success est false si explicitement indiqué', () => {
    const event = logger.logEvent('AUTH_FAILURE', {
      username: 'test',
      success: false
    });
    expect(event.details.success).toBe(false);
  });
});

describe('SecurityLogger - méthodes spécifiques', () => {
  beforeEach(() => { logger.events = []; });

  test('logAuthSuccess crée un événement AUTH_SUCCESS', () => {
    const event = logger.logAuthSuccess('alice', '127.0.0.1', 'sess-1', 1200, ['password', 'otp']);
    expect(event.event_type).toBe('AUTH_SUCCESS');
    expect(event.details.success).toBe(true);
    expect(event.details.factors).toBe('password,otp');
  });

  test('logAuthFailure crée un événement AUTH_FAILURE', () => {
    const event = logger.logAuthFailure('bob', '10.0.0.1', 'password', 'invalid_password', 'step1');
    expect(event.event_type).toBe('AUTH_FAILURE');
    expect(event.details.success).toBe(false);
  });

  test('logSuspiciousIP crée un événement SUSPICIOUS_IP', () => {
    const event = logger.logSuspiciousIP('1.2.3.4', 'eve', 'multiple_failed_attempts');
    expect(event.event_type).toBe('SUSPICIOUS_IP');
    expect(event.severity).toBe('critical');
  });

  test('logBruteForceDetected crée un événement BRUTE_FORCE_DETECTED', () => {
    const event = logger.logBruteForceDetected('5.6.7.8', 'mallory', 10, 5);
    expect(event.event_type).toBe('BRUTE_FORCE_DETECTED');
    expect(event.details.attempt_count).toBe(10);
    expect(event.details.time_window_minutes).toBe(5);
  });

  test('logAccountLocked crée un événement ACCOUNT_LOCKED', () => {
    const event = logger.logAccountLocked('charlie', '9.9.9.9', 'brute_force');
    expect(event.event_type).toBe('ACCOUNT_LOCKED');
    expect(event.severity).toBe('critical');
  });

  test('logSessionCreated crée un événement SESSION_CREATED', () => {
    const event = logger.logSessionCreated('alice', '127.0.0.1', 'sess-abc');
    expect(event.event_type).toBe('SESSION_CREATED');
    expect(event.user).toBe('alice');
  });

  test('logSessionExpired crée un événement SESSION_EXPIRED', () => {
    const event = logger.logSessionExpired('alice', 'sess-abc', 'timeout');
    expect(event.event_type).toBe('SESSION_EXPIRED');
  });
});

describe('SecurityLogger.getRecentLogs', () => {
  test('retourne un tableau', async () => {
    const logs = await logger.getRecentLogs(10);
    expect(Array.isArray(logs)).toBe(true);
  });

  test('accepte une limite', async () => {
    const logs = await logger.getRecentLogs(5);
    expect(logs.length).toBeLessThanOrEqual(5);
  });
});

describe('SecurityLogger.getMetrics', () => {
  test('retourne un objet avec les métriques', async () => {
    const metrics = await logger.getMetrics('1h');
    expect(typeof metrics).toBe('object');
  });

  test('accepte différentes plages de temps', async () => {
    const m1 = await logger.getMetrics('5m');
    const m2 = await logger.getMetrics('24h');
    expect(m1).toBeDefined();
    expect(m2).toBeDefined();
  });
});

describe('SecurityLogger.detectBruteForce', () => {

  test('retourne false si pas assez de tentatives', async () => {
    const result = await logger.detectBruteForce('127.0.0.1', 'alice');
    expect(result).toBe(false);
  });

  test('retourne un booléen', async () => {
    const result = await logger.detectBruteForce('192.168.1.1', 'bob');
    expect(typeof result).toBe('boolean');
  });
});
