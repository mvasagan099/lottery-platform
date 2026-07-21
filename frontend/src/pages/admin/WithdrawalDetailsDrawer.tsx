import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { 
  X, User, ShieldAlert, CheckCircle, XCircle, CreditCard, Clock, Activity, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  withdrawalId: string
  onClose: () => void
}

export function WithdrawalDetailsDrawer({ withdrawalId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [reviewNotes, setReviewNotes] = useState('')

  const { data: withdrawal, isLoading } = useQuery({
    queryKey: ['admin', 'withdrawals', withdrawalId],
    queryFn: async () => {
      const res = await api.get(`/admin/withdrawals/${withdrawalId}`)
      return res.data.data
    }
  })

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      return api.patch(`/admin/withdrawals/${withdrawalId}/status`, { status, reviewNotes })
    },
    onSuccess: () => {
      toast.success('Withdrawal status updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || 'Failed to update status')
    }
  })

  if (isLoading) return null

  const user = withdrawal?.wallet?.user
  const accountDetails = withdrawal?.accountDetails || {}

  // Real Validation Checks for Withdrawals
  const validationChecks = [
    { 
      label: `KYC Status: ${user?.kycStatus || 'NOT_SUBMITTED'}`, 
      passed: user?.kycStatus === 'APPROVED', 
      icon: user?.kycStatus === 'APPROVED' ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color="var(--warning-color)" /> 
    },
    { 
      label: `User Status: ${user?.status || 'ACTIVE'}`, 
      passed: user?.status === 'ACTIVE', 
      icon: user?.status === 'ACTIVE' ? <CheckCircle size={16} color="var(--success-color)" /> : <XCircle size={16} color="var(--error-color)" /> 
    },
    { 
      label: `Email Verification: ${user?.emailVerified ? 'Verified' : 'Unverified'}`, 
      passed: Boolean(user?.emailVerified), 
      icon: user?.emailVerified ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color="var(--warning-color)" /> 
    },
    { 
      label: 'Sufficient Balance Check', 
      passed: Number(withdrawal?.wallet?.balance || 0) >= 0, 
      icon: Number(withdrawal?.wallet?.balance || 0) >= 0 ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color="var(--warning-color)" /> 
    },
    { 
      label: 'High Value Threshold', 
      passed: Number(withdrawal?.amount) <= 10000, 
      icon: Number(withdrawal?.amount) <= 10000 ? <CheckCircle size={16} color="var(--success-color)" /> : <AlertTriangle size={16} color="var(--warning-color)" />, 
      info: Number(withdrawal?.amount) > 10000 ? 'Requires Admin Approval' : 'Standard Amount' 
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning" style={{ fontSize: '14px', padding: '6px 12px' }}>PENDING REVIEW</span>
      case 'IN_PROGRESS': return <span className="badge badge-info" style={{ fontSize: '14px', padding: '6px 12px' }}>PROCESSING</span>
      case 'COMPLETED': return <span className="badge badge-success" style={{ fontSize: '14px', padding: '6px 12px' }}>PAID</span>
      case 'CANCELLED': return <span className="badge badge-error" style={{ fontSize: '14px', padding: '6px 12px' }}>REJECTED</span>
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
                <CreditCard size={24} color="var(--primary-color)"/> Withdrawal Details
              </h2>
              {getStatusBadge(withdrawal.status)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>WDR-{withdrawal.id.substring(0, 8).toUpperCase()} • {new Date(withdrawal.createdAt).toLocaleString()}</div>
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
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount Requested</span>
                    <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>🪙 {Number(withdrawal.amount).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Network Fee</span>
                    <span style={{ fontWeight: 600 }}>🪙 0.00</span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-color)' }}>
                    <span style={{ fontWeight: 600 }}>Net Payout</span>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>🪙 {Number(withdrawal.amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={16}/> Payment Gateway: {withdrawal.gateway}
                </h3>
                <div style={{ backgroundColor: 'var(--bg-overlay)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  {withdrawal.gateway === 'CRYPTO' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Network</div>
                        <div style={{ fontWeight: 600 }}>{accountDetails.network || 'USDT TRC20'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Wallet Address</div>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all' }}>{accountDetails.address || 'TDXyZ...'}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Bank Name</div>
                        <div style={{ fontWeight: 600 }}>{accountDetails.bankName || 'Unknown Bank'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Name</div>
                        <div style={{ fontWeight: 600 }}>{accountDetails.accountName || user?.firstName + ' ' + user?.lastName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Number / BSB</div>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{accountDetails.accountNumber || 'XXX-XXX'}</div>
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
                    <span style={{ fontWeight: 600 }}>🪙 {Number(withdrawal?.wallet?.balance || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pending Withdrawals</span>
                    <span style={{ fontWeight: 600, color: 'var(--warning-color)' }}>🪙 {Number(withdrawal?.wallet?.pendingBalance || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Lifetime Deposited</span>
                    <span style={{ fontWeight: 600 }}>🪙 {Number(withdrawal?.wallet?.totalDeposited || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Lifetime Withdrawn</span>
                    <span style={{ fontWeight: 600 }}>🪙 {Number(withdrawal?.wallet?.totalWithdrawn || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Fraud & Security */}
              <div className="card" style={{ padding: '24px', border: '1px solid rgba(245,158,11,0.3)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--warning-color)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={16}/> Automated Validation</h3>
                
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
              placeholder="Add notes explaining rejection, holding reasons, or compliance tags..." 
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              disabled={withdrawal.status !== 'PENDING' && withdrawal.status !== 'IN_PROGRESS'}
            />
            {withdrawal.reviewNotes && (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Previous Note:</strong>
                {withdrawal.reviewNotes}
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        {withdrawal.status === 'PENDING' && (
          <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button className="btn btn-outline" style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={() => statusMutation.mutate('CANCELLED')} disabled={statusMutation.isPending}>
              <XCircle size={18} /> Reject & Refund
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ color: 'var(--error-color)', borderColor: 'var(--error-color)' }} onClick={() => statusMutation.mutate('FAILED')} disabled={statusMutation.isPending}>
                Mark Failed
              </button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)' }} onClick={() => statusMutation.mutate('COMPLETED')} disabled={statusMutation.isPending}>
                <CheckCircle size={18} /> Approve & Pay
              </button>
            </div>
          </div>
        )}


      </div>
    </>
  )
}
