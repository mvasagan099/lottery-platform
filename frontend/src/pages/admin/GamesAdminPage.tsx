import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  useReactTable, getCoreRowModel, flexRender, SortingState 
} from '@tanstack/react-table'
import api from '../../services/api'
import { GameProfileDrawer } from './GameProfileDrawer'
import { CreateGameDrawer } from './CreateGameDrawer'
import { 
  Search, Dices, DollarSign, Activity, Percent, Ban, CheckCircle, Calendar 
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

export default function GamesAdminPage() {
  const queryClient = useQueryClient()
  
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [rowSelection, setRowSelection] = useState({})
  
  const [searchParams, setSearchParams] = useState({
    page: 1, limit: 10, search: '', status: ''
  })
  const [searchInput, setSearchInput] = useState('')
  
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchParams(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'games', searchParams, sorting],
    queryFn: async () => {
      const sortField = sorting.length > 0 ? sorting[0].id : 'createdAt'
      const sortDir = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc'
      
      const query = new URLSearchParams({
        page: String(searchParams.page),
        limit: String(searchParams.limit),
        search: searchParams.search,
        status: searchParams.status,
        sortField,
        sortDir
      })
      const res = await api.get(`/admin/games?${query.toString()}`)
      return res.data
    },
    placeholderData: (prev: any) => prev,
  })

  const bulkMutation = useMutation({
    mutationFn: async ({ recordIds, action }: { recordIds: string[], action: 'DISABLE' | 'ENABLE' }) => {
      return api.post('/admin/games/bulk-action', { recordIds, action })
    },
    onSuccess: (res) => {
      toast.success(res.data.message)
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['admin', 'games'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Bulk action failed')
  })

  const records = (data as any)?.data || []
  const totalItems = (data as any)?.pagination?.total || 0
  const totalPages = (data as any)?.pagination?.pages || 0
  const stats = (data as any)?.stats || { totalGames: 0, activeGames: 0, totalJackpots: 0 }

  const handleBulkAction = (action: 'DISABLE' | 'ENABLE') => {
    const selectedIds = Object.keys(rowSelection).map(idx => records[idx as any].id)
    if (selectedIds.length === 0) return toast.error('No records selected')
    bulkMutation.mutate({ recordIds: selectedIds, action })
  }

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }: any) => (
        <input 
          type="checkbox" 
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: any) => (
        <input 
          type="checkbox" 
          checked={row.getIsSelected()} 
          onChange={row.getToggleSelectedHandler()}
        />
      )
    },
    {
      accessorKey: 'name',
      header: 'Game',
      cell: (info: any) => {
        const name = info.getValue()
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary-color), var(--color-accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>/{info.row.original.slug}</div>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'jackpotAmount',
      header: 'Advertised Jackpot',
      cell: (info: any) => <div style={{ fontWeight: 600, color: '#f59e0b' }}>🪙{Number(info.getValue()).toLocaleString()}</div>
    },
    {
      accessorKey: 'ticketPrice',
      header: 'Ticket Price',
      cell: (info: any) => <div style={{ fontWeight: 500 }}>🪙{Number(info.getValue()).toFixed(2)}</div>
    },
    {
      accessorKey: 'drawSchedule',
      header: 'Schedule',
      cell: (info: any) => <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{info.getValue()}</div>
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: (info: any) => {
        const isActive = info.getValue()
        return (
          <span style={{ 
            padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isActive ? '#10b981' : '#ef4444' 
          }}>
            {isActive ? 'ACTIVE' : 'DISABLED'}
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
          onClick={() => setSelectedGameId(info.row.original.id)}
        >
          Manage
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Games Management</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Configure games, jackpots, draws, and prize divisions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>Create Game</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <SummaryCard title="Total Games" value={stats.totalGames} icon={<Dices size={20} color="#3b82f6" />} />
        <SummaryCard title="Active Games" value={stats.activeGames} icon={<CheckCircle size={20} color="#10b981" />} />
        <SummaryCard title="Total Advertised Jackpots" value={`🪙${Number(stats.totalJackpots).toLocaleString(undefined, {minimumFractionDigits: 2})}`} icon={<DollarSign size={20} color="#f59e0b" />} />
        <SummaryCard title="Upcoming Draws" value="12" icon={<Calendar size={20} color="#8b5cf6" />} />
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="card-body" style={{ padding: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: 'var(--space-md)', flex: 1 }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search by game name or slug..." 
                style={{ width: '100%', paddingLeft: 36, borderRadius: 'var(--radius-md)' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <select className="form-select" style={{ borderRadius: 'var(--radius-md)', padding: '8px 12px' }} value={searchParams.status} onChange={e => setSearchParams({...searchParams, status: e.target.value, page: 1})}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Disabled Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginRight: '8px' }}>
              {Object.keys(rowSelection).length} selected
            </span>
            <button className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }} disabled={Object.keys(rowSelection).length === 0} onClick={() => handleBulkAction('ENABLE')}>Bulk Enable</button>
            <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} disabled={Object.keys(rowSelection).length === 0} onClick={() => handleBulkAction('DISABLE')}>Bulk Disable</button>
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
                  <Dices size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <br />No games found.
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

      {selectedGameId && (
        <GameProfileDrawer gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}

      <CreateGameDrawer isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
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
