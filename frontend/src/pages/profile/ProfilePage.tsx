import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useForm } from 'react-hook-form'
import { api } from '@/services/api'
import { User, Mail, Calendar, MapPin, Save, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      country: user?.country || '',
      state: user?.state || '',
      city: user?.city || '',
      address: user?.address || '',
      postcode: user?.postcode || '',
    },
  })

  const onSubmit = async (data: any) => {
    try {
      const res = await api.put('/users/me', data)
      updateUser(res.data.data)
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile')
    }
  }

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="section-header" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="section-title">My Profile</h1>
            <div className="section-subtitle">Manage your personal information</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', alignItems: 'start' }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Personal Details</h2>
              <button className={`btn btn-sm ${isEditing ? 'btn-ghost' : 'btn-outline'}`} onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <div className="input-wrapper has-icon-left">
                      <span className="input-icon"><User size={16} /></span>
                      <input {...register('firstName')} className="form-input" disabled={!isEditing} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input {...register('lastName')} className="form-input" disabled={!isEditing} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <div className="input-wrapper has-icon-left">
                      <span className="input-icon"><Mail size={16} /></span>
                      <input type="email" className="form-input" value={user?.email || ''} disabled />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email cannot be changed</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <div className="input-wrapper has-icon-left">
                      <span className="input-icon"><Calendar size={16} /></span>
                      <input type="date" className="form-input" value={user?.dateOfBirth?.split('T')[0] || ''} disabled />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input {...register('phone')} className="form-input" disabled={!isEditing} placeholder="+61 400 000 000" />
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '16px 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} /> Address
                </h3>
                
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input {...register('address')} className="form-input" disabled={!isEditing} />
                </div>

                <div className="grid-3" style={{ gridTemplateColumns: '1fr 1fr 100px' }}>
                  <div className="form-group">
                    <label className="form-label">City/Suburb</label>
                    <input {...register('city')} className="form-input" disabled={!isEditing} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input {...register('state')} className="form-input" disabled={!isEditing} placeholder="NSW" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postcode</label>
                    <input {...register('postcode')} className="form-input" disabled={!isEditing} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input {...register('country')} className="form-input" disabled={!isEditing} placeholder="Australia" />
                </div>

                {isEditing && (
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary">
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card card-body">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Account Status</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span className={`badge badge-${user?.emailVerified ? 'success' : 'warning'}`}>
                  {user?.emailVerified ? 'Email Verified' : 'Email Unverified'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span className={`badge badge-${user?.kycStatus === 'APPROVED' ? 'success' : user?.kycStatus === 'PENDING' ? 'warning' : 'danger'}`}>
                  KYC: {user?.kycStatus}
                </span>
              </div>
              {user?.kycStatus !== 'APPROVED' && (
                <Link to="/profile/kyc" className="btn btn-primary btn-sm btn-full">
                  <ShieldCheck size={14} /> {user?.kycStatus === 'NOT_SUBMITTED' ? 'Verify Identity' : 'Check KYC Status'}
                </Link>
              )}
            </div>

            <div className="card card-body">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Quick Links</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/profile/security" className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>Security & Password</Link>
                <Link to="/profile/notifications" className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>Notification Settings</Link>
                <Link to="/wallet" className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>Wallet & Transactions</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
