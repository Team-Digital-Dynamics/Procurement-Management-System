document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("requisitions", "Requisitions", "Create, submit and view purchase requisitions.");
  loadRequisitions();
});

async function loadRequisitions(messageHtml) {
  PMS.showLoading("Loading requisitions...");

  try {
    const requisitions = await PMS.getJson("/api/requisitions");
    const canCreate = PMS.hasAnyRole(["REQUESTER", "ADMIN"]);

    PMS.setContent(`
      ${messageHtml || ""}

      ${canCreate ? requisitionFormSection() : ""}

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Requisition List</h2>
            <p>All requisitions available from the backend.</p>
          </div>
          <button class="btn btn-soft" type="button" id="refreshBtn">Refresh</button>
        </div>

        ${requisitionsTable(requisitions)}
      </section>
    `);

    document.getElementById("refreshBtn").addEventListener("click", function () {
      loadRequisitions();
    });

    if (canCreate) {
      document.getElementById("requisitionForm").addEventListener("submit", createRequisition);
    }

    document.querySelectorAll("[data-submit-requisition]").forEach(function (button) {
      button.addEventListener("click", function () {
        submitRequisition(button.dataset.submitRequisition);
      });
    });
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function requisitionFormSection() {
  return `
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>New Requisition</h2>
          <p>Create a simple requisition with one line item. More line items can be added later.</p>
        </div>
      </div>

      <form id="requisitionForm" class="auth-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="title">Title</label>
            <input id="title" name="title" type="text" required placeholder="Example: Office chairs">
          </div>

          <div class="form-group">
            <label for="description">Item Description</label>
            <input id="description" name="description" type="text" required placeholder="Describe the goods or service">
          </div>

          <div class="form-group">
            <label for="quantity">Quantity</label>
            <input id="quantity" name="quantity" type="number" min="1" step="1" value="1" required>
          </div>

          <div class="form-group">
            <label for="estimatedUnitPrice">Estimated Unit Price</label>
            <input id="estimatedUnitPrice" name="estimatedUnitPrice" type="number" min="0.01" step="0.01" value="100" required>
          </div>
        </div>

        <div class="form-group">
          <label for="businessJustification">Business Justification</label>
          <textarea id="businessJustification" name="businessJustification" required placeholder="Explain why this purchase is needed."></textarea>
        </div>

        <div class="action-row">
          <button class="btn btn-primary" type="submit">Create Draft Requisition</button>
        </div>
      </form>
    </section>
  `;
}

function requisitionsTable(requisitions) {
  if (!Array.isArray(requisitions) || requisitions.length === 0) {
    return PMS.emptyState("No requisitions found", "Create your first requisition above.");
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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${requisitions.map(function (item) {
            const canSubmit = item.status === "DRAFT" && PMS.hasAnyRole(["REQUESTER", "ADMIN"]);
            return `
              <tr>
                <td>${PMS.escapeHtml(item.id)}</td>
                <td>${PMS.escapeHtml(item.title)}</td>
                <td>${PMS.statusBadge(item.status)}</td>
                <td>${PMS.formatCurrency(item.totalAmount)}</td>
                <td>${PMS.escapeHtml(item.requesterEmail)}</td>
                <td>
                  ${canSubmit ? `<button class="btn btn-primary" type="button" data-submit-requisition="${PMS.escapeHtml(item.id)}">Submit</button>` : `<span class="badge">No action</span>`}
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function createRequisition(event) {
  event.preventDefault();
  const form = event.target;
  const data = PMS.formDataToObject(form);

  try {
    await PMS.postJson("/api/requisitions", {
      title: data.title,
      businessJustification: data.businessJustification,
      items: [
        {
          description: data.description,
          quantity: Number(data.quantity),
          estimatedUnitPrice: Number(data.estimatedUnitPrice)
        }
      ]
    });

    form.reset();
    loadRequisitions(PMS.message("success", "Requisition created as a draft."));
  } catch (error) {
    loadRequisitions(PMS.message("error", error.message));
  }
}

async function submitRequisition(id) {
  try {
    await PMS.postJson(`/api/requisitions/${id}/submit`, {});
    loadRequisitions(PMS.message("success", "Requisition submitted for approval."));
  } catch (error) {
    loadRequisitions(PMS.message("error", error.message));
  }
}
