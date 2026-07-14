import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../services/api';
import { SupportTicket, TicketFilters } from '../../../types/support';

interface Props {
  onRowClick: (ticket: SupportTicket) => void;
  filters: TicketFilters;
  setFilters: (filters: TicketFilters) => void;
}

export function SupportTicketTable({ onRowClick, filters, setFilters }: Props) {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['support', 'tickets', page, limit, filters],
    queryFn: async () => {
      const res = await api.get('/admin/support/tickets', { params: { page, limit, ...filters } });
      return res.data;
    },
    placeholderData: (prev) => prev
  });

  const columnHelper = createColumnHelper<SupportTicket>();

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Subject,Status,Priority,Category,User Email\n" +
      data?.data.map((t: SupportTicket) => `${t.id},"${t.subject}",${t.status},${t.priority},${t.category},${t.userEmail}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "support_tickets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Tickets exported to CSV");
  };

  const columns = [
    columnHelper.accessor('id', {
      header: 'Ticket ID',
      cell: info => <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>{info.getValue()}</div>,
    }),
    columnHelper.accessor('subject', {
      header: 'Subject',
      cell: info => <div style={{ fontWeight: 600, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.getValue()}</div>,
    }),
    columnHelper.accessor('userEmail', {
      header: 'User',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: info => {
        const priority = info.getValue();
        let color = 'var(--text-secondary)';
        if (priority === 'HIGH') color = '#f5a623';
        if (priority === 'URGENT') color = '#ef4444';
        
        return (
          <span style={{ color, fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {priority === 'URGENT' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />}
            {priority}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        let color = 'var(--text-secondary)';
        let bg = 'var(--bg-secondary)';
        if (status === 'OPEN') { color = 'var(--color-primary)'; bg = 'var(--color-primary-light)'; }
        if (status === 'PENDING') { color = '#f5a623'; bg = '#fefce8'; }
        if (status === 'RESOLVED' || status === 'CLOSED') { color = 'var(--color-accent)'; bg = 'var(--color-accent-light)'; }
        
        return (
          <span style={{ 
            color, 
            backgroundColor: bg,
            fontWeight: 600, 
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '12px',
            border: `1px solid ${color}30`
          }}>
            {status}
          </span>
        );
      },
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: info => <div style={{ whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(info.getValue()).toLocaleString()}</div>,
    }),
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.pagination?.pages || -1,
  });

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      
      {/* Table Toolbar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search tickets..." 
              value={filters.search || ''}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              style={{ width: '300px' }}
            />
          </div>
          <button className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', gap: '8px' }}>
            <Filter size={16} /> Filters
          </button>
        </div>
        <div>
          <button className="btn btn-outline" onClick={handleExport} style={{ display: 'flex', gap: '8px' }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select 
              className="form-input"
              value={filters.status?.[0] || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value ? [e.target.value as any] : undefined })}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Priority</label>
            <select 
              className="form-input"
              value={filters.priority?.[0] || ''}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value ? [e.target.value as any] : undefined })}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select 
              className="form-input"
              value={filters.category?.[0] || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value ? [e.target.value as any] : undefined })}
            >
              <option value="">All Categories</option>
              <option value="TECHNICAL">Technical</option>
              <option value="DEPOSITS">Deposits</option>
              <option value="WITHDRAWALS">Withdrawals</option>
              <option value="KYC">KYC</option>
            </select>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {columns.map((_, j) => (
                    <td key={j} style={{ padding: '16px 24px' }}>
                      <div style={{ height: '20px', backgroundColor: 'var(--border-color)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.map(row => (
              <tr 
                key={row.id} 
                onClick={() => onRowClick(row.original)}
                style={{ 
                  borderBottom: '1px solid var(--border-color)', 
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ padding: '16px 24px' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {(!isLoading && data?.data.length === 0) && (
              <tr>
                <td colSpan={columns.length} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No support tickets found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data?.pagination?.total || 0)} of {data?.pagination?.total || 0} tickets
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= (data?.pagination?.pages || 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}
