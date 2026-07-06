let decisionHistoryRecords = [];
let decisionHistoryUsesDemoData = false;

document.addEventListener("DOMContentLoaded", async function () {
  PMS.renderLayout(
    "decision-history",
    "Decision History",
    "Review approval decisions, comments and decision dates."
  );

  await loadDecisionHistoryPage();
});

async function loadDecisionHistoryPage() {
  PMS.showLoading("Loading decision history...");

  try {
    decisionHistoryRecords = await loadDecisionHistoryRecords();
    decisionHistoryUsesDemoData = false;
  } catch (error) {
    decisionHistoryRecords = getDemoDecisionHistory();
    decisionHistoryUsesDemoData = true;
  }
if (!PMS.hasAnyRole(["ADMIN", "ADMINISTRATOR", "APPROVER_LEVEL_1", "APPROVER_LEVEL_2", "APPROVER_LEVEL_3"])) {
  PMS.setContent(`
    <section class="view-section">
      ${PMS.message("error", "You do not have permission to access decision history.")}
    </section>
  `);
  return;
}
  renderDecisionHistoryPage();
  
}

async function loadDecisionHistoryRecords() {
  const possibleEndpoints = [
    "/api/approvals/history",
    "/api/v1/approvals/history",
    "/api/decision-history",
    "/api/v1/decision-history",
    "/api/approval-history",
    "/api/v1/approval-history"
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await PMS.getJson(endpoint);
      const list = extractList(response);

      if (list.length > 0) {
        return list.map(normaliseDecisionHistoryRecord);
      }
    } catch (error) {
      // Try the next possible endpoint.
    }
  }

  throw new Error("No decision history endpoint returned data.");
}

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.history)) return response.history;
  if (Array.isArray(response?.approvals)) return response.approvals;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.history)) return response.data.history;

  return [];
}

function normaliseDecisionHistoryRecord(item, index) {
  const requisition = item.requisition || {};
  const requester = item.requester || requisition.requester || {};
  const approver = item.approver || {};

  return {
    id: item.id || item.approvalId || `DH-${index + 1}`,
    requisitionId: item.requisitionId || requisition.id || item.reqId || "-",
    requisitionTitle: item.requisitionTitle || item.title || requisition.title || "Requisition",
    requesterEmail: item.requesterEmail || requester.email || item.requestedBy || "-",
    approverEmail: item.approverEmail || approver.email || item.approvedBy || "-",
    approvalLevel: item.approvalLevel || item.level || "-",
    decision: item.decision || item.status || item.approvalDecision || "PENDING",
    comments: item.comments || item.reason || item.notes || "-",
    decidedAt: item.decidedAt || item.updatedAt || item.createdAt || item.createdDate || null,
    totalAmount: item.totalAmount || requisition.totalAmount || item.amount || 0
  };
}

function renderDecisionHistoryPage() {
  const approvedCount = decisionHistoryRecords.filter(function (item) {
    return item.decision === "APPROVED";
  }).length;

  const rejectedCount = decisionHistoryRecords.filter(function (item) {
    return item.decision === "REJECTED";
  }).length;

  const pendingCount = decisionHistoryRecords.filter(function (item) {
    return item.decision === "PENDING";
  }).length;

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Approval Decision History</h2>
          <p>Track who approved or rejected requisitions and review the comments linked to each decision.</p>
        </div>

        <div class="page-actions">
          <button id="refreshDecisionHistoryBtn" class="btn btn-soft" type="button">
            Refresh
          </button>

          <button id="exportDecisionHistoryBtn" class="btn btn-primary" type="button">
            Export CSV
          </button>
        </div>
      </div>

      ${
        decisionHistoryUsesDemoData
          ? PMS.message(
              "error",
              "No backend decision history endpoint was found yet. This page is currently showing demo data so the frontend checklist item can be tested."
            )
          : ""
      }

      <div class="grid-4">
        <article class="stat-card">
          <div class="label">Total Decisions</div>
          <div class="value">${decisionHistoryRecords.length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Approved</div>
          <div class="value">${approvedCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Rejected</div>
          <div class="value">${rejectedCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Pending</div>
          <div class="value">${pendingCount}</div>
        </article>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Decision Records</h2>
            <p>Use the table filter to search by requisition, requester, approver, decision or comments.</p>
          </div>
        </div>

        <div id="decisionHistoryTable"></div>
      </div>
    </section>
  `);

  renderDecisionHistoryTable();
  attachDecisionHistoryEvents();
}

function renderDecisionHistoryTable() {
  PMS.renderDataTable({
    container: "decisionHistoryTable",
    title: "Decision History",
    rows: decisionHistoryRecords,
    pageSize: 10,
    searchPlaceholder: "Filter decision history...",
    emptyTitle: "No decision history found",
    emptyText: "There are no approval decisions to display yet.",
    columns: [
      {
        label: "Decision",
        key: "decision",
        render: function (item) {
          return PMS.statusBadge(item.decision);
        },
        searchValue: function (item) {
          return item.decision;
        }
      },
      {
        label: "Requisition",
        key: "requisitionTitle",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.requisitionTitle)}</strong>
            <p class="muted">ID: ${PMS.escapeHtml(item.requisitionId)}</p>
          `;
        },
        searchValue: function (item) {
          return `${item.requisitionId} ${item.requisitionTitle}`;
        }
      },
      {
        label: "Requester",
        key: "requesterEmail",
        render: function (item) {
          return PMS.escapeHtml(item.requesterEmail);
        }
      },
      {
        label: "Approver",
        key: "approverEmail",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.approverEmail)}</strong>
            <p class="muted">Level ${PMS.escapeHtml(item.approvalLevel)}</p>
          `;
        },
        searchValue: function (item) {
          return `${item.approverEmail} ${item.approvalLevel}`;
        }
      },
      {
        label: "Amount",
        key: "totalAmount",
        render: function (item) {
          return PMS.formatCurrency(item.totalAmount);
        }
      },
      {
        label: "Decision Date",
        key: "decidedAt",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatDateTime(item.decidedAt));
        },
        searchValue: function (item) {
          return PMS.formatDateTime(item.decidedAt);
        }
      },
      {
        label: "Comments",
        key: "comments",
        render: function (item) {
          return PMS.escapeHtml(item.comments || "-");
        }
      }
    ]
  });
}

function attachDecisionHistoryEvents() {
  const refreshBtn = document.getElementById("refreshDecisionHistoryBtn");
  const exportBtn = document.getElementById("exportDecisionHistoryBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async function () {
      PMS.showToast("info", "Refreshing decision history...");
      await loadDecisionHistoryPage();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      exportDecisionHistoryCsv();
    });
  }
}

function exportDecisionHistoryCsv() {
  if (decisionHistoryRecords.length === 0) {
    PMS.showToast("warning", "There is no decision history to export.");
    return;
  }

  const headers = [
    "Decision",
    "Requisition ID",
    "Requisition Title",
    "Requester",
    "Approver",
    "Approval Level",
    "Amount",
    "Decision Date",
    "Comments"
  ];

  const rows = decisionHistoryRecords.map(function (item) {
    return [
      item.decision,
      item.requisitionId,
      item.requisitionTitle,
      item.requesterEmail,
      item.approverEmail,
      item.approvalLevel,
      item.totalAmount,
      PMS.formatDateTime(item.decidedAt),
      item.comments
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
  link.download = `decision-history-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);

  PMS.showToast("success", "Decision history exported.");
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function getDemoDecisionHistory() {
  return [
    {
      id: "DH-001",
      requisitionId: "REQ-1001",
      requisitionTitle: "Laptop replacements for Finance team",
      requesterEmail: "requester@digitaldynamics.co.za",
      approverEmail: "approver1@digitaldynamics.co.za",
      approvalLevel: 1,
      decision: "APPROVED",
      comments: "Approved. Business justification is valid.",
      decidedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      totalAmount: 18500
    },
    {
      id: "DH-002",
      requisitionId: "REQ-1002",
      requisitionTitle: "Office furniture procurement",
      requesterEmail: "requester@digitaldynamics.co.za",
      approverEmail: "approver2@digitaldynamics.co.za",
      approvalLevel: 2,
      decision: "REJECTED",
      comments: "Rejected due to missing budget confirmation.",
      decidedAt: new Date(Date.now() - 86400000).toISOString(),
      totalAmount: 42500
    },
    {
      id: "DH-003",
      requisitionId: "REQ-1003",
      requisitionTitle: "Warehouse scanner devices",
      requesterEmail: "warehouse@digitaldynamics.co.za",
      approverEmail: "approver1@digitaldynamics.co.za",
      approvalLevel: 1,
      decision: "PENDING",
      comments: "Awaiting decision.",
      decidedAt: null,
      totalAmount: 12900
    }
  ];
}