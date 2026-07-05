document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "requisition-detail",
    "Requisition Detail",
    "View requisition information and track workflow progress."
  );

  loadRequisitionDetail();
});

async function loadRequisitionDetail() {
  PMS.showLoading("Loading requisition detail...");

  try {
    const params = new URLSearchParams(window.location.search);
    const requisitionId = params.get("id");

    if (!requisitionId) {
      PMS.setContent(`
        <section class="view-section">
          ${PMS.message("error", "No requisition ID was provided.")}
          <a class="btn btn-soft" href="/requisitions.html">Back to Requisitions</a>
        </section>
      `);
      return;
    }

    const requisitions = await PMS.getJson("/api/requisitions");

    const requisition = requisitions.find(function (item) {
      return String(item.id) === String(requisitionId);
    });

    if (!requisition) {
      PMS.setContent(`
        <section class="view-section">
          ${PMS.message("error", "Requisition could not be found.")}
          <a class="btn btn-soft" href="/requisitions.html">Back to Requisitions</a>
        </section>
      `);
      return;
    }

    PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>${PMS.escapeHtml(requisition.title || "Requisition")}</h2>
            <p>Requisition ID: ${PMS.escapeHtml(requisition.id)}</p>
          </div>

          <div class="action-row">
            <a class="btn btn-soft" href="/my-requisitions.html">My Requisitions</a>
            <a class="btn btn-soft" href="/requisitions.html">All Requisitions</a>
          </div>
        </div>

        <section class="grid-4">
          ${detailCard("Status", PMS.statusBadge(requisition.status), "Current workflow status", true)}
          ${detailCard("Total Amount", PMS.formatCurrency(requisition.totalAmount), "Estimated requisition value")}
          ${detailCard("Requester", requisition.requesterEmail || "Not available", "Created by")}
          ${detailCard("Requisition ID", requisition.id, "System reference number")}
        </section>
      </section>

      <section class="grid-2">
        <div class="view-section">
          <div class="section-header">
            <div>
              <h2>Business Justification</h2>
              <p>Reason for the requested purchase.</p>
            </div>
          </div>

          <p class="detail-text">
            ${PMS.escapeHtml(requisition.businessJustification || "No business justification is available for this requisition.")}
          </p>
        </div>

        <div class="view-section">
          <div class="section-header">
            <div>
              <h2>Workflow Progress</h2>
              <p>Current position in the procurement process.</p>
            </div>
          </div>

          ${workflowTimeline(requisition.status)}
        </div>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Line Items</h2>
            <p>Items or services requested on this requisition.</p>
          </div>
        </div>

        ${lineItemsTable(requisition)}
      </section>
    `);
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function detailCard(label, value, text, isHtml) {
  return `
    <div class="stat-card detail-card">
      <p class="label">${PMS.escapeHtml(label)}</p>
      <p class="value detail-card-value">${isHtml ? value : PMS.escapeHtml(value)}</p>
      <p class="muted">${PMS.escapeHtml(text)}</p>
    </div>
  `;
}

function workflowTimeline(status) {
  const currentStatus = String(status || "").toUpperCase();

  const steps = [
    {
      key: "DRAFT",
      label: "Draft Created",
      text: "The requisition has been captured but not submitted."
    },
    {
      key: "SUBMITTED",
      label: "Submitted",
      text: "The requisition has been submitted for approval."
    },
    {
      key: "APPROVED",
      label: "Approved",
      text: "The requisition has been approved and can move to RFQ."
    },
    {
      key: "RFQ_CREATED",
      label: "RFQ Created",
      text: "An RFQ has been created for suppliers."
    },
    {
      key: "PO_CREATED",
      label: "Purchase Order Created",
      text: "A purchase order has been generated."
    },
    {
      key: "RECEIVED",
      label: "Goods Received",
      text: "The goods or services have been received."
    }
  ];

  const rejectedStep = {
    key: "REJECTED",
    label: "Rejected",
    text: "The requisition was rejected during approval."
  };

  if (currentStatus === "REJECTED") {
    return `
      <div class="workflow-timeline">
        ${timelineItem(steps[0], true)}
        ${timelineItem(steps[1], true)}
        ${timelineItem(rejectedStep, true, true)}
      </div>
    `;
  }

  const activeIndex = steps.findIndex(function (step) {
    return step.key === currentStatus;
  });

  return `
    <div class="workflow-timeline">
      ${steps.map(function (step, index) {
        return timelineItem(step, activeIndex >= index);
      }).join("")}
    </div>
  `;
}

function timelineItem(step, complete, danger) {
  return `
    <div class="timeline-item ${complete ? "complete" : ""} ${danger ? "danger" : ""}">
      <div class="timeline-dot"></div>
      <div>
        <strong>${PMS.escapeHtml(step.label)}</strong>
        <p>${PMS.escapeHtml(step.text)}</p>
      </div>
    </div>
  `;
}

function lineItemsTable(requisition) {
  const items =
    requisition.items ||
    requisition.lineItems ||
    requisition.requisitionItems ||
    [];

  if (!Array.isArray(items) || items.length === 0) {
    return PMS.emptyState(
      "No line items available",
      "The requisition was found, but the current API response does not include line item detail yet."
    );
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Estimated Unit Price</th>
            <th>Line Total</th>
          </tr>
        </thead>

        <tbody>
          ${items.map(function (item) {
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.estimatedUnitPrice || item.unitPrice || 0);
            const lineTotal = quantity * unitPrice;

            return `
              <tr>
                <td>${PMS.escapeHtml(item.description || "Item")}</td>
                <td>${PMS.escapeHtml(quantity)}</td>
                <td>${PMS.formatCurrency(unitPrice)}</td>
                <td>${PMS.formatCurrency(lineTotal)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}