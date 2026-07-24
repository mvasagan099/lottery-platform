import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ticketsService } from '@/services/index'
import { Pagination } from '@/components/UI'
import { Ticket, ChevronRight, Filter, Coins } from 'lucide-react'

export default function MyTicketsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('ACTIVE')

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', { page, status }],
    queryFn: () => ticketsService.getAll({ page, limit: 12, status: status === 'ALL' ? undefined : status }),
    select: (r) => r.data,
  })

  return (
    <div className="page-wrapper section">
      <div className="container">
        <div className="section-header">
          <div>
            <h1 className="section-title">My Tickets</h1>
            <div className="section-subtitle">View your active and past lottery tickets</div>
          </div>
          <Link to="/games" className="btn btn-primary">
            Buy New Ticket
          </Link>
        </div>

        <div className="tabs" style={{ marginBottom: '24px' }}>
          {['ALL', 'ACTIVE', 'CHECKED', 'WON', 'LOST'].map((s) => (
            <button
              key={s}
              className={`tab-trigger ${status === s ? 'active' : ''}`}
              onClick={() => { setStatus(s); setPage(1) }}
            >
              {s === 'ALL' ? 'All Tickets' : s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card skeleton" style={{ height: '180px' }} />
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Ticket size={48} /></div>
            <div className="empty-state-title">No tickets found</div>
            <div className="empty-state-desc">You don't have any {status.toLowerCase()} tickets.</div>
            <Link to="/games" className="btn btn-outline" style={{ marginTop: '20px' }}>Browse Games</Link>
          </div>
        ) : (
          <>
            <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {data?.data?.map((ticket: any) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="card card-body" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>{ticket.game.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ticket #{ticket.ticketNumber}</div>
                    </div>
                    <span className={`badge badge-${ticket.status === 'WON' ? 'success' : ticket.status === 'LOST' ? 'danger' : ticket.status === 'ACTIVE' ? 'primary' : 'neutral'}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Lines:</span>
                      <span style={{ fontWeight: 600 }}>{ticket.numbers?.length || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Draws Remaining:</span>
                      <span style={{ fontWeight: 600 }}>{ticket.draws}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cost:</span>
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Coins size={14} color="gold" /> {Number(ticket.totalCost).toFixed(2)}</span>
                    </div>
                  </div>

                  {ticket.status === 'WON' && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '10px 12px', borderRadius: '8px', fontWeight: 700, textAlign: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>🏆 Won <Coins size={16} color="gold" /> {Number(ticket.prizeAmount).toFixed(2)}</div>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 600, alignItems: 'center' }}>
                    View Details <ChevronRight size={14} />
                  </div>
                </Link>
              ))}
            </div>
            {data?.pagination && data.pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                <Pagination page={data.pagination.page} pages={data.pagination.pages} onPage={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
