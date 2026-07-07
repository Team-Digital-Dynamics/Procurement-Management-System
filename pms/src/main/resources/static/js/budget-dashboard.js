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

function getPeriodFromDate(value) {
  if (!value) return "Unassigned";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unassigned";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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