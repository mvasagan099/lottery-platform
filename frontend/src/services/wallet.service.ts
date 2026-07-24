import api from './api'
import type { Wallet, Transaction, Deposit, Withdrawal, PaginatedResponse, ApiResponse } from '@/types'

export const walletService = {
  get: () => api.get<ApiResponse<Wallet>>('/wallet'),

  requestEmailOtp: () => api.post<ApiResponse>('/wallet/request-email-otp'),

  getTransactions: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    api.get<PaginatedResponse<Transaction>>('/wallet/transactions', { params }),

  getDeposits: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Deposit>>('/wallet/deposits', { params }),

  getWithdrawals: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Withdrawal>>('/wallet/withdrawals', { params }),

  initiateDeposit: (amount: number, gateway: string, paymentMethodId?: string) =>
    api.post<ApiResponse<any>>('/wallet/deposit', { amount, gateway, paymentMethodId }),

  confirmDeposit: (id: string, gatewayRef?: string) =>
    api.post<ApiResponse>(`/wallet/deposit/${id}/confirm`, { gatewayRef }),

  requestWithdrawal: (payload: {
    amount: number
    gateway: string
    accountDetails: { accountName: string; accountNumber?: string; bsb?: string; paypalEmail?: string }
    totp?: string
  }) => api.post<ApiResponse>('/wallet/withdraw', payload),

  redeemCoupon: (code: string) => api.post<ApiResponse<any>>('/wallet/redeem', { code }),

  transferToCouponWallet: (amount: number, totp?: string) => api.post<ApiResponse<any>>('/wallet/transfer', { amount, totp }),
}
