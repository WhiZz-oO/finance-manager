import { useState, useEffect } from 'react'
import { Plus, Trash2, Key, Tag, ShieldCheck } from 'lucide-react'
import { categoriesApi, authApi } from '../api/client'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'

export default function Settings() {
  const [categories, setCategories] = useState([])
  const [showAddCat, setShowAddCat] = useState(false)
  const [catName, setCatName] = useState('')
  const [catType, setCatType] = useState('expense')
  const [catIcon, setCatIcon] = useState('🏷️')
  const [catColor, setCatColor] = useState('#6366f1')

  // Password change state
  const [currPassword, setCurrPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.list()
      setCategories(res.data)
    } catch {
      toast.error('Failed to load categories')
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      await categoriesApi.create({
        name: catName,
        type: catType,
        icon: catIcon,
        color: catColor,
      })
      toast.success('Category added')
      setShowAddCat(false)
      setCatName('')
      loadCategories()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create category')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to deactivate this category?')) return
    try {
      await categoriesApi.delete(id)
      toast.success('Category removed')
      loadCategories()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setPwdLoading(true)
    try {
      await authApi.changePassword({
        current_password: currPassword,
        new_password: newPassword,
      })
      toast.success('Password changed successfully')
      setCurrPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update password')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & Preferences</h1>
          <p className="page-subtitle">Manage spending categories, authentication, and core parameters</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Categories Manager */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Tag size={18} color="var(--primary-light)" />
              <span className="card-title">Transaction Categories</span>
            </div>
            <button id="btn-add-cat" className="btn btn-primary btn-sm" onClick={() => setShowAddCat(true)}>
              <Plus size={14} /> Add Category
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {categories.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {c.type}
                    </div>
                  </div>
                </div>
                <button
                  id={`btn-del-cat-${c.id}`}
                  className="btn btn-danger btn-icon btn-sm"
                  onClick={() => handleDeleteCategory(c.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Key size={18} color="var(--primary-light)" />
              <span className="card-title">Security & Password</span>
            </div>
          </div>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="curr-pwd">Current Password</label>
              <input
                id="curr-pwd"
                type="password"
                className="form-input"
                value={currPassword}
                onChange={(e) => setCurrPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-pwd">New Password</label>
              <input
                id="new-pwd"
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pwd">Confirm New Password</label>
              <input
                id="confirm-pwd"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              id="btn-change-pwd"
              type="submit"
              className="btn btn-primary"
              disabled={pwdLoading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {pwdLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCat && (
        <Modal title="➕ Add Category" onClose={() => setShowAddCat(false)}>
          <form onSubmit={handleCreateCategory}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-cat-name">Category Name</label>
              <input
                id="new-cat-name"
                type="text"
                className="form-input"
                placeholder="e.g. Subscriptions"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="new-cat-type">Type</label>
                <select
                  id="new-cat-type"
                  className="form-select"
                  value={catType}
                  onChange={(e) => setCatType(e.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-cat-icon">Icon (Emoji)</label>
                <input
                  id="new-cat-icon"
                  type="text"
                  className="form-input"
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddCat(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Category
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
