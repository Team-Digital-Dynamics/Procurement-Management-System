document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("suppliers", "Suppliers", "Add, search, edit and manage approved suppliers.");
  loadSuppliers();
});

let allSuppliers = [];
let editingSupplierId = null;

async function loadSuppliers(messageHtml) {
  PMS.showLoading("Loading suppliers...");

  try {
    allSuppliers = await PMS.getJson("/api/suppliers");

    PMS.setContent(`
      ${messageHtml || ""}

      ${supplierFormSection()}

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Supplier Search</h2>
            <p>Search suppliers by name, email, category or status.</p>
          </div>

          <button class="btn btn-soft" type="button" id="refreshBtn">Refresh</button>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="supplierSearch">Search Supplier</label>
            <input
              id="supplierSearch"
              type="search"
              placeholder="Search by supplier name, email, category or status..."
              autocomplete="off"
            >
          </div>

          <div class="form-group">
            <label for="statusFilter">Status Filter</label>
            <select id="statusFilter">
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </section>

      <section class="grid-4">
        ${statCard("Total Suppliers", allSuppliers.length, "All suppliers captured")}
        ${statCard("Pending", countByStatus("PENDING"), "Waiting for approval")}
        ${statCard("Approved", countByStatus("APPROVED"), "Available for RFQs")}
        ${statCard("Suspended", countByStatus("SUSPENDED"), "Not currently active")}
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Supplier Register</h2>
            <p>Manage supplier records and approval status.</p>
          </div>
        </div>

        <div id="suppliersTableArea">
          ${suppliersTable(allSuppliers)}
        </div>
      </section>
    `);

    attachSupplierEvents();
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function supplierFormSection() {
  return `
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2 id="supplierFormTitle">Add Supplier</h2>
          <p id="supplierFormSubtitle">Capture supplier details for procurement use.</p>
        </div>

        <button class="btn btn-soft" type="button" id="clearSupplierFormBtn">
          Clear Form
        </button>
      </div>

      <form id="supplierForm" class="auth-form">
        <input id="supplierId" name="supplierId" type="hidden">

        <div class="form-grid">
          <div class="form-group">
            <label for="name">Supplier Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Example: ABC Office Supplies"
            >
          </div>

          <div class="form-group">
            <label for="category">Category</label>
            <input
              id="category"
              name="category"
              type="text"
              required
              placeholder="Example: Stationery, IT, Cleaning"
            >
          </div>

          <div class="form-group">
            <label for="contactEmail">Contact Email</label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              required
              placeholder="supplier@example.com"
            >
          </div>

          <div class="form-group">
            <label for="performanceScore">Performance Score</label>
            <input
              id="performanceScore"
              name="performanceScore"
              type="number"
              min="0"
              max="100"
              step="1"
              value="80"
              required
            >
          </div>
        </div>

        <div class="action-row">
          <button class="btn btn-primary" type="submit" id="saveSupplierBtn">
            Add Supplier
          </button>
        </div>
      </form>
    </section>
  `;
}

function attachSupplierEvents() {
  document.getElementById("supplierForm").addEventListener("submit", saveSupplier);

  document.getElementById("clearSupplierFormBtn").addEventListener("click", function () {
    resetSupplierForm();
  });

  document.getElementById("refreshBtn").addEventListener("click", function () {
    loadSuppliers();
  });

  document.getElementById("supplierSearch").addEventListener("input", filterSuppliers);
  document.getElementById("statusFilter").addEventListener("change", filterSuppliers);

  document.querySelectorAll("[data-edit-supplier]").forEach(function (button) {
    button.addEventListener("click", function () {
      editSupplier(button.dataset.editSupplier);
    });
  });

  document.querySelectorAll("[data-status-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      updateSupplierStatus(button.dataset.supplierId, button.dataset.statusAction);
    });
  });
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

function countByStatus(status) {
  return allSuppliers.filter(function (supplier) {
    return String(supplier.status || "").toUpperCase() === status;
  }).length;
}

function suppliersTable(suppliers) {
  if (!Array.isArray(suppliers) || suppliers.length === 0) {
    return PMS.emptyState(
      "No suppliers found",
      "Add a supplier or adjust your search criteria."
    );
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Supplier Name</th>
            <th>Category</th>
            <th>Contact Email</th>
            <th>Performance Score</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${suppliers.map(function (supplier) {
            return `
              <tr>
                <td>${PMS.escapeHtml(supplier.id)}</td>
                <td>${PMS.escapeHtml(supplier.name || "N/A")}</td>
                <td>${PMS.escapeHtml(supplier.category || "N/A")}</td>
                <td>${PMS.escapeHtml(supplier.contactEmail || supplier.email || "N/A")}</td>
                <td>${PMS.escapeHtml(supplier.performanceScore ?? "N/A")}</td>
                <td>${PMS.statusBadge(supplier.status)}</td>
                <td>
                  <div class="action-row">
                    <button class="btn btn-soft" type="button" data-edit-supplier="${PMS.escapeHtml(supplier.id)}">
                      Edit
                    </button>

                    ${supplierStatusButtons(supplier)}
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

function supplierStatusButtons(supplier) {
  const status = String(supplier.status || "").toUpperCase();

  if (status === "PENDING") {
    return `
      <button class="btn btn-primary" type="button" data-supplier-id="${PMS.escapeHtml(supplier.id)}" data-status-action="APPROVED">
        Approve
      </button>

      <button class="btn btn-danger" type="button" data-supplier-id="${PMS.escapeHtml(supplier.id)}" data-status-action="SUSPENDED">
        Suspend
      </button>
    `;
  }

  if (status === "APPROVED") {
    return `
      <button class="btn btn-danger" type="button" data-supplier-id="${PMS.escapeHtml(supplier.id)}" data-status-action="SUSPENDED">
        Suspend
      </button>
    `;
  }

  if (status === "SUSPENDED") {
    return `
      <button class="btn btn-primary" type="button" data-supplier-id="${PMS.escapeHtml(supplier.id)}" data-status-action="APPROVED">
        Approve
      </button>
    `;
  }

  return `<span class="badge">No action</span>`;
}

function filterSuppliers() {
  const searchValue = String(document.getElementById("supplierSearch").value || "").toLowerCase().trim();
  const statusValue = String(document.getElementById("statusFilter").value || "").toUpperCase();

  const filtered = allSuppliers.filter(function (supplier) {
    const searchableText = [
      supplier.name,
      supplier.category,
      supplier.contactEmail,
      supplier.email,
      supplier.status,
      supplier.id
    ].join(" ").toLowerCase();

    const matchesSearch = !searchValue || searchableText.includes(searchValue);
    const matchesStatus = !statusValue || String(supplier.status || "").toUpperCase() === statusValue;

    return matchesSearch && matchesStatus;
  });

  document.getElementById("suppliersTableArea").innerHTML = suppliersTable(filtered);

  document.querySelectorAll("[data-edit-supplier]").forEach(function (button) {
    button.addEventListener("click", function () {
      editSupplier(button.dataset.editSupplier);
    });
  });

  document.querySelectorAll("[data-status-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      updateSupplierStatus(button.dataset.supplierId, button.dataset.statusAction);
    });
  });
}

function editSupplier(id) {
  const supplier = allSuppliers.find(function (item) {
    return String(item.id) === String(id);
  });

  if (!supplier) {
    loadSuppliers(PMS.message("error", "Supplier could not be found."));
    return;
  }

  editingSupplierId = supplier.id;

  document.getElementById("supplierId").value = supplier.id;
  document.getElementById("name").value = supplier.name || "";
  document.getElementById("category").value = supplier.category || "";
  document.getElementById("contactEmail").value = supplier.contactEmail || supplier.email || "";
  document.getElementById("performanceScore").value = supplier.performanceScore ?? 80;

  document.getElementById("supplierFormTitle").textContent = "Edit Supplier";
  document.getElementById("supplierFormSubtitle").textContent = "Update supplier details and save the changes.";
  document.getElementById("saveSupplierBtn").textContent = "Save Supplier Changes";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function resetSupplierForm() {
  editingSupplierId = null;

  document.getElementById("supplierForm").reset();
  document.getElementById("supplierId").value = "";
  document.getElementById("performanceScore").value = 80;

  document.getElementById("supplierFormTitle").textContent = "Add Supplier";
  document.getElementById("supplierFormSubtitle").textContent = "Capture supplier details for procurement use.";
  document.getElementById("saveSupplierBtn").textContent = "Add Supplier";
}

async function saveSupplier(event) {
  event.preventDefault();

  const form = event.target;
  const data = PMS.formDataToObject(form);

  const payload = {
    name: data.name,
    category: data.category,
    contactEmail: data.contactEmail,
    performanceScore: Number(data.performanceScore)
  };

  try {
    if (editingSupplierId) {
      await PMS.putJson(`/api/suppliers/${editingSupplierId}`, payload);
      resetSupplierForm();
      loadSuppliers(PMS.message("success", "Supplier updated successfully."));
    } else {
      await PMS.postJson("/api/suppliers", payload);
      resetSupplierForm();
      loadSuppliers(PMS.message("success", "Supplier added successfully."));
    }
  } catch (error) {
    loadSuppliers(PMS.message("error", error.message));
  }
}

async function updateSupplierStatus(id, status) {
  try {
    await PMS.putJson(`/api/suppliers/${id}/status?status=${encodeURIComponent(status)}`, {});
    loadSuppliers(PMS.message("success", `Supplier status updated to ${status}.`));
  } catch (error) {
    loadSuppliers(PMS.message("error", error.message));
  }
}