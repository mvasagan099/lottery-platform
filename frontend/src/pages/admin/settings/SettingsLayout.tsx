import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Ticket,
  Users,
  Wallet,
  Shield,
  CreditCard,
  Mail,
  MessageSquare,
  Bell,
  Activity,
  FileKey,
  HardDrive,
  DatabaseBackup,
  AlertTriangle,
  UserPlus
} from 'lucide-react';

const SETTINGS_CATEGORIES = [
  { path: '/admin/settings', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/admin/settings/general', label: 'General', icon: Settings },
  { path: '/admin/settings/lottery', label: 'Lottery rules', icon: Ticket },
  { path: '/admin/settings/users', label: 'Users & KYC', icon: Users },
  { path: '/admin/settings/wallet', label: 'Wallet limits', icon: Wallet },
  { path: '/admin/settings/security', label: 'Security', icon: Shield },


  { path: '/admin/settings/roles', label: 'Roles & Permissions', icon: UserPlus },
];

export function SettingsLayout() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
          Manage your platform's configuration, limits, modules, and integrations.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ width: '100%', maxWidth: '280px', flexShrink: 0, position: 'sticky', top: '100px' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SETTINGS_CATEGORIES.map((category) => (
              <NavLink
                key={category.path}
                to={category.path}
                end={category.exact}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease',
                })}
              >
                <category.icon size={18} style={{ marginRight: '12px' }} />
                {category.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main style={{ flex: '1 1 300px', minWidth: 0, paddingBottom: '100px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
