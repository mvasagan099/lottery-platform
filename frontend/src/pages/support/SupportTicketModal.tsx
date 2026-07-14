import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '@/components/UI/Modal';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface Props {
  ticketId: string | null;
  onClose: () => void;
}

export default function SupportTicketModal({ ticketId, onClose }: Props) {
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => {
      const res = await api.get(`/support/tickets/${ticketId}`);
      return res.data.data;
    },
    enabled: !!ticketId,
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/support/tickets/${ticketId}/messages`, { message: replyText });
      return res.data;
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      toast.success('Reply sent successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to send reply');
    }
  });

  return (
    <Modal isOpen={!!ticketId} onClose={onClose} title={ticket ? `Ticket: ${ticket.subject}` : 'Ticket Details'}>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : ticket ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Status: <strong>{ticket.status}</strong></span>
            <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
            {ticket.messages?.map((msg: any) => (
              <div key={msg.id} style={{ 
                alignSelf: msg.senderType === 'USER' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.senderType === 'USER' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: msg.senderType === 'USER' ? '#fff' : 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: '12px',
                maxWidth: '85%',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
                  {msg.senderType === 'USER' ? 'You' : 'Support Team'} • {new Date(msg.createdAt).toLocaleString()}
                </div>
                <div dangerouslySetInnerHTML={{ __html: msg.message }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <textarea 
              className="form-input" 
              rows={3} 
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={ticket.status === 'CLOSED'}
            />
            <button 
              className="btn btn-primary" 
              onClick={() => replyMutation.mutate()} 
              disabled={!replyText.trim() || replyMutation.isPending || ticket.status === 'CLOSED'}
            >
              {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-error)' }}>Failed to load ticket</div>
      )}
    </Modal>
  );
}
