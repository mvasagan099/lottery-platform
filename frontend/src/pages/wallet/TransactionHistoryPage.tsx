import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { walletService } from '@/services/wallet.service'
import { Pagination } from '@/components/UI'
import { ArrowLeftRight, Search, Filter } from 'lucide-react'

export default function TransactionHistoryPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', { page, type }],
    queryFn: () => walletService.getTransactions({ page, limit: 15, type: type || undefined }),
    select: (r) => r.data,
  })

  return (
    <div className="page-wrapper section">
      <div className="container">
        <div className="section-header">
          <div>
            <h1 className="section-title">Transaction History</h1>
            <div className="section-subtitle">View all your deposits, withdrawals, and ticket purchases</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="input-wrapper has-icon-left" style={{ flex: 1, minWidth: '200px' }}>
              <span className="input-icon"><Filter size={16} /></span>
              <select className="form-select" style={{ paddingLeft: '36px' }} value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
                <option value="">All Transactions</option>
                <option value="DEPOSIT">Deposits</option>
                <option value="WITHDRAWAL">Withdrawals</option>
                <option value="TICKET_PURCHASE">Ticket Purchases</option>
                <option value="PRIZE_CREDIT">Prize Credits</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}><div className="btn-spinner" style={{ borderColor: 'var(--color-primary)', width: '24px', height: '24px' }} /></td></tr>
                ) : data?.data?.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions found.</td></tr>
                ) : (
                  data?.data?.map((tx: any) => (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{tx.reference.substring(0, 8)}...</td>
                      <td style={{ fontWeight: 600 }}>{tx.type.replace(/_/g, ' ')}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{tx.description || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: !['WITHDRAWAL', 'TICKET_PURCHASE'].includes(tx.type) ? '#10b981' : '#ef4444' }}>
                        {!['WITHDRAWAL', 'TICKET_PURCHASE'].includes(tx.type) ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)} Coins
                      </td>
                      <td>
                        <span className={`badge badge-${tx.status === 'COMPLETED' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'danger'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {data?.pagination && data.pagination.pages > 1 && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
              <Pagination page={data.pagination.page} pages={data.pagination.pages} onPage={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
