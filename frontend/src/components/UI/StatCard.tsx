import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  change?: string
  changePositive?: boolean
  variant?: 'default' | 'gold' | 'green' | 'red'
  footer?: ReactNode
}

export default function StatCard({ title, value, icon, change, changePositive, variant = 'default', footer }: StatCardProps) {
  return (
    <div className={`stat-card ${variant !== 'default' ? variant : ''}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
      {change && (
        <div className={`stat-change ${changePositive ? 'positive' : 'negative'}`}>
          {changePositive ? '↑' : '↓'} {change}
        </div>
      )}
      {footer && <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>{footer}</div>}
    </div>
  )
}

interface BadgeProps {
  children: ReactNode
  variant?: 'primary' | 'gold' | 'success' | 'danger' | 'warning' | 'neutral' | 'live'
  dot?: boolean
}

export function Badge({ children, variant = 'neutral', dot }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${dot ? 'badge-dot' : ''}`}>
      {children}
    </span>
  )
}

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = '🎲', title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
      {action && <div style={{ marginTop: '24px' }}>{action}</div>}
    </div>
  )
}

interface PaginationProps {
  page: number
  pages: number
  onPage: (p: number) => void
}

export function Pagination({ page, pages, onPage }: PaginationProps) {
  if (pages <= 1) return null

  const nums = []
  const delta = 2
  for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
    nums.push(i)
  }

  return (
    <div className="pagination">
      <button className="page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹</button>
      {nums[0] > 1 && (
        <>
          <button className="page-btn" onClick={() => onPage(1)}>1</button>
          {nums[0] > 2 && <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>}
        </>
      )}
      {nums.map((n) => (
        <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => onPage(n)}>{n}</button>
      ))}
      {nums[nums.length - 1] < pages && (
        <>
          {nums[nums.length - 1] < pages - 1 && <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>}
          <button className="page-btn" onClick={() => onPage(pages)}>{pages}</button>
        </>
      )}
      <button className="page-btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>›</button>
    </div>
  )
}

