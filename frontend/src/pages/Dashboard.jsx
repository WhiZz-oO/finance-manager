import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react'
import { analyticsApi, accountsApi, transactionsApi } from '../api/client'
import { formatCurrency, formatDate, typeBadgeClass, typeSign, currentYearMonth } from '../utils/format'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1','#10b981','#f43f5e','#f59e0b','#06b6d4','#8b5cf6','#ec4899']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { year, month } = currentYearMonth()
  const [summary, setSummary]     = useState(null)
  const [accounts, setAccounts]   = useState([])
  const [recentTxns, setRecentTxns] = useState([])
  const [cashFlow, setCashFlow]   = useState([])
  const [catBreak, setCatBreak]   = useState([])
  const [loading, setLoading]     = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const end = month < 12
        ? `${year}-${String(month + 1).padStart(2, '0')}-01`
        : `${year}-12-31`

      const [s, a, t, cf, cb] = await Promise.all([
        analyticsApi.summary({ start_date: start, end_date: end }),
        accountsApi.list(),
        transactionsApi.list({ page_size: 8 }),
        analyticsApi.cashFlow(6),
        analyticsApi.byCategory({ start_date: start, end_date: end }),
      ])
      setSummary(s.data)
      setAccounts(a.data)
      setRecentTxns(t.data.items)
      setCashFlow(cf.data)
      setCatBreak(cb.data.slice(0, 6))
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      Loading dashboard…
    </div>
  )

  const STATS = [
    {
      label: 'Total Balance', value: formatCurrency(totalBalance),
      icon: '💰', color: 'var(--primary)', sub: `${accounts.length} accounts`,
    },
    {
      label: 'Monthly Income', value: formatCurrency(summary?.total_income),
      icon: '📈', color: 'var(--income)', sub: 'This month',
    },
    {
      label: 'Monthly Expenses', value: formatCurrency(summary?.total_expense),
      icon: '📉', color: 'var(--expense)', sub: 'This month',
    },
    {
      label: 'Net Cash Flow', value: formatCurrency(summary?.net),
      icon: '⚡', color: summary?.net >= 0 ? 'var(--income)' : 'var(--expense)',
      sub: `${summary?.savings_rate ?? 0}% savings rate`,
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4 mb-6">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card animate-in" style={{ '--accent-color': s.color }}>
            <div className="stat-icon" style={{ background: `${s.color}20` }}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value animate-count">{s.value}</div>
            <div className="stat-change text-muted">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-6">
        {/* Cash Flow Bar */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cash Flow — Last 6 Months</span>
          </div>
          <div className="chart-container" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="total_expense" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Spending by Category</span>
          </div>
          {catBreak.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 220 }}>
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={catBreak} dataKey="amount" nameKey="category"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3}>
                    {catBreak.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catBreak.map((c, i) => (
                  <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: COLORS[i % COLORS.length],
                    }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.icon} {c.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <div className="empty-state-title">No expenses this month</div>
            </div>
          )}
        </div>
      </div>

      {/* Account quick-view + Recent Transactions */}
      <div className="grid-2">
        {/* Accounts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Accounts</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {accounts.map((acc) => (
              <div key={acc.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{acc.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{acc.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{acc.account_type}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: acc.balance >= 0 ? 'var(--text-primary)' : 'var(--expense)' }}>
                  {formatCurrency(acc.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Transactions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTxns.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No transactions yet</div>
                <div className="empty-state-text">Click "Add Transaction" to get started</div>
              </div>
            )}
            {recentTxns.map((txn) => (
              <div key={txn.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  background: txn.transaction_type === 'income' ? 'var(--income-dim)'
                    : txn.transaction_type === 'expense' ? 'var(--expense-dim)' : 'var(--transfer-dim)',
                }}>
                  {txn.category_icon || (txn.transaction_type === 'income' ? '📈' : '📉')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {txn.merchant || txn.description || txn.category_name || 'Transaction'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {formatDate(txn.transaction_date)} · {txn.account_name}
                  </div>
                </div>
                <div className={txn.transaction_type === 'expense' ? 'amount-negative' : 'amount-positive'}
                  style={{ fontSize: '0.9rem', flexShrink: 0 }}>
                  {typeSign(txn.transaction_type)}{formatCurrency(txn.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
