import React from 'react';
import StatCard from '../../../components/UI/StatCard';
import { Activity, Users, Database, Globe, ShieldCheck, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';

export function SettingsDashboard() {
  const { data } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats')
      return res.data?.data
    },
    refetchInterval: 15000,
  })

  const activeUsersCount = data?.activeUsers || data?.totalUsers || 0
  const activeSessionsCount = data?.activeSessions || 0

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Platform Overview</h2>
      
      <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard
          title="System Health"
          value="99.98%"
          change="Operational"
          changePositive={true}
          icon={<Activity size={24} />}
        />
        <StatCard
          title="Active Users"
          value={activeUsersCount.toLocaleString()}
          change={`${activeSessionsCount} active sessions`}
          changePositive={true}
          icon={<Users size={24} />}
        />
        <StatCard
          title="API Uptime"
          value="100%"
          change="Last 30 days"
          changePositive={true}
          icon={<Globe size={24} />}
        />
      </div>

      <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <StatCard
          title="Database Load"
          value="42%"
          change="Optimal"
          changePositive={true}
          icon={<Database size={24} />}
        />
        <StatCard
          title="Storage Usage"
          value="1.2 TB"
          change="60% of 2 TB"
          changePositive={false}
          icon={<HardDrive size={24} />}
        />
        <StatCard
          title="Security Alerts"
          value="0"
          change="All systems secure"
          changePositive={true}
          icon={<ShieldCheck size={24} />}
        />
      </div>
    </motion.div>
  );
}
