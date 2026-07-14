export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'ERROR';
export type AuditStatus = 'SUCCESS' | 'FAILED' | 'PENDING';
export type AuditModule = 
  | 'AUTHENTICATION' 
  | 'USERS' 
  | 'KYC' 
  | 'WALLET' 
  | 'DEPOSITS' 
  | 'WITHDRAWALS' 
  | 'LOTTERY' 
  | 'AFFILIATES' 
  | 'CMS' 
  | 'PROMOTIONS' 
  | 'SYSTEM' 
  | 'API';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  userId?: string;
  userEmail?: string;
  userRole?: string;
  module: AuditModule;
  action: string;
  resource?: string;
  ipAddress: string;
  country?: string;
  location?: string;
  timezone?: string;
  browser?: string;
  os?: string;
  device?: string;
  status: AuditStatus;
  severity: AuditSeverity;
  executionTimeMs?: number;
  
  // Advanced Details
  sessionId?: string;
  apiEndpoint?: string;
  httpMethod?: string;
  httpStatus?: number;
  requestPayload?: any;
  responsePayload?: any;
  previousData?: any;
  updatedData?: any;
  adminNotes?: string;
  correlationId?: string;
}

export interface AuditStats {
  totalLogs: number;
  criticalEvents: number;
  securityEvents: number;
  failedLogins: number;
  adminActions: number;
  apiRequests: number;
  trends: {
    totalLogs: number;
    criticalEvents: number;
    securityEvents: number;
    failedLogins: number;
  };
}

export interface AuditFilters {
  search?: string;
  module?: AuditModule[];
  severity?: AuditSeverity[];
  status?: AuditStatus[];
  startDate?: string;
  endDate?: string;
}

export interface AuditAnalytics {
  timeline: { time: string; count: number; errors: number }[];
  moduleDistribution: { name: string; value: number }[];
  severityDistribution: { name: string; value: number }[];
}
