let budgetRecords = [];

document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "budget-dashboard",
    "Budget Dashboard",
    "Track budget allocation, actual procurement spend and remaining balances."
  );

  renderBudgetDashboardPage();
});

function renderBudgetDashboardPage() {
  if (!PMS.hasAnyRole(["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"])) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", "You do not have permission to access the budget dashboard.")}
      </section>
    `);
    return;
  }

  budgetRecords = getDemoBudgetRecords().map(enrichBudgetRecord);

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Budget Dashboard</h2>
          <p>Compare department budgets against actual procurement spend.</p>
        </div>

        <div class="page-actions">
          <button id="refreshBudgetDashboardBtn" class="btn btn-soft" type="button">
            Refresh
          </button>

          <button id="exportBudgetDashboardBtn" class="btn btn-primary" type="button">
            Export CSV
          </button>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Filters</h2>
            <p>Filter the dashboard by department or period.</p>
          </div>
        </div>

        <div class="form-grid">
          <label>
            Department
            <select id="budgetDepartmentFilter">
              <option value="ALL">All Departments</option>
              ${getUniqueValues(budgetRecords, "department").map(function (department) {
                return `<option value="${PMS.escapeHtml(department)}">${PMS.escapeHtml(department)}</option>`;
              }).join("")}
            </select>
          </label>

          <label>
            Period
            <select id="budgetPeriodFilter">
              <option value="ALL">All Periods</option>
              ${getUniqueValues(budgetRecords, "period").map(function (period) {
                return `<option value="${PMS.escapeHtml(period)}">${PMS.escapeHtml(period)}</option>`;
              }).join("")}
            </select>
          </label>
        </div>
      </div>

      <div id="budgetSummaryArea"></div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Budget Records</h2>
            <p>Detailed budget records for departments and procurement categories.</p>
          </div>
        </div>

        <div id="budgetRecordsTable"></div>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Department Summary</h2>
            <p>Budget usage grouped by department.</p>
          </div>
        </div>

        <div id="budgetDepartmentTable"></div>
      </div>
    </section>
  `);

  renderBudgetDashboardData();
  attachBudgetDashboardEvents();
}

function attachBudgetDashboardEvents() {
  const departmentFilter = document.getElementById("budgetDepartmentFilter");
  const periodFilter = document.getElementById("budgetPeriodFilter");
  const refreshBtn = document.getElementById("refreshBudgetDashboardBtn");
  const exportBtn = document.getElementById("exportBudgetDashboardBtn");

  if (departmentFilter) {
    departmentFilter.addEventListener("change", renderBudgetDashboardData);
  }

  if (periodFilter) {
    periodFilter.addEventListener("change", renderBudgetDashboardData);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      PMS.showToast("info", "Refreshing budget dashboard...");
      budgetRecords = getDemoBudgetRecords().map(enrichBudgetRecord);
      renderBudgetDashboardData();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportBudgetCsv);
  }
}

function renderBudgetDashboardData() {
  const selectedDepartment = getFilterValue("budgetDepartmentFilter", "ALL");
  const selectedPeriod = getFilterValue("budgetPeriodFilter", "ALL");

  const filteredRecords = getFilteredBudgetRecords(selectedDepartment, selectedPeriod).map(enrichBudgetRecord);

  renderBudgetSummary(filteredRecords);
  renderBudgetRecordsTable(filteredRecords);
  renderBudgetDepartmentTable(filteredRecords);
}

function renderBudgetSummary(records) {
  const summaryArea = document.getElementById("budgetSummaryArea");

  if (!summaryArea) return;

  const totalBudget = records.reduce(function (sum, item) {
    return sum + Number(item.budgetAmount || 0);
  }, 0);

  const totalActual = records.reduce(function (sum, item) {
    return sum + Number(item.actualAmount || 0);
  }, 0);

  const remaining = totalBudget - totalActual;
  const usagePercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  const overBudgetCount = records.filter(function (item) {
    return item.budgetStatus === "OVER_BUDGET" || item.budgetStatus === "NO_BUDGET";
  }).length;

  summaryArea.innerHTML = `
    <div class="grid-4">
      <article class="stat-card">
        <div class="label">Total Budget</div>
        <div class="value">${PMS.formatCurrency(totalBudget)}</div>
      </article>

      <article class="stat-card">
        <div class="label">Actual Spend</div>
        <div class="value">${PMS.formatCurrency(totalActual)}</div>
      </article>

      <article class="stat-card">
        <div class="label">Remaining</div>
        <div class="value">${PMS.formatCurrency(remaining)}</div>
      </article>

      <article class="stat-card">
        <div class="label">Budget Health</div>
        <div class="value">${PMS.escapeHtml(getBudgetHealthLabel(usagePercentage, overBudgetCount))}</div>
      </article>
    </div>
  `;
}

function renderBudgetRecordsTable(records) {
  PMS.renderDataTable({
    container: "budgetRecordsTable",
    title: "Budget Records",
    rows: records,
    pageSize: 10,
    searchPlaceholder: "Filter budget records...",
    emptyTitle: "No budget records found",
    emptyText: "There are no budget records for the selected filters.",
    columns: [
      {
        label: "Department",
        key: "department"
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
        label: "Owner",
        key: "owner"
      },
      {
        label: "Budget",
        key: "budgetAmount",
        render: function (item) {
          return PMS.formatCurrency(item.budgetAmount);
        }
      },
      {
        label: "Actual Spend",
        key: "actualAmount",
        render: function (item) {
          return PMS.formatCurrency(item.actualAmount);
        }
      },
      {
        label: "Remaining",
        key: "remainingAmount",
        render: function (item) {
          return PMS.formatCurrency(item.remainingAmount);
        }
      },
      {
        label: "Usage",
        key: "usagePercentage",
        render: function (item) {
          return `${Number(item.usagePercentage || 0).toFixed(1)}%`;
        }
      },
      {
        label: "Status",
        key: "budgetStatus",
        render: function (item) {
          return budgetStatusBadge(item.budgetStatus);
        }
      }
    ]
  });
}

function renderBudgetDepartmentTable(records) {
  const groupedRecords = groupBudget(records, "department");

  PMS.renderDataTable({
    container: "budgetDepartmentTable",
    title: "Department Summary",
    rows: groupedRecords,
    pageSize: 10,
    searchPlaceholder: "Filter departments...",
    emptyTitle: "No department summary found",
    emptyText: "There is no department summary for the selected filters.",
    columns: [
      {
        label: "Department",
        key: "name"
      },
      {
        label: "Records",
        key: "count"
      },
      {
        label: "Budget",
        key: "budget",
        render: function (item) {
          return PMS.formatCurrency(item.budget);
        }
      },
      {
        label: "Actual Spend",
        key: "actual",
        render: function (item) {
          return PMS.formatCurrency(item.actual);
        }
      },
      {
        label: "Remaining",
        key: "remaining",
        render: function (item) {
          return PMS.formatCurrency(item.remaining);
        }
      },
      {
        label: "Usage",
        key: "usage",
        render: function (item) {
          return `${Number(item.usage || 0).toFixed(1)}%`;
        }
      }
    ]
  });
}

function getFilterValue(elementId, fallbackValue) {
  const element = document.getElementById(elementId);

  if (!element) return fallbackValue;

  return element.value || fallbackValue;
}

function getFilteredBudgetRecords(department, period) {
  return budgetRecords.filter(function (item) {
    const departmentMatches = department === "ALL" || item.department === department;
    const periodMatches = period === "ALL" || item.period === period;

    return departmentMatches && periodMatches;
  });
}

function groupBudget(records, key) {
  const grouped = {};

  records.forEach(function (item) {
    const name = item[key] || "Unassigned";

    if (!grouped[name]) {
      grouped[name] = {
        name,
        count: 0,
        budget: 0,
        actual: 0,
        remaining: 0,
        usage: 0
      };
    }

    grouped[name].count += 1;
    grouped[name].budget += Number(item.budgetAmount || 0);
    grouped[name].actual += Number(item.actualAmount || 0);
  });

  return Object.values(grouped)
    .map(function (item) {
      item.remaining = item.budget - item.actual;
      item.usage = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
      return item;
    })
    .sort(function (a, b) {
      return b.actual - a.actual;
    });
}

function enrichBudgetRecord(item) {
  const budgetAmount = Number(item.budgetAmount || 0);
  const actualAmount = Number(item.actualAmount || 0);
  const remainingAmount = budgetAmount - actualAmount;
  const usagePercentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

  return {
    ...item,
    budgetAmount,
    actualAmount,
    remainingAmount,
    usagePercentage,
    budgetStatus: getBudgetStatus(budgetAmount, actualAmount)
  };
}

function getBudgetStatus(budgetAmount, actualAmount) {
  if (budgetAmount <= 0 && actualAmount > 0) {
    return "NO_BUDGET";
  }

  if (actualAmount > budgetAmount) {
    return "OVER_BUDGET";
  }

  const usage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

  if (usage >= 90) {
    return "AT_RISK";
  }

  if (usage >= 70) {
    return "ON_TRACK";
  }

  return "HEALTHY";
}

function budgetStatusBadge(status) {
  const cleanStatus = status || "UNKNOWN";

  if (cleanStatus === "OVER_BUDGET" || cleanStatus === "NO_BUDGET") {
    return `<span class="badge danger">${PMS.escapeHtml(PMS.formatStatus(cleanStatus))}</span>`;
  }

  if (cleanStatus === "AT_RISK") {
    return `<span class="badge warning">${PMS.escapeHtml(PMS.formatStatus(cleanStatus))}</span>`;
  }

  if (cleanStatus === "ON_TRACK" || cleanStatus === "HEALTHY") {
    return `<span class="badge success">${PMS.escapeHtml(PMS.formatStatus(cleanStatus))}</span>`;
  }

  return `<span class="badge">${PMS.escapeHtml(PMS.formatStatus(cleanStatus))}</span>`;
}

function getBudgetHealthLabel(usagePercentage, overBudgetCount) {
  if (overBudgetCount > 0) {
    return "Risk";
  }

  if (usagePercentage >= 90) {
    return "Watch";
  }

  if (usagePercentage >= 70) {
    return "Good";
  }

  return "Healthy";
}

function getUniqueValues(records, key) {
  return Array.from(new Set(records.map(function (item) {
    return item[key];
  }).filter(Boolean))).sort();
}

function exportBudgetCsv() {
  const selectedDepartment = getFilterValue("budgetDepartmentFilter", "ALL");
  const selectedPeriod = getFilterValue("budgetPeriodFilter", "ALL");

  const records = getFilteredBudgetRecords(selectedDepartment, selectedPeriod).map(enrichBudgetRecord);

  if (records.length === 0) {
    PMS.showToast("warning", "There are no budget records to export.");
    return;
  }

  const headers = [
    "Department",
    "Category",
    "Period",
    "Budget Owner",
    "Budget Amount",
    "Actual Spend",
    "Remaining Amount",
    "Usage Percentage",
    "Status",
    "Notes"
  ];

  const rows = records.map(function (item) {
    return [
      item.department,
      item.category,
      item.period,
      item.owner,
      item.budgetAmount,
      item.actualAmount,
      item.remainingAmount,
      `${item.usagePercentage.toFixed(1)}%`,
      PMS.formatStatus(item.budgetStatus),
      item.notes
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
  link.download = `budget-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);

  PMS.showToast("success", "Budget dashboard exported.");
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function getDemoBudgetRecords() {
  return [
    {
      id: "BD-001",
      department: "Finance",
      category: "Office Equipment",
      period: "2026-07",
      budgetAmount: 30000,
      actualAmount: 18500,
      owner: "Finance Manager",
      notes: "Laptop and office equipment budget."
    },
    {
      id: "BD-002",
      department: "Procurement",
      category: "IT Hardware",
      period: "2026-07",
      budgetAmount: 50000,
      actualAmount: 42500,
      owner: "Procurement Manager",
      notes: "Hardware replacement and procurement tools."
    },
    {
      id: "BD-003",
      department: "Warehouse",
      category: "Warehouse Equipment",
      period: "2026-07",
      budgetAmount: 12000,
      actualAmount: 12900,
      owner: "Warehouse Supervisor",
      notes: "Scanner devices exceeded budget slightly."
    },
    {
      id: "BD-004",
      department: "Finance",
      category: "Stationery",
      period: "2026-06",
      budgetAmount: 10000,
      actualAmount: 7600,
      owner: "Finance Manager",
      notes: "Monthly stationery budget."
    },
    {
      id: "BD-005",
      department: "Operations",
      category: "Transport",
      period: "2026-06",
      budgetAmount: 35000,
      actualAmount: 28800,
      owner: "Operations Manager",
      notes: "Operational transport spend."
    },
    {
      id: "BD-006",
      department: "Procurement",
      category: "Supplier Services",
      period: "2026-06",
      budgetAmount: 25000,
      actualAmount: 23500,
      owner: "Procurement Manager",
      notes: "Supplier onboarding and evaluation costs."
    },
    {
      id: "BD-007",
      department: "HR",
      category: "Training",
      period: "2026-07",
      budgetAmount: 20000,
      actualAmount: 9000,
      owner: "HR Manager",
      notes: "Training and onboarding budget."
    }
  ];
}