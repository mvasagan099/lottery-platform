import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { 
  X, User, ShieldAlert, CheckCircle, XCircle, CreditCard, Clock, Activity, AlertTriangle, ArrowRightLeft, ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  depositId: string
  onClose: () => void
}

export function DepositDetailsDrawer({ depositId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [reviewNotes, setReviewNotes] = useState('')
  const [showRefundConfirm, setShowRefundConfirm] = useState(false)

  const handleConfirmRefund = () => {
    statusMutation.mutate('CANCELLED', {
      onSuccess: () => {
        setShowRefundConfirm(false)
      }
    })
  }

  const { data: deposit, isLoading } = useQuery({
    queryKey: ['admin', 'deposits', depositId],
    queryFn: async () => {
      const res = await api.get(`/admin/deposits/${depositId}`)
      return res.data.data
    }
  })

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      return api.patch(`/admin/deposits/${depositId}/status`, { status, reviewNotes })
    },
    onSuccess: () => {
      toast.success('Deposit status updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || 'Failed to update status')
    }
  })

  if (isLoading) return null

  const user = deposit?.wallet?.user
  const metadata = deposit?.metadata || {}

  // Real Validation Checks for Deposits
  const validationChecks = [
    { 
      label: `KYC Status: ${user?.kycStatus || 'NOT_SUBMITTED'}`, 
      passed: user?.kycStatus === 'APPROVED', 
      icon: user?.kycStatus === 'APPROVED' ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color="var(--warning-color)" /> 
    },
    { 
      label: `Account Status: ${user?.status || 'ACTIVE'}`, 
      passed: user?.status === 'ACTIVE', 
      icon: user?.status === 'ACTIVE' ? <CheckCircle size={16} color="var(--success-color)" /> : <XCircle size={16} color="var(--error-color)" /> 
    },
    { 
      label: `Email Verification: ${user?.emailVerified ? 'Verified' : 'Unverified'}`, 
      passed: Boolean(user?.emailVerified), 
      icon: user?.emailVerified ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color="var(--warning-color)" /> 
    },
    { 
      label: 'High Value Threshold', 
      passed: Number(deposit?.amount) <= 5000, 
      icon: Number(deposit?.amount) <= 5000 ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color="var(--warning-color)" />, 
      info: Number(deposit?.amount) > 5000 ? 'Requires Admin Review' : 'Standard Amount' 
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning" style={{ fontSize: '14px', padding: '6px 12px' }}>PENDING</span>
      case 'COMPLETED': return <span className="badge badge-success" style={{ fontSize: '14px', padding: '6px 12px' }}>SUCCESS</span>
      case 'CANCELLED': return <span className="badge badge-error" style={{ fontSize: '14px', padding: '6px 12px' }}>REFUNDED</span>
      case 'FAILED': return <span className="badge badge-error" style={{ fontSize: '14px', padding: '6px 12px' }}>FAILED</span>
      default: return <span className="badge">{status}</span>
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={onClose} />
      
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '800px', backgroundColor: 'var(--bg-primary)', zIndex: 1001, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out' }}>
        
        {/* Header */}
        <div style={{ padding: 'var(--space-xl)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={24} color="var(--success-color)"/> Deposit Details
              </h2>
              {getStatusBadge(deposit.status)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>DEP-{deposit.id.substring(0, 8).toUpperCase()} • {new Date(deposit.createdAt).toLocaleString()}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
            
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              
              {/* Request Info */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount Deposited</span>
                    <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>🪙 {Number(deposit.amount).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Processing Fee (0%)</span>
                    <span style={{ fontWeight: 600 }}>🪙 0.00</span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)' }}>
                    <span style={{ fontWeight: 600 }}>Net Credited</span>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>🪙 {Number(deposit.amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Gateway Details */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={16}/> Payment Gateway: {deposit.gateway}
                </h3>
                <div style={{ backgroundColor: 'var(--bg-overlay)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  {deposit.gateway === 'CRYPTO' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Network</div>
                        <div style={{ fontWeight: 600 }}>{metadata.network || 'BTC / ETH'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tx Hash</div>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all' }}>{deposit.gatewayRef || 'Pending/Missing'}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Gateway Reference</div>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{deposit.gatewayRef || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Card Type</div>
                        <div style={{ fontWeight: 600 }}>{metadata.cardType || 'Visa **** 4242'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              
              {/* User Profile */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16}/> User Profile</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, color: 'var(--primary-color)' }}>
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>{user?.username}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Available Balance</span>
                    <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>🪙 {Number(deposit?.wallet?.balance || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Bonus Balance</span>
                    <span style={{ fontWeight: 600 }}>🪙 {Number(deposit?.wallet?.bonusBalance || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Lifetime Deposited</span>
                    <span style={{ fontWeight: 600 }}>🪙 {Number(deposit?.wallet?.totalDeposited || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Fraud & Security */}
              <div className="card" style={{ padding: '24px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--success-color)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={16}/> Automated Validation</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {validationChecks.map((check, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: check.passed ? 'var(--text-primary)' : 'var(--warning-color)', fontWeight: check.passed ? 500 : 600 }}>
                        {check.icon}
                        {check.label}
                      </div>
                      {check.info && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{check.info}</span>}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Admin Notes */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Internal Review Notes</h3>
            <textarea 
              className="form-input" 
              placeholder="Add notes for manual reconciliation..." 
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              disabled={deposit.status !== 'PENDING'}
            />
          </div>

        </div>

        {/* Footer Actions */}
        {deposit.status === 'PENDING' && (
          <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button className="btn btn-outline" style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={() => statusMutation.mutate('FAILED')} disabled={statusMutation.isPending}>
              <XCircle size={18} /> Mark as Failed
            </button>
            <button className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)' }} onClick={() => statusMutation.mutate('COMPLETED')} disabled={statusMutation.isPending}>
              <CheckCircle size={18} /> Reconcile & Credit
            </button>
          </div>
        )}
        
        {deposit.status === 'COMPLETED' && (
          <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-outline" style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={() => setShowRefundConfirm(true)} disabled={statusMutation.isPending}>
              <ArrowRightLeft size={18} style={{ marginRight: '6px' }}/> Refund & Debit Wallet
            </button>
          </div>
        )}

      </div>

      {/* Refund Confirmation Modal */}
      {showRefundConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
            <button 
              onClick={() => setShowRefundConfirm(false)} 
              style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#ef4444" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Confirm Deposit Refund</h3>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to refund this deposit? This action will mark the deposit status as <strong style={{ color: '#ef4444' }}>CANCELLED</strong> and reverse the credited coins from the user's wallet.
            </p>

            {/* Refund Transaction Details Box */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Deposit ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{deposit?.id?.substring(0, 12)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>User Account:</span>
                <span style={{ fontWeight: 600 }}>{user?.username || user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Refund Amount:</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>🪙 {Number(deposit?.amount || 0).toLocaleString()} ({deposit?.currency})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Wallet Available Balance:</span>
                <span style={{ fontWeight: 600 }}>🪙 {Number(deposit?.wallet?.balance || 0).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowRefundConfirm(false)}
                disabled={statusMutation.isPending}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white', fontWeight: 600 }} 
                onClick={handleConfirmRefund}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? 'Processing Refund...' : 'Confirm & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
