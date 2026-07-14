import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { X, Trophy, DollarSign, Settings, Users, Percent, Shield, Activity, BarChart2 } from 'lucide-react'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ScheduleDrawDrawer } from './ScheduleDrawDrawer'
import { EditPrizeDivisionsDrawer } from './EditPrizeDivisionsDrawer'

interface Props {
  gameId: string | null
  onClose: () => void
}

export function GameProfileDrawer({ gameId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DRAWS' | 'DIVISIONS' | 'ANALYTICS' | 'SETTINGS'>('OVERVIEW')
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isEditDivisionsOpen, setIsEditDivisionsOpen] = useState(false)

  const { data: record, isLoading } = useQuery({
    queryKey: ['admin', 'games', gameId],
    queryFn: async () => {
      const res = await api.get(`/admin/games/${gameId}`)
      return res.data.data
    },
    enabled: !!gameId,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: { isActive?: boolean, jackpotAmount?: number, ticketPrice?: number }) => {
      return api.patch(`/admin/games/${gameId}`, data)
    },
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries({ queryKey: ['admin', 'games'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Update failed')
  })

  if (!gameId) return null

  // Simulated Mock Data for Analytics
  const mockSalesData = Array.from({ length: 30 }).map((_, i) => ({
    date: dayjs().subtract(29 - i, 'day').format('MMM D'),
    tickets: Math.floor(Math.random() * 5000) + 1000,
    revenue: Math.floor(Math.random() * 10000) + 2000
  }))

  const isSuspended = record?.isActive === false

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={onClose} />
      
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '900px', backgroundColor: 'var(--bg-primary)', zIndex: 1001, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflowY: 'auto', animation: 'slideInRight 0.3s ease-out' }}>
        
        {/* Header */}
        <div style={{ padding: 'var(--space-xl)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', right: 'var(--space-xl)', top: 'var(--space-xl)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-color), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 600 }}>
              {record?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ paddingRight: 40 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{record?.name}</h1>
                <span style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: isSuspended ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isSuspended ? '#ef4444' : '#10b981' }}>
                  {isSuspended ? 'Disabled' : 'Active'}
                </span>
                {record?.isFeatured && (
                  <span style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    Featured
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>/{record?.slug} • Added {dayjs(record?.createdAt).format('MMM D, YYYY')}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid-4" style={{ gap: 'var(--space-md)' }}>
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Jackpot</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f59e0b' }}>🪙{Number(record?.jackpotAmount || 0).toLocaleString()}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Ticket Price</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>🪙{Number(record?.ticketPrice || 0).toFixed(2)}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Pool Type</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{record?.minNumbers}/{record?.numberPool} {record?.hasPowerball && `+ PB`}</div>
            </div>
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 4 }}>Upcoming Draws</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{record?.draws?.length || 0} Scheduled</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', flexShrink: 0, borderBottom: '1px solid var(--border-color)', padding: '0 var(--space-xl)', overflowX: 'auto', position: 'sticky', top: 0, backgroundColor: 'var(--bg-primary)', zIndex: 10 }}>
          {['OVERVIEW', 'DRAWS', 'DIVISIONS', 'ANALYTICS', 'SETTINGS'].map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab as any)} style={{ padding: '16px 24px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {tab === 'DIVISIONS' ? 'Prize Divisions' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: 'var(--space-xl)' }}>
          {isLoading ? (
            <div className="loading-spinner" style={{ margin: '40px auto' }}></div>
          ) : (
            <>
              {activeTab === 'OVERVIEW' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                  <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}><Settings size={18}/> Configuration</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Game Code / Slug</div>
                        <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{record?.slug}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Draw Schedule (Cron)</div>
                        <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{record?.drawSchedule}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Primary Pool</div>
                        <div style={{ fontWeight: 500 }}>Pick {record?.minNumbers} out of {record?.numberPool}</div>
                      </div>
                      {record?.hasPowerball && (
                        <div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Powerball Pool</div>
                          <div style={{ fontWeight: 500 }}>Pick 1 out of {record?.powerballPool}</div>
                        </div>
                      )}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Short Description</div>
                        <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.9rem' }}>{record?.shortDescription || 'No description provided.'}</div>
                      </div>
                    </div>
                  </section>
                  
                  <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={18}/> Geo & Age Restrictions (Mock)</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 16px' }}>These settings are mocked for UI presentation.</p>
                      <div style={{ display: 'flex', gap: '24px' }}>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><input type="checkbox" checked readOnly/> Requires 18+ Verification</label>
                        </div>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><input type="checkbox" checked readOnly/> Geofenced to Australia Only</label>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'ANALYTICS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
                  <section>
                    <h3>Live Ticket Sales (Last 30 Days)</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockSalesData}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="tickets" stroke="var(--primary-color)" fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section>
                    <h3>Revenue Growth</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockSalesData}>
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

              {activeTab === 'DIVISIONS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Prize Distribution Table</h3>
                    <button className="btn btn-outline btn-sm" onClick={() => setIsEditDivisionsOpen(true)}>Edit Table</button>
                  </div>
                  <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Division</th>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Requirements</th>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Prize</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record?.prizeDivisions?.length === 0 ? (
                          <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No divisions configured</td></tr>
                        ) : (
                          record?.prizeDivisions?.map((div: any) => (
                            <tr key={div.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 600 }}>{div.divisionName}</td>
                              <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                Match {div.matchNumbers} {div.matchPB && ' + PB'} {div.matchSupp > 0 && ` + ${div.matchSupp} Supp`}
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 600, color: div.isJackpot ? '#f59e0b' : 'var(--text-primary)' }}>
                                {div.isJackpot ? 'JACKPOT' : div.fixedPrize ? `🪙${Number(div.fixedPrize).toFixed(2)}` : 'Varies'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'DRAWS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Recent & Upcoming Draws</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setIsScheduleOpen(true)}>Schedule Draw</button>
                  </div>
                  <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Draw ID</th>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Schedule</th>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                          <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record?.draws?.length === 0 ? (
                          <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No draws configured</td></tr>
                        ) : (
                          record?.draws?.map((draw: any) => (
                            <tr key={draw.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>#{draw.drawNumber || draw.id.substring(0,6)}</td>
                              <td style={{ padding: '12px 16px' }}>{dayjs(draw.scheduledAt).format('MMM D, HH:mm')}</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: draw.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : draw.status === 'PENDING' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', color: draw.status === 'COMPLETED' ? '#10b981' : draw.status === 'PENDING' ? '#3b82f6' : '#f59e0b' }}>
                                  {draw.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                {draw.status === 'PENDING' && <button className="btn btn-outline btn-sm">Run Draw</button>}
                                {draw.status === 'COMPLETED' && <button className="btn btn-ghost btn-sm">View Results</button>}
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
                  
                  {/* Financials */}
                  <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={18}/> Financial Settings</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-lg)' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Ticket Price</label>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <input type="number" id="ticketPrice" className="form-input" defaultValue={Number(record?.ticketPrice)} style={{ flex: 1 }} step="0.01" />
                            <button className="btn btn-primary" onClick={() => {
                              const val = Number((document.getElementById('ticketPrice') as HTMLInputElement).value)
                              updateMutation.mutate({ ticketPrice: val })
                            }}>Save</button>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Advertised Jackpot</label>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <input type="number" id="jackpot" className="form-input" defaultValue={Number(record?.jackpotAmount)} style={{ flex: 1 }} />
                            <button className="btn btn-primary" onClick={() => {
                              const val = Number((document.getElementById('jackpot') as HTMLInputElement).value)
                              updateMutation.mutate({ jackpotAmount: val })
                            }}>Save</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Actions */}
                  <section>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={18}/> Game State</h3>
                    <div className="card" style={{ padding: 'var(--space-lg)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{isSuspended ? 'Enable Game' : 'Disable Game'}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                            {isSuspended ? 'Allow users to purchase tickets for this game again.' : 'Instantly halt all ticket sales and hide this game from the catalog.'}
                          </div>
                        </div>
                        <button 
                          className="btn" 
                          style={{ backgroundColor: isSuspended ? '#10b981' : '#ef4444', color: 'white', border: 'none' }}
                          onClick={() => updateMutation.mutate({ isActive: !record?.isActive })}
                        >
                          {isSuspended ? 'Enable Game' : 'Disable Game'}
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
      <ScheduleDrawDrawer isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} defaultGameId={record?.id} />
      <EditPrizeDivisionsDrawer isOpen={isEditDivisionsOpen} onClose={() => setIsEditDivisionsOpen(false)} gameId={record?.id} initialDivisions={record?.prizeDivisions || []} />
    </>
  )
}
