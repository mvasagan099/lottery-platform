import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { walletService } from '@/services/wallet.service'
import { ArrowDownLeft, Ticket } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function DepositPage() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => walletService.redeemCoupon(code),
    onSuccess: (r) => {
      toast.success(`Redeemed successfully! Added ${r.data.data.amount} Coins to your wallet.`)
      setCode('')
      setTimeout(() => navigate('/wallet'), 2000)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Redemption failed'),
  })

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '500px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '36px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ArrowDownLeft size={32} style={{ color: 'var(--color-accent)' }} />
          Add Funds
        </h1>

        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Ticket size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px', opacity: 0.8 }} />
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Redeem Coupon</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
              Enter your promotional coupon code below to instantly add funds to your wallet balance.
            </p>
          </div>

          <div>
            <div className="form-label" style={{ marginBottom: '8px' }}>Coupon Code</div>
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="e.g. FREE50"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}
              />
            </div>
          </div>

          <button
            className="btn btn-gold btn-lg btn-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || code.length < 3}
          >
            {mutation.isPending ? <><div className="btn-spinner" /> Processing...</> : 'Redeem Code'}
          </button>
        </div>
      </div>
    </div>
  )
}
