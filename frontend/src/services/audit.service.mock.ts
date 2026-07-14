import { AuditLog, AuditModule, AuditSeverity, AuditStatus, AuditFilters, AuditStats, AuditAnalytics } from '../types/audit';

// ── Mock Data Generator ──────────────────────────────────────────────────

const generateMockLogs = (count: number): AuditLog[] => {
  const modules: AuditModule[] = ['AUTHENTICATION', 'USERS', 'KYC', 'WALLET', 'DEPOSITS', 'WITHDRAWALS', 'LOTTERY', 'SYSTEM', 'API'];
  const actions = {
    AUTHENTICATION: ['Login Success', 'Login Failed', 'Logout', 'Password Changed'],
    USERS: ['User Created', 'User Edited', 'User Suspended'],
    KYC: ['KYC Approved', 'KYC Rejected'],
    WALLET: ['Wallet Credited', 'Wallet Debited'],
    DEPOSITS: ['Deposit Created', 'Deposit Approved', 'Deposit Failed'],
    WITHDRAWALS: ['Withdrawal Requested', 'Withdrawal Approved', 'Withdrawal Rejected'],
    LOTTERY: ['Game Created', 'Draw Started', 'Ticket Purchased'],
    SYSTEM: ['Backup Started', 'Maintenance Enabled', 'System Error'],
    API: ['API Request Success', 'API Request Failed', 'Rate Limit Exceeded'],
    AFFILIATES: ['Commission Paid'],
    CMS: ['Banner Published', 'Page Updated'],
    PROMOTIONS: ['Promo Created']
  } as Record<AuditModule, string[]>;

  const logs: AuditLog[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const module = modules[Math.floor(Math.random() * modules.length)];
    const moduleActions = actions[module];
    const action = moduleActions[Math.floor(Math.random() * moduleActions.length)];
    
    let severity: AuditSeverity = 'INFO';
    let status: AuditStatus = 'SUCCESS';

    if (action.includes('Failed') || action.includes('Rejected') || action.includes('Error') || action.includes('Exceeded')) {
      status = 'FAILED';
      severity = action.includes('Error') || action.includes('Exceeded') ? 'ERROR' : 'WARNING';
    }
    if (action === 'Maintenance Enabled' || action === 'User Suspended') {
      severity = 'CRITICAL';
    }

    const timestamp = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(); // Last 30 days

    logs.push({
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      userId: Math.random() > 0.2 ? `usr_${Math.floor(Math.random() * 1000)}` : undefined,
      userEmail: Math.random() > 0.2 ? `user${Math.floor(Math.random() * 1000)}@example.com` : undefined,
      userRole: Math.random() > 0.8 ? 'ADMIN' : 'USER',
      module,
      action,
      resource: `${module.toLowerCase()}_${Math.floor(Math.random() * 100)}`,
      ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      country: ['US', 'AU', 'GB', 'DE', 'FR'][Math.floor(Math.random() * 5)],
      browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
      os: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'][Math.floor(Math.random() * 5)],
      device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
      status,
      severity,
      executionTimeMs: Math.floor(Math.random() * 1500),
      httpMethod: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
      httpStatus: status === 'SUCCESS' ? 200 : (severity === 'ERROR' ? 500 : 400),
      apiEndpoint: `/api/v1/${module.toLowerCase()}`,
      requestPayload: Math.random() > 0.5 ? { foo: 'bar', timestamp } : undefined,
      responsePayload: Math.random() > 0.5 ? { success: status === 'SUCCESS' } : undefined,
    });
  }
  
  // Sort by timestamp descending
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const MOCK_LOGS = generateMockLogs(2500);

// ── Mock Service ─────────────────────────────────────────────────────────

export const auditService = {
  
  async getLogs(params: {
    page: number;
    limit: number;
    filters?: AuditFilters;
    sortBy?: string;
    sortDesc?: boolean;
  }) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    let filtered = [...MOCK_LOGS];

    // Apply filters
    if (params.filters) {
      if (params.filters.search) {
        const s = params.filters.search.toLowerCase();
        filtered = filtered.filter(l => 
          l.id.toLowerCase().includes(s) || 
          l.action.toLowerCase().includes(s) ||
          l.userEmail?.toLowerCase().includes(s) ||
          l.ipAddress.includes(s)
        );
      }
      if (params.filters.module?.length) {
        filtered = filtered.filter(l => params.filters!.module!.includes(l.module));
      }
      if (params.filters.severity?.length) {
        filtered = filtered.filter(l => params.filters!.severity!.includes(l.severity));
      }
      if (params.filters.status?.length) {
        filtered = filtered.filter(l => params.filters!.status!.includes(l.status));
      }
    }

    // Apply sorting
    if (params.sortBy) {
      filtered.sort((a: any, b: any) => {
        const aVal = a[params.sortBy!];
        const bVal = b[params.sortBy!];
        if (aVal < bVal) return params.sortDesc ? 1 : -1;
        if (aVal > bVal) return params.sortDesc ? -1 : 1;
        return 0;
      });
    }

    // Pagination
    const start = (params.page - 1) * params.limit;
    const paginated = filtered.slice(start, start + params.limit);

    return {
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        page: params.page,
        limit: params.limit,
        pages: Math.ceil(filtered.length / params.limit)
      }
    };
  },

  async getStats(): Promise<AuditStats> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      totalLogs: MOCK_LOGS.length,
      criticalEvents: MOCK_LOGS.filter(l => l.severity === 'CRITICAL').length,
      securityEvents: MOCK_LOGS.filter(l => l.module === 'AUTHENTICATION').length,
      failedLogins: MOCK_LOGS.filter(l => l.action === 'Login Failed').length,
      adminActions: MOCK_LOGS.filter(l => l.userRole === 'ADMIN').length,
      apiRequests: MOCK_LOGS.filter(l => l.module === 'API').length,
      trends: {
        totalLogs: 12.5,
        criticalEvents: -5.2,
        securityEvents: 2.1,
        failedLogins: -15.4
      }
    };
  },

  async getAnalytics(): Promise<AuditAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate dummy timeline
    const timeline = Array.from({length: 14}).map((_, i) => ({
      time: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
      count: Math.floor(Math.random() * 500) + 100,
      errors: Math.floor(Math.random() * 50)
    }));

    const moduleDistribution = [
      { name: 'Auth', value: 400 },
      { name: 'Wallet', value: 300 },
      { name: 'Lottery', value: 250 },
      { name: 'System', value: 100 },
    ];

    const severityDistribution = [
      { name: 'Info', value: 1800 },
      { name: 'Warning', value: 400 },
      { name: 'Error', value: 200 },
      { name: 'Critical', value: 100 },
    ];

    return { timeline, moduleDistribution, severityDistribution };
  },

  async getLogById(id: string): Promise<AuditLog | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_LOGS.find(l => l.id === id) || null;
  }
};
