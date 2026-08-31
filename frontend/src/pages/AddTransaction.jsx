import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, ArrowUpRight, ArrowDownLeft, RotateCcw, Wallet, Tag, Calendar, Building, FileText, CheckCircle2, History } from 'lucide-react'
import { transactionsApi, categoriesApi, accountsApi, receiptsApi } from '../api/client'
import { formatCurrency, formatDate, todayISO } from '../utils/format'
import toast from 'react-hot-toast'

const TYPES = [
  { value: 'income',  label: 'Income',  icon: ArrowUpRight,  color: 'var(--income)',  bg: 'var(--income-dim)' },
  { value: 'expense', label: 'Expense', icon: ArrowDownLeft, color: 'var(--expense)', bg: 'var(--expense-dim)' },
  { value: 'refund',  label: 'Refund',  icon: RotateCcw,    color: 'var(--primary-light)', bg: 'rgba(99,102,241,0.15)' },
]

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000]

export default function AddTransaction() {
  const navigate = useNavigate()
  const [type, setType] = useState('income')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [merchant, setMerchant] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)

  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [recentTxns, setRecentTxns] = useState([])
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  const loadInitialData = async () => {
    try {
      const [accRes, catRes, txnRes] = await Promise.all([
        accountsApi.list(),
        categoriesApi.list(),
        transactionsApi.list({ page_size: 5 }),
      ])
      setAccounts(accRes.data)
      setCategories(catRes.data)
      setRecentTxns(txnRes.data.items)
      if (accRes.data.length > 0 && !accountId) {
        setAccountId(accRes.data[0].id)
      }
    } catch {
      toast.error('Failed to load transaction form data')
    } finally {
      setInitLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'both'
  )

  const selectedAccount = accounts.find((a) => String(a.id) === String(accountId))
  const selectedCategory = categories.find((c) => String(c.id) === String(categoryId))

  const handleQuickAdd = (val) => {
    const current = Number(amount) || 0
    setAmount(String(current + val))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const numAmount = Number(amount)
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (!accountId) {
      toast.error('Please select an account')
      return
    }

    setLoading(true)
    try {
      const payload = {
        account_id: Number(accountId),
        transaction_type: type,
        amount: numAmount,
        category_id: categoryId ? Number(categoryId) : null,
        merchant: merchant.trim() || null,
        description: description.trim() || null,
        transaction_date: date,
        notes: notes.trim() || null,
      }

      const res = await transactionsApi.create(payload)
      const createdTxn = res.data

      // Upload receipt if provided
      if (receiptFile && createdTxn?.id) {
        try {
          await receiptsApi.upload(createdTxn.id, receiptFile)
        } catch {
          toast.error('Transaction created, but receipt upload failed')
        }
      }

      toast.success(`Transaction ${createdTxn.reference || ''} saved successfully!`)

      // Reset form fields
      setAmount('')
      setMerchant('')
      setDescription('')
      setNotes('')
      setReceiptFile(null)

      // Refresh recent transactions and account balances
      loadInitialData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record transaction')
    } finally {
      setLoading(false)
    }
  }

  if (initLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
        Loading form...
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Transaction</h1>
          <p className="page-subtitle">Record your daily expenses, incomes, and fund updates</p>
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Main Entry Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            
            {/* Type Selector Tabs */}
            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <div className="grid-3" style={{ gap: 12 }}>
                {TYPES.map((t) => {
                  const Icon = t.icon
                  const active = type === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      id={`btn-type-${t.value}`}
                      onClick={() => {
                        setType(t.value)
                        setCategoryId('') // reset category on type switch
                      }}
                      className="btn btn-secondary"
                      style={{
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 'var(--radius-md)',
                        border: active ? `2px solid ${t.color}` : '1px solid var(--border)',
                        background: active ? t.bg : 'rgba(255,255,255,0.02)',
                        color: active ? t.color : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all var(--transition)',
                      }}
                    >
                      <Icon size={20} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Amount Input with Quick Chips */}
            <div className="form-group" style={{ marginTop: 20 }}>
              <div className="flex-between">
                <label className="form-label" htmlFor="entry-amount">Amount (₹ INR) *</label>
                <div className="flex gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="chip"
                      onClick={() => handleQuickAdd(amt)}
                      style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: type === 'expense' ? 'var(--expense)' : 'var(--income)',
                  }}
                >
                  ₹
                </span>
                <input
                  id="entry-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    paddingLeft: 38,
                    height: 54,
                  }}
                />
              </div>
            </div>

            {/* Account & Category Row */}
            <div className="form-row" style={{ marginTop: 20 }}>
              {/* Account */}
              <div className="form-group">
                <label className="form-label" htmlFor="entry-account">
                  <Wallet size={14} style={{ display: 'inline', marginRight: 4 }} /> Account *
                </label>
                <select
                  id="entry-account"
                  className="form-select"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                >
                  <option value="">Select account...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="entry-category">
                  <Tag size={14} style={{ display: 'inline', marginRight: 4 }} /> Category
                </label>
                <select
                  id="entry-category"
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Uncategorized</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Merchant Row */}
            <div className="form-row">
              {/* Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="entry-date">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} /> Date *
                </label>
                <input
                  id="entry-date"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Merchant / Payee */}
              <div className="form-group">
                <label className="form-label" htmlFor="entry-merchant">
                  <Building size={14} style={{ display: 'inline', marginRight: 4 }} /> Merchant / Payee
                </label>
                <input
                  id="entry-merchant"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Swiggy, Amazon, Employer"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-description">Description</label>
              <input
                id="entry-description"
                type="text"
                className="form-input"
                placeholder="Short note about this transaction"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-notes">Additional Notes</label>
              <textarea
                id="entry-notes"
                className="form-textarea"
                rows={2}
                placeholder="Optional details, reference codes, or tags..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Receipt Upload */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-receipt">
                <FileText size={14} style={{ display: 'inline', marginRight: 4 }} /> Attach Receipt (Optional)
              </label>
              <input
                id="entry-receipt"
                type="file"
                accept="image/*,application/pdf"
                className="form-input"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                style={{ padding: '6px 12px' }}
              />
              {receiptFile && (
                <div style={{ fontSize: '0.75rem', color: 'var(--income)', marginTop: 4 }}>
                  ✓ Selected: {receiptFile.name}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3" style={{ marginTop: 24 }}>
              <button
                type="submit"
                id="btn-submit-transaction"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <PlusCircle size={18} />
                {loading ? 'Saving to Database...' : `Save ${type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Refund'}`}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => navigate('/transactions')}
              >
                View Ledger
              </button>
            </div>

          </form>
        </div>

        {/* Right Sidebar: Live Summary & Recent Transactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Live Preview Card */}
          <div className="card" style={{ border: '1px solid var(--border-accent)' }}>
            <div className="card-header">
              <span className="card-title">Live Preview</span>
            </div>
            
            <div style={{ padding: '10px 0' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {type} Preview
              </div>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  marginTop: 4,
                  color: type === 'expense' ? 'var(--expense)' : 'var(--income)',
                }}
              >
                {type === 'expense' ? '-' : '+'}{formatCurrency(Number(amount) || 0)}
              </div>

              <div className="divider" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Account:</span>
                  <span style={{ fontWeight: 600 }}>{selectedAccount ? `${selectedAccount.icon} ${selectedAccount.name}` : '—'}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                  <span style={{ fontWeight: 600 }}>{selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : 'Uncategorized'}</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                  <span style={{ fontWeight: 600 }}>{formatDate(date)}</span>
                </div>
                {merchant && (
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Payee:</span>
                    <span style={{ fontWeight: 600 }}>{merchant}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Records */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <History size={16} color="var(--primary-light)" />
                <span className="card-title">Recent Entries</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentTxns.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                  No transactions yet
                </div>
              ) : (
                recentTxns.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                        {t.merchant || t.description || t.category_name || 'Transaction'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatDate(t.transaction_date)} · {t.account_name}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: t.transaction_type === 'expense' ? 'var(--expense)' : 'var(--income)',
                      }}
                    >
                      {t.transaction_type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
