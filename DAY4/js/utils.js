/**
 * InvoiceCraft - Utility Functions & Helpers
 */

const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee (INR)', locale: 'en-IN' },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar (USD)', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro (EUR)', locale: 'de-DE' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound (GBP)', locale: 'en-GB' },
  CAD: { symbol: 'CA$', code: 'CAD', name: 'Canadian Dollar (CAD)', locale: 'en-CA' },
  AUD: { symbol: 'AU$', code: 'AUD', name: 'Australian Dollar (AUD)', locale: 'en-AU' },
  SGD: { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar (SGD)', locale: 'en-SG' },
  AED: { symbol: 'AED', code: 'AED', name: 'UAE Dirham (AED)', locale: 'en-AE' }
};

class Utils {
  /**
   * Format monetary amount with symbol and proper decimal places
   */
  static formatCurrency(amount, currencyCode = 'INR') {
    const num = Number(amount) || 0;
    const config = CURRENCIES[currencyCode] || CURRENCIES.INR;
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return `${config.symbol}${num.toFixed(2)}`;
    }
  }

  /**
   * Format numbers with commas (plain format)
   */
  static formatNumber(val, decimals = 2) {
    const num = Number(val) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format date string to readable format e.g. "15 Oct 2026"
   */
  static formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // Safe UTC parsing to avoid timezone day shifts
        const d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
      }
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * Get today's date formatted as YYYY-MM-DD
   */
  static getToday() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Calculate future date by adding days
   */
  static addDays(dateStr, days) {
    const parts = dateStr.split('-');
    const date = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    date.setUTCDate(date.getUTCDate() + Number(days));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Check if a date is in the past compared to today
   */
  static isOverdue(dueDateStr, status) {
    if (status === 'paid' || status === 'draft') return false;
    if (!dueDateStr) return false;
    const today = Utils.getToday();
    return dueDateStr < today;
  }

  /**
   * Generate next sequential invoice number based on existing list
   */
  static generateInvoiceNumber(existingInvoices = []) {
    const year = new Date().getFullYear();
    let maxNum = 0;

    existingInvoices.forEach(inv => {
      const numStr = inv.invoiceNumber || '';
      const match = numStr.match(/\d+$/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > maxNum) maxNum = val;
      }
    });

    const nextNum = maxNum + 1;
    return `INV-${year}-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Generate random unique ID with prefix
   */
  static generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  static escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Convert number to words (English)
   */
  static numberToWords(amount, currencyCode = 'INR') {
    const num = Math.floor(Math.abs(amount));
    if (num === 0) return 'Zero';

    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n) {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    }

    const currName = currencyCode === 'INR' ? 'Rupees' : (currencyCode === 'USD' ? 'Dollars' : (currencyCode === 'EUR' ? 'Euros' : 'Units'));
    return `${inWords(num)} ${currName} Only`;
  }

  /**
   * Toast notification system
   */
  static showToast(message, type = 'success', duration = 3200) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-message">${Utils.escapeHtml(message)}</div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 250);
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }

  /**
   * Status badge HTML renderer
   */
  static getStatusBadge(status) {
    const normalized = (status || 'draft').toLowerCase();
    const map = {
      paid: { label: 'Paid', cls: 'badge-paid' },
      sent: { label: 'Sent', cls: 'badge-sent' },
      overdue: { label: 'Overdue', cls: 'badge-overdue' },
      draft: { label: 'Draft', cls: 'badge-draft' }
    };
    const item = map[normalized] || map.draft;
    return `<span class="status-badge ${item.cls}"><span class="badge-dot"></span>${item.label}</span>`;
  }
}

window.Utils = Utils;
window.CURRENCIES = CURRENCIES;
