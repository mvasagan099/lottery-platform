import { Link } from 'react-router-dom'
import { Gift, Zap, ShieldCheck } from 'lucide-react'

export default function PromotionsPage() {
  const promos = [
    {
      id: 1,
      title: '$10 Welcome Bonus',
      desc: 'Sign up today and get $10 free credit added to your wallet. No deposit required.',
      icon: <Gift size={32} style={{ color: '#f5a623' }} />,
      cta: 'Claim Bonus',
      link: '/register',
      terms: 'New users only. Credit expires in 7 days.'
    },
    {
      id: 2,
      title: 'Refer a Friend, Get $20',
      desc: 'Invite your friends to MegaDraw. When they make their first deposit, you both get $20 bonus credit.',
      icon: <Zap size={32} style={{ color: 'var(--color-primary)' }} />,
      cta: 'Get Referral Link',
      link: '/profile/referral',
      terms: 'Minimum $20 deposit required by referred user.'
    },
    {
      id: 3,
      title: 'Powerball Double Jackpots',
      desc: 'For a limited time, all division 2-9 prizes in Powerball are doubled. Opt-in required.',
      icon: <ShieldCheck size={32} style={{ color: '#10b981' }} />,
      cta: 'Opt In Now',
      link: '/games/powerball',
      terms: 'Valid for next 3 draws only.'
    }
  ]

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 className="section-title">Promotions & Offers</h1>
          <div className="section-subtitle">Take advantage of our latest bonuses and special offers</div>
        </div>

        <div className="grid-3">
          {promos.map((p) => (
            <div key={p.id} className="card card-body" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>{p.icon}</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>{p.title}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', flex: 1 }}>{p.desc}</p>
              <Link to={p.link} className="btn btn-outline btn-full" style={{ marginBottom: '12px' }}>{p.cta}</Link>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>T&Cs Apply. {p.terms}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
