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
import { auditService } from '../../../services/audit.service.mock';
import { AuditLog, AuditFilters } from '../../../types/audit';

interface Props {
  onRowClick: (log: AuditLog) => void;
  filters: AuditFilters;
  setFilters: (filters: AuditFilters) => void;
}

export function AuditLogsTable({ onRowClick, filters, setFilters }: Props) {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', 'logs', page, limit, filters],
    queryFn: () => auditService.getLogs({ page, limit, filters }),
    placeholderData: (prev) => prev
  });

  const columnHelper = createColumnHelper<AuditLog>();

  const handleExport = () => {
    // Generate dummy CSV
    const csvContent = "data:text/csv;charset=utf-8,ID,Timestamp,Action,Module,User,IP\n" +
      data?.data.map(log => `${log.id},${log.timestamp},${log.action},${log.module},${log.userEmail || ''},${log.ipAddress}`).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_report_page.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Current page exported to CSV");
  };

  const columns = [
    columnHelper.accessor('timestamp', {
      header: 'Timestamp',
      cell: info => <div style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{new Date(info.getValue()).toLocaleString()}</div>,
    }),
    columnHelper.accessor('action', {
      header: 'Action',
      cell: info => <div style={{ fontWeight: 600 }}>{info.getValue()}</div>,
    }),
    columnHelper.accessor('module', {
      header: 'Module',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('userEmail', {
      header: 'User / System',
      cell: info => info.getValue() || <span style={{ color: 'var(--text-muted)' }}>System</span>,
    }),
    columnHelper.accessor('ipAddress', {
      header: 'IP Address',
      cell: info => <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{info.getValue()}</div>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const severity = info.row.original.severity;
        let color = 'var(--text-secondary)';
        if (status === 'SUCCESS') color = 'var(--color-accent)';
        if (status === 'FAILED' || severity === 'ERROR' || severity === 'CRITICAL') color = '#ef4444';
        
        return (
          <span style={{ 
            color, 
            fontWeight: 600, 
            fontSize: '12px',
            backgroundColor: `${color}15`,
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {status}
          </span>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.pagination.pages || -1,
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
              placeholder="Search logs by ID, action, IP, email..." 
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
            <label className="form-label">Module</label>
            <select 
              className="form-input"
              value={filters.module?.[0] || ''}
              onChange={(e) => setFilters({ ...filters, module: e.target.value ? [e.target.value as any] : undefined })}
            >
              <option value="">All Modules</option>
              <option value="AUTH">Authentication</option>
              <option value="WALLET">Wallet</option>
              <option value="LOTTERY">Lottery</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Severity</label>
            <select 
              className="form-input"
              value={filters.severity?.[0] || ''}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value ? [e.target.value as any] : undefined })}
            >
              <option value="">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
            />
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
                  No audit logs found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Showing {data ? ((page - 1) * limit) + 1 : 0} to {data ? Math.min(page * limit, data.pagination.total) : 0} of {data?.pagination.total || 0} entries
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '8px 12px' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            className="btn btn-outline" 
            onClick={() => setPage(p => p + 1)}
            disabled={!data || page >= data.pagination.pages}
            style={{ padding: '8px 12px' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}
