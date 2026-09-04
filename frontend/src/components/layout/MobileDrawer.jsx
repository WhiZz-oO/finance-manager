import { NavLink } from 'react-router-dom'
import {
  X, LayoutDashboard, PlusCircle, ArrowLeftRight, Wallet,
  TrendingUp, Target, Receipt, Shield, Settings, RefreshCw,
} from 'lucide-react'

const MENU_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/',                icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/add-transaction', icon: PlusCircle,       label: 'Add Transaction' },
      { to: '/transactions',    icon: ArrowLeftRight,   label: 'Transactions' },
      { to: '/accounts',        icon: Wallet,           label: 'Accounts' },
      { to: '/transfers',       icon: RefreshCw,        label: 'Transfers' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/analytics',       icon: TrendingUp,       label: 'Analytics' },
      { to: '/budgets',         icon: Target,           label: 'Budgets' },
      { to: '/receipts',        icon: Receipt,          label: 'Receipts' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/backup',          icon: Shield,           label: 'Backup & Restore' },
      { to: '/settings',        icon: Settings,         label: 'Settings' },
    ],
  },
]

export default function MobileDrawer({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div className="flex items-center gap-2">
            <div className="sidebar-logo-icon" style={{ width: 32, height: 32, fontSize: 16 }}>💰</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Finance Manager</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Personal Banking</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="mobile-drawer-nav">
          {MENU_SECTIONS.map((section) => (
            <div key={section.label} style={{ marginBottom: 16 }}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} className="nav-item-icon" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* User Footer */}
        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', padding: 14 }}>
          <div className="sidebar-user-avatar">A</div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">Albin</div>
            <div className="sidebar-user-role">Personal Profile</div>
          </div>
        </div>

      </div>
    </div>
  )
}
