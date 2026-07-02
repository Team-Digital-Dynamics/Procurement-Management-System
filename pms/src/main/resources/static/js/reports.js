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

  PMS.renderLayout("purchase-orders", "Purchase Orders", "View purchase order status and next backend steps.");
  loadPurchaseOrdersNotice();
});

function currentPageName() {
  return window.location.pathname.split("/").pop().replace(".html", "") || "reports";
}

async function loadReports() {
  PMS.showLoading("Loading reports...");

  try {
    const data = await PMS.getJson("/api/reports");

    PMS.setContent(`
      <section class="grid-4">
        ${statCard("Submitted Requisitions", data.submittedRequisitions)}
        ${statCard("Approved Requisitions", data.approvedRequisitions)}
        ${statCard("Open RFQs", data.openRfqs)}
        ${statCard("Approved Suppliers", data.approvedSuppliers)}
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Report Summary</h2>
            <p>The current backend reports endpoint returns procurement summary totals.</p>
          </div>
        </div>
        <p class="muted">More detailed report tables can be added when the backend exposes more report endpoints.</p>
      </section>
    `);
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
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
                <td>${PMS.statusBadge(user.status)}</td>
                <td>${PMS.formatCurrency(user.approvalLimit)}</td>
                <td>${PMS.escapeHtml(PMS.formatRoles(Array.from(user.roles || [])))}</td>
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
                <td>${PMS.escapeHtml(PMS.formatStatus(log.action))}</td>
                <td>${PMS.escapeHtml(log.entityType)}</td>
                <td>${PMS.escapeHtml(log.entityId)}</td>
                <td>${PMS.escapeHtml(PMS.formatDateTime(log.createdAt))}</td>
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
