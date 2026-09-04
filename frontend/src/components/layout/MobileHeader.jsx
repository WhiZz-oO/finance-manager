import { Menu, Lock } from 'lucide-react'

export default function MobileHeader({ onOpenMenu, onLock }) {
  return (
    <header className="mobile-header">
      <div className="flex items-center gap-2">
        <div className="sidebar-logo-icon" style={{ width: 28, height: 28, fontSize: 14 }}>💰</div>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
          Finance Manager
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Instant Lock App Button */}
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onLock}
          aria-label="Lock App"
          title="Lock App Instantly"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-accent)',
            borderRadius: '50%',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Lock size={16} />
        </button>

        {/* Menu Toggle */}
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  )
}
