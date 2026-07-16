import { SupportTicket, TicketMessage, TicketStatus, TicketPriority, TicketCategory, TicketFilters, SupportStats, SupportAnalytics } from '../types/support';

// ── Mock Data Generator ──────────────────────────────────────────────────

const generateMockTickets = (count: number): SupportTicket[] => {
  const statuses: TicketStatus[] = ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'];
  const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const categories: TicketCategory[] = ['TECHNICAL', 'DEPOSITS', 'WITHDRAWALS', 'LOTTERY', 'AFFILIATE', 'KYC', 'FRUSD', 'OTHER'];
  const agents = ['Agent Smith', 'Agent Johnson', 'Agent Davis', undefined];

  const tickets: SupportTicket[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    
    const createdDaysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString();
    
    tickets.push({
      id: `TKT-${10000 + i}`,
      subject: `Issue with ${category.toLowerCase()} transaction`,
      status,
      priority,
      category,
      userId: `usr_${Math.floor(Math.random() * 1000)}`,
      username: `user_${Math.floor(Math.random() * 1000)}`,
      userEmail: `user${Math.floor(Math.random() * 1000)}@example.com`,
      userCountry: ['US', 'AU', 'GB', 'DE', 'FR'][Math.floor(Math.random() * 5)],
      userVipLevel: Math.random() > 0.8 ? 'Platinum' : 'Standard',
      userKycStatus: Math.random() > 0.1 ? 'VERIFIED' : 'PENDING',
      assignedAgentId: agent ? `agent_${agent.replace(' ', '').toLowerCase()}` : undefined,
      assignedAgentName: agent,
      createdAt,
      updatedAt: new Date(now.getTime() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
      lastReplyAt: status !== 'CLOSED' ? new Date(now.getTime() - Math.floor(Math.random() * 12 * 60 * 60 * 1000)).toISOString() : undefined,
      slaBreached: status === 'OPEN' && priority === 'URGENT' && Math.random() > 0.7,
      tags: [category.toLowerCase()],
    });
  }
  
  return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const MOCK_TICKETS = generateMockTickets(500);

const generateMockMessages = (ticketId: string): TicketMessage[] => {
  return [
    {
      id: `msg_1`,
      ticketId,
      senderId: 'user_123',
      senderName: 'Customer',
      senderType: 'USER',
      content: '<p>Hello, I am having an issue with my recent withdrawal. It has been pending for 3 days.</p>',
      isInternal: false,
      attachments: [],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `msg_2`,
      ticketId,
      senderId: 'agent_smith',
      senderName: 'Agent Smith',
      senderType: 'AGENT',
      content: '<p>Hi there, let me check the status of your transaction. Please hold on.</p>',
      isInternal: false,
      attachments: [],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `msg_3`,
      ticketId,
      senderId: 'agent_smith',
      senderName: 'Agent Smith',
      senderType: 'AGENT',
      content: '<p>Note: Checked with finance team, there was a delay with the banking partner. Should be resolved today.</p>',
      isInternal: true,
      attachments: [],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    }
  ];
};

// ── Mock Service ─────────────────────────────────────────────────────────

export const supportService = {
  
  async getTickets(params: {
    page: number;
    limit: number;
    filters?: TicketFilters;
    sortBy?: string;
    sortDesc?: boolean;
  }) {
    await new Promise(resolve => setTimeout(resolve, 600));

    let filtered = [...MOCK_TICKETS];

    if (params.filters) {
      if (params.filters.search) {
        const s = params.filters.search.toLowerCase();
        filtered = filtered.filter(t => 
          t.id.toLowerCase().includes(s) || 
          t.subject.toLowerCase().includes(s) ||
          t.userEmail.toLowerCase().includes(s)
        );
      }
      if (params.filters.status?.length) {
        filtered = filtered.filter(t => params.filters!.status!.includes(t.status));
      }
      if (params.filters.priority?.length) {
        filtered = filtered.filter(t => params.filters!.priority!.includes(t.priority));
      }
      if (params.filters.category?.length) {
        filtered = filtered.filter(t => params.filters!.category!.includes(t.category));
      }
    }

    if (params.sortBy) {
      filtered.sort((a: any, b: any) => {
        const aVal = a[params.sortBy!];
        const bVal = b[params.sortBy!];
        if (aVal < bVal) return params.sortDesc ? 1 : -1;
        if (aVal > bVal) return params.sortDesc ? -1 : 1;
        return 0;
      });
    }

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

  async getStats(): Promise<SupportStats> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      totalTickets: MOCK_TICKETS.length,
      openTickets: MOCK_TICKETS.filter(t => t.status === 'OPEN').length,
      pendingTickets: MOCK_TICKETS.filter(t => t.status === 'PENDING').length,
      resolvedTickets: MOCK_TICKETS.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
      urgentTickets: MOCK_TICKETS.filter(t => t.priority === 'URGENT').length,
      averageResponseTimeMin: 45,
      csatScore: 4.8,
      trends: {
        totalTickets: 5.2,
        openTickets: -12.4,
        csatScore: 0.2
      }
    };
  },

  async getAnalytics(): Promise<SupportAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const ticketsPerDay = Array.from({length: 14}).map((_, i) => ({
      date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}),
      created: Math.floor(Math.random() * 50) + 10,
      resolved: Math.floor(Math.random() * 45) + 10
    }));

    const categoryDistribution = [
      { name: 'Withdrawals', value: 120 },
      { name: 'Technical', value: 90 },
      { name: 'Deposits', value: 80 },
      { name: 'KYC', value: 60 },
      { name: 'Other', value: 150 },
    ];

    const csatDistribution = [
      { name: '5 Stars', value: 300 },
      { name: '4 Stars', value: 120 },
      { name: '3 Stars', value: 40 },
      { name: '2 Stars', value: 10 },
      { name: '1 Star', value: 5 },
    ];

    return { ticketsPerDay, categoryDistribution, csatDistribution };
  },

  async getTicketById(id: string): Promise<SupportTicket | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_TICKETS.find(t => t.id === id) || null;
  },

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockMessages(ticketId);
  },
  
  async sendReply(ticketId: string, content: string, isInternal: boolean): Promise<TicketMessage> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      id: `msg_${Math.random()}`,
      ticketId,
      senderId: 'admin_1',
      senderName: 'Admin',
      senderType: 'AGENT',
      content,
      isInternal,
      attachments: [],
      createdAt: new Date().toISOString(),
    };
  }
};
