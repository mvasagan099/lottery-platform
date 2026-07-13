import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  flexRender, getCoreRowModel, useReactTable,
  ColumnDef, PaginationState 
} from '@tanstack/react-table'
import api from '../../services/api'
import { WithdrawalDetailsDrawer } from './WithdrawalDetailsDrawer' // force ts update
import { 
  Search, ArrowDownRight, Clock, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function WithdrawalsAdminPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['admin', 'withdrawals', pagination.pageIndex, pagination.pageSize, statusFilter, debouncedSearch],
    queryFn: async () => {
      const res = await api.get('/admin/withdrawals', {
        params: {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          status: statusFilter || undefined,
          search: debouncedSearch || undefined
        }
      })
      return res.data
    }
  })

  const withdrawals = queryData?.data || []
  const totalCount = queryData?.pagination?.total || 0
  const stats = queryData?.stats || []

  // Derived stats
  const totalPending = stats.find((s: any) => s.status === 'PENDING')?._count || 0
  const totalPendingAmount = stats.find((s: any) => s.status === 'PENDING')?._sum?.amount || 0
  const totalCompleted = stats.find((s: any) => s.status === 'COMPLETED')?._count || 0
  const totalCompletedAmount = stats.find((s: any) => s.status === 'COMPLETED')?._sum?.amount || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning">Pending</span>
      case 'IN_PROGRESS': return <span className="badge badge-info">Processing</span>
      case 'COMPLETED': return <span className="badge badge-success">Completed</span>
      case 'FAILED': 
      case 'CANCELLED': return <span className="badge badge-error">{status === 'FAILED' ? 'Failed' : 'Rejected'}</span>
      default: return <span className="badge">{status}</span>
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'id',
      header: 'Tx ID',
      cell: info => <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{(info.getValue() as string).substring(0, 8).toUpperCase()}</span>
    },
    {
      accessorKey: 'wallet.user',
      header: 'User',
      cell: info => {
        const user = info.getValue() as any
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--primary-color)' }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{user.username}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: info => <strong style={{ color: 'var(--text-primary)' }}>🪙 {Number(info.getValue()).toLocaleString()}</strong>
    },
    {
      accessorKey: 'gateway',
      header: 'Method',
      cell: info => <span style={{ textTransform: 'capitalize' }}>{(info.getValue() as string).toLowerCase()}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => getStatusBadge(info.getValue() as string)
    },
    {
      accessorKey: 'createdAt',
      header: 'Requested',
      cell: info => <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{formatDistanceToNow(new Date(info.getValue() as string))} ago</span>
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <button 
          className="btn btn-outline" 
          style={{ padding: '6px 12px', fontSize: '13px' }}
          onClick={() => setSelectedWithdrawalId(row.original.id)}
        >
          Review
        </button>
      )
    }
  ]

  const table = useReactTable({
    data: withdrawals,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="section">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Withdrawals</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Review, process, and manage user payout requests.</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
          
          <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Pending Requests</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalPending}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Amount Pending</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>🪙 {Number(totalPendingAmount).toLocaleString()}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <ArrowDownRight size={20} />
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Total Paid</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>🪙 {Number(totalCompletedAmount).toLocaleString()}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle size={20} />
            </div>
          </div>

        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '250px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search by ID, username, email..." 
                  style={{ paddingLeft: '40px', borderRadius: 'var(--radius-md)' }}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <select className="form-select" style={{ borderRadius: 'var(--radius-md)', padding: '8px 12px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({...p, pageIndex: 0})) }}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Rejected</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Data Grid */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}><div className="btn-spinner" style={{ borderColor: 'var(--primary-color)', width: '24px', height: '24px' }}></div></td></tr>
                ) : withdrawals.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No withdrawals found matching criteria.</td></tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} style={{ padding: '16px', verticalAlign: 'middle' }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, totalCount)} of {totalCount} entries
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</button>
              <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</button>
            </div>
          </div>
        </div>

      </div>

      {selectedWithdrawalId && (
        <WithdrawalDetailsDrawer withdrawalId={selectedWithdrawalId} onClose={() => setSelectedWithdrawalId(null)} />
      )}
    </div>
  )
}
