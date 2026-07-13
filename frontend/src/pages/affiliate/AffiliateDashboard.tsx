import { useQuery } from '@tanstack/react-query'
import { affiliateService } from '@/services/index'
import { Copy, Trophy, Users, DollarSign, MousePointerClick, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import StatCard from '@/components/UI/StatCard'

export default function AffiliateDashboard() {
  const { data: profile } = useQuery({
    queryKey: ['affiliate-profile'],
    queryFn: () => affiliateService.getProfile(),
    select: (r) => r.data?.data,
  })

  const { data: stats } = useQuery({
    queryKey: ['affiliate-stats'],
    queryFn: () => affiliateService.getStats(),
    select: (r) => r.data?.data,
  })

  const copyLink = () => {
    if (profile?.referralLink) {
      navigator.clipboard.writeText(profile.referralLink)
      toast.success('Referral link copied to clipboard!')
    }
  }

  if (!profile) return (
    <div className="page-wrapper section"><div className="container" style={{ textAlign: 'center' }}><h2>Affiliate account not found or not active.</h2></div></div>
  )

  return (
    <div className="page-wrapper section">
      <div className="container">
        <div className="section-header">
          <div>
            <h1 className="section-title">Affiliate Dashboard</h1>
            <div className="section-subtitle">Manage your referrals and view earnings</div>
          </div>
        </div>

        <div className="card card-body" style={{ background: 'var(--gradient-hero)', color: 'white', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', opacity: 0.8 }}>Your Referral Link</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px' }}>
                <code style={{ fontSize: '16px', fontWeight: 600 }}>{profile.referralLink}</code>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={copyLink} style={{ color: 'white' }} title="Copy Link"><Copy size={18} /></button>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', opacity: 0.8 }}>Commission Rate</div>
              <div style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--color-secondary)' }}>{profile.commissionRate}%</div>
            </div>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: '32px' }}>
          <StatCard title="Total Earned" value={`🪙${Number(profile.totalEarned).toFixed(2)}`} icon={<Trophy size={20} />} variant="gold" />
          <StatCard title="Pending Payout" value={`🪙${Number(profile.pendingAmount).toFixed(2)}`} icon={<DollarSign size={20} />} variant="green" />
          <StatCard title="Total Signups" value={profile.totalSignups} icon={<Users size={20} />} />
          <StatCard title="Link Clicks" value={profile.totalClicks} icon={<MousePointerClick size={20} />} />
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: '18px' }}>Recent Referrals</h2></div>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead><tr><th>User</th><th>Joined Date</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No referrals yet. Share your link to start earning!</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: '18px' }}>Recent Commissions</h2></div>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No commissions earned yet.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
