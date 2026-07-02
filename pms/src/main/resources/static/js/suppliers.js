document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("suppliers", "Suppliers", "Maintain supplier records and supplier approval status.");
  loadSuppliers();
});

async function loadSuppliers(messageHtml) {
  PMS.showLoading("Loading suppliers...");

  try {
    const suppliers = await PMS.getJson("/api/suppliers");
    const canManage = PMS.hasAnyRole(["ADMIN", "PROCUREMENT_OFFICER"]);

    PMS.setContent(`
      ${messageHtml || ""}

      ${canManage ? supplierFormSection() : ""}

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Supplier Register</h2>
            <p>View all registered suppliers and manage their approval status.</p>
          </div>
          <button class="btn btn-soft" type="button" id="refreshBtn">Refresh</button>
        </div>

        ${suppliersTable(suppliers, canManage)}
      </section>
    `);

    document.getElementById("refreshBtn").addEventListener("click", function () {
      loadSuppliers();
    });

    if (canManage) {
      document.getElementById("supplierForm").addEventListener("submit", createSupplier);

      document.querySelectorAll("[data-status]").forEach(function (button) {
        button.addEventListener("click", function () {
          updateSupplierStatus(button.dataset.supplierId, button.dataset.status);
        });
      });
    }
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function supplierFormSection() {
  return `
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>New Supplier</h2>
          <p>Add a supplier to the register. Newly created suppliers start with Pending status.</p>
        </div>
      </div>

      <form id="supplierForm" class="auth-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="name">Supplier Name</label>
            <input id="name" name="name" type="text" required>
          </div>

          <div class="form-group">
            <label for="contactEmail">Contact Email</label>
            <input id="contactEmail" name="contactEmail" type="email" required>
          </div>

          <div class="form-group">
            <label for="phone">Phone</label>
            <input id="phone" name="phone" type="text">
          </div>

          <div class="form-group">
            <label for="taxNumber">Tax Number</label>
            <input id="taxNumber" name="taxNumber" type="text">
          </div>
        </div>

        <div class="action-row">
          <button class="btn btn-primary" type="submit">Create Supplier</button>
        </div>
      </form>
    </section>
  `;
}

function suppliersTable(suppliers, canManage) {
  if (!Array.isArray(suppliers) || suppliers.length === 0) {
    return PMS.emptyState("No suppliers found", "Create your first supplier above.");
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Performance Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${suppliers.map(function (supplier) {
            return `
              <tr>
                <td>${PMS.escapeHtml(supplier.id)}</td>
                <td>${PMS.escapeHtml(supplier.name)}</td>
                <td>${PMS.escapeHtml(supplier.contactEmail)}</td>
                <td>${PMS.statusBadge(supplier.status)}</td>
                <td>${PMS.escapeHtml(supplier.performanceScore ?? "-")}</td>
                <td>
                  ${canManage ? supplierActions(supplier) : `<span class="badge">View only</span>`}
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function supplierActions(supplier) {
  const status = String(supplier.status || "").toUpperCase();

  if (status === "APPROVED") {
    return `
      <div class="action-row">
        <button class="btn btn-danger" type="button"
          data-supplier-id="${PMS.escapeHtml(supplier.id)}"
          data-status="SUSPENDED">
          Suspend
        </button>
      </div>
    `;
  }

  if (status === "SUSPENDED") {
    return `
      <div class="action-row">
        <button class="btn btn-primary" type="button"
          data-supplier-id="${PMS.escapeHtml(supplier.id)}"
          data-status="APPROVED">
          Approve
        </button>
      </div>
    `;
  }

  return `
    <div class="action-row">
      <button class="btn btn-primary" type="button"
        data-supplier-id="${PMS.escapeHtml(supplier.id)}"
        data-status="APPROVED">
        Approve
      </button>

      <button class="btn btn-danger" type="button"
        data-supplier-id="${PMS.escapeHtml(supplier.id)}"
        data-status="SUSPENDED">
        Suspend
      </button>
    </div>
  `;
}

async function createSupplier(event) {
  event.preventDefault();
  const form = event.target;

  try {
    await PMS.postJson("/api/suppliers", PMS.formDataToObject(form));
    form.reset();
    loadSuppliers(PMS.message("success", "Supplier created successfully."));
  } catch (error) {
    loadSuppliers(PMS.message("error", error.message));
  }
}

async function updateSupplierStatus(id, status) {
  try {
    await PMS.api(`/api/suppliers/${id}/status?status=${encodeURIComponent(status)}`, {
      method: "PUT"
    });

    loadSuppliers(PMS.message("success", "Supplier status updated successfully."));
  } catch (error) {
    loadSuppliers(PMS.message("error", error.message));
  }
}
