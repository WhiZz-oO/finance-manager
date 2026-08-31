import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AddTransaction from './pages/AddTransaction'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import Transfers from './pages/Transfers'
import Analytics from './pages/Analytics'
import Budgets from './pages/Budgets'
import Receipts from './pages/Receipts'
import Backup from './pages/Backup'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="add-transaction" element={<AddTransaction />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="backup" element={<Backup />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
