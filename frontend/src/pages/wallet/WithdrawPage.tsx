import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { walletService } from '@/services/wallet.service'
import { ArrowUpRight, Info, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function WithdrawPage() {
  const [amount, setAmount] = useState('')
  const [totp, setTotp] = useState('')
  const { user } = useAuthStore()

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.get(),
    select: (r) => r.data?.data,
  })

  const transferMutation = useMutation({
    mutationFn: () => walletService.transferToCouponWallet(Number(amount), totp),
    onSuccess: () => {
      toast.success('Transferred to Coupon Wallet successfully!')
      setAmount('')
      setTotp('')
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error || 'Transfer failed'
      if (err.response?.data?.code === 'KYC_REQUIRED') {
        toast.error('Please complete KYC verification before withdrawing funds')
      } else {
        toast.error(errMsg)
      }
    },
  })

  const available = Number(wallet?.balance || 0)
  const isKycVerified = user?.kycStatus === 'APPROVED'
  const is2FAEnabled = user?.twoFactorEnabled
  const isInvalid = !amount || Number(amount) < 50 || Number(amount) > available || !isKycVerified || !is2FAEnabled || totp.length !== 6

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '640px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '36px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ArrowUpRight size={32} style={{ color: 'var(--color-accent)' }} />
          Transfer to Coupon Wallet
        </h1>

        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {!isKycVerified && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert size={24} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '15px' }}>Please complete KYC verification</strong>
                  <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '2px' }}>
                    Identity verification is required before withdrawing or transferring funds.
                  </div>
                </div>
              </div>
              <Link to="/profile/kyc" className="btn btn-sm btn-gold" style={{ whiteSpace: 'nowrap' }}>
                Verify Now
              </Link>
            </div>
          )}

          {!is2FAEnabled && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert size={24} style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '15px' }}>2-Step Verification Required</strong>
                  <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '2px' }}>
                    You must enable 2FA in your security settings before withdrawing funds.
                  </div>
                </div>
              </div>
              <Link to="/profile/security" className="btn btn-sm btn-gold" style={{ whiteSpace: 'nowrap' }}>
                Setup 2FA
              </Link>
            </div>
          )}

          <div className="alert alert-info">
            <Info size={18} className="alert-icon" />
            <div>
              <strong>Available to Transfer: {available.toFixed(2)} Coins</strong>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Bonus balances cannot be transferred. Transfers are instant.</div>
            </div>
          </div>

          <div>
            <div className="form-label" style={{ marginBottom: '12px' }}>Amount to Transfer (Min 🪙50)</div>
            <div className="input-wrapper">
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>🪙</span>
              <input
                type="number"
                className="form-input"
                style={{ paddingLeft: '28px' }}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="50"
                max={available}
                disabled={!isKycVerified}
              />
              <button
                className="btn btn-ghost btn-sm"
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setAmount(String(available))}
                disabled={!isKycVerified}
              >
                Max
              </button>
            </div>
            {Number(amount) > available && (
              <span className="form-error" style={{ display: 'block', marginTop: '6px' }}>Amount exceeds available balance.</span>
            )}
          </div>

          {is2FAEnabled && (
            <div>
              <div className="form-label" style={{ marginBottom: '12px' }}>Authenticator Code (2FA)</div>
              <input
                type="text"
                className="form-input"
                placeholder="6-digit code"
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={!isKycVerified}
              />
            </div>
          )}

          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={() => transferMutation.mutate()}
            disabled={transferMutation.isPending || isInvalid}
          >
            {transferMutation.isPending ? <><div className="btn-spinner" /> Processing...</> : 'Transfer Now'}
          </button>
        </div>
      </div>
    </div>
  )
}

