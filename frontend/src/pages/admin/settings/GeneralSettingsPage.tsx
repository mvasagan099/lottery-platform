import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GeneralSettingsSchema, GeneralSettings } from '../../../types/settings';
import { useSettings } from '../../../hooks/useSettings';
import Spinner from '../../../components/UI/Spinner';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';

export function GeneralSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings('general');

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<GeneralSettings>({
    resolver: zodResolver(GeneralSettingsSchema),
    defaultValues: settings || {},
    values: settings, // Updates form when data is loaded
  });

  const onSubmit = (data: GeneralSettings) => {
    updateSettings(data);
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>General Settings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Configure your platform's core identity and localization.
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
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Platform Identity</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div className="form-group">
            <label className="form-label">Platform Name</label>
            <input {...register('platformName')} className={`form-input ${errors.platformName ? 'error' : ''}`} />
            {errors.platformName && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.platformName.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input {...register('companyName')} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Support Email</label>
            <input {...register('supportEmail')} type="email" className="form-input" />
            {errors.supportEmail && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.supportEmail.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Support Phone</label>
            <input {...register('supportPhone')} className="form-input" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Website URL</label>
            <input {...register('websiteUrl')} type="url" className="form-input" />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Localization</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div className="form-group">
            <label className="form-label">Timezone</label>
            <select {...register('timezone')} className="form-input">
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select {...register('currency')} className="form-input">
              <option value="Coins">Coins (🪙)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Maintenance</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Maintenance Mode</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Disable user access to the platform temporarily</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('maintenanceMode')} />
            <span className="switch-track"></span>
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Maintenance Message</label>
          <textarea {...register('maintenanceMessage')} rows={3} className="form-input"></textarea>
        </div>
      </div>
    </motion.div>
  );
}
