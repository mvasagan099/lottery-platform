import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authService } from '@/services/auth.service'
import { notificationsService } from '@/services/index'
import { useQuery } from '@tanstack/react-query'
import {
  Sun, Moon, Bell, Wallet, LogOut, User, ChevronDown,
  Trophy, Ticket, Settings, Menu, X, LayoutDashboard, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
    select: (r) => r.data?.data?.count ?? 0,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setMobileNavOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    logout()
    navigate('/')
    toast.success('Logged out successfully')
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const navLinks = [
    { href: '/games', label: 'Games' },
    { href: '/results', label: 'Results' },
    { href: '/jackpots', label: 'Jackpots' },
    { href: '/promotions', label: 'Promotions' },
  ]

  const balance = (user?.wallet?.balance ?? 0)

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          {/* Logo */}
          <Link to="/" className="logo">
            <Zap size={22} style={{ color: 'var(--color-secondary)' }} />
            Mega<span>Draw</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`nav-link ${isActive(link.href) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="header-actions">
            {/* Theme Toggle */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Wallet */}
                <Link to="/wallet" className="wallet-chip">
                  <Wallet size={15} />
                  <span>${Number(balance).toFixed(2)}</span>
                  <span style={{ opacity: 0.6, fontSize: '11px' }}>AUD</span>
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
                  <Bell size={18} />
                  {(unreadData ?? 0) > 0 && (
                    <span style={{
                      position: 'absolute', top: '6px', right: '6px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#ef4444', border: '2px solid var(--bg-primary)',
                    }} />
                  )}
                </Link>

                {/* User Menu */}
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ gap: '8px', padding: '7px 12px' }}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="avatar avatar-sm">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {user?.firstName}
                    </span>
                    <ChevronDown size={14} style={{
                      transform: userMenuOpen ? 'rotate(180deg)' : '',
                      transition: 'transform 0.2s',
                    }} />
                  </button>

                  {userMenuOpen && (
                    <div className="card" style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      width: '220px', zIndex: 200, padding: '6px',
                    }}>
                      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '6px' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{user?.firstName} {user?.lastName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email}</div>
                      </div>

                      {[
                        { icon: <User size={15} />, label: 'Profile', href: '/profile' },
                        { icon: <Ticket size={15} />, label: 'My Tickets', href: '/tickets' },
                        { icon: <Trophy size={15} />, label: 'Affiliate', href: '/affiliate' },
                        ...(user?.role !== 'USER' ? [{ icon: <LayoutDashboard size={15} />, label: 'Admin Panel', href: '/admin' }] : []),
                        { icon: <Settings size={15} />, label: 'Settings', href: '/profile/security' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="sidebar-link"
                          style={{ padding: '8px 12px', borderRadius: '8px', color: 'var(--text-secondary)', background: 'transparent' }}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}

                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '6px', paddingTop: '6px' }}>
                        <button
                          className="sidebar-link"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', color: '#ef4444', background: 'transparent', border: 'none' }}
                          onClick={handleLogout}
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-gold btn-sm">Get Started</Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="btn btn-ghost btn-icon"
              style={{ display: 'none' }}
              id="mobile-nav-toggle"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileNavOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
          padding: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 99,
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`nav-link ${isActive(link.href) ? 'active' : ''}`}
              style={{ display: 'block', padding: '10px 12px' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
