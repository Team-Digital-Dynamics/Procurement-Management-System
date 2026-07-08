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
              <a href="#" id="exportExcelBtn" style="display: block; padding: 10px 16px; text-decoration: none; color: #334155; font-size: 14px; border-bottom: 1px solid #f1f5f9;">Export as Excel</a>
              <a href="#" id="exportPdfBtn" style="display: block; padding: 10px 16px; text-decoration: none; color: #334155; font-size: 14px;">Export as PDF</a>
            </div>
          </div>
        </div>

        <form id="reportsFilterForm" class="form-grid" style="margin-top: 12px; margin-bottom: 12px;">
          <div class="form-group">
            <label for="startDate">Start Date</label>
            <input id="startDate" name="startDate" data-report-filter="startDate" type="date">
          </div>

          <div class="form-group">
            <label for="endDate">End Date</label>
            <input id="endDate" name="endDate" data-report-filter="endDate" type="date">
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" name="status" data-report-filter="status">
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="AWARDED">Awarded</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div class="form-group">
            <label for="departmentId">Department</label>
            <input id="departmentId" name="departmentId" data-report-filter="departmentId" type="text" placeholder="Department ID">
          </div>

          <div class="form-actions" style="align-self: end;">
            <button id="applyFiltersBtn" type="submit" class="btn btn-soft">Apply Filters</button>
          </div>
        </form>

        ${reportsSummaryTable()}
      </section>
    `);

        initializeProcurementBreakdownGrid();
        wireReportExportEvents();
        wireReportsFilterEvents();
    } catch (error) {
        PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
    }
}

function wireReportExportEvents() {
  const exportExcelBtn = document.getElementById("exportExcelBtn");
  const exportPdfBtn = document.getElementById("exportPdfBtn");

  if (exportExcelBtn) {
    exportExcelBtn.addEventListener("click", function (event) {
      event.preventDefault();
      downloadProcurementExcelReport();
    });
  }

  if (!exportPdfBtn) {
    return;
  }

  exportPdfBtn.addEventListener("click", function (event) {
    event.preventDefault();
    downloadProcurementPdfReport();
  });
}

async function downloadProcurementExcelReport() {
  try {
    const response = await fetch("/api/v1/reports/export/excel", {
      method: "GET",
      headers: {
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    });

    if (!response.ok) {
      throw new Error("Unable to export Excel report.");
    }

    const excelBlobRaw = await response.blob();
    const excelBlob = new Blob([excelBlobRaw], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const objectUrl = URL.createObjectURL(excelBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = objectUrl;
    downloadLink.download = "procurement-summary.xlsx";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(objectUrl);

    const menu = document.getElementById("exportMenu");
    if (menu) {
      menu.style.display = "none";
    }
  } catch (error) {
    if (typeof PMS !== "undefined" && PMS.showToast) {
      PMS.showToast("error", error.message || "Unable to export Excel report.");
      return;
    }

    alert(error.message || "Unable to export Excel report.");
  }
}

function collectActiveReportFilters() {
  const params = new URLSearchParams();

  const knownFilterIds = ["reportSearch", "statusFilter", "dateFrom", "dateTo", "supplierFilter", "departmentFilter", "startDate", "endDate", "status", "departmentId"];

  knownFilterIds.forEach(function (id) {
    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    const value = String(element.value || "").trim();

    if (value) {
      params.set(id, value);
    }
  });

  document.querySelectorAll("[data-report-filter]").forEach(function (element) {
    const key = String(element.getAttribute("data-report-filter") || "").trim();
    const value = String(element.value || "").trim();

    if (key && value) {
      params.set(key, value);
    }
  });

  return params;
}

function wireReportsFilterEvents() {
  const filterForm = document.getElementById("reportsFilterForm");

  if (!filterForm) {
    return;
  }

  filterForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const queryParams = buildReportsFilterQueryParams(filterForm);
    initializeProcurementBreakdownGrid(queryParams);
  });
}

function buildReportsFilterQueryParams(form) {
  const params = new URLSearchParams();

  const startDate = String(form.startDate?.value || "").trim();
  const endDate = String(form.endDate?.value || "").trim();
  const status = String(form.status?.value || "").trim();
  const departmentId = String(form.departmentId?.value || "").trim();

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (status) params.set("status", status);
  if (departmentId) params.set("departmentId", departmentId);

  return params;
}

async function downloadProcurementPdfReport() {
  const queryParams = collectActiveReportFilters();
  const queryText = queryParams.toString();
  const requestUrl = queryText
    ? "/api/v1/reports/export/pdf?" + queryText
    : "/api/v1/reports/export/pdf";

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/pdf"
      }
    });

    if (!response.ok) {
      throw new Error("Unable to export PDF report.");
    }

    const pdfBlob = await response.blob();
    const objectUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = objectUrl;
    downloadLink.download = `procurement-report-${new Date().getFullYear()}.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(objectUrl);

    const menu = document.getElementById("exportMenu");
    if (menu) {
      menu.style.display = "none";
    }
  } catch (error) {
    if (typeof PMS !== "undefined" && PMS.showToast) {
      PMS.showToast("error", error.message || "Unable to export PDF report.");
      return;
    }

    alert(error.message || "Unable to export PDF report.");
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

function reportsSummaryTable() {
    return `
    <div class="table-wrap" style="margin-top: 16px;">
      <table>
        <thead>
          <tr>
      <th>Department Spend</th>
      <th>Order Date</th>
            <th>Supplier Name</th>
      <th>PO Number</th>
      <th>Total Amount</th>
            <th>Status</th>
          </tr>
        </thead>
    <tbody id="reportsPrimaryTableBody"></tbody>
      </table>
    </div>
  <div id="reportsPrimaryTableEmpty" style="margin-top: 12px;"></div>
  `;
}

async function initializeProcurementBreakdownGrid(queryParams) {
  const tableBody = document.getElementById("reportsPrimaryTableBody");
  const emptyHost = document.getElementById("reportsPrimaryTableEmpty");

  if (!tableBody || !emptyHost) {
    return;
  }

  tableBody.innerHTML = "";
  emptyHost.innerHTML = "";

  try {
    const params = queryParams instanceof URLSearchParams ? queryParams : new URLSearchParams();
    const queryText = params.toString();
    const requestUrl = queryText
      ? "/api/v1/reports/procurement-breakdown?" + queryText
      : "/api/v1/reports/procurement-breakdown";

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Unable to load procurement breakdown data.");
    }

    const payload = await response.json();
    const rows = extractBreakdownRows(payload);

    currentReportDetails = rows;

    if (!rows.length) {
      emptyHost.innerHTML = PMS.emptyState("No transaction data", "No matching historical records found to summarize.");
      return;
    }

    rows.forEach(function (item) {
      tableBody.appendChild(createProcurementBreakdownRow(item));
    });
  } catch (error) {
    emptyHost.innerHTML = PMS.message("error", error.message || "Unable to load procurement breakdown data.");
  }
}

function extractBreakdownRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.breakdown)) return payload.breakdown;
  if (Array.isArray(payload?.reports)) return payload.reports;
  return [];
}

function createProcurementBreakdownRow(item) {
  const tr = document.createElement("tr");

  const departmentSpend =
    item.departmentSpend ??
    item.spendAmount ??
    item.totalAmount ??
    0;

  const orderDate =
    item.orderDate ||
    item.dateIssued ||
    item.createdAt ||
    "-";

  const supplierName =
    item.supplierName ||
    item.supplier?.name ||
    "-";

  const poNumber =
    item.poNumber ||
    item.purchaseOrderNumber ||
    "-";

  const totalAmount =
    item.totalAmount ??
    item.poTotal ??
    departmentSpend;

  const status =
    item.status ||
    item.poStatus ||
    "-";

  const cells = [
    PMS.formatCurrency ? PMS.formatCurrency(Number(departmentSpend) || 0) : String(departmentSpend ?? 0),
    PMS.formatDateTime ? PMS.formatDateTime(orderDate) : String(orderDate),
    String(supplierName),
    String(poNumber),
    PMS.formatCurrency ? PMS.formatCurrency(Number(totalAmount) || 0) : String(totalAmount ?? 0),
    String(status)
  ];

  cells.forEach(function (value) {
    const td = document.createElement("td");
    td.textContent = value;
    tr.appendChild(td);
  });

  return tr;
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
