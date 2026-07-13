import api from './api'
import type { Game, Draw, PaginatedResponse, ApiResponse } from '@/types'

export const gamesService = {
  getAll: () => api.get<ApiResponse<Game[]>>('/games'),

  getBySlug: (slug: string) => api.get<ApiResponse<Game>>(`/games/${slug}`),

  getResults: (slug: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<Draw>>(`/games/${slug}/results`, { params: { page, limit } }),

  getJackpot: (slug: string) =>
    api.get<ApiResponse<{ jackpot: number; gameName: string; nextDraw: Draw | null }>>(`/games/${slug}/jackpot`),

  purchase: (payload: {
    gameId: string
    drawId?: string
    lines: { numbers: number[]; supplementary?: number[]; powerball?: number }[]
    isQuickPick: boolean
    draws: number
    isSyndicate?: boolean
  }) => api.post<ApiResponse<any>>('/games/purchase', payload),

  quickPick: (gameId: string, lines = 1) =>
    api.post<ApiResponse<{ numbers: number[]; powerball?: number }[]>>('/games/quick-pick', { gameId, lines }),

  getDraws: (params?: { gameId?: string; status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Draw>>('/draws', { params }),

  getNextDraw: (gameSlug: string) =>
    api.get<ApiResponse<Draw>>(`/draws/next/${gameSlug}`),
}
