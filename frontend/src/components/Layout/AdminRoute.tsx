import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Menu } from 'lucide-react'
import AdminSidebar from './AdminSidebar'

export default function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const hasLegacyRole = user && ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'AFFILIATE_MANAGER'].includes(user.role);
  const hasCustomRole = user?.roles && user.roles.length > 0;

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user || (!hasLegacyRole && !hasCustomRole)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="page-wrapper" style={{ paddingTop: 'var(--header-height)' }}>
      <div className="with-sidebar">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main style={{ overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Toggle Button */}
      <button 
        className="btn btn-primary btn-icon admin-mobile-toggle"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu size={24} />
      </button>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="admin-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
