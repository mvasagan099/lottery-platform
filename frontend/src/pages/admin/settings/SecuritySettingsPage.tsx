import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SecuritySettingsSchema, SecuritySettings } from '../../../types/settings';
import { useSettings } from '../../../hooks/useSettings';
import Spinner from '../../../components/UI/Spinner';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';

export function SecuritySettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings('security');

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<SecuritySettings>({
    resolver: zodResolver(SecuritySettingsSchema),
    defaultValues: settings || {},
    values: settings,
  });

  const onSubmit = (data: SecuritySettings) => {
    updateSettings(data);
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Security Settings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Manage authentication rules, session lifespans, and threat protection.
          </p>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={!isDirty || isUpdating}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isUpdating ? <Spinner size="sm" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Authentication & Sessions</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px', maxWidth: '650px' }}>
          <div className="form-group">
            <label className="form-label">JWT Expiry (Hours)</label>
            <input type="number" {...register('jwtExpiryHours', { valueAsNumber: true })} className={`form-input ${errors.jwtExpiryHours ? 'error' : ''}`} style={{ height: '40px' }} />
            {errors.jwtExpiryHours && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.jwtExpiryHours.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Refresh Token Expiry (Days)</label>
            <input type="number" {...register('refreshTokenExpiryDays', { valueAsNumber: true })} className={`form-input ${errors.refreshTokenExpiryDays ? 'error' : ''}`} style={{ height: '40px' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Inactivity Session Timeout (Minutes)</label>
            <input type="number" {...register('sessionTimeoutMinutes', { valueAsNumber: true })} className="form-input" style={{ height: '40px' }} />
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Force 2FA for Admins</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Require Two-Factor Authentication for all dashboard access</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('twoFactorAuth')} />
            <span className="switch-track"></span>
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Threat Protection</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Device Verification</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Require email code when logging in from a new device or IP</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('deviceVerification')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Suspicious Login Alerts</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Send email notifications for logins from unknown locations</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('loginAlerts')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>API Rate Limiting</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Enforce strict limits on public API endpoints</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('rateLimiting')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Brute Force Protection</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Temporarily lock accounts after 5 failed login attempts</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('bruteForceProtection')} />
            <span className="switch-track"></span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}
