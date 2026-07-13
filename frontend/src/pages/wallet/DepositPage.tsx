import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { walletService } from '@/services/wallet.service'
import { ArrowDownLeft, CreditCard, Landmark } from 'lucide-react'
import toast from 'react-hot-toast'

const GATEWAYS = [
  { id: 'STRIPE', label: 'Credit/Debit Card', icon: <CreditCard size={20} />, fee: '1.5%', min: 10, max: 5000 },
  { id: 'PAYPAL', label: 'PayPal', icon: '🅿', fee: '2.5%', min: 10, max: 5000 },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <Landmark size={20} />, fee: 'Free', min: 50, max: 50000 },
]

export default function DepositPage() {
  const [amount, setAmount] = useState('')
  const [gateway, setGateway] = useState('STRIPE')

  const preset = [10, 20, 50, 100, 200, 500]

  const mutation = useMutation({
    mutationFn: () => walletService.initiateDeposit(Number(amount), gateway),
    onSuccess: (r) => {
      toast.success('Deposit initiated! Follow the payment instructions.')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Deposit failed'),
  })

  const selectedGw = GATEWAYS.find((g) => g.id === gateway)

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '640px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '36px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ArrowDownLeft size={32} style={{ color: 'var(--color-accent)' }} />
          Deposit Funds
        </h1>

        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Gateway selector */}
          <div>
            <div className="form-label" style={{ marginBottom: '12px' }}>Payment Method</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {GATEWAYS.map((gw) => (
                <button
                  key={gw.id}
                  onClick={() => setGateway(gw.id)}
                  style={{
                    padding: '14px 10px', borderRadius: '12px', textAlign: 'center',
                    border: `2px solid ${gateway === gw.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: gateway === gw.id ? 'rgba(26,58,143,0.06)' : 'var(--bg-card)',
                    cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', fontWeight: 600,
                    color: gateway === gw.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{gw.icon}</div>
                  <div>{gw.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Fee: {gw.fee}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="form-label" style={{ marginBottom: '12px' }}>
              Amount (AUD) — Min ${selectedGw?.min}, Max ${selectedGw?.max?.toLocaleString()}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {preset.map((p) => (
                <button key={p} onClick={() => setAmount(String(p))} className={`btn btn-sm ${amount === String(p) ? 'btn-primary' : 'btn-outline'}`}>
                  ${p}
                </button>
              ))}
            </div>
            <div className="input-wrapper">
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>$</span>
              <input
                type="number"
                className="form-input"
                style={{ paddingLeft: '28px' }}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={selectedGw?.min}
                max={selectedGw?.max}
              />
            </div>
          </div>

          {/* Summary */}
          {amount && Number(amount) > 0 && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Deposit Amount</span><span>${Number(amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>You'll receive</span>
                <span style={{ color: 'var(--color-accent)' }}>${Number(amount).toFixed(2)} AUD</span>
              </div>
            </div>
          )}

          <button
            className="btn btn-gold btn-lg btn-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !amount || Number(amount) < (selectedGw?.min || 10)}
          >
            {mutation.isPending ? <><div className="btn-spinner" /> Processing...</> : `Deposit $${amount || '0.00'} AUD`}
          </button>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            All deposits are processed securely. Bank transfers may take 1–2 business days.
          </p>
        </div>
      </div>
    </div>
  )
}
