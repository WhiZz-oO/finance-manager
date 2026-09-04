import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'
import MobileDrawer from './MobileDrawer'
import BiometricLockScreen from '../common/BiometricLockScreen'
import { isLockEnabled, isSessionUnlocked, setSessionUnlocked, registerBiometric, setLockPin } from '../../utils/biometrics'
import toast, { Toaster } from 'react-hot-toast'

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(() => isLockEnabled() && !isSessionUnlocked())

  // Lock the app immediately
  const handleLockApp = async () => {
    if (!isLockEnabled()) {
      // If not configured yet, offer quick setup
      const userPin = prompt('Set a 4-digit PIN to lock your app:', '1234')
      if (userPin && userPin.length >= 4) {
        await setLockPin(userPin)
        toast.success('App Lock Enabled!')
      } else {
        toast('Please configure Fingerprint or PIN in Settings first', { icon: '🔒' })
        return
      }
    }
    setSessionUnlocked(false)
    setIsLocked(true)
    toast('App Locked', { icon: '🔒' })
  }

  // Auto-lock when phone app is closed, switched away, or screen turned off
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isLockEnabled()) {
        // App went to background - lock immediately
        setSessionUnlocked(false)
      } else if (document.visibilityState === 'visible' && isLockEnabled()) {
        // App returned to foreground - enforce lock screen
        if (!isSessionUnlocked()) {
          setIsLocked(true)
        }
      }
    }

    const handlePageHide = () => {
      if (isLockEnabled()) {
        setSessionUnlocked(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [])

  return (
    <div className="app-layout">
      {/* Biometric / PIN Lock Screen */}
      {isLocked && (
        <BiometricLockScreen
          onUnlock={() => {
            setSessionUnlocked(true)
            setIsLocked(false)
          }}
        />
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar onLock={handleLockApp} />

      {/* Mobile Top Header (hidden on desktop) */}
      <MobileHeader onOpenMenu={() => setDrawerOpen(true)} onLock={handleLockApp} />

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
