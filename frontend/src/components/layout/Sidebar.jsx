import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, ArrowLeftRight, Wallet, PieChart, Receipt,
  Target, Shield, Settings, LogOut, TrendingUp, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { label: 'Overview', items: [
    { to: '/',                 icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/add-transaction',  icon: PlusCircle,       label: 'Add Transaction' },
    { to: '/transactions',     icon: ArrowLeftRight,   label: 'Transactions' },
    { to: '/accounts',         icon: Wallet,           label: 'Accounts' },
    { to: '/transfers',        icon: RefreshCw,        label: 'Transfers' },
  ]},
  { label: 'Insights', items: [
    { to: '/analytics',        icon: TrendingUp,       label: 'Analytics' },
    { to: '/budgets',          icon: Target,           label: 'Budgets' },
    { to: '/receipts',         icon: Receipt,          label: 'Receipts' },
  ]},
  { label: 'System', items: [
    { to: '/backup',           icon: Shield,           label: 'Backup & Restore' },
    { to: '/settings',         icon: Settings,         label: 'Settings' },
  ]},
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <div>
          <div className="sidebar-logo-text">Finance Manager</div>
          <div className="sidebar-logo-sub">Personal Banking</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon className="nav-item-icon" size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user-avatar">
          {user?.username?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-username">{user?.username || 'User'}</div>
          <div className="sidebar-user-role">Personal</div>
        </div>
        <button
          id="btn-logout"
          onClick={handleLogout}
          className="btn btn-ghost btn-icon btn-sm"
          title="Logout"
          style={{ marginLeft: 'auto' }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
