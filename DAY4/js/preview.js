/**
 * InvoiceCraft - Professional Invoice Preview & Print Engine
 */

class PreviewManager {
  static currentInvoiceId = null;
  static currentTemplate = 'modern';

  static render(invoiceId) {
    this.currentInvoiceId = invoiceId;
    const container = document.getElementById('preview-sheet-container');
    if (!container) return;

    const invoices = StorageManager.getInvoices();
    const inv = invoices.find(i => i.id === invoiceId);

    if (!inv) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Invoice not found or deleted.</p>
          <button class="btn-primary" onclick="window.InvoicesApp.navigateTo('history')">Return to Invoices</button>
        </div>
      `;
      return;
    }

    const today = Utils.getToday();
    const isPastDue = Utils.isOverdue(inv.dueDate, inv.status);
    const displayStatus = isPastDue ? 'overdue' : inv.status;
    const formattedTotal = Utils.formatCurrency(inv.total, inv.currency);
    const formattedSubtotal = Utils.formatCurrency(inv.subtotal, inv.currency);
    const formattedDiscount = Utils.formatCurrency(inv.discountAmount || 0, inv.currency);
    const formattedTax = Utils.formatCurrency(inv.taxAmount || 0, inv.currency);
    const formattedShipping = Utils.formatCurrency(inv.shippingAmount || 0, inv.currency);

    // Update status button states in the preview toolbar
    this.updateToolbarActions(inv);

    // Render items table
    const itemsRows = (inv.items || []).map((item, idx) => `
      <tr class="preview-item-row">
        <td class="preview-col-num">${idx + 1}</td>
        <td class="preview-col-desc">
          <div class="item-name font-medium">${Utils.escapeHtml(item.description)}</div>
        </td>
        <td class="preview-col-qty text-right font-mono">${item.quantity}</td>
        <td class="preview-col-price text-right font-mono">${Utils.formatCurrency(item.unitPrice, inv.currency)}</td>
        <td class="preview-col-amount text-right font-mono font-medium">${Utils.formatCurrency(item.amount, inv.currency)}</td>
      </tr>
    `).join('');

    // Status Stamp Watermark
    let statusStamp = '';
    if (displayStatus === 'paid') {
      statusStamp = `<div class="invoice-stamp stamp-paid">PAID<span class="stamp-sub">${Utils.formatDate(inv.paidAt || inv.date)}</span></div>`;
    } else if (displayStatus === 'overdue') {
      statusStamp = `<div class="invoice-stamp stamp-overdue">OVERDUE<span class="stamp-sub">Payment Pending</span></div>`;
    } else if (displayStatus === 'draft') {
      statusStamp = `<div class="invoice-stamp stamp-draft">DRAFT<span class="stamp-sub">Unissued</span></div>`;
    }

    container.className = `preview-sheet template-${this.currentTemplate}`;
    container.innerHTML = `
      <div class="invoice-document" id="printable-invoice">
        ${statusStamp}
        
        <!-- Header -->
        <header class="inv-doc-header">
          <div class="inv-biz-info">
            <div class="biz-brand-lockup">
              <div class="biz-logo-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              </div>
              <div>
                <h1 class="inv-biz-title">${Utils.escapeHtml(inv.business?.name || 'Your Company Name')}</h1>
                ${inv.business?.gstin ? `<div class="inv-tax-id">GSTIN / TAX ID: <strong>${Utils.escapeHtml(inv.business.gstin)}</strong></div>` : ''}
              </div>
            </div>
            <div class="inv-biz-contact">
              <div class="address-lines">${Utils.escapeHtml(inv.business?.address || '').replace(/\n/g, '<br>')}</div>
              <div class="contact-line">
                ${inv.business?.email ? `<span>✉ ${Utils.escapeHtml(inv.business.email)}</span>` : ''}
                ${inv.business?.phone ? `<span>✆ ${Utils.escapeHtml(inv.business.phone)}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="inv-meta-block">
            <div class="inv-headline">INVOICE</div>
            <div class="inv-number-badge font-mono">${Utils.escapeHtml(inv.invoiceNumber)}</div>
            
            <div class="inv-dates-grid">
              <div class="date-row">
                <span class="date-label">Issue Date:</span>
                <span class="date-val font-mono">${Utils.formatDate(inv.date)}</span>
              </div>
              <div class="date-row">
                <span class="date-label">Due Date:</span>
                <span class="date-val font-mono ${isPastDue ? 'text-danger font-bold' : ''}">${Utils.formatDate(inv.dueDate)}</span>
              </div>
              <div class="date-row">
                <span class="date-label">Status:</span>
                <span class="date-val">${Utils.getStatusBadge(displayStatus)}</span>
              </div>
            </div>
          </div>
        </header>

        <hr class="inv-divider">

        <!-- Bill To / Customer Details -->
        <div class="inv-party-section">
          <div class="party-box bill-to">
            <span class="party-label">BILLED TO</span>
            <div class="party-name font-bold">${Utils.escapeHtml(inv.customer?.name || 'Walk-in Client')}</div>
            <div class="party-address">${Utils.escapeHtml(inv.customer?.address || 'No address provided').replace(/\n/g, '<br>')}</div>
            <div class="party-contact">
              ${inv.customer?.email ? `<div>Email: ${Utils.escapeHtml(inv.customer.email)}</div>` : ''}
              ${inv.customer?.phone ? `<div>Phone: ${Utils.escapeHtml(inv.customer.phone)}</div>` : ''}
              ${inv.customer?.gstin ? `<div>GSTIN/Tax ID: <strong>${Utils.escapeHtml(inv.customer.gstin)}</strong></div>` : ''}
            </div>
          </div>

          <div class="party-box amount-due-box">
            <span class="party-label">TOTAL AMOUNT DUE</span>
            <div class="amount-due-highlight font-mono">${formattedTotal}</div>
            <div class="currency-tag">All values in ${inv.currency || 'INR'}</div>
            ${displayStatus === 'paid' ? '<div class="paid-confirmation-banner">✓ Paid in Full</div>' : ''}
          </div>
        </div>

        <!-- Line Items Table -->
        <div class="inv-table-wrapper">
          <table class="inv-table">
            <thead>
              <tr>
                <th class="preview-col-num">#</th>
                <th class="preview-col-desc text-left">Description</th>
                <th class="preview-col-qty text-right">Qty</th>
                <th class="preview-col-price text-right">Unit Price</th>
                <th class="preview-col-amount text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <!-- Calculations & Totals Block -->
        <div class="inv-totals-section">
          <div class="inv-notes-block">
            ${inv.notes ? `
              <div class="notes-group">
                <span class="block-title">Notes / Remarks</span>
                <p class="notes-text">${Utils.escapeHtml(inv.notes)}</p>
              </div>
            ` : ''}

            ${inv.paymentDetails ? `
              <div class="notes-group payment-instructions">
                <span class="block-title">Payment Instructions & Bank Account</span>
                <p class="notes-text font-mono">${Utils.escapeHtml(inv.paymentDetails).replace(/\n/g, '<br>')}</p>
              </div>
            ` : ''}

            ${inv.terms ? `
              <div class="notes-group terms-block">
                <span class="block-title">Terms & Conditions</span>
                <p class="notes-text">${Utils.escapeHtml(inv.terms).replace(/\n/g, '<br>')}</p>
              </div>
            ` : ''}
          </div>

          <div class="inv-summary-card">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span class="font-mono">${formattedSubtotal}</span>
            </div>

            ${inv.discountAmount > 0 ? `
              <div class="summary-row discount-row">
                <span>Discount ${inv.discountType === 'percentage' ? `(${inv.discountValue}%)` : ''}:</span>
                <span class="font-mono text-success">- ${formattedDiscount}</span>
              </div>
            ` : ''}

            <div class="summary-row">
              <span>Configurable Tax (${inv.taxRate || 0}%):</span>
              <span class="font-mono">${formattedTax}</span>
            </div>

            ${inv.shippingAmount > 0 ? `
              <div class="summary-row">
                <span>Shipping / Handling:</span>
                <span class="font-mono">${formattedShipping}</span>
              </div>
            ` : ''}

            <div class="summary-row grand-total-row">
              <span>Grand Total:</span>
              <span class="font-mono font-bold">${formattedTotal}</span>
            </div>

            <div class="total-words-box">
              <span class="words-label">Amount in Words:</span>
              <div class="words-val">${Utils.numberToWords(inv.total, inv.currency)}</div>
            </div>
          </div>
        </div>

        <!-- Sign-off Footer -->
        <footer class="inv-doc-footer">
          <div class="footer-left">
            <p>Thank you for partnering with <strong>${Utils.escapeHtml(inv.business?.name || 'us')}</strong>!</p>
            <p class="footer-sub">For inquiries regarding this invoice, contact ${Utils.escapeHtml(inv.business?.email || 'accounts')}</p>
          </div>
          <div class="footer-right">
            <div class="signature-line"></div>
            <span class="signature-label">Authorized Signatory</span>
          </div>
        </footer>
      </div>
    `;
  }

  static updateToolbarActions(inv) {
    const markPaidBtn = document.getElementById('btn-preview-mark-paid');
    const markSentBtn = document.getElementById('btn-preview-mark-sent');

    if (markPaidBtn) {
      if (inv.status === 'paid') {
        markPaidBtn.innerHTML = `<span>✓ Already Paid</span>`;
        markPaidBtn.disabled = true;
      } else {
        markPaidBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Mark as Paid</span>
        `;
        markPaidBtn.disabled = false;
      }
    }

    if (markSentBtn) {
      if (inv.status === 'sent') {
        markSentBtn.innerHTML = `<span>✓ Marked as Sent</span>`;
      } else {
        markSentBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          <span>Mark as Sent</span>
        `;
      }
    }
  }

  static setTemplate(templateName) {
    this.currentTemplate = templateName;
    if (this.currentInvoiceId) {
      this.render(this.currentInvoiceId);
    }
  }

  static printInvoice() {
    window.print();
  }

  static downloadJson() {
    if (!this.currentInvoiceId) return;
    const invoices = StorageManager.getInvoices();
    const inv = invoices.find(i => i.id === this.currentInvoiceId);
    if (!inv) return;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inv, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${inv.invoiceNumber}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    Utils.showToast(`Invoice ${inv.invoiceNumber} downloaded as JSON`, 'success');
  }

  static copySummary() {
    if (!this.currentInvoiceId) return;
    const invoices = StorageManager.getInvoices();
    const inv = invoices.find(i => i.id === this.currentInvoiceId);
    if (!inv) return;

    const summary = `Invoice #${inv.invoiceNumber}\nClient: ${inv.customer?.name}\nAmount: ${Utils.formatCurrency(inv.total, inv.currency)}\nDue Date: ${Utils.formatDate(inv.dueDate)}\nStatus: ${inv.status.toUpperCase()}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).then(() => {
        Utils.showToast('Invoice summary copied to clipboard!', 'success');
      });
    } else {
      Utils.showToast('Invoice Summary:\n' + summary, 'info', 5000);
    }
  }
}

window.PreviewManager = PreviewManager;
