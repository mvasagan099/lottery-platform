import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { gamesService } from '@/services/games.service'
import CountdownTimer from '@/components/UI/CountdownTimer'
import { Search, Filter, Zap, ChevronRight } from 'lucide-react'

export default function GamesPageFull() {
  const [search, setSearch] = useState('')

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => gamesService.getAll(),
    select: (r) => r.data?.data || [],
  })

  const filtered = games.filter((g: any) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <div style={{ background: 'var(--gradient-hero)', padding: '60px 0 40px', color: 'white' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '52px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '12px' }}>
            All <span style={{ background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Lottery</span> Games
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '500px' }}>
            Australia's biggest jackpots across 9 games. Pick your lucky numbers today.
          </p>
        </div>
      </div>

      <div className="section">
        <div className="container">
          {/* Search */}
          <div className="input-wrapper has-icon-left" style={{ maxWidth: '400px', marginBottom: '32px' }}>
            <span className="input-icon"><Search size={16} /></span>
            <input
              type="search"
              className="form-input"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Games Grid */}
          {isLoading ? (
            <div className="grid-auto">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="card" style={{ height: '340px' }}>
                  <div className="skeleton" style={{ height: '140px' }} />
                  <div style={{ padding: '20px' }}>
                    <div className="skeleton" style={{ height: '18px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '32px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '36px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-auto">
              {filtered.map((game: any, i: number) => (
                <GameCard key={game.id} game={game} index={i} />
              ))}
            </div>
          )}

          {filtered.length === 0 && !isLoading && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No games found</div>
              <div className="empty-state-desc">Try a different search term</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GameCard({ game, index }: { game: any; index: number }) {
  const gradients = [
    'linear-gradient(135deg, #0f1e4a 0%, #1a3a8f 100%)',
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    'linear-gradient(135deg, #0d1b2a 0%, #1b3a4a 100%)',
    'linear-gradient(135deg, #1a0f4a 0%, #3a1a8f 100%)',
    'linear-gradient(135deg, #0f2560 0%, #1a3a8f 100%)',
    'linear-gradient(135deg, #060e28 0%, #0f2560 100%)',
    'linear-gradient(135deg, #1a2a0f 0%, #2a4a1a 100%)',
    'linear-gradient(135deg, #2a0f1a 0%, #4a1a3a 100%)',
    'linear-gradient(135deg, #0f1a2a 0%, #1a2a4a 100%)',
  ]

  return (
    <Link to={`/games/${game.slug}`} className="game-card" style={{ textDecoration: 'none' }}>
      <div className="game-card-header" style={{ background: gradients[index % gradients.length] }}>
        {game.badgeText && <div className="game-card-badge">{game.badgeText}</div>}
        <div className="game-card-name">{game.name}</div>
      </div>

      <div className="game-card-body">
        <div className="jackpot-label">AUD JACKPOT</div>
        <div className="game-jackpot">
          ${(Number(game.jackpotAmount) / 1_000_000 >= 1
            ? `${(Number(game.jackpotAmount) / 1_000_000).toFixed(game.jackpotAmount >= 10_000_000 ? 0 : 1)}M`
            : `${(Number(game.jackpotAmount) / 1_000).toFixed(0)}K`)}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0', lineHeight: 1.5, minHeight: '40px' }}>
          {game.shortDescription}
        </p>

        {game.nextDraw && (
          <div style={{ marginBottom: '12px' }}>
            <CountdownTimer targetDate={game.nextDraw.scheduledAt} size="sm" />
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            From ${game.ticketPrice?.toFixed(2)}/line
          </span>
          <div className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
            Play <ChevronRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  )
}
