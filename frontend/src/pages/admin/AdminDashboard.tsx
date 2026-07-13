import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/index'
import StatCard from '@/components/UI/StatCard'
import { Users, Ticket, Wallet, ShieldCheck, Activity } from 'lucide-react'

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
    select: (r) => r.data?.data,
  })

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title">Admin Dashboard</h1>
        
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users size={20} />} />
          <StatCard title="Pending KYC" value={stats?.pendingKYC || 0} icon={<ShieldCheck size={20} />} variant="gold" />
          <StatCard title="Pending Withdrawals" value={stats?.pendingWithdrawals || 0} icon={<Wallet size={20} />} variant="gold" />
          <StatCard title="Today's Revenue" value={`$${Number(stats?.totalRevenue || 0).toFixed(2)}`} icon={<Activity size={20} />} variant="green" />
        </div>

        <div className="card card-body">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>System Status</h2>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'currentColor' }} /> API Online
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'currentColor' }} /> Database Connected
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'currentColor' }} /> Redis Active
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
