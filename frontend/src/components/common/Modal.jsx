import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, children, onClose, footer, maxWidth = '520px' }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {onClose && (
            <button id="btn-modal-close" onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
