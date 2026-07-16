import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ShieldCheck, UploadCloud, FileText, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function KYCPage() {
  const { user } = useAuthStore()
  const [docType, setDocType] = useState('PASSPORT')
  const [isUploading, setIsUploading] = useState(false)
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)

  const handleUpload = async () => {
    if (!frontFile) {
      toast.error('Please select a document to upload')
      return
    }

    setIsUploading(true)
    try {
      // Import api inside component or ensure it's imported at top
      const { api } = await import('@/services/api')
      await api.post('/users/me/kyc', {
        documentType: docType,
        documentUrl: frontFile.name, // Mocking URL with filename for now
        selfieUrl: 'selfie.jpg'
      })
      
      setIsUploading(false)
      toast.success('Document uploaded successfully. Verification pending.')
      
      // Update local user state
      useAuthStore.getState().updateUser({ ...user, kycStatus: 'PENDING' } as any)
    } catch (err: any) {
      setIsUploading(false)
      toast.error(err.response?.data?.error || 'Failed to submit KYC documents')
    }
  }

  return (
    <div className="page-wrapper section">
      <div className="container" style={{ maxWidth: '640px' }}>
        <h1 className="section-title">Identity Verification (KYC)</h1>
        
        {user?.kycStatus === 'APPROVED' ? (
          <div className="card card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircle size={64} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Verified</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Your identity has been successfully verified. You have full access to all platform features including unlimited withdrawals.</p>
          </div>
        ) : user?.kycStatus === 'PENDING' ? (
          <div className="card card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="btn-spinner" style={{ width: '64px', height: '64px', borderWidth: '4px', borderTopColor: 'var(--color-primary)', margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Verification Pending</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Our team is reviewing your documents. This usually takes 1-2 business days.</p>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div className="alert alert-warning" style={{ margin: 0 }}>
                <AlertTriangle size={16} className="alert-icon" />
                Identity verification is required before you can withdraw funds.
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select className="form-select" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="NATIONAL_ID">National ID Card</option>
                </select>
              </div>

              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', background: 'var(--bg-secondary)', marginBottom: '24px' }}>
                <UploadCloud size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Upload Front of Document</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {frontFile ? frontFile.name : 'JPEG, PNG or PDF (Max 5MB)'}
                </p>
                <input 
                  type="file" 
                  id="frontFile" 
                  style={{ display: 'none' }} 
                  onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                  accept="image/jpeg,image/png,application/pdf"
                />
                <label htmlFor="frontFile" className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  {frontFile ? 'Change File' : 'Select File'}
                </label>
              </div>

              {docType === 'DRIVERS_LICENSE' || docType === 'NATIONAL_ID' ? (
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', background: 'var(--bg-secondary)', marginBottom: '24px' }}>
                  <UploadCloud size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Upload Back of Document</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {backFile ? backFile.name : 'JPEG, PNG or PDF (Max 5MB)'}
                  </p>
                  <input 
                    type="file" 
                    id="backFile" 
                    style={{ display: 'none' }} 
                    onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                    accept="image/jpeg,image/png,application/pdf"
                  />
                  <label htmlFor="backFile" className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                    {backFile ? 'Change File' : 'Select File'}
                  </label>
                </div>
              ) : null}

              <button className="btn btn-primary btn-lg btn-full" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? <><div className="btn-spinner" /> Uploading...</> : 'Submit Documents'}
              </button>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
                Your data is encrypted and securely stored in compliance with global privacy laws.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
