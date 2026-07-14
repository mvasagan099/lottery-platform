export type TicketStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'TECHNICAL' | 'DEPOSITS' | 'WITHDRAWALS' | 'LOTTERY' | 'AFFILIATE' | 'KYC' | 'FRAUD' | 'OTHER';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderType: 'USER' | 'AGENT' | 'SYSTEM';
  content: string; // HTML for rich text
  isInternal: boolean;
  attachments: { url: string; name: string; type: string }[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  
  // User info
  userId: string;
  username: string;
  userEmail: string;
  userAvatar?: string;
  userCountry?: string;
  userVipLevel?: string;
  userKycStatus?: string;
  
  // Assignment
  assignedAgentId?: string;
  assignedAgentName?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string;
  resolvedAt?: string;

  // SLA
  slaBreached: boolean;
  firstResponseTimeMs?: number;
  resolutionTimeMs?: number;
  
  // Custom Data
  relatedTransactionId?: string;
  tags: string[];
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
  averageResponseTimeMin: number;
  csatScore: number;
  trends: {
    totalTickets: number;
    openTickets: number;
    csatScore: number;
  };
}

export interface SupportAnalytics {
  ticketsPerDay: { date: string; created: number; resolved: number }[];
  categoryDistribution: { name: string; value: number }[];
  csatDistribution: { name: string; value: number }[];
}

export interface TicketFilters {
  search?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  startDate?: string;
  endDate?: string;
  assignedAgentId?: string;
}
