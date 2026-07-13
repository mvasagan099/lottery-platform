import { useState, useEffect, useRef } from 'react'

interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  formatted: string
}

export function useCountdown(targetDate: string | Date | null): CountdownResult {
  const calculateTimeLeft = () => {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: 'Closed' }

    const target = new Date(targetDate).getTime()
    const now = Date.now()
    const diff = target - now

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: 'Closed' }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    let formatted = ''
    if (days > 0) formatted = `${days}d ${hours}h ${minutes}m`
    else if (hours > 0) formatted = `${hours}h ${minutes}m ${seconds}s`
    else formatted = `${minutes}m ${seconds}s`

    return { days, hours, minutes, seconds, isExpired: false, formatted }
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!targetDate) return
    setTimeLeft(calculateTimeLeft())
    intervalRef.current = setInterval(() => {
      const next = calculateTimeLeft()
      setTimeLeft(next)
      if (next.isExpired && intervalRef.current) clearInterval(intervalRef.current)
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [targetDate])

  return timeLeft
}
