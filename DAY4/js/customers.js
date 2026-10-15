/**
 * InvoiceCraft - Customer Directory & Management
 */

class CustomersManager {
  static editingCustomerId = null;
  static searchQuery = '';

  static render() {
    const tableBody = document.getElementById('customers-table-body');
    const emptyState = document.getElementById('customers-empty-state');
    const countEl = document.getElementById('customers-count');
    if (!tableBody) return;

    let customers = StorageManager.getCustomers();
    const invoices = StorageManager.getInvoices();

    // Calculate customer metrics
    const statsMap = {};
    invoices.forEach(inv => {
      const custId = inv.customer?.id;
      const custName = inv.customer?.name?.toLowerCase().trim();
      const key = custId || custName;
      if (!key) return;

      if (!statsMap[key]) {
        statsMap[key] = { count: 0, totalBilled: 0, totalPaid: 0, outstanding: 0, currency: inv.currency };
      }
      const amt = Number(inv.total) || 0;
      statsMap[key].count++;
      statsMap[key].totalBilled += amt;
      if (inv.status === 'paid') {
        statsMap[key].totalPaid += amt;
      } else {
        statsMap[key].outstanding += amt;
      }
    });

    // Search filter
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q))
      );
    }

    if (countEl) {
      countEl.textContent = `${customers.length} customer${customers.length === 1 ? '' : 's'} registered`;
    }

    if (customers.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    tableBody.innerHTML = customers.map(cust => {
      const stats = statsMap[cust.id] || statsMap[cust.name.toLowerCase().trim()] || { count: 0, totalBilled: 0, totalPaid: 0, outstanding: 0, currency: 'INR' };
      const settings = StorageManager.getSettings();
      const curr = stats.currency || settings.defaultCurrency || 'INR';

      return `
        <tr>
          <td>
            <div class="customer-avatar-cell">
              <div class="customer-avatar">${this.getInitials(cust.name)}</div>
              <div>
                <strong>${Utils.escapeHtml(cust.name)}</strong>
                ${cust.gstin ? `<div class="customer-gstin-tag">GSTIN: ${Utils.escapeHtml(cust.gstin)}</div>` : ''}
              </div>
            </div>
          </td>
          <td>
            <div>${Utils.escapeHtml(cust.email || '—')}</div>
            <div class="text-muted" style="font-size: 0.8rem">${Utils.escapeHtml(cust.phone || '')}</div>
          </td>
          <td class="cell-address">
            <span class="address-snippet" title="${Utils.escapeHtml(cust.address || '')}">
              ${Utils.escapeHtml((cust.address || '—').split('\n')[0])}
            </span>
          </td>
          <td class="text-center font-mono">
            <span class="badge-count">${stats.count}</span>
          </td>
          <td class="cell-amount">
            <strong>${Utils.formatCurrency(stats.totalBilled, curr)}</strong>
            ${stats.outstanding > 0 ? `<div class="text-danger" style="font-size:0.75rem;">Due: ${Utils.formatCurrency(stats.outstanding, curr)}</div>` : '<div class="text-success" style="font-size:0.75rem;">Cleared</div>'}
          </td>
          <td class="cell-actions">
            <div class="action-buttons">
              <button class="btn-primary-xs" title="Create Invoice for this customer" onclick="CustomersManager.createInvoiceForCustomer('${cust.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Invoice</span>
              </button>
              <button class="btn-icon" title="Edit Customer" onclick="CustomersManager.openModal('${cust.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn-icon text-danger" title="Delete Customer" onclick="CustomersManager.deleteCustomer('${cust.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  static getInitials(name) {
    if (!name) return 'C';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  static openModal(customerId = null) {
    this.editingCustomerId = customerId;
    const modal = document.getElementById('customer-modal');
    const modalTitle = document.getElementById('customer-modal-title');
    if (!modal) return;

    if (customerId) {
      modalTitle.textContent = 'Edit Customer';
      const customers = StorageManager.getCustomers();
      const cust = customers.find(c => c.id === customerId);
      if (cust) {
        document.getElementById('modal-cust-name').value = cust.name || '';
        document.getElementById('modal-cust-email').value = cust.email || '';
        document.getElementById('modal-cust-phone').value = cust.phone || '';
        document.getElementById('modal-cust-address').value = cust.address || '';
        document.getElementById('modal-cust-gstin').value = cust.gstin || '';
      }
    } else {
      modalTitle.textContent = 'Add New Customer';
      document.getElementById('modal-cust-name').value = '';
      document.getElementById('modal-cust-email').value = '';
      document.getElementById('modal-cust-phone').value = '';
      document.getElementById('modal-cust-address').value = '';
      document.getElementById('modal-cust-gstin').value = '';
    }

    modal.classList.add('visible');
    document.getElementById('modal-cust-name').focus();
  }

  static closeModal() {
    const modal = document.getElementById('customer-modal');
    if (modal) modal.classList.remove('visible');
    this.editingCustomerId = null;
  }

  static saveCustomerFromModal() {
    const nameInput = document.getElementById('modal-cust-name');
    const name = nameInput.value.trim();
    if (!name) {
      Utils.showToast('Customer name is required', 'error');
      nameInput.focus();
      return;
    }

    const email = document.getElementById('modal-cust-email').value.trim();
    const phone = document.getElementById('modal-cust-phone').value.trim();
    const address = document.getElementById('modal-cust-address').value.trim();
    const gstin = document.getElementById('modal-cust-gstin').value.trim();

    const customers = StorageManager.getCustomers();

    if (this.editingCustomerId) {
      const idx = customers.findIndex(c => c.id === this.editingCustomerId);
      if (idx !== -1) {
        customers[idx] = {
          ...customers[idx],
          name,
          email,
          phone,
          address,
          gstin
        };
        Utils.showToast(`Customer "${name}" updated`, 'success');
      }
    } else {
      customers.push({
        id: Utils.generateId('cust'),
        name,
        email,
        phone,
        address,
        gstin,
        createdAt: Utils.getToday()
      });
      Utils.showToast(`Customer "${name}" added`, 'success');
    }

    StorageManager.saveCustomers(customers);
    this.closeModal();
    this.render();
  }

  static deleteCustomer(id) {
    const customers = StorageManager.getCustomers();
    const cust = customers.find(c => c.id === id);
    const name = cust ? cust.name : 'this customer';

    if (!confirm(`Are you sure you want to delete ${name}? Existing invoices will retain their customer record.`)) {
      return;
    }

    const filtered = customers.filter(c => c.id !== id);
    StorageManager.saveCustomers(filtered);
    Utils.showToast(`Customer "${name}" removed`, 'warning');
    this.render();
  }

  static createInvoiceForCustomer(customerId) {
    window.InvoicesApp.navigateTo('create');
    setTimeout(() => {
      const custSelect = document.getElementById('cust-select');
      if (custSelect) {
        custSelect.value = customerId;
        InvoicesManager.onCustomerSelect(customerId);
      }
    }, 50);
  }
}

window.CustomersManager = CustomersManager;
