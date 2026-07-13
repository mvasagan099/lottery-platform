import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { walletService } from '@/services/wallet.service'
import { ArrowUpRight, CheckCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WithdrawPage() {
  const [amount, setAmount] = useState('')
  const [gateway, setGateway] = useState('BANK_TRANSFER')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bsb, setBsb] = useState('')

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.get(),
    select: (r) => r.data?.data,
  })

  const mutation = useMutation({
    mutationFn: () => walletService.requestWithdrawal({
      amount: Number(amount),
      gateway,
      accountDetails: { accountName, accountNumber, bsb },
    }),
    onSuccess: () => {
      toast.success('Withdrawal requested successfully!')
      setAmount('')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Withdrawal failed'),
  })

  const available = wallet?.balance || 0
  const isInvalid = !amount || Number(amount) < 50 || Number(amount) > available

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '640px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '36px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ArrowUpRight size={32} style={{ color: 'var(--color-accent)' }} />
          Withdraw Funds
        </h1>

        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="alert alert-info">
            <Info size={18} className="alert-icon" />
            <div>
              <strong>Available to Withdraw: ${available.toFixed(2)} AUD</strong>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Bonus balances cannot be withdrawn. Withdrawals take 1-3 business days to process.</div>
            </div>
          </div>

          <div>
            <div className="form-label">Withdrawal Method</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className={`btn btn-sm ${gateway === 'BANK_TRANSFER' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setGateway('BANK_TRANSFER')}
                style={{ flex: 1 }}
              >
                Bank Transfer (Free)
              </button>
            </div>
          </div>

          <div>
            <div className="form-label" style={{ marginBottom: '12px' }}>Amount to Withdraw (Min $50)</div>
            <div className="input-wrapper">
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>$</span>
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

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Account Name</label>
              <input type="text" className="form-input" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">BSB</label>
              <input type="text" className="form-input" value={bsb} onChange={(e) => setBsb(e.target.value)} placeholder="123-456" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Account Number</label>
              <input type="text" className="form-input" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="12345678" />
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || isInvalid || !accountName || !accountNumber || !bsb}
          >
            {mutation.isPending ? <><div className="btn-spinner" /> Processing...</> : 'Request Withdrawal'}
          </button>
        </div>
      </div>
    </div>
  )
}
