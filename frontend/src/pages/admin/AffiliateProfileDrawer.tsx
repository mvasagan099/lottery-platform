import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { X, Users, DollarSign, Activity, Percent, Gift, Link, QrCode, Shield, CheckCircle, Ban, AlertTriangle } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface Props {
  affiliateId: string | null
  onClose: () => void
}

export function AffiliateProfileDrawer({ affiliateId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PERFORMANCE' | 'COMMISSIONS' | 'SETTINGS'>('OVERVIEW')

  const { data: record, isLoading } = useQuery({
    queryKey: ['admin', 'affiliates', affiliateId],
    queryFn: async () => {
      const res = await api.get(`/admin/affiliates/${affiliateId}`)
      return res.data.data
    },
    enabled: !!affiliateId,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: { isActive?: boolean, commissionRate?: number }) => {
      return api.patch(`/admin/affiliates/${affiliateId}`, data)
    },
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Update failed')
  })

  if (!affiliateId) return null

  // Simulated Mock Data for Analytics
  const mockPerformanceData = Array.from({ length: 30 }).map((_, i) => ({
    date: dayjs().subtract(29 - i, 'day').format('MMM D'),
    clicks: Math.floor(Math.random() * 500) + 50,
    signups: Math.floor(Math.random() * 20),
    revenue: Math.floor(Math.random() * 500)
  }))

  const tier = record?.totalEarned > 5000 ? 'Platinum' : record?.totalEarned > 1000 ? 'Gold' : 'Silver'
  const isSuspended = record?.isActive === false

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={onClose} />
      
      {/* Drawer */}
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '800px', backgroundColor: 'var(--bg-primary)', zIndex: 1001, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out' }}>
        
        {/* Header */}
        <div style={{ padding: 'var(--space-xl)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', right: 'var(--space-xl)', top: 'var(--space-xl)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 600 }}>
              {record?.user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{record?.user?.username}</h1>
                <span style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: isSuspended ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isSuspended ? '#ef4444' : '#10b981' }}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </span>
                <span style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                  {tier} Tier
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>{record?.user?.email} • Joined {dayjs(record?.createdAt).format('MMM YYYY')}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Total Earned</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>${Number(record?.totalEarned || 0).toFixed(2)}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Pending Payout</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f59e0b' }}>${Number(record?.pendingAmount || 0).toFixed(2)}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Referrals</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{record?.totalSignups}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Conversion Rate</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{record?.totalClicks ? ((record.totalSignups / record.totalClicks) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 var(--space-xl)' }}>
          <button className={`tab-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`} onClick={() => setActiveTab('OVERVIEW')} style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'OVERVIEW' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'OVERVIEW' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Overview</button>
          <button className={`tab-btn ${activeTab === 'PERFORMANCE' ? 'active' : ''}`} onClick={() => setActiveTab('PERFORMANCE')} style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'PERFORMANCE' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'PERFORMANCE' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Performance Analytics</button>
          <button className={`tab-btn ${activeTab === 'COMMISSIONS' ? 'active' : ''}`} onClick={() => setActiveTab('COMMISSIONS')} style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'COMMISSIONS' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'COMMISSIONS' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>History</button>
          <button className={`tab-btn ${activeTab === 'SETTINGS' ? 'active' : ''}`} onClick={() => setActiveTab('SETTINGS')} style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'SETTINGS' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'SETTINGS' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>Settings & Fraud</button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-xl)' }}>
          {isLoading ? (
            <div className="loading-spinner" style={{ margin: '40px auto' }}></div>
          ) : (
            <>
              {activeTab === 'OVERVIEW' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                  <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}><Link size={18}/> Referral Assets</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Primary Affiliate Link</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input type="text" className="form-input" value={`https://lottery.app/ref/${record?.affiliateCode}`} readOnly style={{ flex: 1 }} />
                        <button className="btn btn-outline">Copy</button>
                      </div>
                      <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
                        <div style={{ width: 120, height: 120, backgroundColor: 'white', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <QrCode size={100} color="black"/>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Download Assets</p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-outline btn-sm">Banners</button>
                            <button className="btn btn-outline btn-sm">Logos</button>
                            <button className="btn btn-outline btn-sm">Landing Page Templates</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18}/> Personal Details</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full Name</div>
                        <div style={{ fontWeight: 500 }}>{record?.user?.firstName} {record?.user?.lastName}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email</div>
                        <div style={{ fontWeight: 500 }}>{record?.user?.email}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone</div>
                        <div style={{ fontWeight: 500 }}>{record?.user?.phone || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Country</div>
                        <div style={{ fontWeight: 500 }}>{record?.user?.country || 'N/A'}</div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'PERFORMANCE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                  <section>
                    <h3>Referral Traffic (Last 30 Days)</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockPerformanceData}>
                          <defs>
                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="clicks" stroke="var(--primary-color)" fillOpacity={1} fill="url(#colorClicks)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section>
                    <h3>Revenue Generated (Last 30 Days)</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'COMMISSIONS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Recent Commissions</h3>
                    <button className="btn btn-outline btn-sm">Export CSV</button>
                  </div>
                  <div className="card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Date</th>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Type</th>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>User ID</th>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Amount</th>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record?.commissions?.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No commission history</td></tr>
                        ) : (
                          record?.commissions?.map((c: any) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px 16px' }}>{dayjs(c.createdAt).format('MMM D, HH:mm')}</td>
                              <td style={{ padding: '12px 16px' }}>{c.type}</td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{c.referredUserId.substring(0,8)}</td>
                              <td style={{ padding: '12px 16px', fontWeight: 600, color: '#10b981' }}>+${Number(c.amount).toFixed(2)}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: c.isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: c.isPaid ? '#10b981' : '#f59e0b' }}>
                                  {c.isPaid ? 'PAID' : 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'SETTINGS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                  
                  {/* Simulated Fraud Engine */}
                  <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}><Shield size={18}/> Fraud & Risk Analysis</h3>
                    <div className="card" style={{ padding: 'var(--space-md)', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#10b981' }}>Traffic Risk Score</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>12/100</span>
                      </div>
                      <p style={{ margin: '8px 0 0', color: '#10b981', fontSize: '0.85rem' }}>No bot traffic or self-referral patterns detected.</p>
                    </div>
                  </section>

                  {/* Commission Plan */}
                  <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Percent size={18}/> Commission Plan</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Plan Type (Mock)</label>
                          <select className="form-select" style={{ width: '100%' }}>
                            <option>Revenue Share</option>
                            <option>CPA (Cost Per Acquisition)</option>
                            <option>Hybrid</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Commission Rate (%)</label>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <input type="number" id="commissionRate" className="form-input" defaultValue={Number(record?.commissionRate)} style={{ flex: 1 }} />
                            <button className="btn btn-primary" onClick={() => {
                              const rate = Number((document.getElementById('commissionRate') as HTMLInputElement).value)
                              updateMutation.mutate({ commissionRate: rate })
                            }}>Save</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Account Actions */}
                  <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={18}/> Danger Zone</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{isSuspended ? 'Reactivate Affiliate' : 'Suspend Affiliate'}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                            {isSuspended ? 'Allow this user to earn commissions again.' : 'Stop all commission tracking and payouts for this user instantly.'}
                          </div>
                        </div>
                        <button 
                          className="btn" 
                          style={{ backgroundColor: isSuspended ? '#10b981' : '#ef4444', color: 'white', border: 'none' }}
                          onClick={() => updateMutation.mutate({ isActive: !record?.isActive })}
                        >
                          {isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
