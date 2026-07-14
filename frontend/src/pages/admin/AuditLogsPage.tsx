import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Activity, Download, Settings } from 'lucide-react';
import { AuditDashboard } from './audit/AuditDashboard';
import { AuditLogsTable } from './audit/AuditLogsTable';
import { LogDetailsDrawer } from './audit/LogDetailsDrawer';
import { AuditLog, AuditFilters } from '../../types/audit';

import toast from 'react-hot-toast';

export function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LOGS' | 'LIVE' | 'INVESTIGATIONS'>('DASHBOARD');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [isRetentionOpen, setIsRetentionOpen] = useState(false);

  const handleExport = () => {
    // Generate dummy CSV
    const csvContent = "data:text/csv;charset=utf-8,ID,Timestamp,Action,Module,User,IP\n" +
      "evt_1,2026-07-14T09:55:00Z,Login Success,AUTH,user1@example.com,192.168.1.1\n" + 
      "evt_2,2026-07-14T09:56:00Z,Wallet Debited,WALLET,user2@example.com,10.0.0.5";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit report exported successfully");
  };

  return (
    <div className="page-wrapper">
      <div className="admin-header">
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield className="text-brand" /> Audit Logs & Activity
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
                Enterprise system monitoring, security events, and audit trails.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={handleExport}><Download size={18} /> Export Report</button>
              <button className="btn btn-primary" onClick={() => setIsRetentionOpen(true)}><Settings size={18} /> Configure Retention</button>
            </div>
          </div>
          
          <div className="admin-tabs">
            <button className={`admin-tab ${activeTab === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setActiveTab('DASHBOARD')}>
              <Activity size={16} style={{ marginRight: '8px' }} /> Dashboard
            </button>
            <button className={`admin-tab ${activeTab === 'LOGS' ? 'active' : ''}`} onClick={() => setActiveTab('LOGS')}>
              <Search size={16} style={{ marginRight: '8px' }} /> System Logs
            </button>
            <button className={`admin-tab ${activeTab === 'LIVE' ? 'active' : ''}`} onClick={() => setActiveTab('LIVE')}>
              Live Feed <span style={{ marginLeft: '6px', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            </button>
            <button className={`admin-tab ${activeTab === 'INVESTIGATIONS' ? 'active' : ''}`} onClick={() => setActiveTab('INVESTIGATIONS')}>
              Investigations
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>
        
        {activeTab === 'DASHBOARD' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AuditDashboard />
          </motion.div>
        )}

        {activeTab === 'LOGS' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AuditLogsTable 
              onRowClick={setSelectedLog} 
              filters={filters}
              setFilters={setFilters}
            />
          </motion.div>
        )}

        {activeTab === 'LIVE' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <Activity size={48} color="var(--color-accent)" style={{ margin: '0 auto 16px auto', animation: 'pulse 2s infinite' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Real-time Audit Stream</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Connecting to WebSocket log stream for real-time monitoring...</p>
          </motion.div>
        )}

        {activeTab === 'INVESTIGATIONS' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <Shield size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Incident Investigations</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Assign, track, and resolve security incidents and flagged events.</p>
          </motion.div>
        )}

      </div>

      <LogDetailsDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />

      {/* Retention Modal */}
      {isRetentionOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(2px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Log Retention Policy</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Configure how long audit logs are kept before being automatically archived or deleted to comply with data regulations.
            </p>
            
            <div className="form-group">
              <label className="form-label">Retention Period</label>
              <select className="form-input" defaultValue="90">
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="180">6 Months</option>
                <option value="365">1 Year</option>
                <option value="never">Keep Indefinitely</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button className="btn btn-outline" onClick={() => setIsRetentionOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                toast.success('Retention policy updated');
                setIsRetentionOpen(false);
              }}>Save Policy</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AuditLogsPage;
