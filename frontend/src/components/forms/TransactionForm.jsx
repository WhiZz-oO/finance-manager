import { useState, useEffect } from 'react'
import { transactionsApi, categoriesApi, accountsApi } from '../../api/client'
import { todayISO } from '../../utils/format'
import toast from 'react-hot-toast'

const TYPES = [
  { value: 'income',   label: '💚 Income',   color: 'var(--income)' },
  { value: 'expense',  label: '🔴 Expense',  color: 'var(--expense)' },
  { value: 'refund',   label: '🔵 Refund',   color: 'var(--primary-light)' },
]

export default function TransactionForm({ onSuccess, onClose, initial = null }) {
  const [type, setType]         = useState(initial?.transaction_type || 'expense')
  const [amount, setAmount]     = useState(initial?.amount || '')
  const [accountId, setAccountId] = useState(initial?.account_id || '')
  const [categoryId, setCategoryId] = useState(initial?.category_id || '')
  const [merchant, setMerchant] = useState(initial?.merchant || '')
  const [description, setDesc]  = useState(initial?.description || '')
  const [date, setDate]         = useState(initial?.transaction_date || todayISO())
  const [notes, setNotes]       = useState(initial?.notes || '')
  const [loading, setLoading]   = useState(false)
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    Promise.all([
      accountsApi.list(),
      categoriesApi.list(),
    ]).then(([a, c]) => {
      setAccounts(a.data)
      setCategories(c.data)
      if (!initial) {
        if (a.data.length) setAccountId(a.data[0].id)
      }
    })
  }, [])

  const filteredCats = categories.filter(
    (c) => c.type === type || c.type === 'both'
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setLoading(true)
    try {
      const payload = {
        account_id: Number(accountId),
        transaction_type: type,
        amount: Number(amount),
        category_id: categoryId ? Number(categoryId) : null,
        merchant: merchant || null,
        description: description || null,
        transaction_date: date,
        notes: notes || null,
      }
      if (initial) {
        await transactionsApi.update(initial.id, payload)
        toast.success('Transaction updated')
      } else {
        await transactionsApi.create(payload)
        toast.success('Transaction added')
      }
      onSuccess?.()
      onClose?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Type selector */}
      <div className="form-group">
        <label className="form-label">Type</label>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              id={`btn-type-${t.value}`}
              className="btn btn-secondary"
              style={{
                flex: 1, fontSize: '0.8rem',
                ...(type === t.value ? {
                  borderColor: t.color,
                  color: t.color,
                  background: `${t.color}18`,
                } : {}),
              }}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        {/* Amount */}
        <div className="form-group">
          <label className="form-label" htmlFor="txn-amount">Amount (₹)</label>
          <input
            id="txn-amount"
            type="number"
            step="0.01"
            min="0.01"
            className="form-input"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label" htmlFor="txn-date">Date</label>
          <input
            id="txn-date"
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        {/* Account */}
        <div className="form-group">
          <label className="form-label" htmlFor="txn-account">Account</label>
          <select
            id="txn-account"
            className="form-select"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            <option value="">Select account...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label" htmlFor="txn-category">Category</label>
          <select
            id="txn-category"
            className="form-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Uncategorized</option>
            {filteredCats.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Merchant */}
      <div className="form-group">
        <label className="form-label" htmlFor="txn-merchant">Merchant / Source</label>
        <input
          id="txn-merchant"
          type="text"
          className="form-input"
          placeholder="e.g. Amazon, Employer Name…"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label" htmlFor="txn-desc">Description</label>
        <input
          id="txn-desc"
          type="text"
          className="form-input"
          placeholder="Short description…"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label" htmlFor="txn-notes">Notes (optional)</label>
        <textarea
          id="txn-notes"
          className="form-textarea"
          placeholder="Additional notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-2 justify-end" style={{ marginTop: 4 }}>
        <button type="button" id="btn-txn-cancel" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          id="btn-txn-submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving…' : initial ? 'Update Transaction' : 'Add Transaction'}
        </button>
      </div>
    </form>
  )
}
