let spendRecords = [];
let spendUsesDemoData = false;

document.addEventListener("DOMContentLoaded", async function () {
  PMS.renderLayout(
    "spend-reports",
    "Spend Reports",
    "Review procurement spend by department, supplier, category and period."
  );

  await loadSpendReportsPage();
});

async function loadSpendReportsPage() {
  if (!PMS.hasAnyRole(["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"])) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", "You do not have permission to access spend reports.")}
      </section>
    `);
    return;
  }

  PMS.showLoading("Loading spend reports...");

  try {
    spendRecords = await loadSpendRecords();
    spendUsesDemoData = false;
  } catch (error) {
    spendRecords = getDemoSpendRecords();
    spendUsesDemoData = true;
  }

  renderSpendReportsPage();
}

async function loadSpendRecords() {
  const possibleEndpoints = [
    "/api/reports/spend",
    "/api/v1/reports/spend",
    "/api/spend-reports",
    "/api/v1/spend-reports",
    "/api/purchase-orders",
    "/api/v1/purchase-orders"
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await PMS.getJson(endpoint);
      const list = extractList(response);

      if (list.length > 0) {
        return list.map(normaliseSpendRecord);
      }
    } catch (error) {
      // Try the next possible endpoint.
    }
  }

  throw new Error("No spend report endpoint returned data.");
}

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.purchaseOrders)) return response.purchaseOrders;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.records)) return response.data.records;

  return [];
}

function normaliseSpendRecord(item, index) {
  const supplier = item.supplier || {};
  const requisition = item.requisition || {};
  const quotation = item.quotation || {};

  return {
    id: item.id || item.purchaseOrderId || item.poId || `SP-${index + 1}`,
    poNumber: item.poNumber || item.purchaseOrderNumber || `PO-${item.id || index + 1}`,
    department: item.department || requisition.department || item.requestingDepartment || "General",
    supplierName: item.supplierName || supplier.name || quotation.supplierName || "Supplier",
    category: item.category || item.spendCategory || requisition.category || "Procurement",
    period: item.period || item.month || getPeriodFromDate(item.createdAt || item.createdDate || item.poDate),
    amount: item.totalAmount || item.amount || item.value || 0,
    status: item.status || "OPEN",
    createdAt: item.createdAt || item.createdDate || item.poDate || null
  };
}

function renderSpendReportsPage() {
  const departments = getUniqueValues(spendRecords, "department");
  const periods = getUniqueValues(spendRecords, "period");

  const selectedDepartment = getFilterValue("departmentFilter", "ALL");
  const selectedPeriod = getFilterValue("periodFilter", "ALL");

  const filteredRecords = getFilteredSpendRecords(selectedDepartment, selectedPeriod);

  const totalSpend = filteredRecords.reduce(function (sum, item) {
    return sum + Number(item.amount || 0);
  }, 0);

  const supplierCount = getUniqueValues(filteredRecords, "supplierName").length;
  const departmentCount = getUniqueValues(filteredRecords, "department").length;
  const highestRecord = getHighestSpendRecord(filteredRecords);

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Spend Overview</h2>
          <p>Analyse procurement spend by department, supplier, category and reporting period.</p>
        </div>

        <div class="page-actions">
          <button id="refreshSpendBtn" class="btn btn-soft" type="button">
            Refresh
          </button>

          <button id="exportSpendBtn" class="btn btn-primary" type="button">
            Export CSV
          </button>
        </div>
      </div>

      ${
        spendUsesDemoData
          ? `
            <div class="info-panel">
              No backend spend report endpoint was found yet. This page is currently showing demo data so the frontend checklist item can be tested.
            </div>
          `
          : ""
      }

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Report Filters</h2>
            <p>Select a department and reporting period to refine the spend report.</p>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="departmentFilter">Department</label>
            <select id="departmentFilter">
              <option value="ALL">All Departments</option>
              ${departments.map(function (department) {
                return `
                  <option value="${PMS.escapeHtml(department)}" ${department === selectedDepartment ? "selected" : ""}>
                    ${PMS.escapeHtml(department)}
                  </option>
                `;
              }).join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="periodFilter">Period</label>
            <select id="periodFilter">
              <option value="ALL">All Periods</option>
              ${periods.map(function (period) {
                return `
                  <option value="${PMS.escapeHtml(period)}" ${period === selectedPeriod ? "selected" : ""}>
                    ${PMS.escapeHtml(period)}
                  </option>
                `;
              }).join("")}
            </select>
          </div>
        </div>
      </div>

      <div class="grid-4">
        <article class="stat-card">
          <div class="label">Total Spend</div>
          <div class="value">${PMS.formatCurrency(totalSpend)}</div>
        </article>

        <article class="stat-card">
          <div class="label">Suppliers</div>
          <div class="value">${supplierCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Departments</div>
          <div class="value">${departmentCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Highest PO</div>
          <div class="value">${highestRecord ? PMS.formatCurrency(highestRecord.amount) : "-"}</div>
        </article>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="section-header">
            <div>
              <h2>Spend by Department</h2>
              <p>Summary of spend grouped by department.</p>
            </div>
          </div>

          <div id="departmentSpendTable"></div>
        </div>

        <div class="card">
          <div class="section-header">
            <div>
              <h2>Spend by Supplier</h2>
              <p>Summary of spend grouped by supplier.</p>
            </div>
          </div>

          <div id="supplierSpendTable"></div>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Spend Records</h2>
            <p>Use the table filter to search by PO number, supplier, department, category or period.</p>
          </div>
        </div>

        <div id="spendRecordsTable"></div>
      </div>
    </section>
  `);

  renderSpendSummaryTables(filteredRecords);
  renderSpendRecordsTable(filteredRecords);
  attachSpendReportEvents();
}

function renderSpendSummaryTables(records) {
  PMS.renderDataTable({
    container: "departmentSpendTable",
    title: "Department Spend",
    rows: groupSpend(records, "department"),
    pageSize: 5,
    searchPlaceholder: "Filter departments...",
    emptyTitle: "No department spend",
    emptyText: "No spend was found for the selected filters.",
    columns: [
      {
        label: "Department",
        key: "name",
        render: function (item) {
          return `<strong>${PMS.escapeHtml(item.name)}</strong>`;
        }
      },
      {
        label: "Records",
        key: "count"
      },
      {
        label: "Total Spend",
        key: "total",
        render: function (item) {
          return PMS.formatCurrency(item.total);
        }
      }
    ]
  });

  PMS.renderDataTable({
    container: "supplierSpendTable",
    title: "Supplier Spend",
    rows: groupSpend(records, "supplierName"),
    pageSize: 5,
    searchPlaceholder: "Filter suppliers...",
    emptyTitle: "No supplier spend",
    emptyText: "No spend was found for the selected filters.",
    columns: [
      {
        label: "Supplier",
        key: "name",
        render: function (item) {
          return `<strong>${PMS.escapeHtml(item.name)}</strong>`;
        }
      },
      {
        label: "Records",
        key: "count"
      },
      {
        label: "Total Spend",
        key: "total",
        render: function (item) {
          return PMS.formatCurrency(item.total);
        }
      }
    ]
  });
}

function renderSpendRecordsTable(records) {
  PMS.renderDataTable({
    container: "spendRecordsTable",
    title: "Spend Records",
    rows: records,
    pageSize: 10,
    searchPlaceholder: "Filter spend records...",
    emptyTitle: "No spend records found",
    emptyText: "No spend records match the selected filters.",
    columns: [
      {
        label: "PO Number",
        key: "poNumber",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.poNumber)}</strong>
            <p class="muted">ID: ${PMS.escapeHtml(item.id)}</p>
          `;
        },
        searchValue: function (item) {
          return `${item.poNumber} ${item.id}`;
        }
      },
      {
        label: "Department",
        key: "department"
      },
      {
        label: "Supplier",
        key: "supplierName"
      },
      {
        label: "Category",
        key: "category"
      },
      {
        label: "Period",
        key: "period"
      },
      {
        label: "Amount",
        key: "amount",
        render: function (item) {
          return PMS.formatCurrency(item.amount);
        }
      },
      {
        label: "Status",
        key: "status",
        render: function (item) {
          return PMS.statusBadge(item.status);
        }
      }
    ]
  });
}

function attachSpendReportEvents() {
  const departmentFilter = document.getElementById("departmentFilter");
  const periodFilter = document.getElementById("periodFilter");
  const refreshBtn = document.getElementById("refreshSpendBtn");
  const exportBtn = document.getElementById("exportSpendBtn");

  if (departmentFilter) {
    departmentFilter.addEventListener("change", function () {
      renderSpendReportsPage();
    });
  }

  if (periodFilter) {
    periodFilter.addEventListener("change", function () {
      renderSpendReportsPage();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async function () {
      PMS.showToast("info", "Refreshing spend reports...");
      await loadSpendReportsPage();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      exportSpendCsv();
    });
  }
}

function getFilterValue(id, defaultValue) {
  const element = document.getElementById(id);

  if (!element) return defaultValue;

  return element.value || defaultValue;
}

function getFilteredSpendRecords(department, period) {
  return spendRecords.filter(function (item) {
    const departmentMatches = department === "ALL" || item.department === department;
    const periodMatches = period === "ALL" || item.period === period;

    return departmentMatches && periodMatches;
  });
}

function groupSpend(records, key) {
  const grouped = {};

  records.forEach(function (item) {
    const name = item[key] || "Unassigned";

    if (!grouped[name]) {
      grouped[name] = {
        name,
        count: 0,
        total: 0
      };
    }

    grouped[name].count += 1;
    grouped[name].total += Number(item.amount || 0);
  });

  return Object.values(grouped).sort(function (a, b) {
    return b.total - a.total;
  });
}

function getUniqueValues(records, key) {
  return Array.from(new Set(records.map(function (item) {
    return item[key];
  }).filter(Boolean))).sort();
}

function getHighestSpendRecord(records) {
  if (records.length === 0) return null;

  return records.reduce(function (highest, item) {
    return Number(item.amount || 0) > Number(highest.amount || 0) ? item : highest;
  }, records[0]);
}

function getPeriodFromDate(value) {
  if (!value) return "Unassigned";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unassigned";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function exportSpendCsv() {
  const selectedDepartment = getFilterValue("departmentFilter", "ALL");
  const selectedPeriod = getFilterValue("periodFilter", "ALL");
  const records = getFilteredSpendRecords(selectedDepartment, selectedPeriod);

  if (records.length === 0) {
    PMS.showToast("warning", "There are no spend records to export.");
    return;
  }

  const headers = [
    "PO Number",
    "Department",
    "Supplier",
    "Category",
    "Period",
    "Amount",
    "Status"
  ];

  const rows = records.map(function (item) {
    return [
      item.poNumber,
      item.department,
      item.supplierName,
      item.category,
      item.period,
      item.amount,
      item.status
    ];
  });

  const csv = [headers, ...rows]
    .map(function (row) {
      return row.map(csvValue).join(",");
    })
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `spend-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);

  PMS.showToast("success", "Spend report exported.");
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function getDemoSpendRecords() {
  return [
    {
      id: "SP-001",
      poNumber: "PO-2026-001",
      department: "Finance",
      supplierName: "ABC Office Supplies",
      category: "Office Equipment",
      period: "2026-07",
      amount: 18500,
      status: "APPROVED",
      createdAt: "2026-07-01T08:00:00"
    },
    {
      id: "SP-002",
      poNumber: "PO-2026-002",
      department: "Procurement",
      supplierName: "TechWorld SA",
      category: "IT Hardware",
      period: "2026-07",
      amount: 42500,
      status: "RECEIVED",
      createdAt: "2026-07-02T09:30:00"
    },
    {
      id: "SP-003",
      poNumber: "PO-2026-003",
      department: "Warehouse",
      supplierName: "ScanTech Supplies",
      category: "Warehouse Equipment",
      period: "2026-07",
      amount: 12900,
      status: "OPEN",
      createdAt: "2026-07-03T11:15:00"
    },
    {
      id: "SP-004",
      poNumber: "PO-2026-004",
      department: "Finance",
      supplierName: "ABC Office Supplies",
      category: "Stationery",
      period: "2026-06",
      amount: 7600,
      status: "RECEIVED",
      createdAt: "2026-06-20T10:00:00"
    },
    {
      id: "SP-005",
      poNumber: "PO-2026-005",
      department: "Operations",
      supplierName: "LogiMove",
      category: "Transport",
      period: "2026-06",
      amount: 28800,
      status: "APPROVED",
      createdAt: "2026-06-18T14:20:00"
    }
  ];
}