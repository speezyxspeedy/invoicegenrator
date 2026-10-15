/**
 * InvoiceCraft - Main Application Controller & Router
 */

class InvoicesApp {
  static currentTab = 'dashboard';

  static init() {
    this.initTheme();
    this.initNavigation();
    this.initSettings();
    this.initGlobalEvents();

    // Default route
    this.navigateTo('dashboard');
  }

  /**
   * Theme Manager (Dark / Light)
   */
  static initTheme() {
    const savedTheme = StorageManager.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeToggleIcon(savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const nextTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        StorageManager.saveTheme(nextTheme);
        this.updateThemeToggleIcon(nextTheme);
        Utils.showToast(`Switched to ${nextTheme} theme`, 'info', 1500);
      });
    }
  }

  static updateThemeToggleIcon(theme) {
    const iconContainer = document.getElementById('theme-icon-container');
    if (!iconContainer) return;

    if (theme === 'dark') {
      // Show sun icon to switch to light
      iconContainer.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
    } else {
      // Show moon icon to switch to dark
      iconContainer.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `;
    }
  }

  /**
   * Router / Navigation
   */
  static initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        this.navigateTo(tab);

        // Close mobile drawer if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
          sidebar.classList.remove('mobile-open');
        }
      });
    });

    // Mobile Hamburger button
    const mobileToggle = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // Close on backdrop click
    document.addEventListener('click', (e) => {
      if (sidebar && sidebar.classList.contains('mobile-open')) {
        if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      }
    });
  }

  static navigateTo(tab) {
    this.currentTab = tab;

    // Update active state in sidebar
    document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
      if (link.getAttribute('data-tab') === tab) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Hide all view containers, show target
    document.querySelectorAll('.view-section').forEach(view => {
      view.classList.add('hidden');
    });

    const targetView = document.getElementById(`view-${tab}`);
    if (targetView) {
      targetView.classList.remove('hidden');
    }

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render tab content
    switch (tab) {
      case 'dashboard':
        DashboardView.render();
        break;
      case 'create':
        InvoicesManager.initForm(InvoicesManager.currentEditingId);
        break;
      case 'history':
        InvoicesManager.renderHistoryTable();
        break;
      case 'customers':
        CustomersManager.render();
        break;
      case 'settings':
        this.loadSettingsForm();
        break;
      case 'preview':
        // Preview is rendered with specific ID
        break;
    }
  }

  static createNewInvoice() {
    InvoicesManager.currentEditingId = null;
    this.navigateTo('create');
  }

  static editInvoice(id) {
    InvoicesManager.currentEditingId = id;
    this.navigateTo('create');
  }

  static openPreview(id) {
    this.navigateTo('preview');
    PreviewManager.render(id);
  }

  /**
   * Quick Action Menu in Tables
   */
  static openQuickActionMenu(event, invoiceId) {
    event.stopPropagation();
    const btn = event.currentTarget;
    const existingMenu = document.getElementById('quick-action-dropdown');
    if (existingMenu) existingMenu.remove();

    const invoices = StorageManager.getInvoices();
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    const menu = document.createElement('div');
    menu.id = 'quick-action-dropdown';
    menu.className = 'quick-action-dropdown';

    menu.innerHTML = `
      <div class="dropdown-item" onclick="window.InvoicesApp.openPreview('${inv.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        <span>View & Print</span>
      </div>
      <div class="dropdown-item" onclick="window.InvoicesApp.editInvoice('${inv.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        <span>Edit Details</span>
      </div>
      <div class="dropdown-item" onclick="InvoicesManager.duplicateInvoice('${inv.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span>Duplicate Invoice</span>
      </div>
      <div class="dropdown-divider"></div>
      ${inv.status !== 'paid' ? `
        <div class="dropdown-item text-success" onclick="InvoicesManager.updateInvoiceStatus('${inv.id}', 'paid')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Mark as Paid</span>
        </div>
      ` : ''}
      ${inv.status !== 'sent' ? `
        <div class="dropdown-item" onclick="InvoicesManager.updateInvoiceStatus('${inv.id}', 'sent')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          <span>Mark as Sent</span>
        </div>
      ` : ''}
      <div class="dropdown-divider"></div>
      <div class="dropdown-item text-danger" onclick="InvoicesManager.deleteInvoice('${inv.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        <span>Delete Invoice</span>
      </div>
    `;

    document.body.appendChild(menu);

    const rect = btn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 6}px`;
    menu.style.left = `${Math.min(window.innerWidth - 220, rect.right - 180)}px`;

    const closeHandler = () => {
      menu.remove();
      document.removeEventListener('click', closeHandler);
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  }

  /**
   * Settings Management
   */
  static initSettings() {
    const saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSettingsForm());
    }

    // Reset sample data
    const resetBtn = document.getElementById('btn-reset-sample-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all invoices, customers, and settings back to the default sample records? Current data will be replaced.')) {
          StorageManager.resetToSampleData();
          Utils.showToast('Sample dataset restored successfully!', 'success');
          this.navigateTo('dashboard');
        }
      });
    }

    // Clear all data
    const clearBtn = document.getElementById('btn-clear-all-data');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all invoices and customers? This will completely empty your database.')) {
          StorageManager.clearAllData();
          Utils.showToast('All invoices and customers cleared', 'warning');
          this.navigateTo('dashboard');
        }
      });
    }

    // Export Backup JSON
    const exportBtn = document.getElementById('btn-export-backup');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const json = StorageManager.exportBackup();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoicecraft_backup_${Utils.getToday()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        Utils.showToast('Backup JSON exported successfully', 'success');
      });
    }

    // Import Backup JSON
    const importInput = document.getElementById('input-import-backup');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = StorageManager.importBackup(event.target.result);
          if (res.success) {
            Utils.showToast('Backup restored successfully!', 'success');
            this.navigateTo('dashboard');
          } else {
            Utils.showToast(`Import failed: ${res.error}`, 'error');
          }
          importInput.value = '';
        };
        reader.readAsText(file);
      });
    }
  }

  static loadSettingsForm() {
    const s = StorageManager.getSettings();
    document.getElementById('setting-biz-name').value = s.businessName || '';
    document.getElementById('setting-biz-email').value = s.businessEmail || '';
    document.getElementById('setting-biz-phone').value = s.businessPhone || '';
    document.getElementById('setting-biz-address').value = s.businessAddress || '';
    document.getElementById('setting-biz-gstin').value = s.businessGstin || '';
    document.getElementById('setting-currency').value = s.defaultCurrency || 'INR';
    document.getElementById('setting-tax-rate').value = s.defaultTaxRate !== undefined ? s.defaultTaxRate : 18;
    document.getElementById('setting-terms-days').value = s.defaultPaymentTerms || '15';
    document.getElementById('setting-bank-details').value = s.bankDetails || '';
    document.getElementById('setting-default-notes').value = s.defaultNotes || '';
    document.getElementById('setting-default-terms').value = s.defaultTerms || '';
  }

  static saveSettingsForm() {
    const newSettings = {
      businessName: document.getElementById('setting-biz-name').value.trim(),
      businessEmail: document.getElementById('setting-biz-email').value.trim(),
      businessPhone: document.getElementById('setting-biz-phone').value.trim(),
      businessAddress: document.getElementById('setting-biz-address').value.trim(),
      businessGstin: document.getElementById('setting-biz-gstin').value.trim(),
      defaultCurrency: document.getElementById('setting-currency').value,
      defaultTaxRate: parseFloat(document.getElementById('setting-tax-rate').value) || 0,
      defaultPaymentTerms: document.getElementById('setting-terms-days').value,
      bankDetails: document.getElementById('setting-bank-details').value.trim(),
      defaultNotes: document.getElementById('setting-default-notes').value.trim(),
      defaultTerms: document.getElementById('setting-default-terms').value.trim()
    };

    StorageManager.saveSettings(newSettings);
    Utils.showToast('Business profile and defaults updated!', 'success');
  }

  /**
   * Bind all static UI triggers across views
   */
  static initGlobalEvents() {
    // Search in History
    const searchHistoryInput = document.getElementById('search-invoices-input');
    if (searchHistoryInput) {
      searchHistoryInput.addEventListener('input', (e) => {
        InvoicesManager.searchQuery = e.target.value.trim();
        InvoicesManager.renderHistoryTable();
      });
    }

    // Status filter buttons in History
    document.querySelectorAll('.filter-tab-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        InvoicesManager.currentFilter = btn.getAttribute('data-filter');
        InvoicesManager.renderHistoryTable();
      });
    });

    // History Sort Dropdown
    const historySortSelect = document.getElementById('history-sort-select');
    if (historySortSelect) {
      historySortSelect.addEventListener('change', (e) => {
        InvoicesManager.sortBy = e.target.value;
        InvoicesManager.renderHistoryTable();
      });
    }

    // Export CSV in History
    const exportCsvBtn = document.getElementById('btn-export-invoices-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => InvoicesManager.exportInvoicesCSV());
    }

    // Search in Customers
    const searchCustomersInput = document.getElementById('search-customers-input');
    if (searchCustomersInput) {
      searchCustomersInput.addEventListener('input', (e) => {
        CustomersManager.searchQuery = e.target.value.trim();
        CustomersManager.render();
      });
    }

    // Add Customer Modal Buttons
    const openAddCustBtn = document.getElementById('btn-open-add-customer');
    if (openAddCustBtn) {
      openAddCustBtn.addEventListener('click', () => CustomersManager.openModal());
    }
    const closeCustModalBtn = document.getElementById('btn-close-customer-modal');
    if (closeCustModalBtn) {
      closeCustModalBtn.addEventListener('click', () => CustomersManager.closeModal());
    }
    const saveCustModalBtn = document.getElementById('btn-save-customer-modal');
    if (saveCustModalBtn) {
      saveCustModalBtn.addEventListener('click', () => CustomersManager.saveCustomerFromModal());
    }

    // Invoice Form Buttons
    const addLineItemBtn = document.getElementById('btn-add-line-item');
    if (addLineItemBtn) {
      addLineItemBtn.addEventListener('click', () => InvoicesManager.addLineItem());
    }

    const custSelect = document.getElementById('cust-select');
    if (custSelect) {
      custSelect.addEventListener('change', (e) => InvoicesManager.onCustomerSelect(e.target.value));
    }

    // Currency switch in Form
    const currencySelect = document.getElementById('inv-currency');
    if (currencySelect) {
      currencySelect.addEventListener('change', () => InvoicesManager.recalculateTotals());
    }

    // Discount & Tax inputs in Form
    ['discount-type', 'discount-val', 'tax-rate', 'shipping-val'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => InvoicesManager.recalculateTotals());
        el.addEventListener('change', () => InvoicesManager.recalculateTotals());
      }
    });

    // Quick tax preset buttons (0%, 5%, 12%, 18%, 28%)
    document.querySelectorAll('.btn-tax-preset[data-tax]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rate = btn.getAttribute('data-tax');
        document.getElementById('tax-rate').value = rate;
        InvoicesManager.recalculateTotals();
        Utils.showToast(`Tax rate set to ${rate}%`, 'info', 1200);
      });
    });

    // Save buttons
    const btnSaveDraft = document.getElementById('btn-save-draft');
    if (btnSaveDraft) {
      btnSaveDraft.addEventListener('click', () => InvoicesManager.saveInvoice('draft'));
    }
    const btnSaveSent = document.getElementById('btn-save-sent');
    if (btnSaveSent) {
      btnSaveSent.addEventListener('click', () => InvoicesManager.saveInvoice('sent'));
    }
    const btnSavePaid = document.getElementById('btn-save-paid');
    if (btnSavePaid) {
      btnSavePaid.addEventListener('click', () => InvoicesManager.saveInvoice('paid'));
    }
    const btnDeleteCurrent = document.getElementById('btn-delete-current-invoice');
    if (btnDeleteCurrent) {
      btnDeleteCurrent.addEventListener('click', () => {
        if (InvoicesManager.currentEditingId) {
          InvoicesManager.deleteInvoice(InvoicesManager.currentEditingId);
        }
      });
    }

    // Preview Actions
    const btnPrint = document.getElementById('btn-preview-print');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => PreviewManager.printInvoice());
    }
    const btnPreviewPaid = document.getElementById('btn-preview-mark-paid');
    if (btnPreviewPaid) {
      btnPreviewPaid.addEventListener('click', () => {
        if (PreviewManager.currentInvoiceId) {
          InvoicesManager.updateInvoiceStatus(PreviewManager.currentInvoiceId, 'paid');
        }
      });
    }
    const btnPreviewSent = document.getElementById('btn-preview-mark-sent');
    if (btnPreviewSent) {
      btnPreviewSent.addEventListener('click', () => {
        if (PreviewManager.currentInvoiceId) {
          InvoicesManager.updateInvoiceStatus(PreviewManager.currentInvoiceId, 'sent');
        }
      });
    }
    const btnPreviewEdit = document.getElementById('btn-preview-edit');
    if (btnPreviewEdit) {
      btnPreviewEdit.addEventListener('click', () => {
        if (PreviewManager.currentInvoiceId) {
          this.editInvoice(PreviewManager.currentInvoiceId);
        }
      });
    }
    const btnPreviewJson = document.getElementById('btn-preview-json');
    if (btnPreviewJson) {
      btnPreviewJson.addEventListener('click', () => PreviewManager.downloadJson());
    }
    const btnPreviewCopy = document.getElementById('btn-preview-copy');
    if (btnPreviewCopy) {
      btnPreviewCopy.addEventListener('click', () => PreviewManager.copySummary());
    }

    // Template switcher buttons
    document.querySelectorAll('.btn-template-select[data-template]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-template-select').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        PreviewManager.setTemplate(btn.getAttribute('data-template'));
      });
    });
  }
}

window.InvoicesApp = InvoicesApp;

// Auto-boot when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  InvoicesApp.init();
});
