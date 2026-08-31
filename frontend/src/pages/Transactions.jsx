import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Pencil, Filter } from 'lucide-react'
import { transactionsApi } from '../api/client'
import { formatCurrency, formatDate, typeBadgeClass, typeSign, todayISO } from '../utils/format'
import Modal from '../components/common/Modal'
import TransactionForm from '../components/forms/TransactionForm'
import toast from 'react-hot-toast'

const TYPE_FILTERS = ['all', 'income', 'expense', 'refund']

export default function Transactions() {
  const navigate = useNavigate()
  const [txns, setTxns]         = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [pages, setPages]       = useState(1)
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState('all')
  const [editing, setEditing]   = useState(null)
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 20 }
      if (search) params.search = search
      if (typeFilter !== 'all') params.transaction_type = typeFilter
      const res = await transactionsApi.list(params)
      setTxns(res.data.items)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch { toast.error('Failed to load transactions') }
    finally { setLoading(false) }
  }, [page, search, typeFilter])

  useEffect(() => { load() }, [load])

  // reset page on filter change
  useEffect(() => { setPage(1) }, [search, typeFilter])

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await transactionsApi.delete(id)
      toast.success('Transaction deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} total records</p>
        </div>
        <button id="btn-add-txn" className="btn btn-primary" onClick={() => navigate('/add-transaction')}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            id="txn-search"
            type="text"
            placeholder="Search merchant, description, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips" style={{ margin: 0 }}>
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              id={`chip-${t}`}
              className={`chip${typeFilter === t ? ' active' : ''}`}
              onClick={() => setType(t)}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>Account</th>
              <th>Type</th>
              <th>Category</th>
              <th>Merchant / Description</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
            )}
            {!loading && txns.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-title">No transactions found</div>
                    <div className="empty-state-text">
                      {search ? 'Try a different search term' : 'Click "Add Transaction" to get started'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {txns.map((txn) => (
              <tr key={txn.id} onClick={() => setEditing(txn)}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {txn.reference}
                </td>
                <td>{formatDate(txn.transaction_date)}</td>
                <td>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {txn.account_name}
                  </span>
                </td>
                <td>
                  <span className={typeBadgeClass(txn.transaction_type)}>
                    {txn.transaction_type}
                  </span>
                </td>
                <td>
                  {txn.category_icon && <span style={{ marginRight: 4 }}>{txn.category_icon}</span>}
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {txn.category_name || '—'}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    {txn.merchant || txn.description || '—'}
                  </div>
                  {txn.merchant && txn.description && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{txn.description}</div>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className={txn.transaction_type === 'expense' ? 'amount-negative' : 'amount-positive'}>
                    {typeSign(txn.transaction_type)}{formatCurrency(txn.amount)}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <button
                      id={`btn-edit-txn-${txn.id}`}
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => setEditing(txn)}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      id={`btn-del-txn-${txn.id}`}
                      className="btn btn-danger btn-icon btn-sm"
                      onClick={() => handleDelete(txn.id)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex gap-2 items-center" style={{ marginTop: 16, justifyContent: 'center' }}>
          <button id="btn-prev-page" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Page {page} of {pages}</span>
          <button id="btn-next-page" className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <Modal title="✏️ Edit Transaction" onClose={() => setEditing(null)}>
          <TransactionForm initial={editing} onSuccess={load} onClose={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}
