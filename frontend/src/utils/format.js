/**
 * Format a number as Indian Rupee currency.
 * ₹1,00,000.00
 */
export const formatCurrency = (amount, showSign = false) => {
  if (amount === null || amount === undefined) return '₹0.00'
  const abs = Math.abs(amount)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(abs)
  if (showSign && amount > 0) return `+${formatted}`
  if (showSign && amount < 0) return `-${formatted}`
  return formatted
}

/**
 * Format a date string to "18 Aug 2026"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Format a datetime string to "18 Aug 2026, 09:00 AM"
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Today's date as YYYY-MM-DD string for form inputs
 */
export const todayISO = () => new Date().toISOString().split('T')[0]

/**
 * Get current year and month
 */
export const currentYearMonth = () => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/**
 * Truncate a string
 */
export const truncate = (str, len = 30) =>
  str && str.length > len ? str.slice(0, len) + '…' : str

/**
 * Get color class for transaction type
 */
export const typeColor = (type) => {
  switch (type) {
    case 'income':   return 'amount-positive'
    case 'refund':   return 'amount-positive'
    case 'expense':  return 'amount-negative'
    case 'transfer': return 'amount-neutral'
    default:         return ''
  }
}

export const typeBadgeClass = (type) => {
  switch (type) {
    case 'income':   return 'badge badge-income'
    case 'expense':  return 'badge badge-expense'
    case 'transfer': return 'badge badge-transfer'
    case 'refund':   return 'badge badge-refund'
    default:         return 'badge'
  }
}

export const typeSign = (type) => (type === 'income' || type === 'refund') ? '+' : '-'
