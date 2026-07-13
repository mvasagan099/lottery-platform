import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supportService } from '@/services/index'
import { Plus, MessageCircle, Clock, CheckCircle } from 'lucide-react'
import Modal from '@/components/UI/Modal'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function SupportPage() {
  const [showNew, setShowNew] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('GENERAL')
  const [message, setMessage] = useState('')

  const { data: tickets, refetch } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => supportService.getTickets(),
    select: (r) => r.data?.data,
  })

  const mutation = useMutation({
    mutationFn: () => supportService.createTicket({ subject, category, message }),
    onSuccess: () => {
      toast.success('Ticket submitted successfully')
      setShowNew(false)
      setSubject(''); setMessage('');
      refetch()
    }
  })

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="section-header">
          <div>
            <h1 className="section-title">Support Center</h1>
            <div className="section-subtitle">Manage your support tickets</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={16} /> New Ticket
          </button>
        </div>

        <div className="card">
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>Subject</th><th>Category</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>
                {tickets?.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No support tickets found.</td></tr>
                ) : (
                  tickets?.map((t: any) => (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => { /* Navigate to detail */ }}>
                      <td style={{ fontWeight: 600 }}>{t.subject}</td>
                      <td>{t.category}</td>
                      <td>
                        <span className={`badge badge-${t.status === 'OPEN' ? 'warning' : t.status === 'IN_PROGRESS' ? 'primary' : 'success'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(t.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Submit Support Request">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="GENERAL">General Inquiry</option>
              <option value="TECHNICAL">Technical Issue</option>
              <option value="BILLING">Billing & Payments</option>
              <option value="KYC">Account Verification</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of your issue" />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-input" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Provide as much detail as possible..." />
          </div>
          <button className="btn btn-primary btn-full" onClick={() => mutation.mutate()} disabled={!subject || !message || mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
