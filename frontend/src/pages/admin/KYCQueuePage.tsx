import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  useReactTable, getCoreRowModel, flexRender, SortingState 
} from '@tanstack/react-table'
import api from '../../services/api'
import { KYCReviewModal } from './KYCReviewModal'
import { 
  Search, Shield, Clock, CheckCircle, XCircle, FileText, AlertTriangle 
} from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'

export default function KYCQueuePage() {
  const queryClient = useQueryClient()
  
  const [sorting, setSorting] = useState<SortingState>([{ id: 'submittedAt', desc: true }])
  const [rowSelection, setRowSelection] = useState({})
  
  const [searchParams, setSearchParams] = useState({
    page: 1, limit: 10, search: '', status: 'PENDING', documentType: ''
  })
  const [searchInput, setSearchInput] = useState('')
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchParams(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'kyc', searchParams, sorting],
    queryFn: async () => {
      const sortField = sorting.length > 0 ? sorting[0].id : 'submittedAt'
      const sortDir = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc'
      
      const query = new URLSearchParams({
        page: String(searchParams.page),
        limit: String(searchParams.limit),
        search: searchParams.search,
        status: searchParams.status,
        documentType: searchParams.documentType,
        sortField,
        sortDir
      })
      const res = await api.get(`/admin/kyc?${query.toString()}`)
      return res.data
    },
    placeholderData: (prev: any) => prev,
  })

  const bulkMutation = useMutation({
    mutationFn: async ({ recordIds, action }: { recordIds: string[], action: 'APPROVED' | 'REJECTED' }) => {
      return api.post('/admin/kyc/bulk-action', { recordIds, action })
    },
    onSuccess: (res) => {
      toast.success(res.data.message)
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Bulk action failed')
  })

  const records = (data as any)?.data || []
  const totalItems = (data as any)?.pagination?.total || 0
  const totalPages = (data as any)?.pagination?.pages || 0
  const stats = (data as any)?.stats || { totalRequests: 0, pendingReview: 0, approvedToday: 0, rejectedToday: 0 }

  const handleBulkAction = (action: 'APPROVED' | 'REJECTED') => {
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
      accessorKey: 'user.username',
      header: 'User',
      cell: (info: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{info.getValue() || 'Unknown'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{info.row.original.user?.email}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'documentType',
      header: 'Doc Type',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info: any) => {
        const status = info.getValue()
        return (
          <span style={{ 
            padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
            backgroundColor: status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status === 'APPROVED' ? '#10b981' : status === 'PENDING' ? '#f59e0b' : '#ef4444' 
          }}>
            {status}
          </span>
        )
      }
    },
    {
      accessorKey: 'submittedAt',
      header: 'Submitted',
      cell: (info: any) => <div style={{ fontSize: '0.85rem' }}>{dayjs(info.getValue()).format('MMM D, YYYY HH:mm')}</div>
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (info: any) => (
        <button 
          className="btn btn-primary" 
          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          onClick={() => setSelectedRecordId(info.row.original.id)}
        >
          Review
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>KYC Management</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Review and audit identity verification requests</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <SummaryCard title="Pending Review" value={stats.pendingReview} icon={<Clock size={20} color="#f59e0b" />} />
        <SummaryCard title="Approved Today" value={stats.approvedToday} icon={<CheckCircle size={20} color="#10b981" />} />
        <SummaryCard title="Rejected Today" value={stats.rejectedToday} icon={<XCircle size={20} color="#ef4444" />} />
        <SummaryCard title="Total Processed" value={stats.totalRequests - stats.pendingReview} icon={<Shield size={20} color="#3b82f6" />} />
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
                placeholder="Search user ID, email..." 
                style={{ width: '100%', paddingLeft: 36, borderRadius: 'var(--radius-md)' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <select className="form-select" style={{ borderRadius: 'var(--radius-md)', padding: '8px 12px' }} value={searchParams.status} onChange={e => setSearchParams({...searchParams, status: e.target.value, page: 1})}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select className="form-select" style={{ borderRadius: 'var(--radius-md)', padding: '8px 12px' }} value={searchParams.documentType} onChange={e => setSearchParams({...searchParams, documentType: e.target.value, page: 1})}>
              <option value="">All Documents</option>
              <option value="PASSPORT">Passport</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="DRIVERS_LICENSE">Driver's License</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginRight: '8px' }}>
              {Object.keys(rowSelection).length} selected
            </span>
            <button className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }} disabled={Object.keys(rowSelection).length === 0} onClick={() => handleBulkAction('APPROVED')}>Bulk Approve</button>
            <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} disabled={Object.keys(rowSelection).length === 0} onClick={() => handleBulkAction('REJECTED')}>Bulk Reject</button>
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
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}><div className="loading-spinner" style={{ margin: 'auto' }}></div></td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <br />No KYC records found.
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

      {/* Modals */}
      {selectedRecordId && (
        <KYCReviewModal recordId={selectedRecordId} onClose={() => setSelectedRecordId(null)} />
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
