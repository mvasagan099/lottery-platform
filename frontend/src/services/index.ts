import api from './api'
import type { Ticket, PaginatedResponse, ApiResponse } from '@/types'

export const ticketsService = {
  getAll: (params?: { page?: number; limit?: number; status?: string; gameId?: string }) =>
    api.get<PaginatedResponse<Ticket>>('/tickets', { params }),

  getById: (id: string) => api.get<ApiResponse<Ticket>>(`/tickets/${id}`),

  checkTicket: (id: string) => api.post<ApiResponse<any>>(`/tickets/${id}/check`),

  claimPrize: (id: string) => api.post<ApiResponse<{ amount: number }>>(`/tickets/${id}/claim`),

  validateByNumber: (ticketNumber: string) =>
    api.get<ApiResponse<any>>(`/tickets/validate/${ticketNumber}`),
}

export const notificationsService = {
  getAll: (params?: { page?: number; limit?: number; unread?: boolean }) =>
    api.get<any>('/notifications', { params }),

  markRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllRead: () => api.post('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),

  getPreferences: () => api.get('/notifications/preferences'),

  updatePreferences: (prefs: Record<string, boolean>) =>
    api.patch('/notifications/preferences', prefs),

  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
}

export const supportService = {
  getFaqs: (category?: string) =>
    api.get('/support/faqs', { params: { category } }),

  getTickets: (params?: { page?: number; limit?: number }) =>
    api.get('/support/tickets', { params }),

  createTicket: (payload: { subject: string; category: string; message: string; priority?: string }) =>
    api.post('/support/tickets', payload),

  getTicket: (id: string) => api.get(`/support/tickets/${id}`),

  addMessage: (id: string, message: string) =>
    api.post(`/support/tickets/${id}/messages`, { message }),
}

export const affiliateService = {
  getProfile: () => api.get('/affiliates/me'),
  getCommissions: (params?: { page?: number; limit?: number }) =>
    api.get('/affiliates/commissions', { params }),
  getReferrals: (params?: { page?: number; limit?: number }) =>
    api.get('/affiliates/referrals', { params }),
  getStats: () => api.get('/affiliates/stats'),
}

export const cmsService = {
  getPage: (slug: string) => api.get(`/cms/pages/${slug}`),
  getBanners: (position?: string) => api.get('/cms/banners', { params: { position } }),
  getPromotions: () => api.get('/cms/promotions'),
  getFaqs: () => api.get('/support/faqs'),
  getPublicSettings: () => api.get('/cms/settings'),
}

export const adminService = {
  getStats: () => api.get('/admin/stats'),

  getUsers: (params?: { page?: number; limit?: number; search?: string; status?: string; role?: string }) =>
    api.get('/admin/users', { params }),

  getUser: (id: string) => api.get(`/admin/users/${id}`),

  updateUserStatus: (id: string, status: string) =>
    api.patch(`/admin/users/${id}/status`, { status }),

  updateUserRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),

  getKYCQueue: (params?: { page?: number; status?: string }) =>
    api.get('/admin/kyc', { params }),

  reviewKYC: (id: string, status: string, notes?: string) =>
    api.post(`/admin/kyc/${id}/review`, { status, notes }),

  creditBonus: (userId: string, amount: number, reason: string) =>
    api.post(`/admin/users/${userId}/credit`, { amount, reason }),

  getGames: () => api.get('/games'),

  updateGame: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/games/${id}`, data),

  createDraw: (data: Record<string, unknown>) => api.post('/draws', data),
  runDraw: (id: string, data: Record<string, unknown>) => api.post(`/draws/${id}/run`, data),
  publishDraw: (id: string) => api.post(`/draws/${id}/publish`),
  calculatePrizes: (id: string) => api.post(`/draws/${id}/calculate-prizes`),

  getPendingWithdrawals: () => api.get('/payments/withdrawals/pending'),
  approveWithdrawal: (id: string) => api.post(`/payments/withdrawals/${id}/approve`),
  rejectWithdrawal: (id: string, reason: string) =>
    api.post(`/payments/withdrawals/${id}/reject`, { reason }),

  getAuditLogs: (params?: { page?: number; userId?: string; action?: string }) =>
    api.get('/reports/audit-logs', { params }),

  getReportSummary: () => api.get('/reports/summary'),
  getRevenueReport: (from?: string, to?: string) =>
    api.get('/reports/revenue', { params: { from, to } }),

  getBanners: () => api.get('/cms/banners/all'),
  createBanner: (data: Record<string, unknown>) => api.post('/cms/banners', data),
  updateBanner: (id: string, data: Record<string, unknown>) => api.put(`/cms/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete(`/cms/banners/${id}`),

  getSettings: () => api.get('/cms/settings/all'),
  updateSetting: (key: string, value: string) => api.put(`/cms/settings/${key}`, { value }),

  getSupportQueue: (params?: { page?: number; status?: string }) =>
    api.get('/support/admin/queue', { params }),

  replyToSupport: (ticketId: string, message: string) =>
    api.post(`/support/tickets/${ticketId}/messages`, { message }),

  updateSupportStatus: (id: string, status: string) =>
    api.patch(`/support/tickets/${id}/status`, { status }),

  getAffiliates: (params?: { page?: number }) =>
    api.get('/affiliates/admin/all', { params }),

  updateAffiliateCommission: (id: string, rate: number) =>
    api.patch(`/affiliates/admin/${id}/commission`, { rate }),
}
