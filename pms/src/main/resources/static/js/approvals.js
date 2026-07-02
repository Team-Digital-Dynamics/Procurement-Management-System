document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("approvals", "Approvals", "Review submitted requisitions and record approval decisions.");
  loadApprovals();
});

async function loadApprovals(messageHtml) {
  PMS.showLoading("Loading approvals...");

  try {
    const approvals = await PMS.getJson("/api/approvals");

    PMS.setContent(`
      ${messageHtml || ""}

      <section class="grid-3">
        ${approvalStatCard("Pending Approvals", approvals.length, "Items awaiting decision")}
        ${approvalStatCard("Workflow Step", "Submitted", "Requisitions must be approved before RFQ")}
        ${approvalStatCard("Next Step", "RFQ", "Approved requisitions become available for RFQ")}
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Approval Queue</h2>
            <p>Approve or reject submitted requisitions assigned to you.</p>
          </div>
          <button class="btn btn-soft" type="button" id="refreshBtn">Refresh</button>
        </div>

        ${approvalsTable(approvals)}
      </section>
    `);

    document.getElementById("refreshBtn").addEventListener("click", function () {
      loadApprovals();
    });

    document.querySelectorAll("[data-decision]").forEach(function (button) {
      button.addEventListener("click", function () {
        decideApproval(button.dataset.approvalId, button.dataset.decision);
      });
    });
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function approvalStatCard(label, value, text) {
  return `
    <div class="stat-card">
      <p class="label">${PMS.escapeHtml(label)}</p>
      <p class="value">${PMS.escapeHtml(value ?? 0)}</p>
      <p class="muted">${PMS.escapeHtml(text)}</p>
    </div>
  `;
}

function approvalsTable(approvals) {
  if (!Array.isArray(approvals) || approvals.length === 0) {
    return PMS.emptyState("No pending approvals", "Submitted requisitions awaiting your approval will appear here.");
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Approval ID</th>
            <th>Requisition</th>
            <th>Requester</th>
            <th>Total Amount</th>
            <th>Approval Level</th>
            <th>Assigned Approver</th>
            <th>Comment</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${approvals.map(function (approval) {
            return `
              <tr>
                <td>${PMS.escapeHtml(approval.id)}</td>
                <td>
                  <strong>REQ-${PMS.escapeHtml(approval.requisitionId)}</strong><br>
                  <span class="muted">${PMS.escapeHtml(approval.requisitionTitle)}</span>
                </td>
                <td>${PMS.escapeHtml(approval.requesterEmail)}</td>
                <td>${PMS.formatCurrency(approval.totalAmount)}</td>
                <td>Level ${PMS.escapeHtml(approval.approvalLevel)}</td>
                <td>${PMS.escapeHtml(approval.approverEmail)}</td>
                <td>
                  <textarea id="approvalComment-${PMS.escapeHtml(approval.id)}" placeholder="Add an optional comment"></textarea>
                </td>
                <td>
                  <div class="action-row">
                    <button class="btn btn-primary" type="button"
                      data-approval-id="${PMS.escapeHtml(approval.id)}"
                      data-decision="APPROVED">
                      Approve
                    </button>
                    <button class="btn btn-danger" type="button"
                      data-approval-id="${PMS.escapeHtml(approval.id)}"
                      data-decision="REJECTED">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function decideApproval(id, decision) {
  const commentField = document.getElementById(`approvalComment-${id}`);
  const comments = commentField ? commentField.value.trim() : "";

  try {
    await PMS.postJson(`/api/approvals/${id}/decision`, {
      decision: decision,
      comments: comments
    });

    const message = decision === "APPROVED"
      ? "Requisition approved successfully. It is now available for RFQ creation."
      : "Requisition rejected successfully.";

    loadApprovals(PMS.message("success", message));
  } catch (error) {
    loadApprovals(PMS.message("error", error.message));
  }
}
