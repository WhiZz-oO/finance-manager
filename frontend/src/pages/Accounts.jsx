import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { accountsApi } from '../api/client'
import { formatCurrency } from '../utils/format'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'

const TYPES = ['bank','cash','upi','savings','credit','wallet']
const ICONS = { bank: '🏦', cash: '💵', upi: '📲', savings: '🏧', credit: '💳', wallet: '👛' }
const COLORS = ['#6366f1','#10b981','#f97316','#06b6d4','#8b5cf6','#ec4899','#f43f5e','#f59e0b']

function AccountForm({ initial, onSuccess, onClose }) {
  const [name, setName]     = useState(initial?.name || '')
  const [type, setType]     = useState(initial?.account_type || 'bank')
  const [balance, setBal]   = useState(initial?.opening_balance || '')
  const [color, setColor]   = useState(initial?.color || '#6366f1')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name, account_type: type, opening_balance: Number(balance) || 0,
        color, icon: ICONS[type] || '🏦',
      }
      if (initial) await accountsApi.update(initial.id, payload)
      else await accountsApi.create(payload)
      toast.success(initial ? 'Account updated' : 'Account created')
      onSuccess?.(); onClose?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save account')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="acc-name">Account Name</label>
        <input id="acc-name" type="text" className="form-input"
          placeholder="e.g. HDFC Bank Account" value={name}
          onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="acc-type">Type</label>
          <select id="acc-type" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="acc-balance">
            {initial ? 'Opening Balance (₹)' : 'Current Balance (₹)'}
          </label>
          <input id="acc-balance" type="number" step="0.01" className="form-input"
            placeholder="0.00" value={balance} onChange={(e) => setBal(e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Card Color</label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button key={c} type="button"
              onClick={() => setColor(c)}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: c,
                border: color === c ? '3px solid white' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" id="btn-acc-cancel" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" id="btn-acc-submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Update Account' : 'Create Account'}
        </button>
      </div>
    </form>
  )
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [showAdd, setShowAdd]   = useState(false)
  const [editing, setEditing]   = useState(null)
  const [loading, setLoading]   = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await accountsApi.list()
      setAccounts(res.data)
    } catch { toast.error('Failed to load accounts') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this account?')) return
    try { await accountsApi.delete(id); toast.success('Account deactivated'); load() }
    catch { toast.error('Delete failed') }
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">Total wealth: {formatCurrency(totalBalance)}</p>
        </div>
        <button id="btn-add-account" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1,2,3].map((i) => (
            <div key={i} className="account-card skeleton" style={{ height: 140 }} />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏦</div>
          <div className="empty-state-title">No accounts yet</div>
          <div className="empty-state-text">Add your bank accounts, cash, UPI wallets, etc.</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add First Account
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="account-card animate-in"
              style={{ '--card-color': acc.color }}>
              {/* Actions */}
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
                <button id={`btn-edit-acc-${acc.id}`}
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={(e) => { e.stopPropagation(); setEditing(acc) }}>
                  <Pencil size={13} />
                </button>
                <button id={`btn-del-acc-${acc.id}`}
                  className="btn btn-danger btn-icon btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleDelete(acc.id) }}>
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="account-card-icon">{acc.icon}</div>
              <div className="account-card-name">{acc.name}</div>
              <div className="account-card-type">{acc.account_type}</div>
              <div className="account-card-balance" style={{ color: acc.color }}>
                {formatCurrency(acc.balance)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Opening: {formatCurrency(acc.opening_balance)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="🏦 Add Account" onClose={() => setShowAdd(false)}>
          <AccountForm onSuccess={load} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title="✏️ Edit Account" onClose={() => setEditing(null)}>
          <AccountForm initial={editing} onSuccess={load} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}
