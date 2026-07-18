import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { walletService } from '@/services/wallet.service'
import { ArrowUpRight, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WithdrawPage() {
  const [amount, setAmount] = useState('')

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.get(),
    select: (r) => r.data?.data,
  })

  const transferMutation = useMutation({
    mutationFn: () => walletService.transferToCouponWallet(Number(amount)),
    onSuccess: () => {
      toast.success('Transferred to Coupon Wallet successfully!')
      setAmount('')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Transfer failed'),
  })

  const available = Number(wallet?.balance || 0)
  const isInvalid = !amount || Number(amount) < 50 || Number(amount) > available

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '640px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '36px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ArrowUpRight size={32} style={{ color: 'var(--color-accent)' }} />
          Transfer to Coupon Wallet
        </h1>

        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              />
              <button
                className="btn btn-ghost btn-sm"
                style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setAmount(String(available))}
              >
                Max
              </button>
            </div>
            {Number(amount) > available && (
              <span className="form-error" style={{ display: 'block', marginTop: '6px' }}>Amount exceeds available balance.</span>
            )}
          </div>

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
