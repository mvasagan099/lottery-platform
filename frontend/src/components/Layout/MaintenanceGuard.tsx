import { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSettings } from '@/hooks/useSettings';
import Spinner from '../UI/Spinner';
import { ShieldAlert } from 'lucide-react';

export default function MaintenanceGuard({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const { settings, isLoading } = useSettings('general');

  // If we're loading settings, show a spinner to prevent flashing the app content
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const isMaintenanceMode = settings?.maintenanceMode;
  const hasLegacyRole = user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role);
  const hasCustomRole = user?.roles && user.roles.length > 0;
  const isAdmin = hasLegacyRole || hasCustomRole;

  // If maintenance mode is active, block access unless the user is an admin
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', textAlign: 'center', padding: '24px' }}>
        <ShieldAlert size={64} style={{ color: 'var(--color-primary)', marginBottom: '24px' }} />
        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>System Maintenance</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '500px', lineHeight: 1.6 }}>
          {settings?.maintenanceMessage || 'Our platform is currently undergoing scheduled maintenance. We will be right back.'}
        </p>
      </div>
    );
  }

  // Otherwise, render the normal application
  return <>{children}</>;
}
