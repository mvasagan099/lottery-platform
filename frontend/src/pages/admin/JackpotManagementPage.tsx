import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import {
  TrendingUp, DollarSign, RotateCcw, Award, Settings, RefreshCw,
  ChevronDown, ChevronUp, Trophy, AlertCircle, History, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── API helper calls ─────────────────────────────────────────────────────────

async function fetchJackpotPools() {
  const res = await api.get('/admin/jackpot')
  return res.data?.data || []
}

async function fetchJackpotPool(gameId: string) {
  const res = await api.get(`/admin/jackpot/${gameId}`)
  return res.data?.data
}

async function fetchJackpotHistory(gameId: string, page = 1) {
  const res = await api.get(`/admin/jackpot/${gameId}/history?page=${page}&limit=10`)
  return res.data
}

async function fetchJackpotTransactions(gameId: string, page = 1, type?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '15' })
  if (type) params.set('type', type)
  const res = await api.get(`/admin/jackpot/${gameId}/transactions?${params}`)
  return res.data
}

async function updateJackpotConfig(gameId: string, data: { baseJackpot?: number; jackpotContribPct?: number }) {
  const res = await api.patch(`/admin/jackpot/${gameId}/config`, data)
  return res.data
}

async function manualAdjust(gameId: string, data: { amount: number; reason: string }) {
  const res = await api.post(`/admin/jackpot/${gameId}/adjust`, data)
  return res.data
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatBadge({ label, value, icon, color = 'var(--color-primary)' }: any) {
  return (
    <div style={{
      padding: '16px 20px',
      background: 'var(--bg-secondary)',
      borderRadius: '14px',
      border: '1.5px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color, fontSize: '13px', fontWeight: 600 }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}

// ── Type badge ───────────────────────────────────────────────────────────────

const TX_COLORS: Record<string, string> = {
  CONTRIBUTION: '#10b981',
  JACKPOT_WIN: '#f59e0b',
  JACKPOT_RESET: '#3b82f6',
  JACKPOT_ROLLOVER: '#8b5cf6',
  MANUAL_ADJUSTMENT: '#ef4444',
}

function TxTypeBadge({ type }: { type: string }) {
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: 700,
      background: `${TX_COLORS[type] || '#6b7280'}22`,
      color: TX_COLORS[type] || '#6b7280',
      letterSpacing: '0.04em',
    }}>
      {type.replace(/_/g, ' ')}
    </span>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function JackpotManagementPage() {
  const qc = useQueryClient()
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [txPage, setTxPage] = useState(1)
  const [txTypeFilter, setTxTypeFilter] = useState('')

  // Config form state
  const [baseJackpot, setBaseJackpot] = useState('')
  const [contribPct, setContribPct] = useState('')
  // Adjust form state
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  // Queries
  const { data: pools = [], isLoading: poolsLoading } = useQuery({
    queryKey: ['jackpot-pools'],
    queryFn: fetchJackpotPools,
    refetchInterval: 30000,
  })

  // Auto-select first game pool when loaded
  useEffect(() => {
    if (!selectedGameId && pools.length > 0) {
      setSelectedGameId(pools[0].gameId)
    }
  }, [pools, selectedGameId])

  const { data: pool } = useQuery({
    queryKey: ['jackpot-pool', selectedGameId],
    queryFn: () => fetchJackpotPool(selectedGameId!),
    enabled: !!selectedGameId,
  })

  const { data: historyData } = useQuery({
    queryKey: ['jackpot-history', selectedGameId, historyPage],
    queryFn: () => fetchJackpotHistory(selectedGameId!, historyPage),
    enabled: !!selectedGameId,
  })

  const { data: txData } = useQuery({
    queryKey: ['jackpot-txns', selectedGameId, txPage, txTypeFilter],
    queryFn: () => fetchJackpotTransactions(selectedGameId!, txPage, txTypeFilter || undefined),
    enabled: !!selectedGameId,
  })

  // Mutations
  const configMutation = useMutation({
    mutationFn: (data: any) => updateJackpotConfig(selectedGameId!, data),
    onSuccess: () => {
      toast.success('Jackpot configuration updated!')
      qc.invalidateQueries({ queryKey: ['jackpot-pool', selectedGameId] })
      qc.invalidateQueries({ queryKey: ['jackpot-pools'] })
      setConfigOpen(false)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to update config'),
  })

  const adjustMutation = useMutation({
    mutationFn: (data: any) => manualAdjust(selectedGameId!, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Jackpot adjusted!')
      qc.invalidateQueries({ queryKey: ['jackpot-pool', selectedGameId] })
      qc.invalidateQueries({ queryKey: ['jackpot-pools'] })
      qc.invalidateQueries({ queryKey: ['jackpot-txns', selectedGameId] })
      setAdjustOpen(false)
      setAdjustAmount('')
      setAdjustReason('')
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to adjust jackpot'),
  })

  const fmt = (n: any) => `🪙${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtDate = (d: string) => new Date(d).toLocaleString()

  return (
    <div className="section">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="section-title" style={{ marginBottom: '4px' }}>🎯 Jackpot Management</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Progressive jackpot pools, rollover tracking, and financial audit logs</p>
          </div>
        </div>

        {/* Game Selection */}
        <div className="card card-body" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select Game
          </h3>
          {poolsLoading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading pools...</div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {pools.map((p: any) => (
                <button
                  key={p.gameId}
                  onClick={() => { setSelectedGameId(p.gameId); setHistoryPage(1); setTxPage(1) }}
                  className={`btn ${selectedGameId === p.gameId ? 'btn-primary' : 'btn-outline'} btn-sm`}
                  style={{ fontWeight: 700 }}
                >
                  {p.game?.name || p.gameId}
                  <span style={{ marginLeft: '8px', opacity: 0.75, fontWeight: 400, fontSize: '12px' }}>
                    {fmt(p.currentJackpot)}
                  </span>
                </button>
              ))}
              {pools.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  No jackpot pools found. Pools are created automatically when the first draw is processed for each game.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pool Detail */}
        {selectedGameId && pool && (
          <>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <StatBadge label="Current Jackpot" value={fmt(pool.currentJackpot)} icon={<Trophy size={14} />} color="#f59e0b" />
              <StatBadge label="Base Jackpot" value={fmt(pool.baseJackpot)} icon={<DollarSign size={14} />} color="#10b981" />
              <StatBadge label="Contribution %" value={`${Number(pool.jackpotContribPct).toFixed(1)}%`} icon={<TrendingUp size={14} />} color="#3b82f6" />
              <StatBadge label="Total Rollover" value={fmt(pool.rolloverAmount)} icon={<RotateCcw size={14} />} color="#8b5cf6" />
              <StatBadge label="Consecutive Rollovers" value={pool.consecutiveRollovers} icon={<RefreshCw size={14} />} color="#ef4444" />
              <StatBadge label="Largest Jackpot Ever" value={fmt(pool.largestJackpot)} icon={<Award size={14} />} color="#f59e0b" />
              <StatBadge label="Total Jackpot Paid" value={fmt(pool.totalPaid)} icon={<DollarSign size={14} />} color="#10b981" />
              <StatBadge label="Last Draw Contribution" value={fmt(pool.currentDrawContrib)} icon={<TrendingUp size={14} />} color="var(--text-muted)" />
            </div>

            {/* Admin Actions */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setConfigOpen(!configOpen)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Settings size={14} />
                Configure
                {configOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setAdjustOpen(!adjustOpen)} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: '#ef4444' }}>
                <AlertCircle size={14} />
                Manual Adjustment
                {adjustOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Config Panel */}
            {configOpen && (
              <div className="card card-body" style={{ marginBottom: '24px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '20px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚙️ Jackpot Configuration
                </h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: '600px', marginBottom: '16px' }}>
                  <div style={{ width: '220px' }}>
                    <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Base Jackpot (coins)</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 'var(--radius-md)' }}
                      placeholder={String(Number(pool.baseJackpot))}
                      value={baseJackpot}
                      onChange={e => setBaseJackpot(e.target.value)}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Current: {fmt(pool.baseJackpot)}
                    </div>
                  </div>
                  <div style={{ width: '220px' }}>
                    <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Ticket Sales Contribution (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 'var(--radius-md)' }}
                      placeholder={String(Number(pool.jackpotContribPct))}
                      value={contribPct}
                      min="1" max="100"
                      onChange={e => setContribPct(e.target.value)}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Current: {Number(pool.jackpotContribPct).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={configMutation.isPending || (!baseJackpot && !contribPct)}
                    onClick={() => configMutation.mutate({
                      ...(baseJackpot && { baseJackpot: Number(baseJackpot) }),
                      ...(contribPct && { jackpotContribPct: Number(contribPct) }),
                    })}
                    style={{ fontWeight: 600, padding: '8px 16px', borderRadius: 'var(--radius-md)' }}
                  >
                    {configMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfigOpen(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Manual Adjust Panel */}
            {adjustOpen && (
              <div className="card card-body" style={{ marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.04)', padding: '20px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ Manual Jackpot Adjustment
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Use positive values to increase and negative values to decrease the jackpot pool. This action is fully audit-logged.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start', maxWidth: '700px', marginBottom: '16px' }}>
                  <div style={{ width: '200px' }}>
                    <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Amount (+ or -)</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 'var(--radius-md)' }}
                      placeholder="e.g. 50000 or -10000"
                      value={adjustAmount}
                      onChange={e => setAdjustAmount(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <label className="form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Reason (required)</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: 'var(--radius-md)' }}
                      placeholder="Provide a clear reason for this adjustment"
                      value={adjustReason}
                      onChange={e => setAdjustReason(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={adjustMutation.isPending || !adjustAmount || !adjustReason || adjustReason.length < 5 || Number(adjustAmount) === 0}
                    onClick={() => adjustMutation.mutate({ amount: Number(adjustAmount), reason: adjustReason })}
                    style={{ backgroundColor: '#ef4444', color: 'white', fontWeight: 600, padding: '8px 16px', borderRadius: 'var(--radius-md)' }}
                  >
                    {adjustMutation.isPending ? 'Applying...' : 'Apply Adjustment'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAdjustOpen(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* History Table */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={16} />
                  <h2 className="modal-title">Jackpot Draw History</h2>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {historyData?.pagination?.total ?? 0} records
                </div>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Draw #</th>
                      <th>Before Draw</th>
                      <th>Contribution</th>
                      <th>Rollover</th>
                      <th>Winners</th>
                      <th>Paid Out</th>
                      <th>After Draw</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(historyData?.data || []).map((h: any) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 700 }}>#{h.drawNumber}</td>
                        <td>{fmt(h.jackpotBefore)}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>+{fmt(h.ticketContrib)}</td>
                        <td style={{ color: '#8b5cf6' }}>{Number(h.rolloverAmount) > 0 ? `🔄 ${fmt(h.rolloverAmount)}` : '—'}</td>
                        <td>
                          {h.winnerCount > 0
                            ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>🏆 {h.winnerCount}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>
                          }
                        </td>
                        <td style={{ color: h.jackpotPaid > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: h.jackpotPaid > 0 ? 700 : 400 }}>
                          {h.jackpotPaid > 0 ? fmt(h.jackpotPaid) : '—'}
                        </td>
                        <td style={{ fontWeight: 700 }}>{fmt(h.jackpotAfter)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{fmtDate(h.createdAt)}</td>
                      </tr>
                    ))}
                    {(historyData?.data || []).length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No history yet — history is created when draws are processed</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {historyData?.pagination && historyData.pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
                  <button className="btn btn-ghost btn-sm" disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>← Prev</button>
                  <span style={{ lineHeight: '32px', fontSize: '13px', color: 'var(--text-muted)' }}>Page {historyPage} of {historyData.pagination.pages}</span>
                  <button className="btn btn-ghost btn-sm" disabled={historyPage >= historyData.pagination.pages} onClick={() => setHistoryPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </div>

            {/* Transactions Table */}
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} />
                  <h2 className="modal-title">Jackpot Transaction Audit Log</h2>
                </div>
                <select
                  className="form-select btn-sm"
                  style={{ width: 'auto', padding: '4px 24px 4px 10px', height: '32px', borderRadius: '8px' }}
                  value={txTypeFilter}
                  onChange={e => { setTxTypeFilter(e.target.value); setTxPage(1) }}
                >
                  <option value="">All Types</option>
                  <option value="CONTRIBUTION">Contribution</option>
                  <option value="JACKPOT_WIN">Jackpot Win</option>
                  <option value="JACKPOT_RESET">Reset</option>
                  <option value="JACKPOT_ROLLOVER">Rollover</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                </select>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Before</th>
                      <th>After</th>
                      <th>Description</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(txData?.data || []).map((tx: any) => (
                      <tr key={tx.id}>
                        <td><TxTypeBadge type={tx.type} /></td>
                        <td style={{ fontWeight: 700, color: Number(tx.amount) >= 0 ? '#10b981' : '#ef4444' }}>
                          {Number(tx.amount) >= 0 ? '+' : ''}{fmt(tx.amount)}
                        </td>
                        <td style={{ fontSize: '12px' }}>{fmt(tx.balanceBefore)}</td>
                        <td style={{ fontSize: '12px', fontWeight: 600 }}>{fmt(tx.balanceAfter)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description || '—'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{fmtDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                    {(txData?.data || []).length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No transactions yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {txData?.pagination && txData.pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
                  <button className="btn btn-ghost btn-sm" disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}>← Prev</button>
                  <span style={{ lineHeight: '32px', fontSize: '13px', color: 'var(--text-muted)' }}>Page {txPage} of {txData.pagination.pages}</span>
                  <button className="btn btn-ghost btn-sm" disabled={txPage >= txData.pagination.pages} onClick={() => setTxPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </div>
          </>
        )}

        {!selectedGameId && !poolsLoading && pools.length > 0 && (
          <div className="card card-body" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Trophy size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p>Select a game above to view its jackpot pool details, history, and transactions.</p>
          </div>
        )}
      </div>
    </div>
  )
}
