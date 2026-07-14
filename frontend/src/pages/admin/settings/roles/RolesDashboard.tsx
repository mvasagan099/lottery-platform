import React from 'react';
import { useRoles } from '../../../../hooks/useRBAC';
import StatCard from '../../../../components/UI/StatCard';
import { Shield, Users, Lock, ShieldAlert } from 'lucide-react';
import Spinner from '../../../../components/UI/Spinner';
import { useNavigate } from 'react-router-dom';

export function RolesDashboard() {
  const { data: roles, isLoading } = useRoles();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const totalRoles = roles?.length || 0;
  const customRoles = roles?.filter(r => !r.isSystem).length || 0;

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Roles & Permissions</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage access controls and security roles</p>
        </div>
        <button 
          style={{ padding: '8px 16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => navigate('/admin/settings/roles/new')}
        >
          Create Role
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard title="Total Roles" value={totalRoles.toString()} icon={<Shield size={24} />} change="0%" />
        <StatCard title="Custom Roles" value={customRoles.toString()} icon={<Users size={24} />} change="0%" />
        <StatCard title="Active Admins" value="12" icon={<Lock size={24} />} change="+2 this week" changePositive />
        <StatCard title="Pending Requests" value="3" icon={<ShieldAlert size={24} />} change="Requires review" />
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Role Name</th>
              <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Department</th>
              <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Type</th>
              <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Users</th>
              <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Permissions</th>
              <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles?.map(role => (
              <tr key={role.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} color="var(--color-primary)" />
                    {role.name}
                  </div>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{role.department || 'General'}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    background: role.isSystem ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: role.isSystem ? '#3b82f6' : '#10b981'
                  }}>
                    {role.isSystem ? 'System' : 'Custom'}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>{role._count?.users || 0}</td>
                <td style={{ padding: '16px' }}>{role._count?.permissions || 0} rules</td>
                <td style={{ padding: '16px' }}>
                  <button 
                    onClick={() => navigate(`/admin/settings/roles/${role.id}`)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Edit Matrix
                  </button>
                </td>
              </tr>
            ))}
            {roles?.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
