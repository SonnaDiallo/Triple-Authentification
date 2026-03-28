const API_BASE = '/api/security';

export const securityAPI = {
  async getMetrics(timeRange = '1h') {
    const response = await fetch(`${API_BASE}/metrics?range=${timeRange}`);
    if (!response.ok) {
      throw new Error('Erreur métriques');
    }
    const data = await response.json();
    return data.data;
  },

  async getLogs(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.level) params.append('level', options.level);
    if (options.search) params.append('search', options.search);

    const response = await fetch(`${API_BASE}/logs?${params}`);
    if (!response.ok) {
      throw new Error('Erreur logs');
    }
    const data = await response.json();
    return data.data;
  },

  async getAlerts(timeRange = '1h') {
    const response = await fetch(`${API_BASE}/alerts?range=${timeRange}`);
    if (!response.ok) {
      throw new Error('Erreur alertes');
    }
    const data = await response.json();
    return data.data;
  },

  async getHealth() {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      throw new Error('Erreur santé');
    }
    return await response.json();
  }
};
