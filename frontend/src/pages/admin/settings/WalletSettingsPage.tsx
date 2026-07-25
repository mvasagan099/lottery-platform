import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WalletSettingsSchema, WalletSettings } from '../../../types/settings';
import { useSettings } from '../../../hooks/useSettings';
import Spinner from '../../../components/UI/Spinner';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';

export function WalletSettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings('wallet');

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<WalletSettings>({
    resolver: zodResolver(WalletSettingsSchema),
    defaultValues: settings || {},
    values: settings,
  });

  const onSubmit = async (data: WalletSettings) => {
    await updateSettings(data);
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Wallet & Financial Settings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Configure deposit limits, withdrawal thresholds, and wallet types.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isUpdating}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isUpdating ? <Spinner size="sm" /> : <Save size={18} />}
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Transaction Limits (Base Currency)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', maxWidth: '650px' }}>
          <div className="form-group">
            <label className="form-label">Minimum Deposit</label>
            <input type="number" step="0.01" {...register('minDeposit', { valueAsNumber: true })} className={`form-input ${errors.minDeposit ? 'error' : ''}`} style={{ height: '40px' }} />
            {errors.minDeposit && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.minDeposit.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Maximum Deposit</label>
            <input type="number" step="0.01" {...register('maxDeposit', { valueAsNumber: true })} className="form-input" style={{ height: '40px' }} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Minimum Withdrawal</label>
            <input type="number" step="0.01" {...register('minWithdrawal', { valueAsNumber: true })} className={`form-input ${errors.minWithdrawal ? 'error' : ''}`} style={{ height: '40px' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Maximum Withdrawal</label>
            <input type="number" step="0.01" {...register('maxWithdrawal', { valueAsNumber: true })} className="form-input" style={{ height: '40px' }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Daily Caps & Velocity</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', maxWidth: '650px' }}>
          <div className="form-group">
            <label className="form-label">Daily Deposit Limit</label>
            <input type="number" step="0.01" {...register('dailyDepositLimit', { valueAsNumber: true })} className={`form-input ${errors.dailyDepositLimit ? 'error' : ''}`} style={{ height: '40px' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Daily Withdrawal Limit</label>
            <input type="number" step="0.01" {...register('dailyWithdrawalLimit', { valueAsNumber: true })} className="form-input" style={{ height: '40px' }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Bonus & Promotional Wallets</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Enable Bonus Wallets</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Separate bonus funds from real cash deposits and winnings</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('bonusWalletEnabled')} />
            <span className="switch-track"></span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}
