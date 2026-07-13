import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { notificationsService } from '@/services/index'
import { Bell, Mail, Smartphone, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationSettingsPage() {
  const { data: prefs, refetch } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => notificationsService.getPreferences(),
    select: (r) => r.data?.data,
  })

  const [localPrefs, setLocalPrefs] = useState<Record<string, boolean>>({})

  // Initialize local state when data loads
  if (prefs && Object.keys(localPrefs).length === 0) {
    setLocalPrefs(prefs)
  }

  const mutation = useMutation({
    mutationFn: () => notificationsService.updatePreferences(localPrefs),
    onSuccess: () => {
      toast.success('Preferences updated')
      refetch()
    },
    onError: () => toast.error('Failed to update preferences'),
  })

  const togglePref = (key: string) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const sections = [
    {
      title: 'Wallet & Transactions',
      items: [
        { key: 'Deposit', label: 'Successful Deposits' },
        { key: 'Withdrawal', label: 'Withdrawal Status Updates' },
      ]
    },
    {
      title: 'Games & Tickets',
      items: [
        { key: 'Ticket', label: 'Ticket Purchase Confirmation' },
        { key: 'Draw', label: 'Draw Results Available' },
        { key: 'Winning', label: 'Prize Wins (Crucial)' },
      ]
    },
    {
      title: 'Marketing',
      items: [
        { key: 'Promo', label: 'Promotions and Bonuses' },
      ]
    }
  ]

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className="section-title">Notification Settings</h1>

        <div className="card">
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th style={{ textAlign: 'center', width: '120px' }}><Mail size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Email</th>
                  <th style={{ textAlign: 'center', width: '120px' }}><Smartphone size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> In-App</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(section => (
                  <React.Fragment key={section.title}>
                    <tr>
                      <td colSpan={3} style={{ background: 'var(--bg-secondary)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {section.title}
                      </td>
                    </tr>
                    {section.items.map(item => (
                      <tr key={item.key}>
                        <td style={{ fontWeight: 500 }}>{item.label}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={localPrefs[`email${item.key}`] ?? false}
                            onChange={() => togglePref(`email${item.key}`)}
                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={localPrefs[`inApp${item.key}`] ?? false}
                            onChange={() => togglePref(`inApp${item.key}`)}
                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : <><Save size={16} /> Save Preferences</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
import React from 'react'
