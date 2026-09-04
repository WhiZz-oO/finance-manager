import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, ArrowLeftRight, Wallet, Menu } from 'lucide-react'

export default function BottomNav({ onOpenMenu }) {
  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/transactions"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <ArrowLeftRight size={20} />
        <span>Ledger</span>
      </NavLink>

      {/* Prominent Center Add Button */}
      <NavLink
        to="/add-transaction"
        className={({ isActive }) => `mobile-nav-center-btn ${isActive ? 'active' : ''}`}
        title="Add Transaction"
      >
        <PlusCircle size={26} />
      </NavLink>

      <NavLink
        to="/accounts"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <Wallet size={20} />
        <span>Accounts</span>
      </NavLink>

      <button
        type="button"
        className="mobile-nav-item"
        onClick={onOpenMenu}
        aria-label="Open full menu"
      >
        <Menu size={20} />
        <span>More</span>
      </button>
    </nav>
  )
}
