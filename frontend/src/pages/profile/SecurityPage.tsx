import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { Shield, Smartphone, Key, AlertTriangle, Monitor } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '@/components/UI/Modal'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })

export default function SecurityPage() {
  const { user, updateUser } = useAuthStore()
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false)
  const [totpToken, setTotpToken] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableToken, setDisableToken] = useState('')
  const [setupData, setSetupData] = useState<{ qrCode: string; secret: string } | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema)
  })

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authService.getSessions(),
    select: (r) => r.data?.data || []
  })

  const passMutation = useMutation({
    mutationFn: (d: any) => authService.changePassword(d.currentPassword, d.newPassword),
    onSuccess: () => { toast.success('Password updated!'); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update password')
  })

  const setup2FAMutation = useMutation({
    mutationFn: authService.setup2FA,
    onSuccess: (r) => setSetupData(r.data.data!),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to initiate 2FA')
  })

  const confirm2FAMutation = useMutation({
    mutationFn: () => authService.confirm2FA(totpToken),
    onSuccess: () => {
      toast.success('2FA Enabled!')
      updateUser({ twoFactorEnabled: true })
      setShow2FAModal(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Invalid code')
  })

  const disable2FAMutation = useMutation({
    mutationFn: () => authService.disable2FA(disablePassword, disableToken),
    onSuccess: () => {
      toast.success('2FA Disabled!')
      updateUser({ twoFactorEnabled: false })
      setShowDisable2FAModal(false)
      setDisablePassword('')
      setDisableToken('')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to disable 2FA. Please check your password and code.')
  })

  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => authService.revokeSession(id),
    onSuccess: () => { toast.success('Session revoked'); refetchSessions() }
  })

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 className="section-title">Security Settings</h1>

        <div className="grid-2" style={{ alignItems: 'start', marginBottom: '24px' }}>
          {/* Password Change */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Key size={18} /> Change Password</h2></div>
            <div className="card-body">
              <form onSubmit={handleSubmit((d) => passMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" {...register('currentPassword')} className="form-input" />
                  {errors.currentPassword && <span className="form-error">{errors.currentPassword.message as string}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" {...register('newPassword')} className="form-input" />
                  {errors.newPassword && <span className="form-error">{errors.newPassword.message as string}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" {...register('confirmPassword')} className="form-input" />
                  {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message as string}</span>}
                </div>
                <button type="submit" className="btn btn-primary" disabled={passMutation.isPending}>Update Password</button>
              </form>
            </div>
          </div>

          {/* 2FA */}
          <div className="card">
            <div className="card-header"><h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={18} /> Two-Factor Auth</h2></div>
            <div className="card-body">
              {user?.twoFactorEnabled ? (
                <div>
                  <div className="alert alert-success" style={{ marginBottom: '16px' }}>2FA is currently ENABLED on your account.</div>
                  <button className="btn btn-danger btn-outline" onClick={() => setShowDisable2FAModal(true)}>Disable 2FA</button>
                </div>
              ) : (
                <div>
                  <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                    <AlertTriangle size={16} className="alert-icon" />
                    Protect your account and wallet by enabling 2FA.
                  </div>
                  <button className="btn btn-primary" onClick={() => { setShow2FAModal(true); setup2FAMutation.mutate() }}>
                    <Smartphone size={16} /> Enable 2FA
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Monitor size={18} /> Active Sessions</h2></div>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>Device / Browser</th><th>IP Address</th><th>Last Active</th><th>Action</th></tr></thead>
              <tbody>
                {sessions?.map((s: any) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.device || 'Unknown Device'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.browser}</div>
                    </td>
                    <td>{s.ipAddress}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(s.lastActiveAt).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => revokeSessionMutation.mutate(s.id)}>Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} title="Enable 2FA">
        {setupData ? (
          <div style={{ textAlign: 'center', padding: '16px 0 24px 0' }}>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
            <img src={setupData.qrCode} alt="2FA QR" style={{ width: '200px', height: '200px', margin: '0 auto 16px', background: 'white', padding: '8px', borderRadius: '8px' }} />
            <div style={{ marginBottom: '24px', fontSize: '13px' }}>Manual Code: <code style={{ padding: '4px', background: 'var(--bg-secondary)' }}>{setupData.secret}</code></div>
            
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Enter 6-digit code to verify</label>
              <input type="text" className="form-input" value={totpToken} onChange={(e) => setTotpToken(e.target.value)} maxLength={6} placeholder="000000" />
            </div>
            <button 
              className="btn btn-primary btn-full" 
              style={{ marginTop: '24px' }}
              onClick={() => confirm2FAMutation.mutate()} 
              disabled={totpToken.length !== 6 || confirm2FAMutation.isPending}
            >
              Verify & Enable
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}><div className="btn-spinner" style={{ width: '32px', height: '32px', borderColor: 'var(--color-primary)' }} /></div>
        )}
      </Modal>

      <Modal isOpen={showDisable2FAModal} onClose={() => setShowDisable2FAModal(false)} title="Disable 2FA">
        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
            To disable 2-Factor Authentication, please enter your current password and a code from your authenticator app.
          </p>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-input" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Authenticator Code</label>
            <input type="text" className="form-input" value={disableToken} onChange={(e) => setDisableToken(e.target.value)} maxLength={6} placeholder="000000" />
          </div>
          <button 
            className="btn btn-danger btn-full" 
            style={{ marginTop: '24px' }}
            onClick={() => disable2FAMutation.mutate()} 
            disabled={!disablePassword || disableToken.length !== 6 || disable2FAMutation.isPending}
          >
            Confirm & Disable 2FA
          </button>
        </div>
      </Modal>
    </div>
  )
}
