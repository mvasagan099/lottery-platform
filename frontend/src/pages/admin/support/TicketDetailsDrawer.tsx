import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, Paperclip, User as UserIcon, AlertCircle, CheckCircle, Clock, MoreVertical, CreditCard, ArrowRightLeft, ShieldCheck, Mail, Globe, MapPin, Search } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import toast from 'react-hot-toast';
import { api } from '../../../services/api';
import { SupportTicket } from '../../../types/support';

interface Props {
  ticket: SupportTicket | null;
  onClose: () => void;
}

export function TicketDetailsDrawer({ ticket, onClose }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isInternal, setIsInternal] = useState(false);

  const { data: fullTicket, isLoading } = useQuery({
    queryKey: ['support', 'ticket', ticket?.id],
    queryFn: async () => {
      const res = await api.get(`/admin/support/tickets/${ticket!.id}`);
      return res.data.data;
    },
    enabled: !!ticket,
  });

  const { data: agentsRes } = useQuery({
    queryKey: ['support', 'agents'],
    queryFn: async () => {
      const res = await api.get('/admin/support/agents');
      return res.data;
    }
  });

  const agents = agentsRes?.data || [];
  const messages = fullTicket?.messages || [];

  const sendReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/admin/support/tickets/${ticket!.id}/reply`, {
        message: content,
        isInternal
      });
      return res.data;
    },
    onSuccess: (newMsg) => {
      queryClient.invalidateQueries({ queryKey: ['support', 'ticket', ticket?.id] });
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
      editor?.commands.setContent('');
      toast.success('Reply sent successfully');
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const creditWalletMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post(`/admin/users/${fullTicket?.user?.id}/wallet/adjust`, {
        amount,
        reason: `Credited via Support Ticket #${ticket?.id}`,
        type: 'CREDIT'
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'ticket', ticket?.id] });
      toast.success('Wallet credited successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to credit wallet'),
  });

  const suspendUserMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/admin/users/${fullTicket?.user?.id}/status`, {
        status: 'SUSPENDED'
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'ticket', ticket?.id] });
      toast.success('User suspended successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to suspend user'),
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(`/admin/support/tickets/${ticket?.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'ticket', ticket?.id] });
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
      toast.success('Ticket updated');
    },
    onError: () => toast.error('Failed to update ticket'),
  });

  const assignTicketMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await api.post(`/admin/support/tickets/${ticket?.id}/assign`, { agentId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'ticket', ticket?.id] });
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
      toast.success('Ticket assigned');
    },
    onError: () => toast.error('Failed to assign ticket'),
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  const handleSend = () => {
    if (!editor) return;
    const content = editor.getHTML();
    if (content.trim() === '<p></p>') return;
    sendReplyMutation.mutate(content);
  };

  if (!ticket) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
          style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(2px)' }} 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '1200px', // Massive drawer
            backgroundColor: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--border-color)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                #{ticket.id}
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{ticket.subject}</h2>
              <span style={{ 
                padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, 
                backgroundColor: ticket.status === 'OPEN' ? 'var(--color-primary-light)' : (ticket.status === 'RESOLVED' ? 'var(--color-accent-light)' : '#fefce8'),
                color: ticket.status === 'OPEN' ? 'var(--color-primary)' : (ticket.status === 'RESOLVED' ? 'var(--color-accent)' : '#f5a623'),
                border: '1px solid currentColor'
              }}>
                {ticket.status}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => toast.success('Ticket marked as resolved')}>Resolve Ticket</button>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}><X size={24} /></button>
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            
            {/* Left Panel: Customer Profile */}
            <div style={{ width: '320px', borderRight: '1px solid var(--border-color)', overflowY: 'auto', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <UserIcon size={32} color="var(--text-muted)" />
                </div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{ticket.username}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>{ticket.userEmail}</p>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  {fullTicket?.user?.kycStatus === 'APPROVED' && (
                    <span style={{ padding: '2px 8px', backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-dark)', fontSize: '11px', fontWeight: 700, borderRadius: '4px' }}>KYC VERIFIED</span>
                  )}
                </div>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <Globe size={16} color="var(--text-muted)" /> {fullTicket?.user?.country || 'Unknown'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <CreditCard size={16} color="var(--text-muted)" /> ${Number(fullTicket?.user?.wallet?.balance || 0).toFixed(2)} Balance
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <ArrowRightLeft size={16} color="var(--text-muted)" /> {fullTicket?.user?._count?.transactions || 0} Recent Transactions
                </div>
              </div>

              <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>Quick Actions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => navigate('/admin/users')}>View Profile</button>
                  <button 
                    className="btn btn-outline" 
                    style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444', borderColor: '#fef2f2' }}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to suspend this user?')) {
                        suspendUserMutation.mutate();
                      }
                    }}
                    disabled={suspendUserMutation.isPending || !fullTicket?.user}
                  >
                    Suspend User
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Panel: Conversation */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: 'var(--bg-secondary)' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading conversation...</div>
                ) : (
                  messages?.map((msg: any) => (
                    <div key={msg.id} style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: msg.senderType === 'USER' ? 'flex-start' : 'flex-end',
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-muted)', 
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {msg.senderName} • {new Date(msg.createdAt).toLocaleString()}
                        {msg.isInternal && <span style={{ color: '#f5a623', fontWeight: 600 }}> (Internal Note)</span>}
                      </div>
                      <div style={{ 
                        backgroundColor: msg.isInternal ? '#fffbeb' : (msg.senderType === 'USER' ? 'var(--bg-card)' : 'var(--color-primary-light)'),
                        color: msg.isInternal ? '#92400e' : (msg.senderType === 'USER' ? 'var(--text-primary)' : 'var(--color-primary-dark)'),
                        padding: '16px',
                        borderRadius: '12px',
                        border: `1px solid ${msg.isInternal ? '#fde68a' : 'var(--border-color)'}`,
                        maxWidth: '80%',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>{msg.message || msg.content || ''}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Box */}
              <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                <div style={{ border: `1px solid ${isInternal ? '#f5a623' : 'var(--border-color)'}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: isInternal ? '#fffbeb' : 'var(--bg-primary)' }}>
                  <div style={{ padding: '12px', borderBottom: `1px solid ${isInternal ? '#fde68a' : 'var(--border-color)'}`, display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: !isInternal ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                        onClick={() => setIsInternal(false)}
                      >
                        Public Reply
                      </button>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: isInternal ? '#d97706' : 'var(--text-secondary)' }}
                        onClick={() => setIsInternal(true)}
                      >
                        Internal Note
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ minHeight: '120px', padding: '16px' }} className="prose">
                    <EditorContent editor={editor} />
                  </div>

                  <div style={{ padding: '12px', borderTop: `1px solid ${isInternal ? '#fde68a' : 'var(--border-color)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Paperclip size={18} /></button>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ backgroundColor: isInternal ? '#f5a623' : 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onClick={handleSend}
                      disabled={sendReplyMutation.isPending}
                    >
                      <Send size={16} /> {isInternal ? 'Add Note' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Ticket Properties */}
            <div style={{ width: '280px', borderLeft: '1px solid var(--border-color)', padding: '24px', backgroundColor: 'var(--bg-card)', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Properties</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Assignee</label>
                  <select 
                    className="form-input" 
                    value={fullTicket?.assignedToId || ''}
                    onChange={(e) => assignTicketMutation.mutate(e.target.value)}
                    disabled={assignTicketMutation.isPending}
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent: any) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.user?.firstName} {agent.user?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Status</label>
                  <select 
                    className="form-input" 
                    value={fullTicket?.status || ticket?.status || 'OPEN'}
                    onChange={(e) => updateTicketMutation.mutate({ status: e.target.value })}
                    disabled={updateTicketMutation.isPending}
                  >
                    <option value="OPEN">Open</option>
                    <option value="PENDING">Pending</option>
                    <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Priority</label>
                  <select 
                    className="form-input" 
                    value={fullTicket?.priority || ticket?.priority || 'MEDIUM'}
                    onChange={(e) => updateTicketMutation.mutate({ priority: e.target.value })}
                    disabled={updateTicketMutation.isPending}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Category</label>
                  <select className="form-input" value={fullTicket?.category?.name || ticket?.category || 'TECHNICAL'} disabled>
                    <option value="TECHNICAL">Technical</option>
                    <option value="DEPOSITS">Deposits</option>
                    <option value="WITHDRAWALS">Withdrawals</option>
                    <option value="KYC">KYC</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
