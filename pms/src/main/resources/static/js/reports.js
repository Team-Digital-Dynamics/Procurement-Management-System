document.addEventListener("DOMContentLoaded", function () {
    const page = currentPageName();

    if (page === "reports") {
        PMS.renderLayout("reports", "Reports", "Review procurement dashboard summary data.");
        loadReports();
        return;
    }

    if (page === "audit-logs") {
        PMS.renderLayout("audit-logs", "Audit Logs", "Review system activity history.");
        loadAuditLogs();
        return;
    }

    if (page === "users") {
        PMS.renderLayout("users", "Users", "View system users and roles.");
        loadUsers();
        return;
    }

    // Handle the active view for Purchase Orders page
    PMS.renderLayout("purchase-orders", "Purchase Orders", "View purchase order status and next backend steps.");
    loadPurchaseOrdersTable();
});

function currentPageName() {
    return window.location.pathname.split("/").pop().replace(".html", "") || "reports";
}

// Global reference container to store active summary values for exports
let currentReportDetails = [];

async function loadReports() {
    PMS.showLoading("Loading reports...");

    try {
        // Fetches payload from the consolidated analytics endpoint
        const data = await PMS.getJson("/api/reports/summary");
        currentReportDetails = data.details || [];

        // Map counts or fall back to zero arrays safely
        const reqSubmitted = data.requisitions?.find(r => r.status === "PENDING")?.count || 0;
        const reqApproved = data.requisitions?.find(r => r.status === "APPROVED")?.count || 0;
        const activePOs = data.purchaseOrders?.reduce((sum, po) => sum + po.count, 0) || 0;
        const activeSuppliersCount = data.topSuppliers?.length || 0;

        PMS.setContent(`
      <section class="grid-4">
        ${statCard("Submitted Requisitions", reqSubmitted)}
        ${statCard("Approved Requisitions", reqApproved)}
        ${statCard("Active Purchase Orders", activePOs)}
        ${statCard("Tracked Active Suppliers", activeSuppliersCount)}
      </section>

      <section class="view-section" style="margin-top: 24px;">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2>Procurement Transaction Summary</h2>
            <p>Detailed breakdowns of active historical transactions within the lifecycle loop.</p>
          </div>
          
          <!-- Unified Export Management Toolset -->
          <div class="export-dropdown-container" style="position: relative; display: inline-block;">
            <button class="btn btn-primary" id="exportBtn" onclick="toggleExportMenu()" style="display: flex; align-items: center; gap: 8px;">
              <span>Export Report Data</span>
              <small>▼</small>
            </button>
            <div id="exportMenu" style="display: none; position: absolute; right: 0; top: 110%; background: #fff; min-width: 160px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px; z-index: 100; border: 1px solid #e2e8f0;">
              <a href="#" onclick="triggerDataExport('CSV'); return false;" style="display: block; padding: 10px 16px; text-decoration: none; color: #334155; font-size: 14px; border-bottom: 1px solid #f1f5f9;">Export as CSV</a>
              <a href="#" onclick="triggerDataExport('EXCEL'); return false;" style="display: block; padding: 10px 16px; text-decoration: none; color: #334155; font-size: 14px; border-bottom: 1px solid #f1f5f9;">Export as Excel</a>
              <a href="#" onclick="triggerDataExport('PDF'); return false;" style="display: block; padding: 10px 16px; text-decoration: none; color: #334155; font-size: 14px;">Export as PDF</a>
            </div>
          </div>
        </div>

        ${reportsSummaryTable(currentReportDetails)}
      </section>
    `);
    } catch (error) {
        PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
    }
}

// Toggle presentation framework view visibility container options context
function toggleExportMenu() {
    const menu = document.getElementById("exportMenu");
    if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
}

// Global click wrapper to dismiss layout dropdown cleanly
document.addEventListener("click", function (event) {
    const container = document.querySelector(".export-dropdown-container");
    const menu = document.getElementById("exportMenu");
    if (menu && container && !container.contains(event.target)) {
        menu.style.display = "none";
    }
});

// Dynamic format generator parser routing
function triggerDataExport(format) {
    if (!currentReportDetails || currentReportDetails.length === 0) {
        alert("No content records available to target for formatting conversion context.");
        return;
    }

    const filename = `procurement_summary_${new Date().toISOString().split('T')[0]}`;

    if (format === 'CSV' || format === 'EXCEL') {
        // Extract headers based on structural keys
        const headers = ["PO Number", "Supplier Name", "Total Amount", "Status", "Date Issued"];
        const rows = currentReportDetails.map(item => [
            item.poNumber,
            item.supplierName,
            item.totalAmount,
            item.poStatus,
            PMS.formatDateTime ? PMS.formatDateTime(item.dateIssued) : item.dateIssued
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.${format === 'CSV' ? 'csv' : 'xls'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (format === 'PDF') {
        // Clean text presentation fallback mapping window printing frame context
        window.print();
    }

    document.getElementById("exportMenu").style.display = "none";
}

function reportsSummaryTable(details) {
    if (!Array.isArray(details) || details.length === 0) {
        return PMS.emptyState("No transaction data", "No matching historical records found to summarize.");
    }

    return `
    <div class="table-wrap" style="margin-top: 16px;">
      <table>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Supplier Name</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Date Issued</th>
          </tr>
        </thead>
        <tbody>
          ${details.map(function (row) {
        return `
              <tr>
                <td><strong>${PMS.escapeHtml(row.poNumber)}</strong></td>
                <td>${PMS.escapeHtml(row.supplierName)}</td>
                <td>${PMS.formatCurrency ? PMS.formatCurrency(row.totalAmount) : row.totalAmount}</td>
                <td>${PMS.statusBadge ? PMS.statusBadge(row.poStatus) : row.poStatus}</td>
                <td>${PMS.formatDateTime ? PMS.formatDateTime(row.dateIssued) : row.dateIssued}</td>
              </tr>
            `;
    }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function loadAuditLogs() {
    PMS.showLoading("Loading audit logs...");

    try {
        const logs = await PMS.getJson("/api/audit-logs");

        PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Audit Log</h2>
            <p>System actions recorded by the backend audit service.</p>
          </div>
        </div>
        ${auditTable(logs)}
      </section>
    `);
    } catch (error) {
        PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
    }
}

async function loadUsers() {
    PMS.showLoading("Loading users...");

    try {
        const users = await PMS.getJson("/api/users");

        PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>User Management</h2>
            <p>Users and roles returned by the backend.</p>
          </div>
        </div>
        ${usersTable(users)}
      </section>
    `);
    } catch (error) {
        PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
    }
}

async function loadPurchaseOrdersTable() {
    PMS.showLoading("Loading purchase orders...");

    try {
        const pos = await PMS.getJson("/api/purchase-orders");

        if (!Array.isArray(pos) || pos.length === 0) {
            return loadPurchaseOrdersNotice();
        }

        PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Purchase Orders</h2>
            <p>Active purchase orders issued tracking procurement operations.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${pos.map(po => `
                <tr>
                  <td>${PMS.escapeHtml(po.poNumber)}</td>
                  <td>${PMS.escapeHtml(po.supplierName)}</td>
                  <td>${PMS.formatCurrency ? PMS.formatCurrency(po.totalAmount) : po.totalAmount}</td>
                  <td>${PMS.statusBadge ? PMS.statusBadge(po.status) : po.status}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `);
    } catch (error) {
        loadPurchaseOrdersNotice();
    }
}

function loadPurchaseOrdersNotice() {
    PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Purchase Orders</h2>
          <p>This page is ready, but the current backend ZIP does not yet expose a GET endpoint for listing purchase orders.</p>
        </div>
      </div>

      <div class="message error">
        Current available flow: the backend creates a purchase order through <strong>POST /api/awards</strong> after RFQ evaluation.
        To display purchase orders here, the backend needs a <strong>GET /api/purchase-orders</strong> endpoint.
      </div>

      <p class="muted">
        The page is intentionally kept simple and clean so it can connect to the endpoint once it is added.
      </p>
    </section>
  `);
}

function usersTable(users) {
    if (!Array.isArray(users) || users.length === 0) {
        return PMS.emptyState("No users found", "No user records were returned.");
    }

    return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Approval Limit</th>
            <th>Roles</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(function (user) {
        return `
              <tr>
                <td>${PMS.escapeHtml(user.id)}</td>
                <td>${PMS.escapeHtml(user.fullName)}</td>
                <td>${PMS.escapeHtml(user.email)}</td>
                <td>${PMS.statusBadge ? PMS.statusBadge(user.status) : user.status}</td>
                <td>${PMS.formatCurrency ? PMS.formatCurrency(user.approvalLimit) : user.approvalLimit}</td>
                <td>${PMS.escapeHtml(user.roles ? user.roles.join(', ') : '')}</td>
              </tr>
            `;
    }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function auditTable(logs) {
    if (!Array.isArray(logs) || logs.length === 0) {
        return PMS.emptyState("No audit logs found", "No audit log records were returned.");
    }

    return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Entity ID</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(function (log) {
        return `
              <tr>
                <td>${PMS.escapeHtml(log.id)}</td>
                <td>${PMS.escapeHtml(log.actor)}</td>
                <td>${PMS.escapeHtml(log.action)}</td>
                <td>${PMS.escapeHtml(log.entityType)}</td>
                <td>${PMS.escapeHtml(log.entityId || '-')}</td>
                <td>${PMS.formatDateTime ? PMS.formatDateTime(log.createdAt) : log.createdAt}</td>
              </tr>
            `;
    }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function statCard(label, value) {
    return `
    <div class="stat-card">
      <p class="label">${PMS.escapeHtml(label)}</p>
      <p class="value">${PMS.escapeHtml(value ?? 0)}</p>
    </div>
  `;
}
