import clsx from 'clsx'

interface NumberBallProps {
  number: number
  variant?: 'default' | 'selected' | 'winning' | 'supplementary' | 'powerball' | 'disabled'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onClick?: (n: number) => void
  clickable?: boolean
}

export default function NumberBall({
  number,
  variant = 'default',
  size = 'md',
  onClick,
  clickable,
}: NumberBallProps) {
  return (
    <div
      className={clsx(
        'number-ball',
        variant !== 'default' && variant,
        size !== 'md' && size,
        String(number).length > 2 && 'raffle-pill',
        (clickable || onClick) && 'clickable'
      )}
      onClick={() => onClick?.(number)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(number)}
      aria-pressed={variant === 'selected'}
      aria-label={`Number ${number}`}
    >
      {number}
    </div>
  )
}
