import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  totp: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [needs2FA, setNeeds2FA] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return null

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (r) => {
      const { user, accessToken, refreshToken } = r.data.data!
      setAuth(user, accessToken, refreshToken)
      toast.success(`Welcome back, ${user.firstName}!`)
      navigate(user.role !== 'USER' ? '/admin' : '/')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Login failed'
      if (msg.includes('2FA') || msg.includes('TOTP')) setNeeds2FA(true)
      else toast.error(msg)
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gradient-hero)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'white', fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900 }}>
            <Zap size={24} style={{ color: 'var(--color-secondary)' }} />
            Mega<span style={{ color: 'var(--color-secondary)' }}>Draw</span>
          </Link>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '6px' }}>
            Sign in to your account
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address<span className="required">*</span></label>
                <div className="input-wrapper has-icon-left">
                  <span className="input-icon"><Mail size={16} /></span>
                  <input
                    {...register('email')}
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    autoComplete="email"
                    id="email"
                  />
                </div>
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">
                  Password<span className="required">*</span>
                </label>
                <div className="input-wrapper has-icon-left has-icon-right">
                  <span className="input-icon"><Lock size={16} /></span>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    id="password"
                  />
                  <span className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </span>
                </div>
                {errors.password && <span className="form-error">{errors.password.message}</span>}
              </div>

              {/* 2FA */}
              {needs2FA && (
                <div className="form-group">
                  <label className="form-label">Two-Factor Code</label>
                  <input {...register('totp')} type="text" className="form-input" placeholder="000000" maxLength={6} inputMode="numeric" />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? <><div className="btn-spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>

            <div className="divider-label">
              <span>New to MegaDraw?</span>
            </div>

            <Link to="/register" className="btn btn-outline btn-full">
              Create Free Account
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          18+ only | Gamble Responsibly
        </div>
      </div>
    </div>
  )
}
