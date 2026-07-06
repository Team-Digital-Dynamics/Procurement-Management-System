let complianceRecords = [];
let complianceUsesDemoData = false;

document.addEventListener("DOMContentLoaded", async function () {
  PMS.renderLayout(
    "compliance-reports",
    "Compliance Reports",
    "Review procurement compliance, supplier risk and policy exceptions."
  );

  await loadComplianceReportsPage();
});

async function loadComplianceReportsPage() {
  if (!PMS.hasAnyRole(["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"])) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", "You do not have permission to access compliance reports.")}
      </section>
    `);
    return;
  }

  PMS.showLoading("Loading compliance reports...");

  try {
    complianceRecords = await loadComplianceRecords();
    complianceUsesDemoData = false;
  } catch (error) {
    complianceRecords = getDemoComplianceRecords();
    complianceUsesDemoData = true;
  }

  renderComplianceReportsPage();
}

async function loadComplianceRecords() {
  const possibleEndpoints = [
    "/api/reports/compliance",
    "/api/v1/reports/compliance",
    "/api/compliance-reports",
    "/api/v1/compliance-reports",
    "/api/suppliers",
    "/api/v1/suppliers"
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await PMS.getJson(endpoint);
      const list = extractList(response);

      if (list.length > 0) {
        return list.map(normaliseComplianceRecord);
      }
    } catch (error) {
      // Try next endpoint.
    }
  }

  throw new Error("No compliance endpoint returned data.");
}

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.suppliers)) return response.suppliers;
  if (Array.isArray(response?.complianceRecords)) return response.complianceRecords;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.records)) return response.data.records;

  return [];
}

function normaliseComplianceRecord(item, index) {
  const supplierName = item.supplierName || item.name || item.companyName || "Supplier";
  const supplierStatus = item.supplierStatus || item.status || "PENDING";
  const missingDocuments = item.missingDocuments || item.documentsMissing || [];
  const hasMissingDocuments = Array.isArray(missingDocuments)
    ? missingDocuments.length > 0
    : Boolean(missingDocuments);

  const riskLevel = item.riskLevel || calculateRiskLevel(supplierStatus, hasMissingDocuments, item.discrepancy);

  return {
    id: item.id || item.supplierId || item.recordId || `CR-${index + 1}`,
    supplierName,
    supplierStatus,
    category: item.category || item.complianceCategory || "Supplier Compliance",
    issue: item.issue || item.finding || buildIssueText(supplierStatus, hasMissingDocuments, item.discrepancy),
    riskLevel,
    missingDocuments: Array.isArray(missingDocuments) ? missingDocuments.join(", ") : String(missingDocuments || "-"),
    owner: item.owner || item.responsiblePerson || "Procurement",
    dueDate: item.dueDate || item.reviewDate || item.expiryDate || null,
    status: item.complianceStatus || item.statusLabel || getComplianceStatus(riskLevel),
    createdAt: item.createdAt || item.createdDate || item.updatedAt || null
  };
}

function calculateRiskLevel(supplierStatus, hasMissingDocuments, discrepancy) {
  const status = String(supplierStatus || "").toUpperCase();

  if (status === "SUSPENDED" || discrepancy) return "HIGH";
  if (hasMissingDocuments || status === "PENDING") return "MEDIUM";
  if (status === "APPROVED" || status === "ACTIVE") return "LOW";

  return "MEDIUM";
}

function buildIssueText(supplierStatus, hasMissingDocuments, discrepancy) {
  if (discrepancy) return "GRN or procurement discrepancy requires review.";
  if (hasMissingDocuments) return "Supplier has missing compliance documents.";
  if (String(supplierStatus || "").toUpperCase() === "PENDING") return "Supplier approval is still pending.";
  if (String(supplierStatus || "").toUpperCase() === "SUSPENDED") return "Supplier is suspended and requires management review.";

  return "No major compliance issue recorded.";
}

function getComplianceStatus(riskLevel) {
  if (riskLevel === "HIGH") return "ACTION_REQUIRED";
  if (riskLevel === "MEDIUM") return "REVIEW_REQUIRED";
  return "COMPLIANT";
}

function renderComplianceReportsPage() {
  const highRiskCount = complianceRecords.filter(function (item) {
    return item.riskLevel === "HIGH";
  }).length;

  const mediumRiskCount = complianceRecords.filter(function (item) {
    return item.riskLevel === "MEDIUM";
  }).length;

  const compliantCount = complianceRecords.filter(function (item) {
    return item.status === "COMPLIANT";
  }).length;

  const actionRequiredCount = complianceRecords.filter(function (item) {
    return item.status === "ACTION_REQUIRED";
  }).length;

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Compliance Overview</h2>
          <p>Monitor supplier compliance, missing documentation, risk levels and policy exceptions.</p>
        </div>

        <div class="page-actions">
          <button id="refreshComplianceBtn" class="btn btn-soft" type="button">
            Refresh
          </button>

          <button id="exportComplianceBtn" class="btn btn-primary" type="button">
            Export CSV
          </button>
        </div>
      </div>

      ${
        complianceUsesDemoData
          ? `
            <div class="info-panel">
              No backend compliance endpoint returned data. This page is currently showing demo data so the frontend checklist item can be tested.
            </div>
          `
          : ""
      }

      <div class="grid-4">
        <article class="stat-card">
          <div class="label">Total Records</div>
          <div class="value">${complianceRecords.length}</div>
        </article>

        <article class="stat-card">
          <div class="label">High Risk</div>
          <div class="value">${highRiskCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Medium Risk</div>
          <div class="value">${mediumRiskCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Compliant</div>
          <div class="value">${compliantCount}</div>
        </article>
      </div>

      <div class="grid-3">
        <article class="stat-card">
          <div class="label">Action Required</div>
          <div class="value">${actionRequiredCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Suppliers</div>
          <div class="value">${getUniqueValues(complianceRecords, "supplierName").length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Categories</div>
          <div class="value">${getUniqueValues(complianceRecords, "category").length}</div>
        </article>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="section-header">
            <div>
              <h2>Risk Summary</h2>
              <p>Grouped view of compliance records by risk level.</p>
            </div>
          </div>

          <div id="riskSummaryTable"></div>
        </div>

        <div class="card">
          <div class="section-header">
            <div>
              <h2>Category Summary</h2>
              <p>Grouped view of compliance records by category.</p>
            </div>
          </div>

          <div id="categorySummaryTable"></div>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Compliance Records</h2>
            <p>Use the table filter to search by supplier, risk level, status, category, owner or issue.</p>
          </div>
        </div>

        <div id="complianceRecordsTable"></div>
      </div>
    </section>
  `);

  renderComplianceSummaryTables();
  renderComplianceRecordsTable();
  attachComplianceEvents();
}

function renderComplianceSummaryTables() {
  PMS.renderDataTable({
    container: "riskSummaryTable",
    title: "Risk Levels",
    rows: groupByField(complianceRecords, "riskLevel"),
    pageSize: 5,
    searchPlaceholder: "Filter risk...",
    emptyTitle: "No risk records",
    emptyText: "No compliance risk records were found.",
    columns: [
      {
        label: "Risk Level",
        key: "name",
        render: function (item) {
          return riskBadge(item.name);
        }
      },
      {
        label: "Records",
        key: "count"
      }
    ]
  });

  PMS.renderDataTable({
    container: "categorySummaryTable",
    title: "Categories",
    rows: groupByField(complianceRecords, "category"),
    pageSize: 5,
    searchPlaceholder: "Filter categories...",
    emptyTitle: "No categories",
    emptyText: "No compliance categories were found.",
    columns: [
      {
        label: "Category",
        key: "name",
        render: function (item) {
          return `<strong>${PMS.escapeHtml(item.name)}</strong>`;
        }
      },
      {
        label: "Records",
        key: "count"
      }
    ]
  });
}

function renderComplianceRecordsTable() {
  PMS.renderDataTable({
    container: "complianceRecordsTable",
    title: "Compliance Records",
    rows: complianceRecords,
    pageSize: 10,
    searchPlaceholder: "Filter compliance records...",
    emptyTitle: "No compliance records found",
    emptyText: "There are no compliance records to display yet.",
    columns: [
      {
        label: "Risk",
        key: "riskLevel",
        render: function (item) {
          return riskBadge(item.riskLevel);
        },
        searchValue: function (item) {
          return item.riskLevel;
        }
      },
      {
        label: "Supplier",
        key: "supplierName",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.supplierName)}</strong>
            <p class="muted">Supplier Status: ${PMS.escapeHtml(PMS.formatStatus(item.supplierStatus))}</p>
          `;
        },
        searchValue: function (item) {
          return `${item.supplierName} ${item.supplierStatus}`;
        }
      },
      {
        label: "Category",
        key: "category"
      },
      {
        label: "Issue",
        key: "issue",
        render: function (item) {
          return PMS.escapeHtml(item.issue);
        }
      },
      {
        label: "Missing Docs",
        key: "missingDocuments",
        render: function (item) {
          return PMS.escapeHtml(item.missingDocuments || "-");
        }
      },
      {
        label: "Owner",
        key: "owner"
      },
      {
        label: "Due / Review Date",
        key: "dueDate",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatDate(item.dueDate));
        },
        searchValue: function (item) {
          return PMS.formatDate(item.dueDate);
        }
      },
      {
        label: "Status",
        key: "status",
        render: function (item) {
          return PMS.statusBadge(item.status);
        },
        searchValue: function (item) {
          return item.status;
        }
      }
    ]
  });
}

function attachComplianceEvents() {
  const refreshBtn = document.getElementById("refreshComplianceBtn");
  const exportBtn = document.getElementById("exportComplianceBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async function () {
      PMS.showToast("info", "Refreshing compliance reports...");
      await loadComplianceReportsPage();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      exportComplianceCsv();
    });
  }
}

function groupByField(records, key) {
  const grouped = {};

  records.forEach(function (item) {
    const name = item[key] || "Unassigned";

    if (!grouped[name]) {
      grouped[name] = {
        name,
        count: 0
      };
    }

    grouped[name].count += 1;
  });

  return Object.values(grouped).sort(function (a, b) {
    return b.count - a.count;
  });
}

function riskBadge(riskLevel) {
  const value = String(riskLevel || "UNKNOWN").toUpperCase();

  if (value === "HIGH") {
    return `<span class="badge danger">High</span>`;
  }

  if (value === "MEDIUM") {
    return `<span class="badge warning">Medium</span>`;
  }

  if (value === "LOW") {
    return `<span class="badge success">Low</span>`;
  }

  return `<span class="badge">${PMS.escapeHtml(PMS.formatStatus(value))}</span>`;
}

function exportComplianceCsv() {
  if (complianceRecords.length === 0) {
    PMS.showToast("warning", "There are no compliance records to export.");
    return;
  }

  const headers = [
    "ID",
    "Supplier",
    "Supplier Status",
    "Category",
    "Issue",
    "Risk Level",
    "Missing Documents",
    "Owner",
    "Due Date",
    "Status"
  ];

  const rows = complianceRecords.map(function (item) {
    return [
      item.id,
      item.supplierName,
      item.supplierStatus,
      item.category,
      item.issue,
      item.riskLevel,
      item.missingDocuments,
      item.owner,
      PMS.formatDate(item.dueDate),
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
  link.download = `compliance-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);

  PMS.showToast("success", "Compliance report exported.");
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function getUniqueValues(records, key) {
  return Array.from(new Set(records.map(function (item) {
    return item[key];
  }).filter(Boolean))).sort();
}

function getDemoComplianceRecords() {
  return [
    {
      id: "CR-001",
      supplierName: "ABC Office Supplies",
      supplierStatus: "APPROVED",
      category: "Supplier Compliance",
      issue: "Supplier approved and active.",
      riskLevel: "LOW",
      missingDocuments: "-",
      owner: "Procurement",
      dueDate: new Date(Date.now() + 86400000 * 60).toISOString(),
      status: "COMPLIANT",
      createdAt: new Date().toISOString()
    },
    {
      id: "CR-002",
      supplierName: "TechWorld SA",
      supplierStatus: "PENDING",
      category: "Missing Documentation",
      issue: "Tax clearance certificate still outstanding.",
      riskLevel: "MEDIUM",
      missingDocuments: "Tax Clearance",
      owner: "Procurement Officer",
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
      status: "REVIEW_REQUIRED",
      createdAt: new Date().toISOString()
    },
    {
      id: "CR-003",
      supplierName: "ScanTech Supplies",
      supplierStatus: "APPROVED",
      category: "GRN Discrepancy",
      issue: "GRN discrepancy was captured against a purchase order.",
      riskLevel: "HIGH",
      missingDocuments: "-",
      owner: "Receiving Clerk",
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      status: "ACTION_REQUIRED",
      createdAt: new Date().toISOString()
    },
    {
      id: "CR-004",
      supplierName: "LogiMove",
      supplierStatus: "SUSPENDED",
      category: "Supplier Risk",
      issue: "Supplier suspended pending management review.",
      riskLevel: "HIGH",
      missingDocuments: "Updated B-BBEE Certificate, Bank Confirmation",
      owner: "Procurement Manager",
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      status: "ACTION_REQUIRED",
      createdAt: new Date().toISOString()
    },
    {
      id: "CR-005",
      supplierName: "OfficePro",
      supplierStatus: "APPROVED",
      category: "Document Expiry",
      issue: "Supplier documentation review due soon.",
      riskLevel: "MEDIUM",
      missingDocuments: "Updated Company Registration",
      owner: "Procurement",
      dueDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      status: "REVIEW_REQUIRED",
      createdAt: new Date().toISOString()
    }
  ];
}