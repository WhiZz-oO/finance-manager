import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle, Eye } from 'lucide-react'
import { receiptsApi, transactionsApi } from '../api/client'
import { formatCurrency, formatDate } from '../utils/format'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'

export default function Receipts() {
  const [transactions, setTransactions] = useState([])
  const [selectedTxnId, setSelectedTxnId] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [receiptsList, setReceiptsList] = useState([])
  const [previewReceipt, setPreviewReceipt] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await transactionsApi.list({ page_size: 100 })
      setTransactions(res.data.items)
      if (res.data.items.length > 0 && !selectedTxnId) {
        setSelectedTxnId(res.data.items[0].id)
      }
    } catch {
      toast.error('Failed to load transactions for receipts')
    } finally {
      setLoading(false)
    }
  }

  const loadReceiptsForTxn = async (txnId) => {
    if (!txnId) return
    try {
      const res = await receiptsApi.forTransaction(txnId)
      setReceiptsList(res.data)
    } catch {
      toast.error('Failed to load receipts')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTxnId) {
      loadReceiptsForTxn(selectedTxnId)
    }
  }, [selectedTxnId])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please choose a file to upload')
      return
    }
    if (!selectedTxnId) {
      toast.error('Please select a transaction')
      return
    }

    setUploading(true)
    try {
      await receiptsApi.upload(selectedTxnId, file)
      toast.success('Receipt uploaded & scanned with OCR!')
      setFile(null)
      loadReceiptsForTxn(selectedTxnId)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Receipt upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteReceipt = async (id) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return
    try {
      await receiptsApi.delete(id)
      toast.success('Receipt deleted')
      loadReceiptsForTxn(selectedTxnId)
    } catch {
      toast.error('Failed to delete receipt')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Receipts & OCR Vault</h1>
          <p className="page-subtitle">Attach receipt images/PDFs and extract text automatically</p>
        </div>
      </div>

      <div className="grid-2 mb-6">
        {/* Upload Form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Upload & Scan Receipt</span>
          </div>

          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label className="form-label" htmlFor="rec-txn">Linked Transaction</label>
              <select
                id="rec-txn"
                className="form-select"
                value={selectedTxnId}
                onChange={(e) => setSelectedTxnId(e.target.value)}
                required
              >
                <option value="">Select Transaction...</option>
                {transactions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.reference} - {t.merchant || t.description || 'Txn'} ({formatCurrency(t.amount)}) - {formatDate(t.transaction_date)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Receipt File (JPEG, PNG, WEBP, PDF)</label>
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('receipt-file-input').click()}
              >
                <Upload size={32} style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {file ? file.name : 'Click to browse receipt file'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Maximum file size: 10MB
                </div>
                <input
                  id="receipt-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
            </div>

            <button
              id="btn-upload-receipt"
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !file}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {uploading ? 'Processing OCR & Uploading...' : 'Upload & Extract Data'}
            </button>
          </form>
        </div>

        {/* Selected Transaction Receipts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Attached Receipts</span>
          </div>

          {receiptsList.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <div className="empty-state-title">No receipts attached</div>
              <div className="empty-state-text">Select a transaction and upload its receipt above.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {receiptsList.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <div className="flex-between mb-2">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color="var(--primary-light)" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rec.original_filename}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Uploaded {formatDate(rec.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id={`btn-view-rec-${rec.id}`}
                        className="btn btn-secondary btn-icon btn-sm"
                        onClick={() => setPreviewReceipt(rec)}
                        title="View OCR & File"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        id={`btn-del-rec-${rec.id}`}
                        className="btn btn-danger btn-icon btn-sm"
                        onClick={() => handleDeleteReceipt(rec.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {rec.total_amount && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--income)', marginTop: 6 }}>
                      Parsed Amount: {formatCurrency(rec.total_amount)}
                    </div>
                  )}
                  {rec.merchant && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Merchant: {rec.merchant}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewReceipt && (
        <Modal
          title={`Receipt: ${previewReceipt.original_filename}`}
          onClose={() => setPreviewReceipt(null)}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {previewReceipt.mime_type?.startsWith('image/') ? (
              <div style={{ textAlign: 'center', background: '#000', borderRadius: 8, padding: 8, maxHeight: 350, overflow: 'hidden' }}>
                <img
                  src={receiptsApi.fileUrl(previewReceipt.id)}
                  alt="Receipt Preview"
                  style={{ maxWidth: '100%', maxHeight: 330, objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                <a
                  href={receiptsApi.fileUrl(previewReceipt.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  Download / View PDF File
                </a>
              </div>
            )}

            <div>
              <h4 style={{ marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Extracted OCR Text</h4>
              <pre
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 180,
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {previewReceipt.ocr_text || '(No OCR text extracted)'}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
