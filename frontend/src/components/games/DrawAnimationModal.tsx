import { useEffect, useRef, useState } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { gamesService } from '@/services/games.service'
import { Game } from '@/types'

interface DrawAnimationModalProps {
  isOpen: boolean
  onClose: () => void
  game: Game
}

interface Coin {
  x: number
  y: number
  z: number // 3D Z depth
  vx: number
  vy: number
  vz: number // 3D Z velocity
  radius: number
  number: number
  color: 'blue' | 'red'
  label: string // 'decor' | 'main' | 'supp' | 'powerball'
  angle: number
  angularVelocity: number
}

interface FlyingCoin {
  x: number
  y: number
  targetX: number
  targetY: number
  size: number
  number: number
  label: string
  progress: number // 0 to 1
  color: 'blue' | 'red'
}

export default function DrawAnimationModal({ isOpen, onClose, game }: DrawAnimationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'loading' | 'idle' | 'countdown' | 'mixing' | 'drawing' | 'completed'>('loading')
  const [winningNumbers, setWinningNumbers] = useState<number[]>([])
  const [suppNumbers, setSuppNumbers] = useState<number[]>([])
  const [powerball, setPowerball] = useState<number | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)

  // Displayed drawn numbers as they land
  const [drawnMain, setDrawnMain] = useState<number[]>([])
  const [drawnSupp, setDrawnSupp] = useState<number[]>([])
  const [drawnPowerball, setDrawnPowerball] = useState<number | null>(null)
  const [currentDrawingIndex, setCurrentDrawingIndex] = useState(-1)

  const [flyingCoin, setFlyingCoin] = useState<FlyingCoin | null>(null)

  // References to hold the draw sequence order
  const drawSequenceRef = useRef<{ number: number; label: string; color: 'blue' | 'red' }[]>([])
  const animationRef = useRef<number | null>(null)
  const coinsRef = useRef<Coin[]>([])

  // Fetch or mock results
  useEffect(() => {
    if (!isOpen) return

    setPhase('loading')
    setDrawnMain([])
    setDrawnSupp([])
    setDrawnPowerball(null)
    setFlyingCoin(null)
    setCurrentDrawingIndex(-1)

    const activeLockDraw = game.draws?.find((d: any) => {
      const drawTime = new Date(d.scheduledAt).getTime()
      return Date.now() >= drawTime - 60 * 60 * 1000 && Date.now() < drawTime + 60 * 60 * 1000
    })
    const nextDraw = activeLockDraw || game.nextDraw || (game.draws
      ? [...game.draws].filter((d: any) => d.status === 'SCHEDULED')
          .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]
      : undefined)
    const nextDrawTime = nextDraw ? new Date(nextDraw.scheduledAt).getTime() : 0

    // If before the draw time, enter countdown phase
    if (nextDrawTime && Date.now() < nextDrawTime) {
      setPhase('countdown')
      generateMockNumbers()
      return
    }

    // If at or after the draw time, fetch and reveal numbers
    gamesService.getResults(game.slug, 1, 5)
      .then((res) => {
        const draw = res.data?.data?.[0]
        if (draw && nextDraw && draw.drawNumber === nextDraw.drawNumber && draw.winningNumbers && draw.winningNumbers.length > 0) {
          setWinningNumbers(draw.winningNumbers)
          setSuppNumbers(draw.supplementary || [])
          setPowerball(draw.powerball || null)
          setPhase('mixing')
        } else {
          generateMockNumbers()
          setPhase('mixing')
        }
      })
      .catch((err) => {
        console.error('Error fetching results:', err)
        generateMockNumbers()
        setPhase('mixing')
      })
  }, [isOpen, game])

  const generateMockNumbers = () => {
    // Generate distinct random main numbers
    const mainPool = Array.from({ length: game.numberPool }, (_, i) => i + 1)
    const shuffledMain = [...mainPool].sort(() => Math.random() - 0.5)
    const winning = shuffledMain.slice(0, game.minNumbers).sort((a, b) => a - b)

    // Supplementary numbers
    const remaining = shuffledMain.slice(game.minNumbers)
    const supp = game.hasSupplementary ? remaining.slice(0, game.suppNumbers || 2).sort((a, b) => a - b) : []

    // Powerball
    const pb = game.hasPowerball ? Math.floor(Math.random() * (game.powerballPool || 20)) + 1 : null

    setWinningNumbers(winning)
    setSuppNumbers(supp)
    setPowerball(pb)


  }

  // Countdown timer loop to decrement seconds
  useEffect(() => {
    if (phase !== 'countdown') return

    const activeLockDraw = game.draws?.find((d: any) => {
      const drawTime = new Date(d.scheduledAt).getTime()
      return Date.now() >= drawTime - 60 * 60 * 1000 && Date.now() < drawTime + 60 * 60 * 1000
    })
    const nextDraw = activeLockDraw || game.nextDraw || (game.draws
      ? [...game.draws].filter((d: any) => d.status === 'SCHEDULED')
        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]
      : undefined)
    const nextDrawTime = nextDraw ? new Date(nextDraw.scheduledAt).getTime() : 0
    const targetTime = nextDrawTime

    const update = () => {
      const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000))
      setSecondsRemaining(diff)
      if (diff <= 0) {
        setPhase('mixing')
      }
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [phase, game])

  // Automatically start mixing and transition to drawing
  useEffect(() => {
    if (phase === 'mixing' && winningNumbers.length > 0) {
      const handle = requestAnimationFrame(() => {
        initCoins()
      })
      const timer = setTimeout(() => {
        setPhase('drawing')
        drawNextCoin(0)
      }, 2500)
      return () => {
        cancelAnimationFrame(handle)
        clearTimeout(timer)
      }
    } else if (phase === 'countdown') {
      const handle = requestAnimationFrame(() => {
        initCoins()
      })
      return () => {
        cancelAnimationFrame(handle)
      }
    }
  }, [phase, winningNumbers])

  // Set up the physics coin particles inside the bowl
  const initCoins = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coins: Coin[] = []
    const count = 40 // Number of background coins to make it look full and dynamic

    // Add winning sequence items to a list to be drawn
    const sequence: { number: number; label: string; color: 'blue' | 'red' }[] = []
    winningNumbers.forEach(num => {
      sequence.push({ number: num, label: 'main', color: 'blue' })
    })
    suppNumbers.forEach(num => {
      sequence.push({ number: num, label: 'supp', color: 'blue' })
    })
    if (powerball !== null) {
      sequence.push({ number: powerball, label: 'powerball', color: 'red' })
    }
    drawSequenceRef.current = sequence

    // Create the visual coins
    for (let i = 0; i < count; i++) {
      const isWinner = i < sequence.length
      const numInfo = isWinner ? sequence[i] : null

      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 5

      const isPowerballDecor = !isWinner && game.hasPowerball && Math.random() > 0.75
      const ballColor = numInfo ? numInfo.color : (isPowerballDecor ? 'red' : 'blue')

      coins.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height / 2 - 20 + (Math.random() - 0.5) * 40,
        z: (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.5) * speed,
        radius: 12,
        number: numInfo ? numInfo.number : Math.floor(Math.random() * game.numberPool) + 1,
        color: ballColor,
        label: numInfo ? numInfo.label : 'decor',
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.2
      })
    }
    coinsRef.current = coins
  }

  const startDrawSequence = () => {
    setDrawnMain([])
    setDrawnSupp([])
    setDrawnPowerball(null)
    setFlyingCoin(null)
    setCurrentDrawingIndex(-1)
    setPhase('mixing')
  }

  const drawNextCoin = (index: number) => {
    if (index >= drawSequenceRef.current.length) {
      setPhase('completed')
      setFlyingCoin(null)
      return
    }

    setCurrentDrawingIndex(index)
    const coinInfo = drawSequenceRef.current[index]

    // Find the matching coin inside the bowl and "extract" it to fly out
    const coins = coinsRef.current
    let sourceX = 250
    let sourceY = 200
    const matchedIdx = coins.findIndex(c => c.number === coinInfo.number && c.label === coinInfo.label)
    if (matchedIdx !== -1) {
      sourceX = coins[matchedIdx].x
      sourceY = coins[matchedIdx].y
      // Remove it from the bowl mixing simulation
      coins.splice(matchedIdx, 1)
    }

    // Determine target location for the flying animation based on where the slots are
    setFlyingCoin({
      x: sourceX,
      y: sourceY,
      targetX: 250,
      targetY: 150,
      size: 15,
      number: coinInfo.number,
      label: coinInfo.label,
      color: coinInfo.color,
      progress: 0
    })
  }

  // Animation frame loop
  useEffect(() => {
    if (phase !== 'mixing' && phase !== 'drawing' && phase !== 'completed' && phase !== 'countdown') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bowlCenterX = canvas.width / 2
    const bowlCenterY = canvas.height / 2 + 10
    const bowlRadius = 130

    // Confetti particles for the completion phase
    interface Confetti {
      x: number
      y: number
      size: number
      color: string
      vx: number
      vy: number
      rotation: number
      rotSpeed: number
    }
    const confettiList: Confetti[] = []
    if (phase === 'completed') {
      const confColors = ['#1a3a8f', '#ef4444', '#fca311', '#00b4d8', '#ffffff']
      for (let i = 0; i < 80; i++) {
        confettiList.push({
          x: Math.random() * canvas.width,
          y: Math.random() * -100 - 10,
          size: Math.random() * 6 + 4,
          color: confColors[Math.floor(Math.random() * confColors.length)],
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 3 + 2,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.1
        })
      }
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update coins 3D physics (mixing runs on mixing OR countdown phase)
      const coins = coinsRef.current
      const mixingIntensity = (phase === 'mixing' || phase === 'countdown') ? 1.4 : 0.6

      coins.forEach(coin => {
        if (phase === 'mixing' || phase === 'countdown') {
          coin.vx += (Math.random() - 0.5) * 1.6
          coin.vy += (Math.random() - 0.5) * 1.6
          coin.vz += (Math.random() - 0.5) * 1.6
        }

        coin.vy += 0.15

        coin.x += coin.vx * mixingIntensity
        coin.y += coin.vy * mixingIntensity
        coin.z += coin.vz * mixingIntensity
        coin.angle += coin.angularVelocity * mixingIntensity

        const dx = coin.x - bowlCenterX
        const dy = coin.y - bowlCenterY
        const dz = coin.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (dist + coin.radius > bowlRadius) {
          const nx = dx / dist
          const ny = dy / dist
          const nz = dz / dist

          coin.x = bowlCenterX + nx * (bowlRadius - coin.radius)
          coin.y = bowlCenterY + ny * (bowlRadius - coin.radius)
          coin.z = nz * (bowlRadius - coin.radius)

          const dot = coin.vx * nx + coin.vy * ny + coin.vz * nz
          coin.vx = (coin.vx - 2 * dot * nx) * 0.8
          coin.vy = (coin.vy - 2 * dot * ny) * 0.8
          coin.vz = (coin.vz - 2 * dot * nz) * 0.8

          coin.angularVelocity = (coin.vx * ny - coin.vy * nx) * 0.05
        }

        if (coin.y < bowlCenterY - 30) {
          if (coin.y < bowlCenterY - 45) {
            coin.y = bowlCenterY - 45
            coin.vy = -coin.vy * 0.8
          }
        }
      })

      // Draw background/inside of bowl shadow
      ctx.beginPath()
      ctx.arc(bowlCenterX, bowlCenterY, bowlRadius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 2
      ctx.stroke()

      const sortedCoins = [...coins].sort((a, b) => a.z - b.z)

      sortedCoins.forEach(coin => {
        const scale = 1 + (coin.z / bowlRadius) * 0.25
        const r = coin.radius

        ctx.save()
        ctx.translate(coin.x, coin.y)
        ctx.scale(scale, scale)
        ctx.rotate(coin.angle)

        const grad = ctx.createRadialGradient(
          -r * 0.35, -r * 0.35, r * 0.05,
          0, 0, r
        )

        let baseColor = '#1a3a8f'
        let lightColor = '#3b82f6'
        let shadowColor = '#0b1b4f'
        if (coin.color === 'red') {
          baseColor = '#d90429'
          lightColor = '#f87171'
          shadowColor = '#7f0c1f'
        }

        grad.addColorStop(0, '#ffffff')
        grad.addColorStop(0.18, lightColor)
        grad.addColorStop(0.55, baseColor)
        grad.addColorStop(0.85, shadowColor)
        grad.addColorStop(1, '#000000')

        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        ctx.beginPath()
        ctx.arc(0, 0, r - 0.7, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.lineWidth = 0.5
        ctx.stroke()

        if (coin.z < 0) {
          ctx.beginPath()
          ctx.arc(0, 0, r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(10, 15, 30, ${Math.min(0.65, Math.abs(coin.z) / bowlRadius)})`
          ctx.fill()
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        ctx.font = 'bold 9.5px "Inter", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(coin.number.toString(), 0, 0)
        ctx.restore()
      })

      // Draw Glass Overlay bowl front
      ctx.beginPath()
      ctx.arc(bowlCenterX, bowlCenterY, bowlRadius, 0, Math.PI)
      const bowlGrad = ctx.createLinearGradient(bowlCenterX, bowlCenterY - 50, bowlCenterX, bowlCenterY + bowlRadius)
      bowlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)')
      bowlGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)')
      bowlGrad.addColorStop(1, 'rgba(255, 255, 255, 0.28)')
      ctx.fillStyle = bowlGrad
      ctx.fill()

      ctx.beginPath()
      ctx.ellipse(bowlCenterX, bowlCenterY - 15, bowlRadius, 25, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fill()

      if (flyingCoin) {
        flyingCoin.progress += 0.035

        if (flyingCoin.progress >= 1) {
          if (flyingCoin.label === 'main') {
            setDrawnMain(prev => [...prev, flyingCoin.number])
          } else if (flyingCoin.label === 'supp') {
            setDrawnSupp(prev => [...prev, flyingCoin.number])
          } else if (flyingCoin.label === 'powerball') {
            setDrawnPowerball(flyingCoin.number)
          }

          const nextIdx = currentDrawingIndex + 1
          setFlyingCoin(null)
          setTimeout(() => {
            drawNextCoin(nextIdx)
          }, 800)
        } else {
          const p = flyingCoin.progress
          const ease = p * (2 - p)
          const currentX = flyingCoin.x + (flyingCoin.targetX - flyingCoin.x) * ease
          const currentY = flyingCoin.y + (flyingCoin.targetY - flyingCoin.y) * ease
          const size = flyingCoin.size + Math.sin(p * Math.PI) * 45

          ctx.save()
          ctx.translate(currentX, currentY)
          ctx.shadowColor = flyingCoin.color === 'red' ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.6)'
          ctx.shadowBlur = 30

          const grad = ctx.createRadialGradient(
            -size * 0.35, -size * 0.35, size * 0.05,
            0, 0, size
          )
          let baseColor = '#1a3a8f'
          let lightColor = '#3b82f6'
          let shadowColor = '#0b1b4f'
          if (flyingCoin.color === 'red') {
            baseColor = '#d90429'
            lightColor = '#f87171'
            shadowColor = '#7f0c1f'
          }

          grad.addColorStop(0, '#ffffff')
          grad.addColorStop(0.18, lightColor)
          grad.addColorStop(0.55, baseColor)
          grad.addColorStop(0.85, shadowColor)
          grad.addColorStop(1, '#000000')

          ctx.beginPath()
          ctx.arc(0, 0, size, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()

          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()

          ctx.fillStyle = '#ffffff'
          ctx.font = `bold ${Math.floor(size * 0.7)}px "Inter", sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.shadowBlur = 0
          ctx.fillText(flyingCoin.number.toString(), 0, 0)
          ctx.restore()
        }
      }

      if (phase === 'completed') {
        confettiList.forEach(c => {
          c.y += c.vy
          c.x += c.vx
          c.rotation += c.rotSpeed

          if (c.y > canvas.height) {
            c.y = -20
            c.x = Math.random() * canvas.width
          }

          ctx.save()
          ctx.translate(c.x, c.y)
          ctx.rotate(c.rotation)
          ctx.fillStyle = c.color
          ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6)
          ctx.restore()
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [phase, flyingCoin, currentDrawingIndex])

  const formatTime = (sec: number | null) => {
    if (sec === null) return '00:00:00'
    const hrs = Math.floor(sec / 3600)
    const mins = Math.floor((sec % 3600) / 60)
    const secs = sec % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', position: 'fixed', inset: 0 }}>
      <div className="card" style={{ width: '520px', maxWidth: '95%', background: '#0f172a', border: '1.5px solid rgba(255,255,255,0.1)', overflow: 'hidden', color: 'white', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, margin: 0, fontSize: '18px', color: '#fca311' }}>
            {game.name} Result
          </h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} style={{ color: 'rgba(255,255,255,0.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Content / Stage */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

          {phase === 'loading' && (
            <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <div className="btn-spinner" style={{ width: '40px', height: '40px', borderColor: '#fca311' }} />
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading latest draw results...</p>
            </div>
          )}

          {phase !== 'loading' && (
            <>
              {/* Mixing Bowl Canvas */}
              <div style={{ position: 'relative', background: 'radial-gradient(circle, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)', borderRadius: '24px', padding: '4px', border: '1.5px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)' }}>
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={320}
                  style={{ display: 'block', maxWidth: '100%', borderRadius: '20px' }}
                />
              </div>

              {/* Draw Results Slots (Trays) OR Countdown */}
              {phase === 'countdown' ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1.5px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live Draw Countdown
                  </div>
                  <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fca311', letterSpacing: '0.05em' }}>
                    {formatTime(secondsRemaining)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    Coins are mixing. Numbers will reveal automatically.
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {phase === 'completed' ? 'Winning Combination' : 'Drawing Numbers...'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', minHeight: '44px', width: '100%', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1.5px dashed rgba(255,255,255,0.06)' }}>

                    {/* Slots for Winning Numbers */}
                    {Array.from({ length: game.minNumbers }).map((_, i) => {
                      const num = drawnMain[i]
                      return (
                        <div
                          key={`main-${i}`}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid rgba(26, 58, 143, 0.2)',
                            background: num ? '#1a3a8f' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '15px',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            transform: num ? 'scale(1)' : 'scale(0.9)',
                            boxShadow: num ? '0 4px 10px rgba(26, 58, 143, 0.4)' : 'none'
                          }}
                        >
                          {num || ''}
                        </div>
                      )
                    })}

                    {/* Supplementary Numbers */}
                    {game.hasSupplementary && (
                      <>
                        <div style={{ width: '1.5px', background: 'rgba(255,255,255,0.15)', margin: '4px 2px' }} />
                        {Array.from({ length: game.suppNumbers || 2 }).map((_, i) => {
                          const num = drawnSupp[i]
                          return (
                            <div
                              key={`supp-${i}`}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: '2px solid rgba(26, 58, 143, 0.2)',
                                background: num ? '#1a3a8f' : 'rgba(255,255,255,0.05)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '15px',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                transform: num ? 'scale(1)' : 'scale(0.9)',
                                boxShadow: num ? '0 4px 10px rgba(26, 58, 143, 0.4)' : 'none'
                              }}
                            >
                              {num || ''}
                            </div>
                          )
                        })}
                      </>
                    )}

                    {/* Powerball */}
                    {game.hasPowerball && (
                      <>
                        <div style={{ width: '1.5px', background: 'rgba(255,255,255,0.15)', margin: '4px 2px' }} />
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid rgba(239, 68, 68, 0.2)',
                            background: drawnPowerball !== null ? '#d90429' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '15px',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            transform: drawnPowerball !== null ? 'scale(1)' : 'scale(0.9)',
                            boxShadow: drawnPowerball !== null ? '0 4px 10px rgba(239, 68, 68, 0.4)' : 'none'
                          }}
                        >
                          {drawnPowerball !== null ? drawnPowerball : ''}
                        </div>
                      </>
                    )}

                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer actions */}
        {phase === 'completed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
            <button
              className="btn btn-gold btn-lg btn-full animate-pulse"
              onClick={() => {
                onClose()
                navigate('/results')
              }}
              style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Go to Results Page
            </button>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={startDrawSequence}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <RefreshCw size={14} /> Replay Draw
              </button>
              <button className="btn btn-gold btn-sm" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
