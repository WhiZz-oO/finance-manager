import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, ShieldCheck, Download, RefreshCw, Database, Lock, History } from 'lucide-react'
import { backupApi, exportApi } from '../api/client'
import { formatDateTime, currentYearMonth } from '../utils/format'
import toast from 'react-hot-toast'

export default function Backup() {
  const { year, month } = currentYearMonth()
  const [backups, setBackups] = useState([])
  const [integrityStatus, setIntegrityStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [checking, setChecking] = useState(false)

  const loadBackups = async () => {
    setLoading(true)
    try {
      const res = await backupApi.list()
      setBackups(res.data)
    } catch {
      toast.error('Failed to load backup logs')
    } finally {
      setLoading(false)
    }
  }

  const checkIntegrity = async () => {
    setChecking(true)
    try {
      const res = await backupApi.integrity()
      setIntegrityStatus(res.data)
      if (res.data.status === 'ok') {
        toast.success('Database integrity verified! All pages OK.')
      } else {
        toast.error('Database integrity warning!')
      }
    } catch {
      toast.error('Integrity check failed')
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    loadBackups()
    checkIntegrity()
  }, [])

  const handleCreateBackup = async () => {
    setCreating(true)
    try {
      await backupApi.create()
      toast.success('Hot encrypted backup created with SHA-256 checksum!')
      loadBackups()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Backup creation failed')
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (id) => {
    if (!confirm('⚠️ WARNING: Restoring this backup will replace current database. Integrity will be validated before restoration. Continue?')) {
      return
    }
    try {
      await backupApi.restore(id)
      toast.success('Database restored successfully!')
      checkIntegrity()
      loadBackups()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Restore failed')
    }
  }

  const handleExportExcel = async () => {
    try {
      const res = await exportApi.excel(month, year)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Finance_Export_${year}_${month}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Excel statement downloaded!')
    } catch {
      toast.error('Failed to export Excel report')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Backup & Disaster Recovery</h1>
          <p className="page-subtitle">3-2-1 Backup Strategy: Hot SQLite copies, AES-256 encryption, and verification</p>
        </div>
        <div className="flex gap-2">
          <button id="btn-export-excel" className="btn btn-secondary" onClick={handleExportExcel}>
            <Download size={16} /> Export Excel Statement
          </button>
          <button
            id="btn-create-backup"
            className="btn btn-primary"
            disabled={creating}
            onClick={handleCreateBackup}
          >
            <Shield size={16} /> {creating ? 'Backing up...' : 'Create Instant Backup'}
          </button>
        </div>
      </div>

      {/* Integrity card */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Database size={18} color="var(--primary-light)" />
            <span className="card-title">SQLite Database Health</span>
          </div>
          <button
            id="btn-recheck-integrity"
            className="btn btn-ghost btn-sm"
            disabled={checking}
            onClick={checkIntegrity}
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} /> Check Integrity
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: integrityStatus?.status === 'ok' ? 'var(--income-dim)' : 'var(--expense-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {integrityStatus?.status === 'ok' ? (
              <ShieldCheck size={28} color="var(--income)" />
            ) : (
              <ShieldAlert size={28} color="var(--expense)" />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: integrityStatus?.status === 'ok' ? 'var(--income)' : 'var(--expense)' }}>
              {integrityStatus?.status === 'ok' ? 'PRAGMA integrity_check: HEALTHY' : 'Integrity Issue Detected'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Storage engine: SQLite WAL Mode (Write-Ahead Logging) with Foreign Keys Enabled
            </div>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <History size={18} color="var(--primary-light)" />
            <span className="card-title">Backup History & Snapshots</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Type</th>
                <th>SHA-256 Checksum</th>
                <th>Size</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                    Loading backups...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🛡️</div>
                      <div className="empty-state-title">No backups yet</div>
                      <div className="empty-state-text">Click "Create Instant Backup" to generate your first backup.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.filename}</td>
                    <td>
                      <span className="badge badge-transfer">{b.backup_type}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {b.checksum ? `${b.checksum.substring(0, 12)}...${b.checksum.substring(b.checksum.length - 8)}` : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {b.size_bytes ? `${(b.size_bytes / 1024).toFixed(1)} KB` : '—'}
                    </td>
                    <td>{formatDateTime(b.created_at)}</td>
                    <td>
                      <span className={b.status === 'success' ? 'badge badge-income' : 'badge badge-expense'}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <button
                        id={`btn-restore-${b.id}`}
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRestore(b.id)}
                      >
                        <Lock size={12} /> Restore & Verify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
