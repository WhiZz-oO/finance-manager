import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'
import MobileDrawer from './MobileDrawer'
import BiometricLockScreen from '../common/BiometricLockScreen'
import { isLockEnabled, isSessionUnlocked } from '../../utils/biometrics'
import { Toaster } from 'react-hot-toast'

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(() => isLockEnabled() && !isSessionUnlocked())

  return (
    <div className="app-layout">
      {/* Biometric / PIN Lock Screen */}
      {isLocked && <BiometricLockScreen onUnlock={() => setIsLocked(false)} />}

      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Mobile Top Header (hidden on desktop) */}
      <MobileHeader onOpenMenu={() => setDrawerOpen(true)} />

      {/* Mobile Slide-Out Drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main Content Body */}
      <main className="main-content">
        <div className="page-body">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (hidden on desktop) */}
      <BottomNav onOpenMenu={() => setDrawerOpen(true)} />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e1b4b',
            color: '#f1f5f9',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontFamily: 'Inter, sans-serif',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#fff' },
          },
        }}
      />
    </div>
  )
}
