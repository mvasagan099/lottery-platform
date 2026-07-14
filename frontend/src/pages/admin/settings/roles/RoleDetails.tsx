import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateRole, useRoleDetails, useUpdateRole, useCloneRole, usePermissions, useUpdateRolePermissions } from '../../../../hooks/useRBAC';
import Spinner from '../../../../components/UI/Spinner';
import toast from 'react-hot-toast';

const MODULES = [
  'Dashboard', 'Reports', 'Users', 'KYC', 'Wallets', 'Deposits', 'Withdrawals', 
  'Games', 'Draws', 'Results', 'Jackpots', 'Affiliates', 'CMS', 'Promotions', 
  'Support', 'Audit Logs', 'Analytics', 'Notifications', 'Settings', 'API Keys', 'Backups'
];

const ACTIONS = [
  'View', 'Create', 'Edit', 'Delete', 'Approve', 'Reject', 'Export', 'Import', 'Manage', 'Assign', 'Configure'
];

export function RoleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const { data: role, isLoading } = useRoleDetails(isNew ? '' : id || '');
  const { mutateAsync: createRole } = useCreateRole();
  const { mutateAsync: updateRole } = useUpdateRole();
  const { mutateAsync: cloneRole } = useCloneRole();
  const { mutateAsync: updateRolePermissions } = useUpdateRolePermissions();
  const { data: systemPermissions } = usePermissions();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  // Sync state if editing
  useEffect(() => {
    if (role && !isNew) {
      setName(role.name);
      setDescription(role.description || '');
      setDepartment(role.department || '');
      
      if (role.permissions) {
        const perms: Record<string, boolean> = {};
        role.permissions.forEach((rp: any) => {
          if (rp.permission) {
            perms[`${rp.permission.module}:${rp.permission.action}`] = true;
          }
        });
        setPermissions(perms);
      }
    }
  }, [role, isNew]);

  const togglePermission = (mod: string, act: string) => {
    const key = `${mod}:${act}`;
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectModuleAll = (mod: string) => {
    const isAll = ACTIONS.every(act => permissions[`${mod}:${act}`]);
    const next = { ...permissions };
    ACTIONS.forEach(act => { next[`${mod}:${act}`] = !isAll; });
    setPermissions(next);
  };

  const handleClone = async () => {
    if (!id || isNew) return;
    try {
      const cloned = await cloneRole(id);
      toast.success('Role cloned successfully!');
      navigate(`/admin/settings/roles/${cloned.id}`);
    } catch (err) {
      toast.error('Failed to clone role');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    setIsSubmitting(true);
    try {
      let roleId = id;
      
      // 1. Create or Update Role Details
      if (isNew) {
        const newRole = await createRole({ name, description, department });
        roleId = newRole.id;
      } else if (id) {
        await updateRole({ id, data: { name, description, department } });
      }

      // 2. Map matrix boolean state to permission IDs
      if (roleId && systemPermissions) {
        const permissionIds: string[] = [];
        
        Object.entries(permissions).forEach(([key, isChecked]) => {
          if (isChecked) {
            const [mod, act] = key.split(':');
            const perm = systemPermissions.find((p: any) => p.module === mod && p.action === act);
            if (perm) permissionIds.push(perm.id);
          }
        });

        // 3. Save Matrix
        await updateRolePermissions({ id: roleId, permissionIds });
        toast.success(isNew ? 'Role created successfully!' : 'Role updated successfully!');
        navigate('/admin/settings/roles');
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !isNew) {
    return <Spinner size="lg" />;
  }

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/admin/settings/roles')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '24px' }}
          >
            &larr;
          </button>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
              {isNew ? 'Create New Role' : `Edit Role: ${role?.name}`}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Define role parameters and granular access matrices
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isNew && (
            <button 
              onClick={handleClone}
              style={{ padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >
              Clone Role
            </button>
          )}
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !name}
            style={{ padding: '10px 24px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isSubmitting || !name ? 'not-allowed' : 'pointer', opacity: isSubmitting || !name ? 0.7 : 1 }}
          >
            {isSubmitting ? 'Saving...' : 'Save Role'}
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Role Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Role Name *</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Compliance Officer"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Department</label>
            <input 
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Compliance & Risk"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe the responsibilities of this role"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Permission Matrix</h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Granular module and action level access controls</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px', textAlign: 'left', minWidth: '150px' }}>Module</th>
                {ACTIONS.map(act => (
                  <th key={act} style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {act}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map(mod => {
                const isAllSelected = ACTIONS.every(act => permissions[`${mod}:${act}`]);
                return (
                  <tr key={mod} style={{ borderBottom: '1px solid var(--border-color)', ':hover': { background: 'var(--bg-primary)' } } as any}>
                    <td style={{ padding: '16px', textAlign: 'left', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox" 
                          checked={isAllSelected}
                          onChange={() => selectModuleAll(mod)}
                        />
                        {mod}
                      </div>
                    </td>
                    {ACTIONS.map(act => (
                      <td key={act} style={{ padding: '16px' }}>
                        <input 
                          type="checkbox"
                          checked={permissions[`${mod}:${act}`] || false}
                          onChange={() => togglePermission(mod, act)}
                          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
