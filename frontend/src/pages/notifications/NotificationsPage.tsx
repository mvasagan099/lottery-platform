import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/services/index'
import { Pagination } from '@/components/UI'
import { Bell, Check, Trash2, Trophy, Ticket, DollarSign, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationsService.getAll({ page, limit: 20 }),
    select: (r) => r.data,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
      toast.success('All marked as read')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notification deleted')
    }
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'WINNING': return <Trophy size={18} style={{ color: '#f5a623' }} />
      case 'TICKET_PURCHASE': return <Ticket size={18} style={{ color: 'var(--color-primary)' }} />
      case 'DEPOSIT':
      case 'WITHDRAWAL': return <DollarSign size={18} style={{ color: '#10b981' }} />
      default: return <Info size={18} style={{ color: 'var(--color-accent)' }} />
    }
  }

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="section-header">
          <div>
            <h1 className="section-title">Notifications</h1>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            <Check size={14} /> Mark all as read
          </button>
        </div>

        <div className="card">
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><div className="btn-spinner" style={{ borderColor: 'var(--color-primary)', width: '32px', height: '32px' }} /></div>
          ) : data?.data?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Bell size={48} /></div>
              <div className="empty-state-title">No notifications</div>
              <div className="empty-state-desc">You're all caught up!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data?.data?.map((n: any) => (
                <div key={n.id} style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid var(--border-color)', background: n.isRead ? 'transparent' : 'rgba(26,58,143,0.05)', transition: 'background 0.2s' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ fontWeight: n.isRead ? 600 : 700, fontSize: '15px', color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {!n.isRead && (
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => markReadMutation.mutate(n.id)} title="Mark as read">
                        <Check size={16} />
                      </button>
                    )}
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#ef4444' }} onClick={() => deleteMutation.mutate(n.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data?.pagination && data.pagination.pages > 1 && (
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
              <Pagination page={data.pagination.page} pages={data.pagination.pages} onPage={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
