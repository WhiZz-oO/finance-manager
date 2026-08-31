import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { budgetsApi, categoriesApi } from '../api/client'
import { formatCurrency, currentYearMonth } from '../utils/format'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'

function BudgetForm({ onSuccess, onClose }) {
  const { year, month } = currentYearMonth()
  const [catId, setCatId]     = useState('')
  const [period, setPeriod]   = useState('monthly')
  const [limit, setLimit]     = useState('')
  const [categories, setCats] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    categoriesApi.list('expense').then((r) => setCats(r.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await budgetsApi.create({
        category_id: Number(catId),
        period,
        year,
        month: period === 'monthly' ? month : null,
        limit_amount: Number(limit),
      })
      toast.success('Budget created')
      onSuccess?.(); onClose?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create budget')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="bud-cat">Category</label>
        <select id="bud-cat" className="form-select" value={catId}
          onChange={(e) => setCatId(e.target.value)} required>
          <option value="">Select category…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="bud-period">Period</label>
          <select id="bud-period" className="form-select" value={period}
            onChange={(e) => setPeriod(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="bud-limit">Limit (₹)</label>
          <input id="bud-limit" type="number" min="1" step="0.01" className="form-input"
            placeholder="5000.00" value={limit} onChange={(e) => setLimit(e.target.value)} required />
        </div>
      </div>
      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
        <button type="button" id="btn-bud-cancel" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" id="btn-bud-submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create Budget'}
        </button>
      </div>
    </form>
  )
}

export default function Budgets() {
  const { year, month } = currentYearMonth()
  const [budgets, setBudgets] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await budgetsApi.list({ year, month })
      setBudgets(res.data)
    } catch { toast.error('Failed to load budgets') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return
    try { await budgetsApi.delete(id); toast.success('Budget deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">{months[month-1]} {year}</p>
        </div>
        <button id="btn-add-budget" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Budget
        </button>
      </div>

      {loading ? (
        <div className="grid-2">
          {[1,2,3,4].map((i) => <div key={i} className="card skeleton" style={{ height: 120 }} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">No budgets set</div>
          <div className="empty-state-text">Set spending limits per category to track your expenses</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Set First Budget
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {budgets.map((b) => {
            const pct = Math.min(b.percentage_used, 100)
            const cls = b.percentage_used >= 100 ? 'danger' : b.percentage_used >= 80 ? 'warning' : 'safe'
            return (
              <div key={b.id} className="card animate-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{b.category_icon} {b.category_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{b.period}</div>
                  </div>
                  <button id={`btn-del-bud-${b.id}`} className="btn btn-danger btn-icon btn-sm"
                    onClick={() => handleDelete(b.id)}><Trash2 size={13} /></button>
                </div>

                <div className="flex-between mb-2">
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {formatCurrency(b.spent)} spent
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600,
                    color: b.is_over_budget ? 'var(--expense)' : 'var(--text-primary)' }}>
                    {formatCurrency(b.limit_amount)} limit
                  </span>
                </div>

                <div className="progress-bar">
                  <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="flex-between" style={{ marginTop: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {b.is_over_budget
                      ? `⚠️ Over by ${formatCurrency(Math.abs(b.remaining))}`
                      : `${formatCurrency(b.remaining)} remaining`
                    }
                  </span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    color: b.is_over_budget ? 'var(--expense)' : b.percentage_used >= 80 ? 'var(--warning)' : 'var(--income)',
                  }}>
                    {b.percentage_used.toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="🎯 Set Budget" onClose={() => setShowAdd(false)}>
          <BudgetForm onSuccess={load} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
