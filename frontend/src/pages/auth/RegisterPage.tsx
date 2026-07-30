import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { Eye, EyeOff, User, Mail, Lock, Calendar, Zap, Globe, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', dialCode: '+93' }, { code: 'AL', name: 'Albania', dialCode: '+355' }, { code: 'DZ', name: 'Algeria', dialCode: '+213' }, { code: 'AD', name: 'Andorra', dialCode: '+376' }, { code: 'AO', name: 'Angola', dialCode: '+244' }, { code: 'AR', name: 'Argentina', dialCode: '+54' }, { code: 'AM', name: 'Armenia', dialCode: '+374' }, { code: 'AU', name: 'Australia', dialCode: '+61' }, { code: 'AT', name: 'Austria', dialCode: '+43' }, { code: 'AZ', name: 'Azerbaijan', dialCode: '+994' },
  { code: 'BS', name: 'Bahamas', dialCode: '+1242' }, { code: 'BH', name: 'Bahrain', dialCode: '+973' }, { code: 'BD', name: 'Bangladesh', dialCode: '+880' }, { code: 'BB', name: 'Barbados', dialCode: '+1246' }, { code: 'BY', name: 'Belarus', dialCode: '+375' }, { code: 'BE', name: 'Belgium', dialCode: '+32' }, { code: 'BZ', name: 'Belize', dialCode: '+501' }, { code: 'BJ', name: 'Benin', dialCode: '+229' }, { code: 'BT', name: 'Bhutan', dialCode: '+975' }, { code: 'BO', name: 'Bolivia', dialCode: '+591' }, { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387' }, { code: 'BW', name: 'Botswana', dialCode: '+267' }, { code: 'BR', name: 'Brazil', dialCode: '+55' }, { code: 'BN', name: 'Brunei', dialCode: '+673' }, { code: 'BG', name: 'Bulgaria', dialCode: '+359' }, { code: 'BF', name: 'Burkina Faso', dialCode: '+226' }, { code: 'BI', name: 'Burundi', dialCode: '+257' },
  { code: 'CV', name: 'Cabo Verde', dialCode: '+238' }, { code: 'KH', name: 'Cambodia', dialCode: '+855' }, { code: 'CM', name: 'Cameroon', dialCode: '+237' }, { code: 'CA', name: 'Canada', dialCode: '+1' }, { code: 'CF', name: 'Central African Republic', dialCode: '+236' }, { code: 'TD', name: 'Chad', dialCode: '+235' }, { code: 'CL', name: 'Chile', dialCode: '+56' }, { code: 'CN', name: 'China', dialCode: '+86' }, { code: 'CO', name: 'Colombia', dialCode: '+57' }, { code: 'KM', name: 'Comoros', dialCode: '+269' }, { code: 'CG', name: 'Congo', dialCode: '+242' }, { code: 'CR', name: 'Costa Rica', dialCode: '+506' }, { code: 'HR', name: 'Croatia', dialCode: '+385' }, { code: 'CU', name: 'Cuba', dialCode: '+53' }, { code: 'CY', name: 'Cyprus', dialCode: '+357' }, { code: 'CZ', name: 'Czech Republic', dialCode: '+420' },
  { code: 'DK', name: 'Denmark', dialCode: '+45' }, { code: 'DJ', name: 'Djibouti', dialCode: '+253' }, { code: 'DM', name: 'Dominica', dialCode: '+1767' }, { code: 'DO', name: 'Dominican Republic', dialCode: '+1809' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593' }, { code: 'EG', name: 'Egypt', dialCode: '+20' }, { code: 'SV', name: 'El Salvador', dialCode: '+503' }, { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240' }, { code: 'ER', name: 'Eritrea', dialCode: '+291' }, { code: 'EE', name: 'Estonia', dialCode: '+372' }, { code: 'SZ', name: 'Eswatini', dialCode: '+268' }, { code: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { code: 'FJ', name: 'Fiji', dialCode: '+679' }, { code: 'FI', name: 'Finland', dialCode: '+358' }, { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'GA', name: 'Gabon', dialCode: '+241' }, { code: 'GM', name: 'Gambia', dialCode: '+220' }, { code: 'GE', name: 'Georgia', dialCode: '+995' }, { code: 'DE', name: 'Germany', dialCode: '+49' }, { code: 'GH', name: 'Ghana', dialCode: '+233' }, { code: 'GR', name: 'Greece', dialCode: '+30' }, { code: 'GD', name: 'Grenada', dialCode: '+1473' }, { code: 'GT', name: 'Guatemala', dialCode: '+502' }, { code: 'GN', name: 'Guinea', dialCode: '+224' }, { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245' }, { code: 'GY', name: 'Guyana', dialCode: '+592' },
  { code: 'HT', name: 'Haiti', dialCode: '+509' }, { code: 'HN', name: 'Honduras', dialCode: '+504' }, { code: 'HU', name: 'Hungary', dialCode: '+36' },
  { code: 'IS', name: 'Iceland', dialCode: '+354' }, { code: 'IN', name: 'India', dialCode: '+91' }, { code: 'ID', name: 'Indonesia', dialCode: '+62' }, { code: 'IR', name: 'Iran', dialCode: '+98' }, { code: 'IQ', name: 'Iraq', dialCode: '+964' }, { code: 'IE', name: 'Ireland', dialCode: '+353' }, { code: 'IL', name: 'Israel', dialCode: '+972' }, { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'JM', name: 'Jamaica', dialCode: '+1876' }, { code: 'JP', name: 'Japan', dialCode: '+81' }, { code: 'JO', name: 'Jordan', dialCode: '+962' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7' }, { code: 'KE', name: 'Kenya', dialCode: '+254' }, { code: 'KI', name: 'Kiribati', dialCode: '+686' }, { code: 'KP', name: 'North Korea', dialCode: '+850' }, { code: 'KR', name: 'South Korea', dialCode: '+82' }, { code: 'KW', name: 'Kuwait', dialCode: '+965' }, { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996' },
  { code: 'LA', name: 'Laos', dialCode: '+856' }, { code: 'LV', name: 'Latvia', dialCode: '+371' }, { code: 'LB', name: 'Lebanon', dialCode: '+961' }, { code: 'LS', name: 'Lesotho', dialCode: '+266' }, { code: 'LR', name: 'Liberia', dialCode: '+231' }, { code: 'LY', name: 'Libya', dialCode: '+218' }, { code: 'LI', name: 'Liechtenstein', dialCode: '+423' }, { code: 'LT', name: 'Lithuania', dialCode: '+370' }, { code: 'LU', name: 'Luxembourg', dialCode: '+352' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261' }, { code: 'MW', name: 'Malawi', dialCode: '+265' }, { code: 'MY', name: 'Malaysia', dialCode: '+60' }, { code: 'MV', name: 'Maldives', dialCode: '+960' }, { code: 'ML', name: 'Mali', dialCode: '+223' }, { code: 'MT', name: 'Malta', dialCode: '+356' }, { code: 'MH', name: 'Marshall Islands', dialCode: '+692' }, { code: 'MR', name: 'Mauritania', dialCode: '+222' }, { code: 'MU', name: 'Mauritius', dialCode: '+230' }, { code: 'MX', name: 'Mexico', dialCode: '+52' }, { code: 'FM', name: 'Micronesia', dialCode: '+691' }, { code: 'MD', name: 'Moldova', dialCode: '+373' }, { code: 'MC', name: 'Monaco', dialCode: '+377' }, { code: 'MN', name: 'Mongolia', dialCode: '+976' }, { code: 'ME', name: 'Montenegro', dialCode: '+382' }, { code: 'MA', name: 'Morocco', dialCode: '+212' }, { code: 'MZ', name: 'Mozambique', dialCode: '+258' }, { code: 'MM', name: 'Myanmar', dialCode: '+95' },
  { code: 'NA', name: 'Namibia', dialCode: '+264' }, { code: 'NR', name: 'Nauru', dialCode: '+674' }, { code: 'NP', name: 'Nepal', dialCode: '+977' }, { code: 'NL', name: 'Netherlands', dialCode: '+31' }, { code: 'NZ', name: 'New Zealand', dialCode: '+64' }, { code: 'NI', name: 'Nicaragua', dialCode: '+505' }, { code: 'NE', name: 'Niger', dialCode: '+227' }, { code: 'NG', name: 'Nigeria', dialCode: '+234' }, { code: 'MK', name: 'North Macedonia', dialCode: '+389' }, { code: 'NO', name: 'Norway', dialCode: '+47' },
  { code: 'OM', name: 'Oman', dialCode: '+968' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92' }, { code: 'PW', name: 'Palau', dialCode: '+680' }, { code: 'PA', name: 'Panama', dialCode: '+507' }, { code: 'PG', name: 'Papua New Guinea', dialCode: '+675' }, { code: 'PY', name: 'Paraguay', dialCode: '+595' }, { code: 'PE', name: 'Peru', dialCode: '+51' }, { code: 'PH', name: 'Philippines', dialCode: '+63' }, { code: 'PL', name: 'Poland', dialCode: '+48' }, { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'QA', name: 'Qatar', dialCode: '+974' },
  { code: 'RO', name: 'Romania', dialCode: '+40' }, { code: 'RU', name: 'Russia', dialCode: '+7' }, { code: 'RW', name: 'Rwanda', dialCode: '+250' },
  { code: 'KN', name: 'Saint Kitts and Nevis', dialCode: '+1869' }, { code: 'LC', name: 'Saint Lucia', dialCode: '+1758' }, { code: 'VC', name: 'Saint Vincent and the Grenadines', dialCode: '+1784' }, { code: 'WS', name: 'Samoa', dialCode: '+685' }, { code: 'SM', name: 'San Marino', dialCode: '+378' }, { code: 'ST', name: 'Sao Tome and Principe', dialCode: '+239' }, { code: 'SA', name: 'Saudi Arabia', dialCode: '+966' }, { code: 'SN', name: 'Senegal', dialCode: '+221' }, { code: 'RS', name: 'Serbia', dialCode: '+381' }, { code: 'SC', name: 'Seychelles', dialCode: '+248' }, { code: 'SL', name: 'Sierra Leone', dialCode: '+232' }, { code: 'SG', name: 'Singapore', dialCode: '+65' }, { code: 'SK', name: 'Slovakia', dialCode: '+421' }, { code: 'SI', name: 'Slovenia', dialCode: '+386' }, { code: 'SB', name: 'Solomon Islands', dialCode: '+677' }, { code: 'SO', name: 'Somalia', dialCode: '+252' }, { code: 'ZA', name: 'South Africa', dialCode: '+27' }, { code: 'SS', name: 'South Sudan', dialCode: '+211' }, { code: 'ES', name: 'Spain', dialCode: '+34' }, { code: 'LK', name: 'Sri Lanka', dialCode: '+94' }, { code: 'SD', name: 'Sudan', dialCode: '+249' }, { code: 'SR', name: 'Suriname', dialCode: '+597' }, { code: 'SE', name: 'Sweden', dialCode: '+46' }, { code: 'CH', name: 'Switzerland', dialCode: '+41' }, { code: 'SY', name: 'Syria', dialCode: '+963' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886' }, { code: 'TJ', name: 'Tajikistan', dialCode: '+992' }, { code: 'TZ', name: 'Tanzania', dialCode: '+255' }, { code: 'TH', name: 'Thailand', dialCode: '+66' }, { code: 'TL', name: 'Timor-Leste', dialCode: '+670' }, { code: 'TG', name: 'Togo', dialCode: '+228' }, { code: 'TO', name: 'Tonga', dialCode: '+676' }, { code: 'TT', name: 'Trinidad and Tobago', dialCode: '+1868' }, { code: 'TN', name: 'Tunisia', dialCode: '+216' }, { code: 'TR', name: 'Turkey', dialCode: '+90' }, { code: 'TM', name: 'Turkmenistan', dialCode: '+993' }, { code: 'TV', name: 'Tuvalu', dialCode: '+688' },
  { code: 'UG', name: 'Uganda', dialCode: '+256' }, { code: 'UA', name: 'Ukraine', dialCode: '+380' }, { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' }, { code: 'UK', name: 'United Kingdom', dialCode: '+44' }, { code: 'US', name: 'United States', dialCode: '+1' }, { code: 'UY', name: 'Uruguay', dialCode: '+598' }, { code: 'UZ', name: 'Uzbekistan', dialCode: '+998' },
  { code: 'VU', name: 'Vanuatu', dialCode: '+678' }, { code: 'VA', name: 'Vatican City', dialCode: '+39' }, { code: 'VE', name: 'Venezuela', dialCode: '+58' }, { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'YE', name: 'Yemen', dialCode: '+967' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260' }, { code: 'ZW', name: 'Zimbabwe', dialCode: '+263' }
]

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  email: z.string().email('Invalid email address'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
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
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [otp, setOtp] = useState('')

  const { register, handleSubmit, formState: { errors }, trigger, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const selectedCountryCode = watch('country')
  
  useEffect(() => {
    if (selectedCountryCode) {
      const country = COUNTRIES.find(c => c.code === selectedCountryCode)
      if (country) {
        setValue('phone', country.dialCode + ' ')
      }
    }
  }, [selectedCountryCode, setValue])

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      setValue('referralCode', ref)
    }
  }, [searchParams, setValue])

  const mutation = useMutation({
    mutationFn: (data: Omit<FormData, 'confirmPassword' | 'terms'>) => authService.register(data as any),
    onSuccess: (_, variables) => {
      setRegisteredEmail(variables.email)
      toast.success('Account created! Please check your email for the OTP.')
      setStep(3)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Registration failed')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(registeredEmail, token),
    onSuccess: () => {
      toast.success('Email verified successfully! You can now sign in.')
      navigate('/login')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Verification failed')
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => authService.resendVerification(registeredEmail),
    onSuccess: () => toast.success('Verification email resent!'),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to resend email')
  })

  const skipMutation = useMutation({
    mutationFn: () => authService.skipVerification(registeredEmail),
    onSuccess: () => {
      toast.success('Account created! You can verify your email later in your profile settings.')
      navigate('/login')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to skip verification')
  })

  const handleNext = async () => {
    const valid = await trigger(['firstName', 'lastName', 'email', 'country', 'phone', 'dateOfBirth'])
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
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: step >= s ? 'var(--gradient-gold)' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: 'white',
              }}>{s}</div>
              <span style={{ fontSize: '12px', color: step >= s ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                {s === 1 ? 'Personal' : s === 2 ? 'Account' : 'Verify'}
              </span>
              {s < 3 && <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />}
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
                      <label className="form-label" htmlFor="firstName">First Name<span className="required" aria-hidden="true">*</span></label>
                      <div className="input-wrapper has-icon-left">
                        <span className="input-icon"><User size={16} /></span>
                        <input {...register('firstName')} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="Jane" id="firstName" />
                      </div>
                      {errors.firstName && <span className="form-error" role="alert">{errors.firstName.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="lastName">Last Name<span className="required" aria-hidden="true">*</span></label>
                      <input {...register('lastName')} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Smith" id="lastName" />
                      {errors.lastName && <span className="form-error" role="alert">{errors.lastName.message}</span>}
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="country">Country<span className="required" aria-hidden="true">*</span></label>
                      <div className="input-wrapper has-icon-left">
                        <span className="input-icon"><Globe size={16} /></span>
                        <select {...register('country')} className={`form-input ${errors.country ? 'error' : ''}`} style={{ paddingLeft: '40px', appearance: 'none' }} id="country">
                          <option value="">Select country...</option>
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      {errors.country && <span className="form-error" role="alert">{errors.country.message}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="phone">Mobile Number<span className="required" aria-hidden="true">*</span></label>
                      <div className="input-wrapper has-icon-left">
                        <span className="input-icon"><Phone size={16} /></span>
                        <input {...register('phone')} type="tel" className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="+61 400 000 000" id="phone" />
                      </div>
                      {errors.phone && <span className="form-error" role="alert">{errors.phone.message}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address<span className="required" aria-hidden="true">*</span></label>
                    <div className="input-wrapper has-icon-left">
                      <span className="input-icon"><Mail size={16} /></span>
                      <input {...register('email')} type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="jane@example.com" id="email" />
                    </div>
                    {errors.email && <span className="form-error" role="alert">{errors.email.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="dateOfBirth">Date of Birth<span className="required" aria-hidden="true">*</span></label>
                    <div className="input-wrapper has-icon-left">
                      <span className="input-icon"><Calendar size={16} /></span>
                      <input {...register('dateOfBirth')} type="date" className={`form-input ${errors.dateOfBirth ? 'error' : ''}`} id="dateOfBirth" />
                    </div>
                    {errors.dateOfBirth && <span className="form-error" role="alert">{errors.dateOfBirth.message}</span>}
                  </div>

                  <button type="button" className="btn btn-primary btn-lg btn-full" onClick={handleNext}>
                    Continue
                  </button>
                </div>
              ) : step === 2 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="username">Username<span className="required" aria-hidden="true">*</span></label>
                    <input {...register('username')} className={`form-input ${errors.username ? 'error' : ''}`} placeholder="jane_smith" id="username" autoComplete="username" />
                    {errors.username && <span className="form-error" role="alert">{errors.username.message}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="password">Password<span className="required" aria-hidden="true">*</span></label>
                    <div className="input-wrapper has-icon-left has-icon-right">
                      <span className="input-icon"><Lock size={16} /></span>
                      <input {...register('password')} type={showPassword ? 'text' : 'password'} className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Min. 8 characters" id="password" autoComplete="new-password" />
                      <button type="button" className="input-icon-right" aria-label={showPassword ? "Hide password text" : "Show password text"} onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <span className="form-error" role="alert">{errors.password.message}</span>}
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
              ) : step === 3 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#3b82f6' }}>
                      <Mail size={30} />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>Verify your email</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                      We've sent a 6-digit code to <strong>{registeredEmail}</strong>.<br />Enter it below to complete registration.
                    </p>
                  </div>

                  <div className="form-group">
                    <input 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="form-input" 
                      placeholder="000000" 
                      maxLength={6} 
                      style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', padding: '16px' }}
                      inputMode="numeric"
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary btn-lg btn-full" 
                    disabled={verifyMutation.isPending || otp.length !== 6}
                    onClick={() => verifyMutation.mutate(otp)}
                  >
                    {verifyMutation.isPending ? 'Verifying...' : 'Verify & Continue'}
                  </button>

                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      type="button"
                      className="btn btn-ghost btn-sm" 
                      onClick={() => resendMutation.mutate()}
                      disabled={resendMutation.isPending}
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {resendMutation.isPending ? 'Sending...' : "Didn't receive it? Resend code"}
                    </button>
                    
                    <button 
                      type="button"
                      className="btn btn-ghost btn-sm" 
                      onClick={() => skipMutation.mutate()}
                      disabled={skipMutation.isPending}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {skipMutation.isPending ? 'Skipping...' : 'Skip for now'}
                    </button>
                  </div>
                </div>
              ) : null}
            </form>

            <div className="divider-label"><span>Already have an account?</span></div>
            <Link to="/login" className="btn btn-outline btn-full">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
