import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AdminSidebar from './AdminSidebar'

export default function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore()

  const hasLegacyRole = user && ['SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'AFFILIATE_MANAGER'].includes(user.role);
  const hasCustomRole = user?.roles && user.roles.length > 0;

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user || (!hasLegacyRole && !hasCustomRole)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="page-wrapper" style={{ paddingTop: 'var(--header-height)' }}>
      <div className="with-sidebar">
        <AdminSidebar />
        <main style={{ overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
