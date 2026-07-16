import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LotterySettingsSchema, LotterySettings } from '../../../types/settings';
import { useSettings } from '../../../hooks/useSettings';
import Spinner from '../../../components/UI/Spinner';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';

export function LotterySettingsPage() {
  const { settings, isLoading, updateSettings, isUpdating } = useSettings('lottery');

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<LotterySettings>({
    resolver: zodResolver(LotterySettingsSchema),
    defaultValues: settings || {},
    values: settings,
  });

  const onSubmit = (data: LotterySettings) => {
    updateSettings(data);
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}><Spinner /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600 }}>Lottery Rules & Settings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Configure default game rules, draw logic, and prize distribution.
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
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Ticket Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="form-group">
            <label className="form-label">Minimum Ticket Price (🪙)</label>
            <input type="number" step="0.01" {...register('minTicketPrice', { valueAsNumber: true })} className={`form-input ${errors.minTicketPrice ? 'error' : ''}`} />
            {errors.minTicketPrice && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{errors.minTicketPrice.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Maximum Ticket Price (🪙)</label>
            <input type="number" step="0.01" {...register('maxTicketPrice', { valueAsNumber: true })} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Max Tickets Per User Per Draw</label>
            <input type="number" {...register('ticketPurchaseLimit', { valueAsNumber: true })} className="form-input" />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Draw Mechanics</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Jackpot Rollover</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Unwon jackpots automatically roll over to the next draw</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('jackpotRollOver')} />
            <span className="switch-track"></span>
          </label>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Automated Draws</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>System executes draws automatically at scheduled times</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('autoDraw')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
          <div className="form-group">
            <label className="form-label">Draw Timezone</label>
            <select {...register('drawTimezone')} className="form-input">
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Result Publish Delay (Minutes)</label>
            <input type="number" {...register('resultPublishDelay', { valueAsNumber: true })} className="form-input" />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Prize Distribution</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Auto Prize Distribution</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Automatically credit minor prizes to user wallets</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('autoPrizeDistribution')} />
            <span className="switch-track"></span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Winner KYC Verification</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Require KYC for claiming jackpot prizes</div>
          </div>
          <label className="switch">
            <input type="checkbox" {...register('winnerVerification')} />
            <span className="switch-track"></span>
          </label>
        </div>
        
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Prize Claim Expiry (Days)</label>
          <input type="number" {...register('claimExpiryDays', { valueAsNumber: true })} className="form-input" />
        </div>
      </div>
    </motion.div>
  );
}
