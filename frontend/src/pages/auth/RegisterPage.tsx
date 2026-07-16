import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { Eye, EyeOff, User, Mail, Lock, Calendar, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+🪙/, 'Letters, numbers, underscores only'),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string().refine((dob) => {
    const age = (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    return age >= 18
  }, 'You must be 18 or older to register'),
  password: z.string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)

  const { register, handleSubmit, formState: { errors }, trigger, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: Omit<FormData, 'confirmPassword' | 'terms'>) => authService.register(data as any),
    onSuccess: () => {
      toast.success('Account created! Please check your email to verify.')
      navigate('/login')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Registration failed')
    },
  })

  const handleNext = async () => {
    const valid = await trigger(['firstName', 'lastName', 'email', 'dateOfBirth'])
    if (valid) setStep(2)
  }

  const onSubmit = (data: FormData) => {
    const { confirmPassword, terms, ...payload } = data
    mutation.mutate(payload)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gradient-hero)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '90px 20px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'white', fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900 }}>
            <Zap size={24} style={{ color: 'var(--color-secondary)' }} />
            Mega<span style={{ color: 'var(--color-secondary)' }}>Draw</span>
          </Link>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '6px' }}>
            Create your free account
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: step >= s ? 'var(--gradient-gold)' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: 'white',
              }}>{s}</div>
              <span style={{ fontSize: '12px', color: step >= s ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                {s === 1 ? 'Personal Info' : 'Account Setup'}
              </span>
              {s < 2 && <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 1 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">First Name<span className="required">*</span></label>
                      <div className="input-wrapper has-icon-left">
                        <span className="input-icon"><User size={16} /></span>
                        <input {...register('firstName')} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="Jane" id="firstName" />
                      </div>
                      {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name<span className="required">*</span></label>
                      <input {...register('lastName')} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Smith" id="lastName" />
                      {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address<span className="required">*</span></label>
                    <div className="input-wrapper has-icon-left">
                      <span className="input-icon"><Mail size={16} /></span>
                      <input {...register('email')} type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="jane@example.com" id="email" />
                    </div>
                    {errors.email && <span className="form-error">{errors.email.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth<span className="required">*</span></label>
                    <div className="input-wrapper has-icon-left">
                      <span className="input-icon"><Calendar size={16} /></span>
                      <input {...register('dateOfBirth')} type="date" className={`form-input ${errors.dateOfBirth ? 'error' : ''}`} id="dateOfBirth" />
                    </div>
                    {errors.dateOfBirth && <span className="form-error">{errors.dateOfBirth.message}</span>}
                  </div>

                  <button type="button" className="btn btn-primary btn-lg btn-full" onClick={handleNext}>
                    Continue
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Username<span className="required">*</span></label>
                    <input {...register('username')} className={`form-input ${errors.username ? 'error' : ''}`} placeholder="jane_smith" id="username" autoComplete="username" />
                    {errors.username && <span className="form-error">{errors.username.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password<span className="required">*</span></label>
                    <div className="input-wrapper has-icon-left has-icon-right">
                      <span className="input-icon"><Lock size={16} /></span>
                      <input {...register('password')} type={showPassword ? 'text' : 'password'} className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Min. 8 characters" id="password" autoComplete="new-password" />
                      <span className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </span>
                    </div>
                    {errors.password && <span className="form-error">{errors.password.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password<span className="required">*</span></label>
                    <input {...register('confirmPassword')} type="password" className={`form-input ${errors.confirmPassword ? 'error' : ''}`} placeholder="Repeat password" id="confirmPassword" autoComplete="new-password" />
                    {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Referral Code (optional)</label>
                    <input {...register('referralCode')} className="form-input" placeholder="FRIEND123" id="referralCode" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                    <input {...register('terms')} type="checkbox" id="terms" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <label htmlFor="terms" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.5 }}>
                      I am 18+ years old and agree to the{' '}
                      <Link to="/terms" target="_blank" style={{ color: 'var(--color-primary)' }}>Terms & Conditions</Link>
                      {' '}and{' '}
                      <Link to="/privacy" target="_blank" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>
                      {'. '}I understand that gambling can be addictive and I will gamble responsibly.
                    </label>
                  </div>
                  {errors.terms && <span className="form-error">{errors.terms.message}</span>}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-outline btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-gold btn-lg" style={{ flex: 2 }} disabled={mutation.isPending}>
                      {mutation.isPending ? <><div className="btn-spinner" /> Creating...</> : 'Create Account'}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className="divider-label"><span>Already have an account?</span></div>
            <Link to="/login" className="btn btn-outline btn-full">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
