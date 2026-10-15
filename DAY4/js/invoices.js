/**
 * InvoiceCraft - Invoices Logic, Editor & History Management
 */

class InvoicesManager {
  static currentEditingId = null;
  static currentFilter = 'all';
  static searchQuery = '';
  static sortBy = 'date-desc';

  /**
   * Initialize Create/Edit Invoice Form
   */
  static initForm(invoiceId = null) {
    this.currentEditingId = invoiceId;
    const formTitle = document.getElementById('form-page-title');
    const formSubtitle = document.getElementById('form-page-subtitle');
    const saveDraftBtn = document.getElementById('btn-save-draft');
    const saveSentBtn = document.getElementById('btn-save-sent');
    const savePaidBtn = document.getElementById('btn-save-paid');
    const deleteInvoiceBtn = document.getElementById('btn-delete-current-invoice');

    const settings = StorageManager.getSettings();
    const existingInvoices = StorageManager.getInvoices();

    // Populate customer dropdown
    this.populateCustomerDropdown();

    if (invoiceId) {
      // EDIT MODE
      const invoice = existingInvoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        Utils.showToast('Invoice not found!', 'error');
        window.InvoicesApp.navigateTo('history');
        return;
      }

      if (formTitle) formTitle.textContent = `Edit Invoice ${invoice.invoiceNumber}`;
      if (formSubtitle) formSubtitle.textContent = `Modify line items, pricing, or status for this invoice`;
      if (deleteInvoiceBtn) deleteInvoiceBtn.classList.remove('hidden');

      this.fillFormWithInvoice(invoice);
    } else {
      // CREATE MODE
      if (formTitle) formTitle.textContent = 'Create New Invoice';
      if (formSubtitle) formSubtitle.textContent = 'Generate a professional, print-ready invoice in seconds';
      if (deleteInvoiceBtn) deleteInvoiceBtn.classList.add('hidden');

      this.resetFormDefaults(settings, existingInvoices);
    }

    this.recalculateTotals();
  }

  /**
   * Reset form with default settings and empty single line item
   */
  static resetFormDefaults(settings, existingInvoices) {
    document.getElementById('inv-number').value = Utils.generateInvoiceNumber(existingInvoices);
    document.getElementById('inv-date').value = Utils.getToday();
    const defaultDays = parseInt(settings.defaultPaymentTerms || '15', 10);
    document.getElementById('inv-due-date').value = Utils.addDays(Utils.getToday(), defaultDays);

    // Business details from settings
    document.getElementById('biz-name').value = settings.businessName || '';
    document.getElementById('biz-email').value = settings.businessEmail || '';
    document.getElementById('biz-phone').value = settings.businessPhone || '';
    document.getElementById('biz-address').value = settings.businessAddress || '';
    document.getElementById('biz-gstin').value = settings.businessGstin || '';

    // Customer fields empty
    document.getElementById('cust-select').value = '';
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-email').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-address').value = '';
    document.getElementById('cust-gstin').value = '';
    const saveCustCheck = document.getElementById('cust-save-new');
    if (saveCustCheck) saveCustCheck.checked = false;

    // Currency & Tax
    document.getElementById('inv-currency').value = settings.defaultCurrency || 'INR';
    document.getElementById('tax-rate').value = settings.defaultTaxRate !== undefined ? settings.defaultTaxRate : 18;
    document.getElementById('discount-type').value = 'percentage';
    document.getElementById('discount-val').value = 0;
    document.getElementById('shipping-val').value = 0;

    // Notes & Terms
    document.getElementById('inv-notes').value = settings.defaultNotes || '';
    document.getElementById('inv-terms').value = settings.defaultTerms || '';
    document.getElementById('inv-payment-details').value = settings.bankDetails || '';

    // Line items container
    const itemsTableBody = document.getElementById('line-items-body');
    if (itemsTableBody) {
      itemsTableBody.innerHTML = '';
      this.addLineItem({
        description: 'Professional Consulting & Development Services',
        quantity: 1,
        unitPrice: 10000
      });
    }
  }

  /**
   * Fill form with existing invoice details for editing
   */
  static fillFormWithInvoice(inv) {
    document.getElementById('inv-number').value = inv.invoiceNumber || '';
    document.getElementById('inv-date').value = inv.date || '';
    document.getElementById('inv-due-date').value = inv.dueDate || '';

    // Business info
    document.getElementById('biz-name').value = inv.business?.name || '';
    document.getElementById('biz-email').value = inv.business?.email || '';
    document.getElementById('biz-phone').value = inv.business?.phone || '';
    document.getElementById('biz-address').value = inv.business?.address || '';
    document.getElementById('biz-gstin').value = inv.business?.gstin || '';

    // Customer info
    document.getElementById('cust-select').value = inv.customer?.id || '';
    document.getElementById('cust-name').value = inv.customer?.name || '';
    document.getElementById('cust-email').value = inv.customer?.email || '';
    document.getElementById('cust-phone').value = inv.customer?.phone || '';
    document.getElementById('cust-address').value = inv.customer?.address || '';
    document.getElementById('cust-gstin').value = inv.customer?.gstin || '';

    // Currency & Pricing
    document.getElementById('inv-currency').value = inv.currency || 'INR';
    document.getElementById('tax-rate').value = inv.taxRate !== undefined ? inv.taxRate : 18;
    document.getElementById('discount-type').value = inv.discountType || 'percentage';
    document.getElementById('discount-val').value = inv.discountValue !== undefined ? inv.discountValue : 0;
    document.getElementById('shipping-val').value = inv.shippingAmount !== undefined ? inv.shippingAmount : 0;

    // Notes
    document.getElementById('inv-notes').value = inv.notes || '';
    document.getElementById('inv-terms').value = inv.terms || '';
    document.getElementById('inv-payment-details').value = inv.paymentDetails || '';

    // Line items
    const itemsTableBody = document.getElementById('line-items-body');
    if (itemsTableBody) {
      itemsTableBody.innerHTML = '';
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        inv.items.forEach(item => this.addLineItem(item));
      } else {
        this.addLineItem();
      }
    }
  }

  /**
   * Populate customer dropdown in the invoice editor
   */
  static populateCustomerDropdown() {
    const custSelect = document.getElementById('cust-select');
    if (!custSelect) return;

    const customers = StorageManager.getCustomers();
    let optionsHtml = '<option value="">-- Choose Existing Customer or Enter Below --</option>';

    customers.forEach(cust => {
      optionsHtml += `<option value="${cust.id}">${Utils.escapeHtml(cust.name)} (${Utils.escapeHtml(cust.email || 'No email')})</option>`;
    });

    custSelect.innerHTML = optionsHtml;
  }

  /**
   * On customer dropdown change, prefill customer inputs
   */
  static onCustomerSelect(customerId) {
    if (!customerId) return;
    const customers = StorageManager.getCustomers();
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      document.getElementById('cust-name').value = cust.name || '';
      document.getElementById('cust-email').value = cust.email || '';
      document.getElementById('cust-phone').value = cust.phone || '';
      document.getElementById('cust-address').value = cust.address || '';
      document.getElementById('cust-gstin').value = cust.gstin || '';
      Utils.showToast(`Customer details for "${cust.name}" filled`, 'info', 2000);
    }
  }

  /**
   * Add a new line item row to the table
   */
  static addLineItem(data = null) {
    const itemsTableBody = document.getElementById('line-items-body');
    if (!itemsTableBody) return;

    const rowId = Utils.generateId('row');
    const tr = document.createElement('tr');
    tr.id = rowId;
    tr.className = 'line-item-row';

    const desc = data?.description || '';
    const qty = data?.quantity !== undefined ? data.quantity : 1;
    const price = data?.unitPrice !== undefined ? data.unitPrice : 0;
    const rowTotal = qty * price;
    const currency = document.getElementById('inv-currency')?.value || 'INR';

    tr.innerHTML = `
      <td class="col-item-desc">
        <input type="text" class="form-input item-desc-input" placeholder="Item or service description..." value="${Utils.escapeHtml(desc)}" required>
      </td>
      <td class="col-item-qty">
        <input type="number" class="form-input item-qty-input text-right" min="0.01" step="any" value="${qty}" required>
      </td>
      <td class="col-item-price">
        <input type="number" class="form-input item-price-input text-right" min="0" step="any" value="${price}" required>
      </td>
      <td class="col-item-total text-right">
        <span class="item-total-display font-medium font-mono">${Utils.formatCurrency(rowTotal, currency)}</span>
      </td>
      <td class="col-item-action text-center">
        <button type="button" class="btn-icon-danger btn-remove-item" title="Remove item" onclick="InvoicesManager.removeLineItem('${rowId}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </td>
    `;

    // Add live calculation listeners
    const qtyInput = tr.querySelector('.item-qty-input');
    const priceInput = tr.querySelector('.item-price-input');

    const updateRow = () => {
      const q = parseFloat(qtyInput.value) || 0;
      const p = parseFloat(priceInput.value) || 0;
      const tot = q * p;
      const curr = document.getElementById('inv-currency')?.value || 'INR';
      tr.querySelector('.item-total-display').textContent = Utils.formatCurrency(tot, curr);
      InvoicesManager.recalculateTotals();
    };

    qtyInput.addEventListener('input', updateRow);
    priceInput.addEventListener('input', updateRow);

    itemsTableBody.appendChild(tr);
    InvoicesManager.recalculateTotals();
  }

  /**
   * Remove a line item row
   */
  static removeLineItem(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const rows = document.querySelectorAll('.line-item-row');
    if (rows.length <= 1) {
      Utils.showToast('An invoice must have at least one line item', 'warning');
      return;
    }

    row.remove();
    this.recalculateTotals();
  }

  /**
   * Recalculate Subtotal, Discount, Tax, and Grand Total
   */
  static recalculateTotals() {
    const currency = document.getElementById('inv-currency')?.value || 'INR';
    const rows = document.querySelectorAll('.line-item-row');

    let subtotal = 0;
    rows.forEach(row => {
      const qty = parseFloat(row.querySelector('.item-qty-input')?.value) || 0;
      const price = parseFloat(row.querySelector('.item-price-input')?.value) || 0;
      const rowTotal = qty * price;
      subtotal += rowTotal;
      const totalDisplay = row.querySelector('.item-total-display');
      if (totalDisplay) {
        totalDisplay.textContent = Utils.formatCurrency(rowTotal, currency);
      }
    });

    // Discount
    const discountType = document.getElementById('discount-type')?.value || 'percentage';
    const discountVal = parseFloat(document.getElementById('discount-val')?.value) || 0;
    let discountAmount = 0;

    if (discountType === 'percentage') {
      const pct = Math.min(Math.max(discountVal, 0), 100);
      discountAmount = (subtotal * pct) / 100;
    } else {
      discountAmount = Math.min(Math.max(discountVal, 0), subtotal);
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // Tax
    const taxRate = parseFloat(document.getElementById('tax-rate')?.value) || 0;
    const taxAmount = (discountedSubtotal * taxRate) / 100;

    // Shipping
    const shipping = parseFloat(document.getElementById('shipping-val')?.value) || 0;

    // Grand Total
    const grandTotal = discountedSubtotal + taxAmount + shipping;

    // Update displays
    const subtotalEl = document.getElementById('calc-subtotal');
    const discountAmountEl = document.getElementById('calc-discount-amount');
    const taxAmountEl = document.getElementById('calc-tax-amount');
    const grandTotalEl = document.getElementById('calc-grand-total');
    const grandTotalWordsEl = document.getElementById('calc-grand-total-words');

    if (subtotalEl) subtotalEl.textContent = Utils.formatCurrency(subtotal, currency);
    if (discountAmountEl) discountAmountEl.textContent = `- ${Utils.formatCurrency(discountAmount, currency)}`;
    if (taxAmountEl) taxAmountEl.textContent = Utils.formatCurrency(taxAmount, currency);
    if (grandTotalEl) grandTotalEl.textContent = Utils.formatCurrency(grandTotal, currency);
    if (grandTotalWordsEl) grandTotalWordsEl.textContent = Utils.numberToWords(grandTotal, currency);

    return {
      subtotal,
      discountType,
      discountVal,
      discountAmount,
      taxRate,
      taxAmount,
      shippingAmount: shipping,
      grandTotal,
      currency
    };
  }

  /**
   * Validate and Save Invoice
   */
  static saveInvoice(targetStatus = 'draft') {
    const invNumberInput = document.getElementById('inv-number');
    const invNumber = invNumberInput.value.trim();
    const invDate = document.getElementById('inv-date').value;
    const invDueDate = document.getElementById('inv-due-date').value;

    if (!invNumber) {
      Utils.showToast('Please provide an Invoice Number', 'error');
      invNumberInput.focus();
      return;
    }

    // Check duplicate invoice number (excluding current editing invoice)
    const allInvoices = StorageManager.getInvoices();
    const isDuplicate = allInvoices.some(inv => inv.invoiceNumber.toLowerCase() === invNumber.toLowerCase() && inv.id !== this.currentEditingId);
    if (isDuplicate) {
      Utils.showToast(`Invoice number "${invNumber}" already exists! Please use a unique number.`, 'error');
      invNumberInput.focus();
      return;
    }

    if (!invDate) {
      Utils.showToast('Please select an Invoice Date', 'error');
      return;
    }
    if (!invDueDate) {
      Utils.showToast('Please select a Due Date', 'error');
      return;
    }
    if (invDueDate < invDate) {
      Utils.showToast('Due date cannot be earlier than the invoice date', 'error');
      return;
    }

    // Customer fields
    const custName = document.getElementById('cust-name').value.trim();
    if (!custName) {
      Utils.showToast('Please enter customer/client name', 'error');
      document.getElementById('cust-name').focus();
      return;
    }

    // Line items
    const rows = document.querySelectorAll('.line-item-row');
    if (rows.length === 0) {
      Utils.showToast('Please add at least one line item', 'error');
      return;
    }

    const items = [];
    let hasInvalidItem = false;
    rows.forEach(row => {
      const desc = row.querySelector('.item-desc-input').value.trim();
      const qty = parseFloat(row.querySelector('.item-qty-input').value);
      const price = parseFloat(row.querySelector('.item-price-input').value);

      if (!desc || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
        hasInvalidItem = true;
      }
      items.push({
        id: Utils.generateId('item'),
        description: desc,
        quantity: qty,
        unitPrice: price,
        amount: qty * price
      });
    });

    if (hasInvalidItem) {
      Utils.showToast('Please fill valid descriptions, quantities (>0), and prices for all items', 'error');
      return;
    }

    const totals = this.recalculateTotals();

    // Check if user requested to save customer to directory
    const saveCustCheck = document.getElementById('cust-save-new');
    let customerId = document.getElementById('cust-select').value;

    if (saveCustCheck && saveCustCheck.checked) {
      const customers = StorageManager.getCustomers();
      // check if exists by email or name
      const existingCust = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
      if (!existingCust) {
        customerId = Utils.generateId('cust');
        customers.push({
          id: customerId,
          name: custName,
          email: document.getElementById('cust-email').value.trim(),
          phone: document.getElementById('cust-phone').value.trim(),
          address: document.getElementById('cust-address').value.trim(),
          gstin: document.getElementById('cust-gstin').value.trim(),
          createdAt: Utils.getToday()
        });
        StorageManager.saveCustomers(customers);
        Utils.showToast(`Saved "${custName}" to Customer Directory`, 'info');
      } else {
        customerId = existingCust.id;
      }
    }

    // Determine final status
    let finalStatus = targetStatus;
    if (finalStatus === 'sent' && Utils.isOverdue(invDueDate, finalStatus)) {
      finalStatus = 'overdue';
    }

    const newInvoice = {
      id: this.currentEditingId || Utils.generateId('inv'),
      invoiceNumber: invNumber,
      status: finalStatus,
      date: invDate,
      dueDate: invDueDate,
      currency: totals.currency,
      customer: {
        id: customerId || null,
        name: custName,
        email: document.getElementById('cust-email').value.trim(),
        phone: document.getElementById('cust-phone').value.trim(),
        address: document.getElementById('cust-address').value.trim(),
        gstin: document.getElementById('cust-gstin').value.trim()
      },
      business: {
        name: document.getElementById('biz-name').value.trim(),
        email: document.getElementById('biz-email').value.trim(),
        phone: document.getElementById('biz-phone').value.trim(),
        address: document.getElementById('biz-address').value.trim(),
        gstin: document.getElementById('biz-gstin').value.trim()
      },
      items,
      subtotal: totals.subtotal,
      discountType: totals.discountType,
      discountValue: totals.discountVal,
      discountAmount: totals.discountAmount,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      shippingAmount: totals.shippingAmount,
      total: totals.grandTotal,
      notes: document.getElementById('inv-notes').value.trim(),
      terms: document.getElementById('inv-terms').value.trim(),
      paymentDetails: document.getElementById('inv-payment-details').value.trim(),
      paidAt: targetStatus === 'paid' ? Utils.getToday() : null,
      updatedAt: new Date().toISOString()
    };

    if (this.currentEditingId) {
      // Update
      const index = allInvoices.findIndex(i => i.id === this.currentEditingId);
      if (index !== -1) {
        allInvoices[index] = newInvoice;
      } else {
        allInvoices.unshift(newInvoice);
      }
      StorageManager.saveInvoices(allInvoices);
      Utils.showToast(`Invoice ${newInvoice.invoiceNumber} updated successfully!`, 'success');
    } else {
      // Create new
      allInvoices.unshift(newInvoice);
      StorageManager.saveInvoices(allInvoices);
      Utils.showToast(`Invoice ${newInvoice.invoiceNumber} created successfully!`, 'success');
    }

    // Navigate to preview or history
    window.InvoicesApp.openPreview(newInvoice.id);
  }

  /**
   * Delete Invoice
   */
  static deleteInvoice(id) {
    if (!confirm('Are you sure you want to permanently delete this invoice? This action cannot be undone.')) {
      return;
    }

    const invoices = StorageManager.getInvoices();
    const filtered = invoices.filter(inv => inv.id !== id);
    StorageManager.saveInvoices(filtered);

    Utils.showToast('Invoice deleted', 'warning');
    if (this.currentEditingId === id) {
      window.InvoicesApp.navigateTo('history');
    } else {
      this.renderHistoryTable();
      DashboardView.render();
    }
  }

  /**
   * Duplicate Invoice
   */
  static duplicateInvoice(id) {
    const invoices = StorageManager.getInvoices();
    const source = invoices.find(inv => inv.id === id);
    if (!source) return;

    const newInv = JSON.parse(JSON.stringify(source));
    newInv.id = Utils.generateId('inv');
    newInv.invoiceNumber = Utils.generateInvoiceNumber(invoices);
    newInv.status = 'draft';
    newInv.date = Utils.getToday();
    newInv.dueDate = Utils.addDays(Utils.getToday(), 15);
    newInv.paidAt = null;

    invoices.unshift(newInv);
    StorageManager.saveInvoices(invoices);

    Utils.showToast(`Duplicated as new draft ${newInv.invoiceNumber}`, 'success');
    this.renderHistoryTable();
    DashboardView.render();
    this.initForm(newInv.id);
    window.InvoicesApp.navigateTo('create');
  }

  /**
   * Change Invoice Status (Paid, Sent, Draft, Overdue)
   */
  static updateInvoiceStatus(id, newStatus) {
    const invoices = StorageManager.getInvoices();
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;

    invoice.status = newStatus;
    if (newStatus === 'paid') {
      invoice.paidAt = Utils.getToday();
    } else {
      invoice.paidAt = null;
    }

    StorageManager.saveInvoices(invoices);
    Utils.showToast(`Invoice ${invoice.invoiceNumber} marked as ${newStatus.toUpperCase()}`, 'success');

    this.renderHistoryTable();
    DashboardView.render();

    // If currently previewing this invoice, re-render preview
    if (window.PreviewManager && window.PreviewManager.currentInvoiceId === id) {
      window.PreviewManager.render(id);
    }
  }

  /**
   * Render Invoice History Page
   */
  static renderHistoryTable() {
    const tableBody = document.getElementById('history-table-body');
    const emptyState = document.getElementById('history-empty-state');
    if (!tableBody) return;

    let invoices = StorageManager.getInvoices();
    const today = Utils.getToday();

    // Dynamically flag overdue
    invoices.forEach(inv => {
      if (inv.status === 'sent' && inv.dueDate && inv.dueDate < today) {
        inv.status = 'overdue';
      }
    });

    // Filtering by status
    if (this.currentFilter !== 'all') {
      invoices = invoices.filter(inv => inv.status === this.currentFilter);
    }

    // Search query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      invoices = invoices.filter(inv => 
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
        (inv.customer?.name && inv.customer.name.toLowerCase().includes(q)) ||
        (inv.customer?.email && inv.customer.email.toLowerCase().includes(q))
      );
    }

    // Sorting
    invoices.sort((a, b) => {
      if (this.sortBy === 'date-desc') return (b.date || '').localeCompare(a.date || '');
      if (this.sortBy === 'date-asc') return (a.date || '').localeCompare(b.date || '');
      if (this.sortBy === 'amount-desc') return (b.total || 0) - (a.total || 0);
      if (this.sortBy === 'amount-asc') return (a.total || 0) - (b.total || 0);
      if (this.sortBy === 'number-asc') return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
      return 0;
    });

    // Update count indicator
    const countEl = document.getElementById('history-results-count');
    if (countEl) {
      countEl.textContent = `${invoices.length} invoice${invoices.length === 1 ? '' : 's'} found`;
    }

    if (invoices.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    tableBody.innerHTML = invoices.map(inv => {
      const isPastDue = Utils.isOverdue(inv.dueDate, inv.status);
      const displayStatus = isPastDue ? 'overdue' : inv.status;
      const formattedTotal = Utils.formatCurrency(inv.total, inv.currency);

      return `
        <tr>
          <td>
            <a href="#" class="invoice-link font-mono" onclick="window.InvoicesApp.openPreview('${inv.id}'); return false;">
              <strong>${Utils.escapeHtml(inv.invoiceNumber)}</strong>
            </a>
          </td>
          <td>
            <div class="customer-cell">
              <span class="customer-name">${Utils.escapeHtml(inv.customer?.name || 'Walk-in Customer')}</span>
              <span class="customer-email">${Utils.escapeHtml(inv.customer?.email || '')}</span>
            </div>
          </td>
          <td class="cell-date">${Utils.formatDate(inv.date)}</td>
          <td class="cell-date ${isPastDue ? 'text-danger font-medium' : ''}">${Utils.formatDate(inv.dueDate)}</td>
          <td class="cell-amount"><strong>${formattedTotal}</strong></td>
          <td>${Utils.getStatusBadge(displayStatus)}</td>
          <td class="cell-actions">
            <div class="action-buttons">
              <button class="btn-icon" title="View & Print" onclick="window.InvoicesApp.openPreview('${inv.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
              <button class="btn-icon" title="Edit" onclick="window.InvoicesApp.editInvoice('${inv.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn-icon" title="Duplicate" onclick="InvoicesManager.duplicateInvoice('${inv.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
              <button class="btn-icon text-danger" title="Delete" onclick="InvoicesManager.deleteInvoice('${inv.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Export all invoices to CSV
   */
  static exportInvoicesCSV() {
    const invoices = StorageManager.getInvoices();
    if (invoices.length === 0) {
      Utils.showToast('No invoices to export', 'warning');
      return;
    }

    const headers = ['Invoice Number', 'Status', 'Date', 'Due Date', 'Customer Name', 'Customer Email', 'Currency', 'Subtotal', 'Tax Rate', 'Tax Amount', 'Total'];
    const rows = invoices.map(inv => [
      `"${inv.invoiceNumber}"`,
      `"${inv.status}"`,
      `"${inv.date}"`,
      `"${inv.dueDate}"`,
      `"${(inv.customer?.name || '').replace(/"/g, '""')}"`,
      `"${(inv.customer?.email || '').replace(/"/g, '""')}"`,
      `"${inv.currency}"`,
      inv.subtotal,
      inv.taxRate,
      inv.taxAmount,
      inv.total
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `invoicecraft_export_${Utils.getToday()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    Utils.showToast('Invoices exported to CSV successfully', 'success');
  }
}

window.InvoicesManager = InvoicesManager;
