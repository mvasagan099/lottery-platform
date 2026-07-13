import { useCountdown } from '@/hooks/useCountdown'

interface CountdownTimerProps {
  targetDate: string | Date | null
  size?: 'sm' | 'md' | 'lg'
  label?: string
  onExpired?: () => void
}

export default function CountdownTimer({ targetDate, size = 'md', label, onExpired }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate)

  if (isExpired) {
    return (
      <div className="countdown">
        <span className="badge badge-danger">Draw Closed</span>
      </div>
    )
  }

  const valueStyle = size === 'sm'
    ? { fontSize: '16px', minWidth: '36px', padding: '5px 3px' }
    : size === 'lg'
    ? { fontSize: '32px', minWidth: '72px', padding: '12px 8px' }
    : {}

  const labelStyle = size === 'lg' ? { fontSize: '12px' } : {}

  return (
    <div>
      {label && <div className="jackpot-label" style={{ marginBottom: '8px' }}>{label}</div>}
      <div className="countdown">
        {days > 0 && (
          <>
            <div className="countdown-unit">
              <div className="countdown-value" style={valueStyle}>{String(days).padStart(2, '0')}</div>
              <div className="countdown-label" style={labelStyle}>Days</div>
            </div>
            <div className="countdown-sep">:</div>
          </>
        )}
        <div className="countdown-unit">
          <div className="countdown-value" style={valueStyle}>{String(hours).padStart(2, '0')}</div>
          <div className="countdown-label" style={labelStyle}>Hrs</div>
        </div>
        <div className="countdown-sep">:</div>
        <div className="countdown-unit">
          <div className="countdown-value" style={valueStyle}>{String(minutes).padStart(2, '0')}</div>
          <div className="countdown-label" style={labelStyle}>Min</div>
        </div>
        <div className="countdown-sep">:</div>
        <div className="countdown-unit">
          <div className="countdown-value" style={valueStyle}>{String(seconds).padStart(2, '0')}</div>
          <div className="countdown-label" style={labelStyle}>Sec</div>
        </div>
      </div>
    </div>
  )
}
