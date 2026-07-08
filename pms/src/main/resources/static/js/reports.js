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
        const data = await loadReportsSummary();
        const breakdownRows = await loadProcurementBreakdownData();

        currentReportDetails = breakdownRows;

        // Map counts or fall back to zero arrays safely
        const reqSubmitted =
          data.requisitions?.find(r => r.status === "PENDING")?.count ||
          data.submittedRequisitions ||
          0;
        const reqApproved =
          data.requisitions?.find(r => r.status === "APPROVED")?.count ||
          data.approvedRequisitions ||
          0;
        const activePOs =
          data.purchaseOrders?.reduce((sum, po) => sum + po.count, 0) ||
          breakdownRows.length ||
          0;
        const activeSuppliersCount =
          data.topSuppliers?.length ||
          data.approvedSuppliers ||
          0;

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
            <label for="departmentId">Supplier ID</label>
            <input id="departmentId" name="departmentId" data-report-filter="departmentId" type="text" placeholder="Supplier ID">
          </div>

          <div class="form-actions" style="align-self: end;">
            <button id="applyFiltersBtn" type="submit" class="btn btn-soft">Apply Filters</button>
          </div>
        </form>

        ${reportsSummaryTable()}
      </section>
    `);

        initializeProcurementBreakdownGrid(null, breakdownRows);
        wireReportExportEvents();
        wireReportsFilterEvents();
    } catch (error) {
        PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
    }
}

async function loadReportsSummary() {
  const endpoints = ["/api/reports/summary", "/api/reports"];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const payload = await PMS.getJson(endpoint);
      return payload || {};
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to load reports summary.");
}

async function loadProcurementBreakdownData(queryParams) {
  const params = queryParams instanceof URLSearchParams ? queryParams : new URLSearchParams();
  const queryText = params.toString();
  const breakdownEndpoint = queryText
    ? "/api/v1/reports/procurement-breakdown?" + queryText
    : "/api/v1/reports/procurement-breakdown";

  try {
    const payload = await PMS.getJson(breakdownEndpoint);
    const rows = extractBreakdownRows(payload);

    if (rows.length > 0) {
      return rows;
    }
  } catch (error) {
    // Fall through to purchase-order fallback.
  }

  const purchaseOrders = await PMS.getJson("/api/purchase-orders");
  const normalized = Array.isArray(purchaseOrders)
    ? purchaseOrders.map(function (po) {
        return {
          departmentSpend: po.totalAmount,
          orderDate: po.createdAt || po.updatedAt || null,
          supplierName: po.supplierName || (po.supplierId ? "Supplier ID: " + po.supplierId : "-"),
          poNumber: po.poNumber,
          totalAmount: po.totalAmount,
          status: po.status
        };
      })
    : [];

  return applyBreakdownFilters(normalized, params);
}

function applyBreakdownFilters(rows, params) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const status = String(params.get("status") || "").trim().toUpperCase();
  const startDate = String(params.get("startDate") || "").trim();
  const endDate = String(params.get("endDate") || "").trim();
  const departmentId = String(params.get("departmentId") || "").trim().toLowerCase();

  return rows.filter(function (row) {
    if (status) {
      const rowStatus = String(row.status || row.poStatus || "").toUpperCase();
      if (rowStatus !== status) {
        return false;
      }
    }

    if (startDate || endDate) {
      const rowDateText = String(row.orderDate || row.dateIssued || row.createdAt || "").slice(0, 10);
      if (!rowDateText) {
        return false;
      }
      if (startDate && rowDateText < startDate) {
        return false;
      }
      if (endDate && rowDateText > endDate) {
        return false;
      }
    }

    if (departmentId) {
      const supplierText = String(row.supplierName || "").toLowerCase();
      if (!supplierText.includes(departmentId)) {
        return false;
      }
    }

    return true;
  });
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
    const queryParams = collectActiveReportFilters();
    const backendBlob = await tryBackendReportExport(
      ["/api/v1/reports/export/excel", "/api/reports/export/excel"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      queryParams
    );

    if (backendBlob) {
      downloadBlob(
        backendBlob,
        `procurement-summary-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      hideExportMenu();
      return;
    }

    const excelBlob = createExcelFallbackBlob();
    downloadBlob(
      excelBlob,
      `procurement-summary-${new Date().toISOString().slice(0, 10)}.xls`
    );
    hideExportMenu();

    if (typeof PMS !== "undefined" && PMS.showToast) {
      PMS.showToast("success", "Excel report downloaded.");
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

  try {
    const backendBlob = await tryBackendReportExport(
      ["/api/v1/reports/export/pdf", "/api/reports/export/pdf"],
      "application/pdf",
      queryParams
    );

    if (backendBlob) {
      downloadBlob(backendBlob, `procurement-report-${new Date().getFullYear()}.pdf`);
      hideExportMenu();
      return;
    }

    const pdfBlob = createPdfFallbackBlob();
    downloadBlob(pdfBlob, `procurement-report-${new Date().getFullYear()}.pdf`);
    hideExportMenu();

    if (typeof PMS !== "undefined" && PMS.showToast) {
      PMS.showToast("success", "PDF report downloaded.");
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
  const rows = getNormalizedReportExportRows();

    if (format === 'CSV' || format === 'EXCEL') {
    const headers = ["PO Number", "Supplier Name", "Total Amount", "Status", "Order Date"];
    const tableRows = rows.map(item => [
      item.poNumber,
      item.supplierName,
      item.totalAmount,
      item.status,
      item.orderDate
    ]);

        let csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...tableRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

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

function getNormalizedReportExportRows() {
  return (Array.isArray(currentReportDetails) ? currentReportDetails : []).map(function (item) {
    return {
      poNumber: String(item.poNumber || item.purchaseOrderNumber || "-"),
      supplierName: String(item.supplierName || item.supplier?.name || "-"),
      totalAmount: PMS.formatCurrency
        ? PMS.formatCurrency(Number(item.totalAmount ?? item.poTotal ?? item.departmentSpend ?? 0) || 0)
        : String(item.totalAmount ?? item.poTotal ?? item.departmentSpend ?? 0),
      status: String(item.status || item.poStatus || "-"),
      orderDate: formatReportDateValue(item.orderDate || item.dateIssued || item.createdAt || item.updatedAt || "-")
    };
  });
}

async function tryBackendReportExport(baseUrls, acceptMime, params) {
  const queryParams = params instanceof URLSearchParams ? params : new URLSearchParams();
  const queryText = queryParams.toString();
  const token = typeof PMS !== "undefined" && PMS.getToken ? PMS.getToken() : null;
  const headers = {
    Accept: acceptMime
  };

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  for (const baseUrl of baseUrls) {
    const requestUrl = queryText ? `${baseUrl}?${queryText}` : baseUrl;

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers
      });

      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      // Continue to fallback.
    }
  }

  return null;
}

function createExcelFallbackBlob() {
  const rows = getNormalizedReportExportRows();

  if (!rows.length) {
    throw new Error("There is no report data to export.");
  }

  const headers = ["PO Number", "Supplier Name", "Total Amount", "Status", "Order Date"];
  const headerRow = `<tr>${headers.map((value) => `<th>${escapeExportHtml(value)}</th>`).join("")}</tr>`;
  const bodyRows = rows
    .map(function (row) {
      const cells = [row.poNumber, row.supplierName, row.totalAmount, row.status, row.orderDate];
      return `<tr>${cells.map((value) => `<td>${escapeExportHtml(value)}</td>`).join("")}</tr>`;
    })
    .join("");

  const html = `
    <html>
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">${headerRow}${bodyRows}</table>
      </body>
    </html>
  `;

  return new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;"
  });
}

function createPdfFallbackBlob() {
  const rows = getNormalizedReportExportRows();

  if (!rows.length) {
    throw new Error("There is no report data to export.");
  }

  const lines = [
    "Procurement Report",
    "",
    "PO Number | Supplier | Total Amount | Status | Order Date"
  ];

  rows.forEach(function (row) {
    lines.push(`${row.poNumber} | ${row.supplierName} | ${row.totalAmount} | ${row.status} | ${row.orderDate}`);
  });

  return createSimplePdfBlob(lines);
}

function createSimplePdfBlob(lines) {
  const safeLines = lines.slice(0, 42).map(function (line) {
    return String(line || "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  });

  const contentParts = ["BT", "/F1 10 Tf", "40 800 Td"];

  safeLines.forEach(function (line, index) {
    if (index > 0) {
      contentParts.push("0 -16 Td");
    }
    contentParts.push(`(${line}) Tj`);
  });

  contentParts.push("ET");
  const streamContent = contentParts.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach(function (obj, index) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function escapeExportHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

function hideExportMenu() {
  const menu = document.getElementById("exportMenu");

  if (menu) {
    menu.style.display = "none";
  }
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

async function initializeProcurementBreakdownGrid(queryParams, preloadedRows) {
  const tableBody = document.getElementById("reportsPrimaryTableBody");
  const emptyHost = document.getElementById("reportsPrimaryTableEmpty");

  if (!tableBody || !emptyHost) {
    return;
  }

  tableBody.innerHTML = "";
  emptyHost.innerHTML = "";

  try {
    const params = queryParams instanceof URLSearchParams ? queryParams : new URLSearchParams();
    const rows = Array.isArray(preloadedRows)
      ? applyBreakdownFilters(preloadedRows, params)
      : await loadProcurementBreakdownData(params);

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

  const displayOrderDate = formatReportDateValue(orderDate);

  const cells = [
    PMS.formatCurrency ? PMS.formatCurrency(Number(departmentSpend) || 0) : String(departmentSpend ?? 0),
    displayOrderDate,
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

function formatReportDateValue(value) {
  const raw = String(value ?? "").trim();

  if (!raw || raw === "-" || raw.toLowerCase() === "null" || raw.toLowerCase() === "undefined") {
    return "-";
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  if (typeof PMS !== "undefined" && typeof PMS.formatDateTime === "function") {
    return PMS.formatDateTime(raw);
  }

  return raw;
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
