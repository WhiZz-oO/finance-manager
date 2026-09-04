import { Menu } from 'lucide-react'

export default function MobileHeader({ onOpenMenu }) {
  return (
    <header className="mobile-header">
      <div className="flex items-center gap-2">
        <div className="sidebar-logo-icon" style={{ width: 28, height: 28, fontSize: 14 }}>💰</div>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
          Finance Manager
        </span>
      </div>

      <button
        type="button"
        className="btn btn-ghost btn-icon btn-sm"
        onClick={onOpenMenu}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>
    </header>
  )
}
