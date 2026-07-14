import React, { useState } from 'react';
import { SimpleErrorBoundary } from '../../components/SimpleErrorBoundary';
import { motion } from 'framer-motion';
import { HeadphonesIcon, Activity, List, BookOpen, BarChart3, Plus, Settings } from 'lucide-react';
import { SupportDashboard } from './support/SupportDashboard';
import { SupportTicketTable } from './support/SupportTicketTable';
import { TicketDetailsDrawer } from './support/TicketDetailsDrawer';
import { SupportTicket, TicketFilters } from '../../types/support';
import { X, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export default function SupportAdminPage() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TICKETS' | 'KNOWLEDGE' | 'ANALYTICS'>('DASHBOARD');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({});
  
  const { data: agentsRes, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['support', 'agents'],
    queryFn: async () => {
      const res = await api.get('/admin/support/agents');
      return res.data;
    }
  });
  const agents = agentsRes?.data || [];
  
  const [showManageAgents, setShowManageAgents] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);

  return (
    <SimpleErrorBoundary>
      <div className="page-wrapper">
        <div className="admin-header">
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <HeadphonesIcon className="text-brand" /> Support Center
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
                Manage customer inquiries, view agent performance, and configure help center.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setShowManageAgents(true)}><Settings size={18} /> Manage Agents</button>
              <button className="btn btn-primary" onClick={() => setShowNewTicket(true)}><Plus size={18} /> New Ticket</button>
            </div>
          </div>
          
          <div className="admin-tabs">
            <button className={`admin-tab ${activeTab === 'DASHBOARD' ? 'active' : ''}`} onClick={() => setActiveTab('DASHBOARD')}>
              <Activity size={16} style={{ marginRight: '8px' }} /> Dashboard
            </button>
            <button className={`admin-tab ${activeTab === 'TICKETS' ? 'active' : ''}`} onClick={() => setActiveTab('TICKETS')}>
              <List size={16} style={{ marginRight: '8px' }} /> Tickets
            </button>
            <button className={`admin-tab ${activeTab === 'KNOWLEDGE' ? 'active' : ''}`} onClick={() => setActiveTab('KNOWLEDGE')}>
              <BookOpen size={16} style={{ marginRight: '8px' }} /> Knowledge Base
            </button>
            <button className={`admin-tab ${activeTab === 'ANALYTICS' ? 'active' : ''}`} onClick={() => setActiveTab('ANALYTICS')}>
              <BarChart3 size={16} style={{ marginRight: '8px' }} /> Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px', paddingBottom: '64px' }}>
        
        {activeTab === 'DASHBOARD' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SupportDashboard />
          </motion.div>
        )}

        {activeTab === 'TICKETS' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SupportTicketTable 
              onRowClick={setSelectedTicket} 
              filters={filters}
              setFilters={setFilters}
            />
          </motion.div>
        )}

        {activeTab === 'KNOWLEDGE' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <BookOpen size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Knowledge Base Articles</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Create and manage help articles, FAQs, and tutorials.</p>
            <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => toast.success('Knowledge Base CMS coming soon!')}>Manage Articles</button>
          </motion.div>
        )}

        {activeTab === 'ANALYTICS' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <BarChart3 size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Support Analytics & Reports</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Detailed breakdown of agent performance, CSAT scores, and ticket categories.</p>
          </motion.div>
        )}

        {selectedTicket && (
          <TicketDetailsDrawer ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        )}

      </div>

      {/* Manage Agents Modal */}
      {showManageAgents && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(2px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Manage Support Agents</h2>
              <button onClick={() => setShowManageAgents(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isLoadingAgents ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading agents...</div>
              ) : agents.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>No agents found.</div>
              ) : agents.map((agent: any, i: number) => (
                <div key={agent.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {agent.avatar ? (
                      <img src={agent.avatar} alt={agent.fullName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserIcon size={20} color="var(--text-muted)" />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{agent.fullName || agent.username}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Role: {agent.role || 'Agent'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '13px', padding: '4px 8px', backgroundColor: agent.status === "ONLINE" ? "var(--color-success-light)" : "var(--bg-secondary)", color: agent.status === "ONLINE" ? "var(--color-success-dark)" : "var(--text-muted)", borderRadius: '12px', fontWeight: 600 }}>
                      {agent.status}
                    </span>
                    <button className="btn btn-outline" style={{ padding: '6px 12px' }}>Edit</button>
                  </div>
                </div>
              ))}
              
              <button className="btn btn-outline" style={{ marginTop: '8px', borderStyle: 'dashed' }} onClick={() => toast.success('Agent invitation sent')}>
                <Plus size={16} style={{ marginRight: '8px' }} /> Invite New Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(2px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Create New Ticket</h2>
              <button onClick={() => setShowNewTicket(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowNewTicket(false); toast.success('Ticket created successfully'); }}>
              <div className="form-group">
                <label className="form-label">User Email / ID</label>
                <input type="text" className="form-input" placeholder="Search user..." required />
              </div>
              
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" className="form-input" placeholder="Enter ticket subject" required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" required>
                    <option value="TECHNICAL">Technical</option>
                    <option value="DEPOSITS">Deposits</option>
                    <option value="WITHDRAWALS">Withdrawals</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" required>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Initial Message</label>
                <textarea className="form-input" rows={4} placeholder="Describe the issue..." required></textarea>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowNewTicket(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Ticket</button>
              </div>
            </form>
          </div>
        </div>
        )}
      </div>
    </SimpleErrorBoundary>
  );
}
