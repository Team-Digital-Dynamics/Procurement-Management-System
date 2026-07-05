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
            <p>View requisitions captured in the procurement workflow.</p>
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
      document.getElementById("addLineItemBtn").addEventListener("click", addLineItemRow);

      document.getElementById("lineItemsBody").addEventListener("input", function (event) {
        if (event.target.matches("[data-line-field]")) {
          updateRequisitionTotals();
        }
      });

      document.getElementById("lineItemsBody").addEventListener("click", function (event) {
        const removeButton = event.target.closest("[data-remove-line]");
        if (!removeButton) return;

        removeLineItemRow(removeButton);
      });

      updateRequisitionTotals();
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
          <p>Create a requisition with multiple line items and an automatic total.</p>
        </div>
      </div>

      <form id="requisitionForm" class="auth-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="title">Requisition Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Example: Office supplies for Finance Department"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="businessJustification">Business Justification</label>
          <textarea
            id="businessJustification"
            name="businessJustification"
            required
            placeholder="Explain why this purchase is needed."
          ></textarea>
        </div>

        <div class="section-header" style="margin-top: 24px;">
          <div>
            <h2>Line Items</h2>
            <p>Add each item or service required for this requisition.</p>
          </div>

          <button class="btn btn-soft" type="button" id="addLineItemBtn">
            Add Line Item
          </button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Estimated Unit Price</th>
                <th>Line Total</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody id="lineItemsBody">
              ${lineItemRowTemplate()}
            </tbody>
          </table>
        </div>

        <div class="requisition-total-row">
          <div class="stat-card requisition-total-card">
            <p class="label">Grand Total</p>
            <p class="value" id="grandTotal">R0.00</p>
            <p class="muted">Calculated automatically from line items.</p>
          </div>
        </div>

        <div class="action-row">
          <button class="btn btn-primary" type="submit">Create Draft Requisition</button>
        </div>
      </form>
    </section>
  `;
}

function lineItemRowTemplate() {
  return `
    <tr data-line-row>
      <td>
        <input
          data-line-field="description"
          type="text"
          required
          placeholder="Item or service description"
        >
      </td>

      <td>
        <input
          data-line-field="quantity"
          type="number"
          min="1"
          step="1"
          value="1"
          required
        >
      </td>

      <td>
        <input
          data-line-field="estimatedUnitPrice"
          type="number"
          min="0.01"
          step="0.01"
          value="0.00"
          required
        >
      </td>

      <td data-line-total>
        R0.00
      </td>

      <td>
        <button class="btn btn-danger" type="button" data-remove-line>
          Remove
        </button>
      </td>
    </tr>
  `;
}

function addLineItemRow() {
  const lineItemsBody = document.getElementById("lineItemsBody");
  lineItemsBody.insertAdjacentHTML("beforeend", lineItemRowTemplate());
  updateRequisitionTotals();
}

function removeLineItemRow(button) {
  const lineItemsBody = document.getElementById("lineItemsBody");
  const rows = lineItemsBody.querySelectorAll("[data-line-row]");

  if (rows.length === 1) {
    return;
  }

  button.closest("[data-line-row]").remove();
  updateRequisitionTotals();
}

function updateRequisitionTotals() {
  const rows = document.querySelectorAll("[data-line-row]");
  let grandTotal = 0;

  rows.forEach(function (row) {
    const quantity = Number(row.querySelector('[data-line-field="quantity"]').value || 0);
    const unitPrice = Number(row.querySelector('[data-line-field="estimatedUnitPrice"]').value || 0);
    const lineTotal = quantity * unitPrice;

    grandTotal += lineTotal;

    const lineTotalCell = row.querySelector("[data-line-total]");
    lineTotalCell.textContent = PMS.formatCurrency(lineTotal);
  });

  const grandTotalElement = document.getElementById("grandTotal");

  if (grandTotalElement) {
    grandTotalElement.textContent = PMS.formatCurrency(grandTotal);
  }
}

function collectLineItems() {
  const rows = document.querySelectorAll("[data-line-row]");

  return Array.from(rows).map(function (row) {
    return {
      description: row.querySelector('[data-line-field="description"]').value.trim(),
      quantity: Number(row.querySelector('[data-line-field="quantity"]').value || 0),
      estimatedUnitPrice: Number(row.querySelector('[data-line-field="estimatedUnitPrice"]').value || 0)
    };
  });
}

function validateLineItems(items) {
  if (!items.length) {
    return "Please add at least one line item.";
  }

  const invalidItem = items.find(function (item) {
    return !item.description || item.quantity <= 0 || item.estimatedUnitPrice <= 0;
  });

  if (invalidItem) {
    return "Please complete all line items with a description, quantity and estimated unit price.";
  }

  return "";
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
            const canSubmit = String(item.status || "").toUpperCase() === "DRAFT"
              && PMS.hasAnyRole(["REQUESTER", "ADMIN"]);

            return `
              <tr>
                <td>${PMS.escapeHtml(item.id)}</td>
                <td>${PMS.escapeHtml(item.title)}</td>
                <td>${PMS.statusBadge(item.status)}</td>
                <td>${PMS.formatCurrency(item.totalAmount)}</td>
                <td>${PMS.escapeHtml(item.requesterEmail)}</td>
               <td>
  <div class="action-row">
    <a class="btn btn-soft" href="/requisition-detail.html?id=${PMS.escapeHtml(item.id)}">
      View / Track
    </a>

    ${canSubmit
      ? `<button class="btn btn-primary" type="button" data-submit-requisition="${PMS.escapeHtml(item.id)}">Submit</button>`
      : ""
    }
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

async function createRequisition(event) {
  event.preventDefault();

  const form = event.target;
  const data = PMS.formDataToObject(form);
  const items = collectLineItems();
  const validationMessage = validateLineItems(items);

  if (validationMessage) {
    loadRequisitions(PMS.message("error", validationMessage));
    return;
  }

  try {
    await PMS.postJson("/api/requisitions", {
      title: data.title,
      businessJustification: data.businessJustification,
      items: items
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