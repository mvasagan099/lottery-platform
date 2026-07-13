import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { X, PlusCircle, MinusCircle, Gift } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  walletId: string
  userId: string
  username: string
  onClose: () => void
}

export function WalletAdjustmentModal({ walletId, userId, username, onClose }: Props) {
  const queryClient = useQueryClient()
  const [type, setType] = useState<'CREDIT' | 'DEBIT' | 'BONUS'>('CREDIT')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) throw new Error('Please enter a valid amount')
      if (!reason.trim()) throw new Error('Please provide a reason for the adjustment')

      return api.post(`/admin/wallets/${walletId}/adjustment`, {
        amount: Number(amount),
        type,
        reason
      })
    },
    onSuccess: () => {
      toast.success('Wallet adjusted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'deposits', walletId] })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || 'Failed to adjust wallet')
    }
  })

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-primary)', zIndex: 1001, borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}>
        
        <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Adjust Wallet</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
        </div>

        <div style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Target User:</span> <strong style={{ color: 'var(--text-primary)' }}>{username}</strong>
          </div>

          <div className="form-group">
            <label className="form-label">Adjustment Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button 
                type="button"
                className={`btn ${type === 'CREDIT' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px', fontSize: '13px' }}
                onClick={() => setType('CREDIT')}
              >
                <PlusCircle size={16} style={{ marginRight: '6px' }}/> Credit
              </button>
              <button 
                type="button"
                className={`btn ${type === 'DEBIT' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px', fontSize: '13px', backgroundColor: type === 'DEBIT' ? 'var(--error-color)' : '', borderColor: type === 'DEBIT' ? 'var(--error-color)' : '' }}
                onClick={() => setType('DEBIT')}
              >
                <MinusCircle size={16} style={{ marginRight: '6px' }}/> Debit
              </button>
              <button 
                type="button"
                className={`btn ${type === 'BONUS' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px', fontSize: '13px', backgroundColor: type === 'BONUS' ? 'var(--primary-color)' : '', borderColor: type === 'BONUS' ? 'var(--primary-color)' : '' }}
                onClick={() => setType('BONUS')}
              >
                <Gift size={16} style={{ marginRight: '6px' }}/> Bonus
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (🪙)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="0.00" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Reference</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. VIP Cashback, Manual Deposit Correction..." 
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>

        <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: 'var(--bg-secondary)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button 
            className="btn btn-primary" 
            onClick={() => mutation.mutate()} 
            disabled={mutation.isPending}
            style={type === 'DEBIT' ? { backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' } : {}}
          >
            {mutation.isPending ? 'Processing...' : 'Execute Adjustment'}
          </button>
        </div>
      </div>
    </>
  )
}
