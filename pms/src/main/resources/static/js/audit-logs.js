let auditLogRecords = [];
let auditLogsUseDemoData = false;

document.addEventListener("DOMContentLoaded", async function () {
  PMS.renderLayout(
    "audit-logs",
    "Audit Logs",
    "Review system activity, user actions and procurement audit records."
  );

  await loadAuditLogsPage();
});

async function loadAuditLogsPage() {
  if (!PMS.hasAnyRole(["ADMIN", "ADMINISTRATOR"])) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", "You do not have permission to access the audit log viewer.")}
      </section>
    `);
    return;
  }

  PMS.showLoading("Loading audit logs...");

  try {
    auditLogRecords = await loadAuditLogRecords();
    auditLogsUseDemoData = false;
  } catch (error) {
    auditLogRecords = getDemoAuditLogs();
    auditLogsUseDemoData = true;
  }

  renderAuditLogsPage();
}

async function loadAuditLogRecords() {
  const possibleEndpoints = [
    "/api/audit-logs",
    "/api/v1/audit-logs",
    "/api/audit",
    "/api/v1/audit"
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await PMS.getJson(endpoint);
      const list = extractList(response);

      if (list.length > 0) {
        return list.map(normaliseAuditLogRecord);
      }
    } catch (error) {
      // Try next endpoint.
    }
  }

  throw new Error("No audit log endpoint returned data.");
}

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.logs)) return response.logs;
  if (Array.isArray(response?.auditLogs)) return response.auditLogs;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.logs)) return response.data.logs;
  if (Array.isArray(response?.data?.records)) return response.data.records;

  return [];
}

function normaliseAuditLogRecord(item, index) {
  return {
    id: item.id || item.auditLogId || `AL-${index + 1}`,
    actor: item.actor || item.username || item.userEmail || item.performedBy || "-",
    action: item.action || item.eventType || item.activity || "SYSTEM_ACTION",
    entityType: item.entityType || item.module || item.resourceType || "-",
    entityId: item.entityId || item.resourceId || item.recordId || "-",
    details: item.details || item.description || item.message || "-",
    createdAt: item.createdAt || item.createdDate || item.timestamp || item.date || null,
    ipAddress: item.ipAddress || item.ip || "-",
    status: item.status || "RECORDED"
  };
}

function renderAuditLogsPage() {
  const todayCount = auditLogRecords.filter(function (item) {
    return isToday(item.createdAt);
  }).length;

  const uniqueActors = getUniqueValues(auditLogRecords, "actor").length;
  const uniqueActions = getUniqueValues(auditLogRecords, "action").length;
  const latestLog = auditLogRecords.length ? auditLogRecords[0] : null;

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>System Audit Log Viewer</h2>
          <p>Track important backend actions including supplier, requisition, approval, RFQ, quotation and purchase order activity.</p>
        </div>

        <div class="page-actions">
          <button id="refreshAuditLogsBtn" class="btn btn-soft" type="button">
            Refresh
          </button>

          <button id="exportAuditLogsBtn" class="btn btn-primary" type="button">
            Export CSV
          </button>
        </div>
      </div>

      ${
        auditLogsUseDemoData
          ? `
            <div class="info-panel">
              No backend audit log endpoint returned data. This page is currently showing demo data so the frontend checklist item can be tested.
            </div>
          `
          : ""
      }

      <div class="grid-4">
        <article class="stat-card">
          <div class="label">Total Logs</div>
          <div class="value">${auditLogRecords.length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Today</div>
          <div class="value">${todayCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Users / Actors</div>
          <div class="value">${uniqueActors}</div>
        </article>

        <article class="stat-card">
          <div class="label">Action Types</div>
          <div class="value">${uniqueActions}</div>
        </article>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="section-header">
            <div>
              <h2>Action Summary</h2>
              <p>Grouped view of audit actions recorded by the system.</p>
            </div>
          </div>

          <div id="auditActionSummaryTable"></div>
        </div>

        <div class="card">
          <div class="section-header">
            <div>
              <h2>Latest Activity</h2>
              <p>Most recent audit log record.</p>
            </div>
          </div>

          ${
            latestLog
              ? latestAuditTemplate(latestLog)
              : PMS.emptyState("No activity", "No audit activity has been recorded yet.")
          }
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Audit Log Records</h2>
            <p>Use the table filter to search by actor, action, entity, record ID, date or details.</p>
          </div>
        </div>

        <div id="auditLogsTable"></div>
      </div>
    </section>
  `);

  renderAuditActionSummaryTable();
  renderAuditLogsTable();
  attachAuditLogEvents();
}

function renderAuditActionSummaryTable() {
  PMS.renderDataTable({
    container: "auditActionSummaryTable",
    title: "Actions",
    rows: groupAuditActions(auditLogRecords),
    pageSize: 5,
    searchPlaceholder: "Filter actions...",
    emptyTitle: "No actions found",
    emptyText: "No audit action records are available.",
    columns: [
      {
        label: "Action",
        key: "action",
        render: function (item) {
          return `<strong>${PMS.escapeHtml(PMS.formatStatus(item.action))}</strong>`;
        },
        searchValue: function (item) {
          return item.action;
        }
      },
      {
        label: "Count",
        key: "count"
      },
      {
        label: "Latest",
        key: "latest",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatDateTime(item.latest));
        },
        searchValue: function (item) {
          return PMS.formatDateTime(item.latest);
        }
      }
    ]
  });
}

function renderAuditLogsTable() {
  PMS.renderDataTable({
    container: "auditLogsTable",
    title: "Audit Logs",
    rows: auditLogRecords,
    pageSize: 10,
    searchPlaceholder: "Filter audit logs...",
    emptyTitle: "No audit logs found",
    emptyText: "There are no audit log records to display yet.",
    columns: [
      {
        label: "Date",
        key: "createdAt",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatDateTime(item.createdAt));
        },
        searchValue: function (item) {
          return PMS.formatDateTime(item.createdAt);
        }
      },
      {
        label: "Actor",
        key: "actor",
        render: function (item) {
          return `<strong>${PMS.escapeHtml(item.actor)}</strong>`;
        }
      },
      {
        label: "Action",
        key: "action",
        render: function (item) {
          return PMS.statusBadge(item.action);
        },
        searchValue: function (item) {
          return item.action;
        }
      },
      {
        label: "Entity",
        key: "entityType",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.entityType)}</strong>
            <p class="muted">ID: ${PMS.escapeHtml(item.entityId)}</p>
          `;
        },
        searchValue: function (item) {
          return `${item.entityType} ${item.entityId}`;
        }
      },
      {
        label: "Details",
        key: "details",
        render: function (item) {
          return PMS.escapeHtml(item.details || "-");
        }
      },
      {
        label: "IP Address",
        key: "ipAddress",
        render: function (item) {
          return PMS.escapeHtml(item.ipAddress || "-");
        }
      }
    ]
  });
}

function attachAuditLogEvents() {
  const refreshBtn = document.getElementById("refreshAuditLogsBtn");
  const exportBtn = document.getElementById("exportAuditLogsBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async function () {
      PMS.showToast("info", "Refreshing audit logs...");
      await loadAuditLogsPage();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      exportAuditLogsCsv();
    });
  }
}

function latestAuditTemplate(log) {
  return `
    <div class="info-panel">
      <p><strong>Actor:</strong> ${PMS.escapeHtml(log.actor)}</p>
      <p><strong>Action:</strong> ${PMS.escapeHtml(PMS.formatStatus(log.action))}</p>
      <p><strong>Entity:</strong> ${PMS.escapeHtml(log.entityType)} ${PMS.escapeHtml(log.entityId)}</p>
      <p><strong>Date:</strong> ${PMS.escapeHtml(PMS.formatDateTime(log.createdAt))}</p>
      <p><strong>Details:</strong> ${PMS.escapeHtml(log.details || "-")}</p>
    </div>
  `;
}

function groupAuditActions(records) {
  const grouped = {};

  records.forEach(function (item) {
    const action = item.action || "SYSTEM_ACTION";

    if (!grouped[action]) {
      grouped[action] = {
        action,
        count: 0,
        latest: item.createdAt
      };
    }

    grouped[action].count += 1;

    if (new Date(item.createdAt) > new Date(grouped[action].latest)) {
      grouped[action].latest = item.createdAt;
    }
  });

  return Object.values(grouped).sort(function (a, b) {
    return b.count - a.count;
  });
}

function exportAuditLogsCsv() {
  if (auditLogRecords.length === 0) {
    PMS.showToast("warning", "There are no audit logs to export.");
    return;
  }

  const headers = [
    "ID",
    "Date",
    "Actor",
    "Action",
    "Entity Type",
    "Entity ID",
    "Details",
    "IP Address",
    "Status"
  ];

  const rows = auditLogRecords.map(function (item) {
    return [
      item.id,
      PMS.formatDateTime(item.createdAt),
      item.actor,
      item.action,
      item.entityType,
      item.entityId,
      item.details,
      item.ipAddress,
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
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);

  PMS.showToast("success", "Audit logs exported.");
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

function isToday(value) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();

  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function getDemoAuditLogs() {
  return [
    {
      id: "AL-001",
      actor: "admin@digitaldynamics.co.za",
      action: "CREATE_SUPPLIER",
      entityType: "Supplier",
      entityId: "SUP-001",
      details: "Supplier registered",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      ipAddress: "127.0.0.1",
      status: "RECORDED"
    },
    {
      id: "AL-002",
      actor: "requester@digitaldynamics.co.za",
      action: "CREATE_REQUISITION",
      entityType: "Requisition",
      entityId: "REQ-001",
      details: "Requisition drafted",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      ipAddress: "127.0.0.1",
      status: "RECORDED"
    },
    {
      id: "AL-003",
      actor: "requester@digitaldynamics.co.za",
      action: "SUBMIT_REQUISITION",
      entityType: "Requisition",
      entityId: "REQ-001",
      details: "Requisition submitted for approval",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      ipAddress: "127.0.0.1",
      status: "RECORDED"
    },
    {
      id: "AL-004",
      actor: "approver1@digitaldynamics.co.za",
      action: "DECIDE_APPROVAL",
      entityType: "Approval",
      entityId: "APP-001",
      details: "Decision: APPROVED",
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      ipAddress: "127.0.0.1",
      status: "RECORDED"
    },
    {
      id: "AL-005",
      actor: "procurement@digitaldynamics.co.za",
      action: "CREATE_RFQ",
      entityType: "Rfq",
      entityId: "RFQ-001",
      details: "RFQ created from requisition",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      ipAddress: "127.0.0.1",
      status: "RECORDED"
    }
  ];
}