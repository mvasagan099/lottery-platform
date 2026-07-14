import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, ShieldAlert, Shield, Server, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { auditService } from '../../../services/audit.service.mock';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, Cell, PieChart, Pie } from 'recharts';

export function AuditDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['audit', 'stats'],
    queryFn: () => auditService.getStats()
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['audit', 'analytics'],
    queryFn: () => auditService.getAnalytics()
  });

  if (statsLoading || analyticsLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="card" style={{ height: '120px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  const renderTrend = (value: number) => {
    const isPos = value >= 0;
    const color = isPos ? 'var(--color-accent)' : 'var(--color-secondary)';
    const Icon = isPos ? ArrowUpRight : ArrowDownRight;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color, fontSize: '13px', fontWeight: 600 }}>
        <Icon size={14} />
        {Math.abs(value)}%
      </div>
    );
  };

  const statCards = [
    { title: 'Total Events', value: stats?.totalLogs, trend: stats?.trends.totalLogs, icon: Activity, color: 'var(--color-primary)' },
    { title: 'Critical Events', value: stats?.criticalEvents, trend: stats?.trends.criticalEvents, icon: AlertTriangle, color: 'var(--color-secondary)' },
    { title: 'Security Alerts', value: stats?.securityEvents, trend: stats?.trends.securityEvents, icon: ShieldAlert, color: 'var(--color-accent)' },
    { title: 'Failed Logins', value: stats?.failedLogins, trend: stats?.trends.failedLogins, icon: Shield, color: '#ef4444' }
  ];

  const COLORS = ['#1a3a8f', '#f5a623', '#10b981', '#64748b', '#ef4444', '#8b5cf6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── Summary Cards ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {statCards.map((card, i) => (
          <div key={i} className="card card-interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.title}</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {card.value?.toLocaleString()}
                </div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${card.color}15`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={20} />
              </div>
            </div>
            {card.trend !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                {renderTrend(card.trend)}
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>vs last 30 days</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 600 }}>System Activity Timeline</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={analytics?.timeline}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                  itemStyle={{ fontSize: '13px' }}
                />
                <Area type="monotone" dataKey="count" name="Total Events" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                <Area type="monotone" dataKey="errors" name="Errors/Failures" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorErrors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 600 }}>Events by Module</h3>
          <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={analytics?.moduleDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {analytics?.moduleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}
                  itemStyle={{ fontSize: '13px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
