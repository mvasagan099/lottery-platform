interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizes = { sm: 20, md: 32, lg: 48 }

export default function Spinner({ size = 'md', color }: SpinnerProps) {
  const px = sizes[size]
  return (
    <div
      style={{
        width: px, height: px, flexShrink: 0,
        border: `${size === 'sm' ? 2 : 3}px solid var(--border-color)`,
        borderTopColor: color || 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
  )
}
