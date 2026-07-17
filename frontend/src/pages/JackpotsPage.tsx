import { useQuery } from '@tanstack/react-query'
import { gamesService } from '@/services/games.service'
import { Link } from 'react-router-dom'
import JackpotCounter from '@/components/UI/JackpotCounter'
import CountdownTimer from '@/components/UI/CountdownTimer'
import { ChevronRight } from 'lucide-react'

export default function JackpotsPage() {
  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: () => gamesService.getAll(),
    select: (r) => r.data?.data?.filter((g: any) => g.isActive).sort((a: any, b: any) => Number(b.jackpotAmount) - Number(a.jackpotAmount)) || [],
  })

  return (
    <div className="page-wrapper section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: 900, marginBottom: '12px' }}>Current Jackpots</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>The biggest prizes available to win this week</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {games.map((game: any, i: number) => (
            <Link key={game.id} to={`/games/${game.slug}`} className="card card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', textDecoration: 'none', transition: 'transform 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 900 }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--text-primary)' }}>{game.name}</div>
                  {game.nextDraw && (
                    <div style={{ marginTop: '8px' }}>
                      <CountdownTimer targetDate={game.nextDraw.scheduledAt} size="sm" />
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {game.jackpotPool?.consecutiveRollovers > 0 && (
                  <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'white', background: 'var(--color-primary)', padding: '4px 10px', borderRadius: '99px', display: 'inline-block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🔄 Rollover x{game.jackpotPool.consecutiveRollovers}
                  </div>
                )}
                <JackpotCounter amount={Number(game.jackpotAmount)} size="sm" />
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  Play Now <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
