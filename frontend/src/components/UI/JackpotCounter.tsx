import { useEffect, useRef, useState } from 'react'

interface JackpotCounterProps {
  amount: number
  currency?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

function formatJackpot(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} Million`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

export default function JackpotCounter({ amount, currency = 'AUD', className, size = 'md' }: JackpotCounterProps) {
  const [displayed, setDisplayed] = useState(0)
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>()
  const startRef = useRef(0)
  const startAmountRef = useRef(0)
  const duration = 1200

  useEffect(() => {
    startRef.current = performance.now()
    startAmountRef.current = displayed

    const animate = (now: number) => {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease out cubic
      const current = Math.round(startAmountRef.current + (amount - startAmountRef.current) * eased)
      setDisplayed(current)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [amount])

  const fontSizes = { sm: '24px', md: '40px', lg: '60px' }

  return (
    <div className={className}>
      <div className="jackpot-label">{currency} JACKPOT</div>
      <div
        className="jackpot-display animate-jackpot"
        style={{ fontSize: fontSizes[size] }}
      >
        {formatJackpot(displayed)}
      </div>
    </div>
  )
}
