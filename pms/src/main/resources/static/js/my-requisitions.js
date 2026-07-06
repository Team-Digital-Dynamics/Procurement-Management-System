document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("my-requisitions", "My Requisitions", "View your own requisitions and monitor their status.");
  loadMyRequisitions();
});

async function loadMyRequisitions(messageHtml) {
  PMS.showLoading("Loading my requisitions...");

  try {
    const user = PMS.getUser();
    const requisitions = await PMS.getJson("/api/requisitions");

    const isAdmin = PMS.hasAnyRole(["ADMIN"]);

    const visibleRequisitions = isAdmin
      ? requisitions
      : requisitions.filter(function (item) {
          return String(item.requesterEmail || "").toLowerCase() === String(user.email || "").toLowerCase();
        });

    PMS.setContent(`
      ${messageHtml || ""}

      <section class="grid-4">
        ${statCard("Draft", countByStatus(visibleRequisitions, "DRAFT"), "Not yet submitted")}
        ${statCard("Submitted", countByStatus(visibleRequisitions, "SUBMITTED"), "Waiting for approval")}
        ${statCard("Approved", countByStatus(visibleRequisitions, "APPROVED"), "Ready for RFQ")}
        ${statCard("Completed", countCompleted(visibleRequisitions), "Moved to RFQ, PO or received")}
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>${isAdmin ? "Requisition Register" : "My Requisition Register"}</h2>
            <p>
              ${isAdmin
                ? "Administrator view of requisitions created in the system."
                : "Requisitions created by your user account."
              }
            </p>
          </div>

          <button class="btn btn-soft" type="button" id="refreshBtn">Refresh</button>
        </div>

        ${requisitionsTable(visibleRequisitions)}
      </section>
    `);

    document.getElementById("refreshBtn").addEventListener("click", function () {
      loadMyRequisitions();
    });
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function statCard(label, value, text) {
  return `
    <div class="stat-card">
      <p class="label">${PMS.escapeHtml(label)}</p>
      <p class="value">${PMS.escapeHtml(value)}</p>
      <p class="muted">${PMS.escapeHtml(text)}</p>
    </div>
  `;
}

function countByStatus(requisitions, status) {
  if (!Array.isArray(requisitions)) return 0;

  return requisitions.filter(function (item) {
    return String(item.status || "").toUpperCase() === status;
  }).length;
}

function countCompleted(requisitions) {
  if (!Array.isArray(requisitions)) return 0;

  return requisitions.filter(function (item) {
    const status = String(item.status || "").toUpperCase();

    return [
      "RFQ_CREATED",
      "PO_CREATED",
      "RECEIVED",
      "DISCREPANCY"
    ].includes(status);
  }).length;
}

function requisitionsTable(requisitions) {
  if (!Array.isArray(requisitions) || requisitions.length === 0) {
    return PMS.emptyState(
      "No requisitions found",
      "Requisitions you create will appear here with their current workflow status."
    );
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Total Amount</th>
            <th>Requester</th>
            <th>Progress</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${requisitions.map(function (item) {
            return `
              <tr>
                <td>${PMS.escapeHtml(item.id)}</td>
                <td>${PMS.escapeHtml(item.title)}</td>
                <td>${PMS.statusBadge(item.status)}</td>
                <td>${PMS.formatCurrency(item.totalAmount)}</td>
                <td>${PMS.escapeHtml(item.requesterEmail)}</td>
                <td>${progressText(item.status)}</td>
<td>
  <a class="btn btn-soft" href="/requisition-detail.html?id=${PMS.escapeHtml(item.id)}">
    View / Track
  </a>
</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function progressText(status) {
  const value = String(status || "").toUpperCase();

  const progressMap = {
    DRAFT: "Draft created. Submit when ready.",
    SUBMITTED: "Submitted and waiting for approval.",
    APPROVED: "Approved and ready for RFQ.",
    REJECTED: "Rejected during approval.",
    RFQ_CREATED: "RFQ has been created.",
    PO_CREATED: "Purchase order has been created.",
    RECEIVED: "Goods received.",
    DISCREPANCY: "Goods received with discrepancy."
  };

  return `<span class="muted">${PMS.escapeHtml(progressMap[value] || "Status in progress.")}</span>`;
}