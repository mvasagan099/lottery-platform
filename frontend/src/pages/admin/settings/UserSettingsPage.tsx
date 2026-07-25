import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserSettingsSchema, UserSettings } from '../../../types/settings';
import { useSettings } from '../../../hooks/useSettings';
import Spinner from '../../../components/UI/Spinner';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';

export function UserSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings('user');

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<UserSettings>({
    resolver: zodResolver(UserSettingsSchema),
    defaultValues: settings || {},
    values: settings,
  });

  const onSubmit = (data: UserSettings) => {
    updateSettings(data);
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>User & Registration Settings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Configure account creation, verification rules, and user programs.
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
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Registration & KYC</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Allow Public Registration</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Users can create accounts freely on the platform</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('registrationEnabled')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Require Email Verification</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Users must verify email before accessing features</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('emailVerification')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Require Phone Verification</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Users must verify phone number via SMS OTP</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('phoneVerification')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Strict KYC Enforcement</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Lock wallets until identity is fully verified</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('kycRequired')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div className="form-group" style={{ maxWidth: '300px' }}>
          <label className="form-label">Minimum Age Requirement</label>
          <input type="number" {...register('minimumAge', { valueAsNumber: true })} className={`form-input ${errors.minimumAge ? 'error' : ''}`} style={{ height: '40px' }} />
          {errors.minimumAge && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.minimumAge.message}</span>}
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Programs & Features</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Referral System</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Enable peer-to-peer referral links and rewards</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('referralSystem')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Affiliate Program</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Enable multi-tier revenue sharing for marketers</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('affiliateProgram')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>VIP Loyalty Program</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Enable XP tracking and VIP tiers for high rollers</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('vipProgram')} />
            <span className="switch-track"></span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}
