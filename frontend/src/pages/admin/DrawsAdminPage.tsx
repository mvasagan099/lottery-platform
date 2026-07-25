import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  useReactTable, getCoreRowModel, flexRender, SortingState 
} from '@tanstack/react-table'
import api from '../../services/api'
import { DrawExecutionDrawer } from './DrawExecutionDrawer'
import { ScheduleDrawDrawer } from './ScheduleDrawDrawer'
import { 
  Search, Radio, Calendar, CheckCircle, Ticket, AlertCircle 
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

export default function DrawsAdminPage() {
  const queryClient = useQueryClient()
  
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [showCompleted, setShowCompleted] = useState(false)
  
  const [searchParams, setSearchParams] = useState({
    page: 1, limit: 10, search: '', status: ''
  })
  const [searchInput, setSearchInput] = useState('')
  
  const [selectedDrawId, setSelectedDrawId] = useState<string | null>(null)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchParams(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'draws', searchParams, sorting, showCompleted],
    queryFn: async () => {
      const query = new URLSearchParams({
        page: String(searchParams.page),
        limit: String(searchParams.limit),
        search: searchParams.search,
        status: searchParams.status,
        hideCompleted: String(!showCompleted),
      })
      if (sorting.length > 0) {
        query.append('sortField', sorting[0].id)
        query.append('sortDir', sorting[0].desc ? 'desc' : 'asc')
      }
      const res = await api.get(`/admin/draws?${query.toString()}`)
      return res.data
    },
    placeholderData: (prev: any) => prev,
  })

  const records = (data as any)?.data || []
  const totalItems = (data as any)?.pagination?.total || 0
  const totalPages = (data as any)?.pagination?.pages || 0
  const stats = (data as any)?.stats || { totalDraws: 0, liveDraws: 0, scheduledDraws: 0, totalSales: 0 }

  const columns = useMemo(() => [
    {
      accessorKey: 'drawNumber',
      header: 'Draw ID',
      cell: (info: any) => {
        return (
          <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
            #{info.getValue() || info.row.original.id.substring(0, 8)}
          </div>
        )
      }
    },
    {
      accessorKey: 'game',
      header: 'Game',
      cell: (info: any) => {
        const game = info.getValue()
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontWeight: 600 }}>{game?.name}</div>
            {game?.badgeText && (
              <span style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{game.badgeText}</span>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: 'scheduledAt',
      header: 'Scheduled Date',
      cell: (info: any) => (
        <div style={{ color: 'var(--text-secondary)' }}>
          {dayjs(info.getValue()).format('MMM D, YYYY h:mm A')}
        </div>
      )
    },
    {
      accessorKey: 'jackpotAmount',
      header: 'Jackpot',
      cell: (info: any) => <div style={{ fontWeight: 600, color: '#f59e0b' }}>🪙{Number(info.getValue()).toLocaleString()}</div>
    },
    {
      accessorKey: 'totalSales',
      header: 'Total Sales',
      cell: (info: any) => <div style={{ fontWeight: 500 }}>🪙{Number(info.getValue()).toLocaleString()}</div>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info: any) => {
        const status = info.getValue()
        let color = '#3b82f6'
        let bg = 'rgba(59, 130, 246, 0.1)'
        if (status === 'COMPLETED') {
          color = '#10b981'
          bg = 'rgba(16, 185, 129, 0.1)'
        } else if (status === 'SCHEDULED') {
          color = '#8b5cf6'
          bg = 'rgba(139, 92, 246, 0.1)'
        } else if (status === 'CANCELLED') {
          color = '#ef4444'
          bg = 'rgba(239, 68, 68, 0.1)'
        }
        
        return (
          <span style={{ 
            padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: bg, color: color
          }}>
            {status}
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (info: any) => (
        <button 
          className="btn btn-outline btn-sm" 
          onClick={() => setSelectedDrawId(info.row.original.id)}
        >
          {info.row.original.status === 'COMPLETED' ? 'View Results' : 'Execute Draw'}
        </button>
      )
    }
  ], [])

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  return (
    <div className="section" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Draw Management</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Manage live draws, enter winning numbers, and verify results.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsScheduleOpen(true)}>Schedule New Draw</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <SummaryCard title="Live/Pending Draws" value={stats.liveDraws} icon={<Radio size={20} color="#3b82f6" />} />
        <SummaryCard title="Scheduled Draws" value={stats.scheduledDraws} icon={<Calendar size={20} color="#8b5cf6" />} />
        <SummaryCard title="Completed Draws" value={stats.totalDraws - stats.scheduledDraws - stats.liveDraws} icon={<CheckCircle size={20} color="#10b981" />} />
        <SummaryCard title="Total Ticket Sales" value={`🪙${Number(stats.totalSales).toLocaleString()}`} icon={<Ticket size={20} color="#f59e0b" />} />
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="card-body" style={{ padding: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ position: 'relative', width: '280px', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search by Draw ID or Game..." 
                style={{ width: '100%', paddingLeft: 36, height: '40px', borderRadius: 'var(--radius-md)' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <select 
              className="form-select" 
              style={{ width: '180px', height: '40px', borderRadius: 'var(--radius-md)', padding: '0 12px' }} 
              value={searchParams.status} 
              onChange={e => setSearchParams({...searchParams, status: e.target.value, page: 1})}
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress (Live)</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Show Completed:</span>
            <button
              type="button"
              onClick={() => {
                setShowCompleted(!showCompleted)
                setSearchParams(prev => ({ ...prev, page: 1 }))
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                backgroundColor: showCompleted ? '#10b981' : '#6b7280',
                color: 'white',
                boxShadow: showCompleted ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {showCompleted ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem', cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: 'auto' }}></div></td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <br />No draws found.
                </td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: row.getIsSelected() ? 'var(--bg-hover)' : 'transparent' }}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={{ padding: '16px' }}>
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
        <div style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Showing page {searchParams.page} of {totalPages} ({totalItems} records)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-outline" 
              disabled={searchParams.page === 1}
              onClick={() => setSearchParams({ ...searchParams, page: searchParams.page - 1 })}
            >
              Previous
            </button>
            <button 
              className="btn btn-outline" 
              disabled={searchParams.page >= totalPages}
              onClick={() => setSearchParams({ ...searchParams, page: searchParams.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedDrawId && (
        <DrawExecutionDrawer drawId={selectedDrawId} onClose={() => setSelectedDrawId(null)} />
      )}

      <ScheduleDrawDrawer isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} />
    </div>
  )
}

function SummaryCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</p>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</h3>
        </div>
        <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
          {icon}
        </div>
      </div>
    </div>
  )
}
