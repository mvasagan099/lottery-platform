import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { gamesService } from '@/services/games.service'
import { cmsService } from '@/services/index'
import JackpotCounter from '@/components/UI/JackpotCounter'
import CountdownTimer from '@/components/UI/CountdownTimer'
import { ChevronRight, Zap, Shield, Users, Trophy, Star, ArrowRight, Play } from 'lucide-react'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { data: gamesData } = useQuery({
    queryKey: ['games'],
    queryFn: () => gamesService.getAll(),
    select: (r) => r.data?.data || [],
  })

  const { data: banners } = useQuery({
    queryKey: ['banners-home'],
    queryFn: () => cmsService.getBanners('HOME'),
    select: (r) => r.data?.data || [],
  })

  const featuredGames = gamesData?.filter((g: any) => g.isFeatured).slice(0, 4) || []
  const allGames = gamesData || []

  const totalJackpot = allGames.reduce((sum: number, g: any) => sum + Number(g.jackpotAmount || 0), 0)

  const features = [
    { icon: <Shield size={28} />, title: 'Safe & Secure', desc: 'Bank-grade SSL encryption and licensed by Australian authorities.', color: '#10b981' },
    { icon: <Zap size={28} />, title: 'Instant Prizes', desc: 'Prizes automatically credited to your wallet after each draw.', color: '#f5a623' },
    { icon: <Users size={28} />, title: '100K+ Members', desc: 'Join hundreds of thousands of Australians playing online.', color: '#6366f1' },
    { icon: <Trophy size={28} />, title: '🪙50M+ Paid Out', desc: 'Verified winners from every major Australian lottery.', color: '#3b82f6' },
  ]

  const gameCategories = [
    { label: 'All Games', filter: null },
    { label: 'Featured', filter: 'featured' },
    { label: 'Tuesday', filter: 'tuesday' },
    { label: 'Thursday', filter: 'thursday' },
    { label: 'Saturday', filter: 'saturday' },
  ]

  return (
    <div className="page-wrapper">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
            <div className="hero-content animate-fade-in-up">
              <div className="hero-badge">
                <Star size={14} fill="currentColor" />
                Australia's #1 Online Lottery Platform
              </div>

              <h1 className="hero-title">
                Win Big with<br />
                <span className="jackpot-text">Australia's Biggest</span><br />
                Jackpots
              </h1>

              <p className="hero-subtitle">
                Play MegaDraw, Powerball, Saturday Lotto and 6 more games — all in one place. Safe, secure, and 100% Australian.
              </p>

              <div className="flex gap-md flex-wrap">
                <Link to="/games" className="btn btn-gold btn-xl">
                  <Play size={18} fill="currentColor" />
                  Play Now
                </Link>
                <Link to="/results" className="btn btn-outline btn-xl" style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.25)' }}>
                  View Results
                </Link>
              </div>

              {/* Mini stats */}
              <div className="flex gap-xl" style={{ marginTop: '40px', flexWrap: 'wrap' }}>
                {[
                  { value: '9', label: 'Lottery Games' },
                  { value: '100K+', label: 'Members' },
                  { value: '🪙50M+', label: 'Prizes Paid' },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'white', letterSpacing: '-0.03em' }}>{s.value}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Card */}
            <div className="animate-float" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="card-glass" style={{
                borderRadius: '28px', padding: '32px', maxWidth: '380px', width: '100%',
              }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                    COMBINED JACKPOT
                  </div>
                  <div style={{ fontSize: '56px', fontWeight: 900, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    <span style={{ background: 'linear-gradient(135deg, #f5a623, #f7b84b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      🪙{(totalJackpot / 1_000_000).toFixed(0)}M
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Across all 9 games this week</div>
                </div>

                {/* Next draw countdown */}
                {featuredGames[0]?.nextDraw && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Next Draw: {featuredGames[0].name}
                    </div>
                    <CountdownTimer targetDate={featuredGames[0].nextDraw.scheduledAt} size="sm" />
                  </div>
                )}

                <Link to="/games" className="btn btn-gold btn-full" style={{ marginTop: '20px' }}>
                  View All Games <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Animated orbs */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(245,166,35,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(16,185,129,0.04)', pointerEvents: 'none' }} />
      </section>

      {/* ── Featured Games ────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Games</h2>
              <div className="section-subtitle">Australia's favourite lotteries, online and easy</div>
            </div>
            <Link to="/games" className="btn btn-outline btn-sm">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {featuredGames.length > 0 ? featuredGames.map((game: any, i: number) => (
              <GameCard key={game.id} game={game} index={i} />
            )) : (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card" style={{ height: '320px' }}>
                  <div className="skeleton" style={{ height: '130px' }} />
                  <div style={{ padding: '20px' }}>
                    <div className="skeleton" style={{ height: '20px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '32px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '36px', borderRadius: '8px' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="section-sm" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="section-title">Why MegaDraw?</h2>
            <div className="section-subtitle">Trusted by Australians for safe and fair online lottery</div>
          </div>
          <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {features.map((f) => (
              <div key={f.title} className="card card-body" style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '20px',
                  background: `rgba(${hexToRgb(f.color)}, 0.12)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: f.color, margin: '0 auto 16px',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">How It Works</h2>
            <div className="section-subtitle">Three simple steps to win big</div>
          </div>
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up for free in 2 minutes. Verify your email and you\'re ready to play.', icon: '👤' },
              { step: '02', title: 'Choose Numbers', desc: 'Pick your lucky numbers or use Quick Pick for a random selection.', icon: '🎯' },
              { step: '03', title: 'Win Prizes', desc: 'Prizes are automatically credited after each draw. Withdraw anytime.', icon: '🏆' },
            ].map((s) => (
              <div key={s.step} className="card card-body" style={{ position: 'relative', paddingTop: '28px' }}>
                <div style={{
                  position: 'absolute', top: '-16px', left: '20px',
                  background: 'var(--gradient-brand)', color: 'white',
                  borderRadius: '12px', padding: '4px 12px',
                  fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em',
                }}>
                  STEP {s.step}
                </div>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{s.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', marginBottom: '8px' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/register" className="btn btn-primary btn-xl">
              Start Playing Today <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recent Results Preview ────────────────────────────────── */}
      <section className="section-sm" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Latest Results</h2>
              <div className="section-subtitle">Recent winning numbers from every draw</div>
            </div>
            <Link to="/results" className="btn btn-outline btn-sm">
              All Results <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allGames.slice(0, 3).map((game: any) => (
              <Link key={game.id} to={`/games/${game.slug}`} className="card" style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '20px',
                  padding: '20px', flexWrap: 'wrap',
                }}>
                  <div style={{ minWidth: '180px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px' }}>{game.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {game.nextDraw ? `Draw #${game.nextDraw.drawNumber}` : 'No upcoming draw'}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {game.nextDraw?.winningNumbers ? (
                      <>
                        {(game.nextDraw.winningNumbers as number[]).map((n: number) => (
                          <div key={n} className="number-ball winning sm">{n}</div>
                        ))}
                      </>
                    ) : (
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Draw not yet held</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '22px', whiteSpace: 'nowrap' }}>
                    🪙{(Number(game.jackpotAmount) / 1_000_000).toFixed(0)}M
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section style={{ background: 'var(--gradient-hero)', padding: '80px 0' }}>
        <div className="container" style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            LIMITED TIME
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Get a <span style={{ background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>🪙10 Welcome Bonus</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '36px', maxWidth: '480px', margin: '0 auto 36px' }}>
            Register today and get 🪙10 free credit to start playing. No deposit required.
          </p>
          <Link to="/register" className="btn btn-gold btn-xl">
            Claim Bonus <ArrowRight size={18} />
          </Link>
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            18+ | T&C Apply | Gamble Responsibly
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Game Card ────────────────────────────────────────────────────────────────

function GameCard({ game, index }: { game: any; index: number }) {
  const cardColors = [
    'linear-gradient(135deg, #0f1e4a 0%, #1a3a8f 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    'linear-gradient(135deg, #0d1b2a 0%, #1b2a4a 100%)',
    'linear-gradient(135deg, #0f2560 0%, #1a3a8f 100%)',
  ]

  return (
    <Link to={`/games/${game.slug}`} className="game-card" style={{ textDecoration: 'none' }}>
      <div className="game-card-header" style={{ background: cardColors[index % cardColors.length] }}>
        <div className="game-card-badge">{game.badgeText || 'PLAY NOW'}</div>
        <div className="game-card-name">{game.name}</div>
      </div>

      <div className="game-card-body">
        <div className="jackpot-label">JACKPOT</div>
        <div className="game-jackpot">
          🪙{(Number(game.jackpotAmount) / 1_000_000).toFixed(game.jackpotAmount >= 10_000_000 ? 0 : 1)}M
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 12px', lineHeight: 1.5 }}>
          {game.shortDescription}
        </p>

        {game.nextDraw && (
          <div style={{ marginBottom: '12px' }}>
            <CountdownTimer targetDate={game.nextDraw.scheduledAt} size="sm" />
          </div>
        )}

        <div className="game-card-actions mt-auto">
          <div className="btn btn-primary btn-sm btn-full" style={{ pointerEvents: 'none' }}>
            Play Now <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  )
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})🪙/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0'
}
