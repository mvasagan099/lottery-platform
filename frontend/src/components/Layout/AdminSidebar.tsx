import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShieldCheck, Dices,
  Gamepad2, Wallet, BarChart3, FileText,
  HeadphonesIcon, ClipboardList, Settings, Trophy, Zap
} from 'lucide-react'

const sections = [
  {
    label: 'Overview',
    links: [
      { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { href: '/admin/reports', label: 'Reports', icon: <BarChart3 size={16} /> },
    ],
  },
  {
    label: 'Users',
    links: [
      { href: '/admin/users', label: 'All Users', icon: <Users size={16} /> },
      { href: '/admin/kyc', label: 'KYC Queue', icon: <ShieldCheck size={16} /> },
      { href: '/admin/affiliates', label: 'Affiliates', icon: <Trophy size={16} /> },
    ],
  },
  {
    label: 'Lottery',
    links: [
      { href: '/admin/games', label: 'Games', icon: <Gamepad2 size={16} /> },
      { href: '/admin/draws', label: 'Draws', icon: <Dices size={16} /> },
    ],
  },
  {
    label: 'Finance',
    links: [
      { href: '/admin/wallet', label: 'Withdrawals', icon: <Wallet size={16} /> },
    ],
  },
  {
    label: 'Content',
    links: [
      { href: '/admin/cms', label: 'CMS / Banners', icon: <FileText size={16} /> },
      { href: '/admin/support', label: 'Support', icon: <HeadphonesIcon size={16} /> },
      { href: '/admin/audit', label: 'Audit Logs', icon: <ClipboardList size={16} /> },
    ],
  },
  {
    label: 'System',
    links: [
      { href: '/admin/settings', label: 'Settings', icon: <Settings size={16} /> },
    ],
  },
]

export default function AdminSidebar() {
  const location = useLocation()

  const isActive = (href: string) =>
    location.pathname === href || (href !== '/admin' && location.pathname.startsWith(href))

  return (
    <aside className="sidebar">
      <div style={{ padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} style={{ color: 'var(--color-secondary)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: 'white', fontSize: '18px' }}>
            Mega<span style={{ color: 'var(--color-secondary)' }}>Draw</span>
          </span>
        </Link>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.05em', marginTop: '4px' }}>
          ADMIN PANEL
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.label} className="sidebar-section">
          <div className="sidebar-label">{section.label}</div>
          {section.links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`sidebar-link ${isActive(link.href) ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  )
}
