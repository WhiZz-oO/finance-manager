import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { analyticsApi } from '../api/client'
import { formatCurrency, currentYearMonth } from '../utils/format'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1','#10b981','#f43f5e','#f59e0b','#06b6d4','#8b5cf6','#ec4899','#f97316']

const Tip = ({ active, payload, label }) => {
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

export default function Analytics() {
  const { year: curYear, month: curMonth } = currentYearMonth()
  const [year, setYear]     = useState(curYear)
  const [month, setMonth]   = useState(curMonth)
  const [monthly, setMonthly] = useState([])
  const [weekly, setWeekly]   = useState([])
  const [byCat, setByCat]     = useState([])
  const [cashFlow, setCashFlow] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const start = `${year}-${String(month).padStart(2, '0')}-01`
      const end = month < 12
        ? `${year}-${String(month + 1).padStart(2, '0')}-01`
        : `${year}-12-31`
      const [m, w, c, cf] = await Promise.all([
        analyticsApi.monthly(year),
        analyticsApi.weekly(year, month),
        analyticsApi.byCategory({ start_date: start, end_date: end }),
        analyticsApi.cashFlow(6),
      ])
      setMonthly(m.data)
      setWeekly(w.data)
      setByCat(c.data)
      setCashFlow(cf.data)
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [year, month])

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Income, expenses, and spending patterns</p>
        </div>
        <div className="flex gap-2">
          <select id="sel-month" className="form-select" style={{ width: 120 }}
            value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select id="sel-year" className="form-select" style={{ width: 90 }}
            value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[curYear-1, curYear, curYear+1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading analytics…</div>
      ) : (
        <>
          {/* Monthly Overview */}
          <div className="card mb-6">
            <div className="card-header">
              <span className="card-title">Monthly Overview — {year}</span>
            </div>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month_name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{ fontSize: '0.78rem', color: '#94a3b8' }} />
                  <Bar dataKey="total_income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="total_expense" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} />
                  <Line dataKey="net" name="Net" stroke="#6366f1" dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid-2 mb-6">
            {/* Weekly breakdown */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Weekly Breakdown — {months[month-1]} {year}</span>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey={(d) => `Week ${d.week}`} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="total_income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="total_expense" name="Expenses" fill="#f43f5e" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Spending by Category</span>
              </div>
              {byCat.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-title">No expense data</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {byCat.slice(0, 7).map((c, i) => (
                    <div key={c.category}>
                      <div className="flex-between mb-2" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: '0.82rem' }}>{c.icon} {c.category}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{formatCurrency(c.amount)}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill safe"
                          style={{ width: `${c.percentage}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cash Flow Line */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Net Cash Flow — Last 6 Months</span>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                  <Tooltip content={<Tip />} />
                  <Line dataKey="net" name="Net" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                  <Line dataKey="total_income" name="Income" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <Line dataKey="total_expense" name="Expenses" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
