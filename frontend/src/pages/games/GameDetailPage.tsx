import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { gamesService } from '@/services/games.service'
import { useAuthStore } from '@/store/authStore'
import CountdownTimer from '@/components/UI/CountdownTimer'
import NumberBall from '@/components/UI/NumberBall'
import JackpotCounter from '@/components/UI/JackpotCounter'
import Spinner from '@/components/UI/Spinner'
import { Ticket, Zap, RefreshCw, ChevronRight, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GameDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const [lines, setLines] = useState<number[][]>([[]])
  const [activeLine, setActiveLine] = useState(0)
  const [numDraws, setNumDraws] = useState(1)
  const [activeTab, setActiveTab] = useState<'play' | 'prizes' | 'how'>('play')

  const { data: game, isLoading } = useQuery({
    queryKey: ['game', slug],
    queryFn: () => gamesService.getBySlug(slug!),
    select: (r) => r.data?.data,
    enabled: !!slug,
  })

  const quickPickMutation = useMutation({
    mutationFn: (numLines: number) => gamesService.quickPick(game!.id, numLines),
    onSuccess: (r) => {
      const picked = r.data?.data || []
      setLines(picked.map((p: any) => p.numbers))
      toast.success(`${picked.length} line(s) quick-picked!`)
    },
  })

  const purchaseMutation = useMutation({
    mutationFn: () => gamesService.purchase({
      gameId: game!.id,
      lines: lines.map((nums) => ({ numbers: nums })),
      isQuickPick: false,
      draws: numDraws,
    }),
    onSuccess: () => {
      toast.success('Ticket purchased! Check My Tickets.')
      navigate('/tickets')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Purchase failed')
    },
  })

  const toggleNumber = (lineIdx: number, num: number) => {
    if (!game) return
    setLines((prev) => {
      const updated = [...prev]
      const current = [...(updated[lineIdx] || [])]
      if (current.includes(num)) {
        updated[lineIdx] = current.filter((n) => n !== num)
      } else if (current.length < game.minNumbers) {
        updated[lineIdx] = [...current, num].sort((a, b) => a - b)
      }
      return updated
    })
  }

  const addLine = () => {
    if (lines.length >= 10) { toast.error('Maximum 10 lines per ticket'); return }
    setLines((prev) => [...prev, []])
    setActiveLine(lines.length)
  }

  const removeLine = (idx: number) => {
    if (lines.length === 1) return
    setLines((prev) => prev.filter((_, i) => i !== idx))
    setActiveLine(Math.max(0, idx - 1))
  }

  const totalCost = game ? lines.length * game.ticketPrice * numDraws : 0
  const currentLineComplete = game && (lines[activeLine]?.length ?? 0) >= game.minNumbers

  if (isLoading) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <Spinner size="lg" />
    </div>
  )

  if (!game) return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Game not found</h2>
        <Link to="/games" className="btn btn-primary" style={{ marginTop: '20px' }}>Back to Games</Link>
      </div>
    </div>
  )

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <div style={{ background: 'var(--gradient-hero)', padding: '60px 0 40px', color: 'white' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.6, fontSize: '14px' }}>
            <Link to="/games" style={{ color: 'inherit' }}>Games</Link>
            <ChevronRight size={14} /> {game.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              {game.badgeText && <span className="game-card-badge" style={{ marginBottom: '12px', display: 'inline-flex' }}>{game.badgeText}</span>}
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '8px' }}>
                {game.name}
              </h1>
              <p style={{ fontSize: '16px', opacity: 0.75, maxWidth: '500px', lineHeight: 1.6 }}>{game.description}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <JackpotCounter amount={game.jackpotAmount} size="lg" />
              {game.nextDraw && (
                <div style={{ marginTop: '16px' }}>
                  <CountdownTimer targetDate={game.nextDraw.scheduledAt} label="NEXT DRAW CLOSES IN" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container" style={{ padding: '0 var(--space-lg)' }}>
        <div className="tabs" style={{ marginBottom: '0' }}>
          {(['play', 'prizes', 'how'] as const).map((tab) => (
            <button
              key={tab}
              className={`tab-trigger ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'play' ? '🎯 Play' : tab === 'prizes' ? '🏆 Prize Divisions' : '📖 How to Play'}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '32px var(--space-lg)' }}>
        {/* ── Play Tab ── */}
        {activeTab === 'play' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
            {/* Number Picker */}
            <div className="card">
              <div className="card-header">
                <h2 className="modal-title">Select Your Numbers</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => quickPickMutation.mutate(lines.length)}
                    disabled={quickPickMutation.isPending}
                  >
                    <RefreshCw size={14} /> Quick Pick
                  </button>
                </div>
              </div>

              {/* Line Tabs */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {lines.map((line, i) => (
                  <button
                    key={i}
                    className={`tab-trigger ${activeLine === i ? 'active' : ''}`}
                    style={{ padding: '5px 12px', border: '1.5px solid var(--border-color)', borderRadius: '8px', marginBottom: '-2px' }}
                    onClick={() => setActiveLine(i)}
                  >
                    Line {i + 1}
                    {line.length >= (game.minNumbers || 0) && <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>}
                    {lines.length > 1 && (
                      <span
                        style={{ marginLeft: '6px', color: 'var(--text-muted)', fontWeight: 400 }}
                        onClick={(e) => { e.stopPropagation(); removeLine(i) }}
                      >×</span>
                    )}
                  </button>
                ))}
                <button className="btn btn-ghost btn-xs" onClick={addLine} style={{ padding: '5px 10px' }}>
                  + Add Line
                </button>
              </div>

              <div className="card-body">
                {/* Instruction */}
                <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                  <Info size={16} className="alert-icon" />
                  <div>Pick <strong>{game.minNumbers}</strong> numbers from 1–{game.numberPool}
                    {game.hasPowerball && ` and 1 Powerball from 1–${game.powerballPool}`}
                  </div>
                </div>

                {/* Number Grid */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Main Numbers ({lines[activeLine]?.length ?? 0}/{game.minNumbers})
                  </div>
                  <div className="number-grid">
                    {Array.from({ length: game.numberPool }, (_, i) => i + 1).map((num) => {
                      const selected = lines[activeLine]?.includes(num)
                      const maxReached = !selected && (lines[activeLine]?.length ?? 0) >= game.minNumbers
                      return (
                        <NumberBall
                          key={num}
                          number={num}
                          variant={selected ? 'selected' : maxReached ? 'disabled' : 'default'}
                          size="sm"
                          onClick={maxReached ? undefined : () => toggleNumber(activeLine, num)}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Powerball picker */}
                {game.hasPowerball && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', color: '#ef4444', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Powerball (1–{game.powerballPool})
                    </div>
                    <div className="number-grid" style={{ gridTemplateColumns: `repeat(${game.powerballPool}, minmax(36px, 1fr))` }}>
                      {Array.from({ length: game.powerballPool || 20 }, (_, i) => i + 1).map((num) => (
                        <NumberBall key={num} number={num} variant="powerball" size="sm" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="card card-body" style={{ position: 'sticky', top: 'calc(var(--header-height) + 20px)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', marginBottom: '20px' }}>Your Ticket</h3>

              {/* Lines summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {lines.map((line, i) => (
                  <div key={i} style={{
                    padding: '10px 12px',
                    background: activeLine === i ? 'rgba(26,58,143,0.08)' : 'var(--bg-secondary)',
                    borderRadius: '10px', border: activeLine === i ? '1.5px solid rgba(26,58,143,0.2)' : '1.5px solid transparent',
                    cursor: 'pointer',
                  }} onClick={() => setActiveLine(i)}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Line {i + 1}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {line.length > 0 ? line.map((n) => (
                        <div key={n} className="number-ball sm selected">{n}</div>
                      )) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No numbers selected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Draws */}
              <div style={{ marginBottom: '16px' }}>
                <div className="form-label">Number of Draws</div>
                <select
                  className="form-select"
                  value={numDraws}
                  onChange={(e) => setNumDraws(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 10].map((d) => (
                    <option key={d} value={d}>{d} draw{d > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Cost breakdown */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>{lines.length} line{lines.length > 1 ? 's' : ''} × ${game.ticketPrice} × {numDraws} draw{numDraws > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '20px', fontFamily: 'var(--font-display)' }}>
                  <span>Total</span>
                  <span>${totalCost.toFixed(2)} AUD</span>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  className="btn btn-gold btn-lg btn-full"
                  onClick={() => purchaseMutation.mutate()}
                  disabled={purchaseMutation.isPending || lines.every((l) => l.length < (game.minNumbers || 0))}
                >
                  {purchaseMutation.isPending ? (
                    <><div className="btn-spinner" /> Processing...</>
                  ) : (
                    <><Ticket size={18} /> Buy Ticket for ${totalCost.toFixed(2)}</>
                  )}
                </button>
              ) : (
                <div>
                  <Link to="/login" className="btn btn-gold btn-lg btn-full">
                    Sign In to Purchase
                  </Link>
                  <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Link to="/register" style={{ color: 'var(--color-primary)' }}>Create free account</Link>
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <Zap size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Quick Pick available for instant selection
              </div>
            </div>
          </div>
        )}

        {/* ── Prize Divisions Tab ── */}
        {activeTab === 'prizes' && (
          <div className="card">
            <div className="card-header">
              <h2 className="modal-title">Prize Divisions</h2>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Current jackpot: <strong style={{ color: 'var(--color-secondary)' }}>${(Number(game.jackpotAmount) / 1_000_000).toFixed(1)}M</strong>
              </div>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Division</th>
                    <th>Match Requirements</th>
                    <th>Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {game.prizeDivisions?.map((div: any) => (
                    <tr key={div.id}>
                      <td style={{ fontWeight: 700 }}>{div.divisionName}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{div.description}</td>
                      <td>
                        {div.isJackpot ? (
                          <span style={{ fontWeight: 800, fontSize: '16px', background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            ${(Number(game.jackpotAmount) / 1_000_000).toFixed(1)}M+
                          </span>
                        ) : div.fixedPrize ? (
                          <span style={{ fontWeight: 700, color: 'var(--color-accent-dark)' }}>
                            ${Number(div.fixedPrize).toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Varies</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── How to Play Tab ── */}
        {activeTab === 'how' && (
          <div className="card card-body" style={{ maxWidth: '720px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '24px', marginBottom: '20px' }}>
              How to Play {game.name}
            </h2>
            <div style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              <p>{game.description}</p>
              <br />
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px' }}>Rules</h3>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Select <strong>{game.minNumbers}</strong> numbers from 1 to <strong>{game.numberPool}</strong></li>
                {game.hasPowerball && <li>Select <strong>1</strong> Powerball from 1 to <strong>{game.powerballPool}</strong></li>}
                {game.hasSupplementary && <li>An additional <strong>{game.suppNumbers}</strong> supplementary number(s) will be drawn</li>}
                <li>Minimum age: <strong>18 years</strong></li>
                <li>Maximum <strong>{game.rulesJson?.maxLines || 50}</strong> lines per ticket</li>
                <li>Play up to <strong>{game.rulesJson?.maxDraws || 10}</strong> consecutive draws</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
