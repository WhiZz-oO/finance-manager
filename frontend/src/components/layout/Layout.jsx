import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-body">
          <Outlet />
        </div>
      </main>
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
