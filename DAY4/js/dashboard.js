/**
 * InvoiceCraft - Dashboard Metrics, SVG Charts & Visuals
 */

class DashboardView {
  static render() {
    const invoices = StorageManager.getInvoices();
    const metrics = this.calculateMetrics(invoices);

    this.renderKPIs(metrics);
    this.renderMonthlyChart(invoices);
    this.renderStatusBreakdown(metrics);
    this.renderRecentInvoices(invoices);
  }

  static calculateMetrics(invoices) {
    const today = Utils.getToday();
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let sentCount = 0;
    let draftCount = 0;

    // Use default currency for primary metrics display (fallback INR)
    const settings = StorageManager.getSettings();
    const primaryCurrency = settings.defaultCurrency || 'INR';

    invoices.forEach(inv => {
      const amount = Number(inv.total) || 0;
      totalInvoiced += amount;

      // Auto update status if past due and still 'sent'
      let status = inv.status || 'draft';
      if (status === 'sent' && inv.dueDate && inv.dueDate < today) {
        status = 'overdue';
      }

      if (status === 'paid') {
        totalPaid += amount;
        paidCount++;
      } else if (status === 'overdue') {
        totalOverdue += amount;
        totalOutstanding += amount;
        overdueCount++;
      } else if (status === 'sent') {
        totalOutstanding += amount;
        sentCount++;
      } else if (status === 'draft') {
        draftCount++;
      }
    });

    return {
      totalCount: invoices.length,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalOverdue,
      overdueCount,
      paidCount,
      sentCount,
      draftCount,
      currency: primaryCurrency
    };
  }

  static renderKPIs(metrics) {
    const kpiContainer = document.getElementById('dashboard-kpis');
    if (!kpiContainer) return;

    const curr = metrics.currency;
    const paidPercent = metrics.totalInvoiced > 0 ? Math.round((metrics.totalPaid / metrics.totalInvoiced) * 100) : 0;
    const outstandingPercent = metrics.totalInvoiced > 0 ? Math.round((metrics.totalOutstanding / metrics.totalInvoiced) * 100) : 0;

    kpiContainer.innerHTML = `
      <!-- Total Invoiced -->
      <div class="kpi-card" data-card="total">
        <div class="kpi-header">
          <span class="kpi-title">Total Invoiced</span>
          <div class="kpi-icon-wrapper icon-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">${Utils.formatCurrency(metrics.totalInvoiced, curr)}</div>
          <div class="kpi-meta">
            <span class="meta-badge meta-neutral">${metrics.totalCount} Invoices Total</span>
            <span class="meta-sub">Lifetime volume</span>
          </div>
        </div>
      </div>

      <!-- Paid Amount -->
      <div class="kpi-card" data-card="paid">
        <div class="kpi-header">
          <span class="kpi-title">Received (Paid)</span>
          <div class="kpi-icon-wrapper icon-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">${Utils.formatCurrency(metrics.totalPaid, curr)}</div>
          <div class="kpi-meta">
            <span class="meta-badge meta-success">${paidPercent}% Collected</span>
            <span class="meta-sub">${metrics.paidCount} cleared invoices</span>
          </div>
        </div>
      </div>

      <!-- Outstanding Amount -->
      <div class="kpi-card" data-card="outstanding">
        <div class="kpi-header">
          <span class="kpi-title">Outstanding</span>
          <div class="kpi-icon-wrapper icon-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">${Utils.formatCurrency(metrics.totalOutstanding, curr)}</div>
          <div class="kpi-meta">
            <span class="meta-badge meta-warning">${outstandingPercent}% Pending</span>
            <span class="meta-sub">${metrics.sentCount + metrics.overdueCount} invoices pending</span>
          </div>
        </div>
      </div>

      <!-- Overdue Invoices -->
      <div class="kpi-card" data-card="overdue">
        <div class="kpi-header">
          <span class="kpi-title">Overdue</span>
          <div class="kpi-icon-wrapper icon-danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
        </div>
        <div class="kpi-body">
          <div class="kpi-value ${metrics.totalOverdue > 0 ? 'text-danger' : ''}">${Utils.formatCurrency(metrics.totalOverdue, curr)}</div>
          <div class="kpi-meta">
            <span class="meta-badge ${metrics.overdueCount > 0 ? 'meta-danger' : 'meta-neutral'}">${metrics.overdueCount} Past Due</span>
            <span class="meta-sub">Requires follow-up</span>
          </div>
        </div>
      </div>
    `;
  }

  static renderMonthlyChart(invoices) {
    const chartContainer = document.getElementById('monthly-chart-container');
    if (!chartContainer) return;

    // Build last 6 months list
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
        total: 0,
        paid: 0,
        count: 0
      });
    }

    invoices.forEach(inv => {
      if (!inv.date) return;
      const key = inv.date.substring(0, 7);
      const monthObj = months.find(m => m.key === key);
      if (monthObj) {
        const amt = Number(inv.total) || 0;
        monthObj.total += amt;
        if (inv.status === 'paid') {
          monthObj.paid += amt;
        }
        monthObj.count++;
      }
    });

    const maxAmount = Math.max(...months.map(m => m.total), 50000);
    const settings = StorageManager.getSettings();
    const curr = settings.defaultCurrency || 'INR';

    // Generate responsive SVG chart with interactive bars and gradients
    let barsHtml = '';
    const chartHeight = 180;
    const chartWidth = 560;
    const barWidth = 44;
    const gap = (chartWidth - (barWidth * months.length)) / (months.length + 1);

    months.forEach((m, idx) => {
      const x = gap + idx * (barWidth + gap);
      const totalBarHeight = maxAmount > 0 ? Math.max(8, (m.total / maxAmount) * (chartHeight - 40)) : 8;
      const paidBarHeight = maxAmount > 0 && m.total > 0 ? Math.max(4, (m.paid / maxAmount) * (chartHeight - 40)) : 0;
      const y = chartHeight - 24 - totalBarHeight;
      const paidY = chartHeight - 24 - paidBarHeight;

      barsHtml += `
        <g class="chart-bar-group" data-month="${m.label}" data-total="${Utils.formatCurrency(m.total, curr)}" data-paid="${Utils.formatCurrency(m.paid, curr)}" data-count="${m.count}">
          <!-- Background track -->
          <rect x="${x}" y="10" width="${barWidth}" height="${chartHeight - 34}" rx="6" class="chart-track"></rect>
          <!-- Total Bar -->
          <rect x="${x}" y="${y}" width="${barWidth}" height="${totalBarHeight}" rx="6" class="chart-bar-total"></rect>
          <!-- Paid Overlay Bar -->
          ${paidBarHeight > 0 ? `<rect x="${x + 2}" y="${paidY}" width="${barWidth - 4}" height="${paidBarHeight}" rx="4" class="chart-bar-paid"></rect>` : ''}
          <!-- X Axis Label -->
          <text x="${x + barWidth / 2}" y="${chartHeight - 6}" text-anchor="middle" class="chart-label">${m.label}</text>
        </g>
      `;
    });

    chartContainer.innerHTML = `
      <div class="chart-header">
        <div>
          <h3 class="chart-title">Revenue & Invoicing Trend</h3>
          <p class="chart-subtitle">Monthly breakdown for the past 6 billing cycles</p>
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot dot-total"></span> Total Invoiced</span>
          <span class="legend-item"><span class="legend-dot dot-paid"></span> Paid</span>
        </div>
      </div>
      <div class="chart-wrapper">
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="none" class="chart-svg">
          <defs>
            <linearGradient id="totalBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6366f1" />
              <stop offset="100%" stop-color="#4338ca" />
            </linearGradient>
            <linearGradient id="paidBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" />
              <stop offset="100%" stop-color="#059669" />
            </linearGradient>
          </defs>
          <!-- Grid lines -->
          <line x1="10" y1="30" x2="${chartWidth - 10}" y2="30" class="chart-grid"></line>
          <line x1="10" y1="${chartHeight / 2}" x2="${chartWidth - 10}" y2="${chartHeight / 2}" class="chart-grid"></line>
          <line x1="10" y1="${chartHeight - 24}" x2="${chartWidth - 10}" y2="${chartHeight - 24}" class="chart-baseline"></line>
          ${barsHtml}
        </svg>
        <div id="chart-tooltip" class="chart-tooltip"></div>
      </div>
    `;

    // Tooltip interactivity
    const tooltip = document.getElementById('chart-tooltip');
    const barGroups = chartContainer.querySelectorAll('.chart-bar-group');

    barGroups.forEach(group => {
      group.addEventListener('mouseenter', (e) => {
        const month = group.getAttribute('data-month');
        const total = group.getAttribute('data-total');
        const paid = group.getAttribute('data-paid');
        const count = group.getAttribute('data-count');

        tooltip.innerHTML = `
          <strong>${month}</strong>
          <div>Total: <span>${total}</span></div>
          <div>Paid: <span style="color:var(--success)">${paid}</span></div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${count} invoice(s)</div>
        `;
        tooltip.classList.add('visible');
      });

      group.addEventListener('mousemove', (e) => {
        const containerRect = chartContainer.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        tooltip.style.left = `${mouseX + 12}px`;
        tooltip.style.top = `${mouseY - 30}px`;
      });

      group.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
      });
    });
  }

  static renderStatusBreakdown(metrics) {
    const container = document.getElementById('status-breakdown-container');
    if (!container) return;

    const total = metrics.totalCount || 1;
    const paidPct = Math.round((metrics.paidCount / total) * 100);
    const sentPct = Math.round((metrics.sentCount / total) * 100);
    const overduePct = Math.round((metrics.overdueCount / total) * 100);
    const draftPct = Math.round((metrics.draftCount / total) * 100);

    container.innerHTML = `
      <div class="breakdown-card">
        <h3 class="breakdown-title">Invoice Health & Status</h3>
        <p class="breakdown-subtitle">${metrics.totalCount} total generated documents</p>

        <!-- Segmented Progress Bar -->
        <div class="progress-stacked">
          <div class="progress-segment seg-paid" style="width: ${paidPct}%" title="Paid: ${metrics.paidCount}"></div>
          <div class="progress-segment seg-sent" style="width: ${sentPct}%" title="Sent: ${metrics.sentCount}"></div>
          <div class="progress-segment seg-overdue" style="width: ${overduePct}%" title="Overdue: ${metrics.overdueCount}"></div>
          <div class="progress-segment seg-draft" style="width: ${draftPct}%" title="Draft: ${metrics.draftCount}"></div>
        </div>

        <!-- Detailed Stat Rows -->
        <div class="breakdown-list">
          <div class="breakdown-item">
            <div class="item-left">
              <span class="status-indicator ind-paid"></span>
              <span class="item-name">Paid</span>
            </div>
            <div class="item-right">
              <span class="item-count">${metrics.paidCount}</span>
              <span class="item-pct">(${paidPct}%)</span>
            </div>
          </div>
          <div class="breakdown-item">
            <div class="item-left">
              <span class="status-indicator ind-sent"></span>
              <span class="item-name">Sent & Pending</span>
            </div>
            <div class="item-right">
              <span class="item-count">${metrics.sentCount}</span>
              <span class="item-pct">(${sentPct}%)</span>
            </div>
          </div>
          <div class="breakdown-item">
            <div class="item-left">
              <span class="status-indicator ind-overdue"></span>
              <span class="item-name">Overdue</span>
            </div>
            <div class="item-right">
              <span class="item-count ${metrics.overdueCount > 0 ? 'text-danger font-bold' : ''}">${metrics.overdueCount}</span>
              <span class="item-pct">(${overduePct}%)</span>
            </div>
          </div>
          <div class="breakdown-item">
            <div class="item-left">
              <span class="status-indicator ind-draft"></span>
              <span class="item-name">Draft</span>
            </div>
            <div class="item-right">
              <span class="item-count">${metrics.draftCount}</span>
              <span class="item-pct">(${draftPct}%)</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static renderRecentInvoices(invoices) {
    const tableBody = document.getElementById('recent-invoices-body');
    const emptyState = document.getElementById('recent-empty-state');
    if (!tableBody) return;

    if (!invoices || invoices.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Sort by date descending, grab top 5
    const recent = [...invoices].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

    tableBody.innerHTML = recent.map(inv => {
      const isPastDue = Utils.isOverdue(inv.dueDate, inv.status);
      const displayStatus = isPastDue ? 'overdue' : inv.status;
      const formattedTotal = Utils.formatCurrency(inv.total, inv.currency);

      return `
        <tr>
          <td>
            <a href="#" class="invoice-link" onclick="window.InvoicesApp.openPreview('${inv.id}'); return false;">
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
              <button class="btn-icon" title="View / Print" onclick="window.InvoicesApp.openPreview('${inv.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
              <button class="btn-icon" title="Edit Invoice" onclick="window.InvoicesApp.editInvoice('${inv.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn-icon" title="Quick Actions" onclick="window.InvoicesApp.openQuickActionMenu(event, '${inv.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
}

window.DashboardView = DashboardView;
