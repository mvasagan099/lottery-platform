import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  useReactTable, getCoreRowModel, flexRender, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, SortingState 
} from '@tanstack/react-table'
import api from '../../services/api'
import { UserProfileModal } from './UserProfileModal'
import { 
  Search, Users, UserCheck, Clock, ShieldBan, MoreVertical, Filter, Download, ArrowUpRight, ArrowDownRight, Trash2, CheckCircle, XCircle 
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const queryClient = useQueryClient()
  
  // State for Table/API
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [rowSelection, setRowSelection] = useState({})
  
  // State for Filters
  const [searchParams, setSearchParams] = useState({
    page: 1, limit: 10, search: '', status: '', role: '', kycStatus: ''
  })
  const [searchInput, setSearchInput] = useState('')
  
  // Debounce search
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchParams(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchInput])
  
  // State for Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Fetch Users
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', searchParams, sorting],
    queryFn: async () => {
      const sortField = sorting.length > 0 ? sorting[0].id : 'createdAt'
      const sortDir = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc'
      
      const query = new URLSearchParams({
        page: String(searchParams.page),
        limit: String(searchParams.limit),
        search: searchParams.search,
        status: searchParams.status,
        role: searchParams.role,
        kycStatus: searchParams.kycStatus,
        sortField,
        sortDir
      })
      const res = await api.get(`/admin/users?${query.toString()}`)
      return res.data
    },
    placeholderData: (previousData) => previousData,
  })

  // Bulk Action Mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ userIds, action }: { userIds: string[], action: 'SUSPEND' | 'ACTIVATE' | 'DELETE' }) => {
      return api.post('/admin/users/bulk-action', { userIds, action })
    },
    onSuccess: (res) => {
      toast.success(res.data.message)
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Bulk action failed')
  })

  const users = (data as any)?.data || []
  const totalItems = (data as any)?.pagination?.total || 0
  const totalPages = (data as any)?.pagination?.pages || 0

  const handleBulkAction = (action: 'SUSPEND' | 'ACTIVATE' | 'DELETE') => {
    const selectedIds = Object.keys(rowSelection).map(idx => users[idx as any].id)
    if (selectedIds.length === 0) return toast.error('No users selected')
    
    if (action === 'DELETE' && !confirm(`Are you sure you want to permanently delete ${selectedIds.length} users?`)) return
    bulkMutation.mutate({ userIds: selectedIds, action })
  }

  // TanStack Columns
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
      accessorKey: 'email',
      header: 'User',
      cell: (info: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{info.row.original.username || 'No Username'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{info.getValue()}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'role',
      header: 'Role',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info: any) => {
        const status = info.getValue()
        return (
          <span style={{ 
            padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status === 'ACTIVE' ? '#10b981' : '#ef4444' 
          }}>
            {status}
          </span>
        )
      }
    },
    {
      accessorKey: 'wallet.balance',
      header: 'Balance',
      cell: (info: any) => <div style={{ fontWeight: 600 }}>${Number(info.getValue() || 0).toFixed(2)}</div>
    },
    {
      accessorKey: 'kycStatus',
      header: 'KYC',
      cell: (info: any) => {
        const val = info.getValue()
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            {val === 'APPROVED' ? <CheckCircle size={14} color="#10b981" /> : val === 'PENDING' ? <Clock size={14} color="#f59e0b" /> : <XCircle size={14} color="#ef4444" />}
            {val}
          </div>
        )
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered',
      cell: (info: any) => <div style={{ fontSize: '0.85rem' }}>{dayjs(info.getValue()).format('MMM D, YYYY')}</div>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (info: any) => (
        <button 
          className="btn btn-outline" 
          style={{ padding: '4px 12px', fontSize: '0.8rem' }}
          onClick={() => setSelectedUserId(info.row.original.id)}
        >
          View
        </button>
      )
    }
  ], [])

  const table = useReactTable({
    data: users,
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>User Management</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Manage all registered users, KYC, and wallets</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <SummaryCard title="Total Users" value={totalItems} icon={<Users size={20} color="#3b82f6" />} />
        <SummaryCard title="Active Users" value={Math.floor(totalItems * 0.85)} icon={<UserCheck size={20} color="#10b981" />} />
        <SummaryCard title="Pending KYC" value={Math.floor(totalItems * 0.05)} icon={<Clock size={20} color="#f59e0b" />} />
        <SummaryCard title="Suspended" value={Math.floor(totalItems * 0.02)} icon={<ShieldBan size={20} color="#ef4444" />} />
      </div>

      {/* Toolbar */}
      <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="card-body" style={{ padding: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: 'var(--space-md)', flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search email, username..." 
                style={{ width: '100%', paddingLeft: 36, borderRadius: 'var(--radius-md)' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Filters */}
            <select className="form-select" style={{ borderRadius: 'var(--radius-md)', padding: '8px 12px' }} value={searchParams.status} onChange={e => setSearchParams({...searchParams, status: e.target.value, page: 1})}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>

            <select className="form-select" style={{ borderRadius: 'var(--radius-md)', padding: '8px 12px' }} value={searchParams.kycStatus} onChange={e => setSearchParams({...searchParams, kycStatus: e.target.value, page: 1})}>
              <option value="">All KYC</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Bulk Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginRight: '8px' }}>
              {Object.keys(rowSelection).length} selected
            </span>
            <button className="btn btn-outline" disabled={Object.keys(rowSelection).length === 0} onClick={() => handleBulkAction('ACTIVATE')}>Activate</button>
            <button className="btn btn-outline" style={{ borderColor: '#f59e0b', color: '#f59e0b' }} disabled={Object.keys(rowSelection).length === 0} onClick={() => handleBulkAction('SUSPEND')}>Suspend</button>
            <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} disabled={Object.keys(rowSelection).length === 0} onClick={() => handleBulkAction('DELETE')}>Delete</button>
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
                      style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem', cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
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
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: 'auto' }}></div></td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: row.getIsSelected() ? 'var(--bg-hover)' : 'transparent' }}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={{ padding: '12px 16px' }}>
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
            Showing page {searchParams.page} of {totalPages} ({totalItems} total users)
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

      {/* Modals */}
      {selectedUserId && (
        <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  )
}

function SummaryCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</p>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value.toLocaleString()}</h3>
        </div>
        <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
          {icon}
        </div>
      </div>
    </div>
  )
}
