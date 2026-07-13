import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideClose?: boolean
  footer?: ReactNode
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', hideClose, footer }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal aria-label={title}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {!hideClose && (
              <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
