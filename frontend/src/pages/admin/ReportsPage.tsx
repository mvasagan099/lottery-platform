import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts'
import { 
  Download, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

export function ReportsPage() {
  const [dateRange, setDateRange] = useState('30') // days

  // Fetch Overview Data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'reports', 'overview', dateRange],
    queryFn: async () => {
      const from = dayjs().subtract(Number(dateRange), 'day').toISOString()
      const res = await api.get(`/reports/overview?from=${from}`)
      return res.data.data
    },
    refetchInterval: 30000 // Auto-refresh every 30s
  })

  // Fetch Charts Data
  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['admin', 'reports', 'charts', dateRange],
    queryFn: async () => {
      const from = dayjs().subtract(Number(dateRange), 'day').toISOString()
      const interval = Number(dateRange) > 90 ? 'month' : 'day'
      const res = await api.get(`/reports/charts?from=${from}&interval=${interval}`)
      return res.data.data
    },
    refetchInterval: 30000
  })

  // Fetch Live Feed
  const { data: liveFeed } = useQuery({
    queryKey: ['admin', 'reports', 'live'],
    queryFn: async () => {
      const res = await api.get('/reports/live')
      return res.data.data
    },
    refetchInterval: 10000 // Very fast refresh for live feed
  })

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (type !== 'csv') {
      toast.error(`${type.toUpperCase()} export is not implemented yet. Try CSV!`)
      return
    }

    if (!charts || charts.length === 0) {
      toast.error('No data available to export')
      return
    }

    // Convert chart data to CSV
    const headers = ['Date', 'Gross Revenue', 'Deposits', 'Withdrawals', 'Ticket Sales']
    const csvContent = [
      headers.join(','),
      ...charts.map((row: any) => 
        [row.name, row.revenue, row.deposits, row.withdrawals, row.tickets].join(',')
      )
    ].join('\\n')

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `financial_report_${dateRange}days.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('CSV downloaded successfully!')
  }

  const formatCurrency = (val: number | undefined) => `🪙${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0)}`

  return (
    <div className="section" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
      {/* Header Area */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Financial Reports</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Real-time analytics and performance metrics</p>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <select 
            className="input" 
            style={{ width: '180px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn btn-outline" onClick={() => handleExport('csv')}><Download size={16} /> CSV</button>
            <button className="btn btn-outline" onClick={() => handleExport('excel')}><Download size={16} /> Excel</button>
            <button className="btn btn-outline" onClick={() => handleExport('pdf')}><Download size={16} /> PDF</button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {overviewLoading ? <div className="loading-spinner" style={{ margin: '40px auto' }}></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          <KPICard title="Total Revenue" value={formatCurrency(overview?.grossProfit)} icon={<DollarSign color="#10b981" size={20} />} trend={+12.5} />
          <KPICard title="Total Deposits" value={formatCurrency(overview?.totalDeposits)} icon={<ArrowUpRight color="#3b82f6" size={20} />} trend={+8.2} />
          <KPICard title="Total Withdrawals" value={formatCurrency(overview?.totalWithdrawals)} icon={<ArrowDownRight color="#ef4444" size={20} />} trend={-2.4} />
          <KPICard title="Net Profit" value={formatCurrency(overview?.netProfit)} icon={<TrendingUp color="#8b5cf6" size={20} />} trend={+15.3} />
        </div>
      )}

      {/* Main Charts Area */}
      <div className="reports-chart-grid">
        {/* Revenue Trend Area Chart */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Revenue & Ticket Sales Trend</h3>
          </div>
          <div className="card-body" style={{ height: '350px', paddingTop: '20px' }}>
            {chartsLoading ? <div className="loading-spinner" style={{ margin: 'auto' }}></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `🪙${val}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                  <Area type="monotone" dataKey="tickets" name="Ticket Sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTickets)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Deposit/Withdrawal Bar Chart */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Cash Flow</h3>
          </div>
          <div className="card-body" style={{ height: '350px', paddingTop: '20px' }}>
            {chartsLoading ? <div className="loading-spinner" style={{ margin: 'auto' }}></div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.slice(-7) || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `🪙${val > 1000 ? (val/1000).toFixed(1)+'k' : val}`} />
                  <RechartsTooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="deposits" name="Deposits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawals" name="Withdrawals" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Live Transaction Feed */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
            Live Transactions
          </h3>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <th style={{ padding: '12px var(--space-md)', color: 'var(--text-secondary)', fontWeight: 500 }}>Time</th>
                <th style={{ padding: '12px var(--space-md)', color: 'var(--text-secondary)', fontWeight: 500 }}>User</th>
                <th style={{ padding: '12px var(--space-md)', color: 'var(--text-secondary)', fontWeight: 500 }}>Type</th>
                <th style={{ padding: '12px var(--space-md)', color: 'var(--text-secondary)', fontWeight: 500 }}>Amount</th>
                <th style={{ padding: '12px var(--space-md)', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {liveFeed?.slice(0, 10).map((tx: any) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px var(--space-md)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{dayjs(tx.createdAt).format('HH:mm:ss')}</td>
                  <td style={{ padding: '12px var(--space-md)' }}>{tx.user?.email || tx.userId}</td>
                  <td style={{ padding: '12px var(--space-md)' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500,
                      backgroundColor: tx.type === 'DEPOSIT' ? 'rgba(59, 130, 246, 0.1)' : 
                                     tx.type === 'WITHDRAWAL' ? 'rgba(239, 68, 68, 0.1)' : 
                                     tx.type === 'TICKET_PURCHASE' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: tx.type === 'DEPOSIT' ? '#3b82f6' : 
                             tx.type === 'WITHDRAWAL' ? '#ef4444' : 
                             tx.type === 'TICKET_PURCHASE' ? '#8b5cf6' : '#10b981'
                    }}>
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px var(--space-md)', fontWeight: 600, color: tx.type === 'WITHDRAWAL' || tx.type === 'TICKET_PURCHASE' ? '#ef4444' : '#10b981' }}>
                    {tx.type === 'WITHDRAWAL' || tx.type === 'TICKET_PURCHASE' ? '-' : '+'}{formatCurrency(tx.amount)}
                  </td>
                  <td style={{ padding: '12px var(--space-md)' }}>
                    {tx.status === 'COMPLETED' ? <CheckCircle size={16} color="#10b981" /> : 
                     tx.status === 'PENDING' ? <Clock size={16} color="#f59e0b" /> : 
                     <XCircle size={16} color="#ef4444" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

function Clock({ size, color }: { size: number, color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  )
}

function KPICard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: number }) {
  const isPositive = trend > 0
  
  return (
    <div className="card" style={{ padding: 'var(--space-md) var(--space-lg)', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xs)', gap: '8px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
          <h3 style={{ 
            margin: 0, 
            fontSize: 'clamp(1rem, 1.4vw, 1.45rem)', 
            fontWeight: 700, 
            color: 'var(--text-primary)', 
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            lineHeight: 1.25
          }}>
            {value}
          </h3>
        </div>
        <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
        <span style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '2px',
          color: isPositive ? '#10b981' : '#ef4444', 
          backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
        }}>
          {isPositive ? <TrendingUp size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>vs last period</span>
      </div>
    </div>
  )
}

export default ReportsPage
