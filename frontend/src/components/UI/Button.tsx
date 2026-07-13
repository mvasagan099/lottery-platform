import { ReactNode, ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import Spinner from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'accent' | 'outline' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'btn',
        `btn-${variant}`,
        size !== 'md' && `btn-${size}`,
        fullWidth && 'btn-full',
        loading && 'btn-loading',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <><div className="btn-spinner" /><span>Loading...</span></>
      ) : (
        <>
          {leftIcon && leftIcon}
          {children}
          {rightIcon && rightIcon}
        </>
      )}
    </button>
  )
}
