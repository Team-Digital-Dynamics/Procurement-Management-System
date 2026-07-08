const reportHubItems = [
  {
    title: "Reports Summary",
    description: "View the main procurement summary totals from the backend reports endpoint.",
    href: "/reports.html",
    category: "Summary",
    roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"],
    status: "AVAILABLE"
  },
  {
    title: "Spend Reports",
    description: "Review procurement spend by department, supplier, category and period.",
    href: "/spend-reports.html",
    category: "Financial",
    roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"],
    status: "AVAILABLE"
  },
  {
    title: "Budget Dashboard",
    description: "Compare approved budgets against actual procurement spend.",
    href: "/budget-dashboard.html",
    category: "Financial",
    roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"],
    status: "AVAILABLE"
  },
  {
    title: "Compliance Reports",
    description: "Review supplier compliance, missing documentation, risk levels and policy exceptions.",
    href: "/compliance-reports.html",
    category: "Compliance",
    roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"],
    status: "AVAILABLE"
  },
  {
    title: "Audit Log Viewer",
    description: "Review system activity, backend actions and audit history.",
    href: "/audit-logs.html",
    category: "Audit",
    roles: ["ADMIN", "ADMINISTRATOR"],
    status: "AVAILABLE"
  },
  {
    title: "Decision History",
    description: "Review approval decisions, approver comments and decision dates.",
    href: "/decision-history.html",
    category: "Approvals",
    roles: ["ADMIN", "ADMINISTRATOR", "APPROVER_LEVEL_1", "APPROVER_LEVEL_2", "APPROVER_LEVEL_3"],
    status: "AVAILABLE"
  },
  {
    title: "My Quotations",
    description: "View quotations previously submitted through the supplier portal.",
    href: "/my-quotations.html",
    category: "Supplier",
    roles: ["SUPPLIER", "ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"],
    status: "AVAILABLE"
  },
  {
    title: "My Purchase Orders",
    description: "View purchase orders awarded to suppliers.",
    href: "/my-purchase-orders.html",
    category: "Supplier",
    roles: ["SUPPLIER", "ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"],
    status: "AVAILABLE"
  }
];

document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "reports-hub",
    "Reports Hub",
    "Access procurement reports, compliance views, audit records and supplier reporting."
  );

  renderReportsHubPage();
});

function renderReportsHubPage() {
  if (!PMS.hasAnyRole(["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER", "APPROVER_LEVEL_1", "APPROVER_LEVEL_2", "APPROVER_LEVEL_3", "SUPPLIER"])) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", "You do not have permission to access the reports hub.")}
      </section>
    `);
    return;
  }

  const allowedReports = reportHubItems.filter(function (item) {
    return PMS.hasAnyRole(item.roles);
  });

  const financialCount = allowedReports.filter(function (item) {
    return item.category === "Financial";
  }).length;

  const complianceCount = allowedReports.filter(function (item) {
    return item.category === "Compliance";
  }).length;

  const auditCount = allowedReports.filter(function (item) {
    return item.category === "Audit";
  }).length;

  const supplierCount = allowedReports.filter(function (item) {
    return item.category === "Supplier";
  }).length;

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Reporting Centre</h2>
          <p>Select a report area below. Only reports available to your login role are displayed.</p>
        </div>

        <div class="page-actions">
          <button id="refreshReportsHubBtn" class="btn btn-soft" type="button">
            Refresh
          </button>
        </div>
      </div>

      <div class="grid-4">
        <article class="stat-card">
          <div class="label">Available Reports</div>
          <div class="value">${allowedReports.length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Financial</div>
          <div class="value">${financialCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Compliance</div>
          <div class="value">${complianceCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Supplier / Audit</div>
          <div class="value">${supplierCount + auditCount}</div>
        </article>
      </div>

      <div class="grid-3">
        ${allowedReports.map(reportCardTemplate).join("")}
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Report Directory</h2>
            <p>Search and open reports from one central directory.</p>
            <p class="muted">Search works across report name, description, category, status and allowed roles. Example terms: summary, compliance, available, system administrator, approver level 2, supplier.</p>
          </div>
        </div>

        <div id="reportsDirectoryTable"></div>
      </div>
    </section>
  `);

  renderReportsDirectoryTable(allowedReports);
  attachReportsHubEvents();
}

function reportCardTemplate(item) {
  return `
    <article class="card">
      <div class="section-header">
        <div>
          <h2>${PMS.escapeHtml(item.title)}</h2>
          <p>${PMS.escapeHtml(item.description)}</p>
        </div>
      </div>

      <div class="info-panel">
        <p><strong>Category:</strong> ${PMS.escapeHtml(item.category)}</p>
        <p><strong>Status:</strong> ${PMS.escapeHtml(PMS.formatStatus(item.status))}</p>
      </div>

      <div class="form-actions">
        <a class="btn btn-primary" href="${PMS.escapeHtml(item.href)}">
          Open Report
        </a>
      </div>
    </article>
  `;
}

function renderReportsDirectoryTable(allowedReports) {
  PMS.renderDataTable({
    container: "reportsDirectoryTable",
    title: "Reports Directory",
    rows: allowedReports,
    pageSize: 10,
    searchPlaceholder: "Search by report, category, status, or role...",
    emptyTitle: "No reports available",
    emptyText: "No reports are available for your current role.",
    columns: [
      {
        label: "Report",
        key: "title",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.title)}</strong>
            <p class="muted">${PMS.escapeHtml(item.description)}</p>
          `;
        },
        searchValue: function (item) {
          return buildReportDirectorySearchText(item);
        }
      },
      {
        label: "Category",
        key: "category"
      },
      {
        label: "Status",
        key: "status",
        render: function (item) {
          return PMS.statusBadge(item.status);
        }
      },
      {
        label: "Allowed Roles",
        key: "roles",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatRoles(item.roles));
        },
        searchValue: function (item) {
          return `${item.roles.join(" ")} ${PMS.formatRoles(item.roles)}`;
        }
      },
      {
        label: "Action",
        key: "href",
        render: function (item) {
          return `
            <a class="btn btn-soft btn-sm" href="${PMS.escapeHtml(item.href)}">
              Open
            </a>
          `;
        },
        searchValue: function () {
          return "";
        }
      }
    ]
  });
}

function buildReportDirectorySearchText(item) {
  const safeItem = item || {};
  const status = String(safeItem.status || "");
  const formattedStatus = String(PMS.formatStatus ? PMS.formatStatus(status) : status);
  const rawRoles = Array.isArray(safeItem.roles) ? safeItem.roles.join(" ") : "";
  const formattedRoles = Array.isArray(safeItem.roles) && PMS.formatRoles
    ? PMS.formatRoles(safeItem.roles)
    : rawRoles;

  return [
    safeItem.title,
    safeItem.description,
    safeItem.category,
    status,
    formattedStatus,
    rawRoles,
    formattedRoles,
    safeItem.href
  ].join(" ");
}

function attachReportsHubEvents() {
  const refreshBtn = document.getElementById("refreshReportsHubBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      PMS.showToast("info", "Refreshing reports hub...");
      renderReportsHubPage();
    });
  }
}