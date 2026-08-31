import { useState, useEffect } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { transfersApi, accountsApi } from '../api/client'
import { formatCurrency, formatDate, todayISO } from '../utils/format'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'

function TransferForm({ onSuccess, onClose }) {
  const [fromId, setFrom]     = useState('')
  const [toId, setTo]         = useState('')
  const [amount, setAmount]   = useState('')
  const [date, setDate]       = useState(todayISO())
  const [desc, setDesc]       = useState('')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    accountsApi.list().then((r) => {
      setAccounts(r.data)
      if (r.data.length >= 2) { setFrom(r.data[0].id); setTo(r.data[1].id) }
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (String(fromId) === String(toId)) { toast.error('Cannot transfer to same account'); return }
    setLoading(true)
    try {
      await transfersApi.create({
        from_account_id: Number(fromId), to_account_id: Number(toId),
        amount: Number(amount), transfer_date: date, description: desc || null,
      })
      toast.success('Transfer created')
      onSuccess?.(); onClose?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Transfer failed')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="trf-from">From Account</label>
          <select id="trf-from" className="form-select" value={fromId}
            onChange={(e) => setFrom(e.target.value)} required>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name} ({formatCurrency(a.balance)})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="trf-to">To Account</label>
          <select id="trf-to" className="form-select" value={toId}
            onChange={(e) => setTo(e.target.value)} required>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name} ({formatCurrency(a.balance)})</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="trf-amount">Amount (₹)</label>
          <input id="trf-amount" type="number" min="0.01" step="0.01" className="form-input"
            placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="trf-date">Date</label>
          <input id="trf-date" type="date" className="form-input" value={date}
            onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="trf-desc">Description (optional)</label>
        <input id="trf-desc" type="text" className="form-input"
          placeholder="e.g. Monthly savings transfer" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
        <button type="button" id="btn-trf-cancel" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" id="btn-trf-submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Processing…' : '🔄 Transfer Funds'}
        </button>
      </div>
    </form>
  )
}

export default function Transfers() {
  const [transfers, setTransfers] = useState([])
  const [showAdd, setShowAdd]     = useState(false)
  const [loading, setLoading]     = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await transfersApi.list()
      setTransfers(res.data)
    } catch { toast.error('Failed to load transfers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this transfer?')) return
    try { await transfersApi.delete(id); toast.success('Transfer deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transfers</h1>
          <p className="page-subtitle">Move funds between your accounts</p>
        </div>
        <button id="btn-add-transfer" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> New Transfer
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>}
            {!loading && transfers.length === 0 && (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">🔄</div>
                  <div className="empty-state-title">No transfers yet</div>
                </div>
              </td></tr>
            )}
            {transfers.map((t) => (
              <tr key={t.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.reference}</td>
                <td>{formatDate(t.transfer_date)}</td>
                <td>
                  <span className="badge badge-expense">{t.from_account}</span>
                </td>
                <td>
                  <span className="badge badge-income">{t.to_account}</span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="amount-neutral">{formatCurrency(t.amount)}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{t.description || '—'}</td>
                <td>
                  <button id={`btn-del-trf-${t.id}`} className="btn btn-danger btn-icon btn-sm"
                    onClick={() => handleDelete(t.id)}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="🔄 Transfer Funds" onClose={() => setShowAdd(false)}>
          <TransferForm onSuccess={load} onClose={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
