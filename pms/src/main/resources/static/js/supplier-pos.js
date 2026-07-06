(function () {
  const demoPurchaseOrders = [
    {
      id: 1,
      poNumber: "PO-2026-001",
      rfqNumber: "RFQ-2026-001",
      supplierName: "Demo Supplier",
      orderDate: "2026-07-03",
      expectedDeliveryDate: "2026-07-15",
      totalValue: 17650,
      status: "AWARDED"
    },
    {
      id: 2,
      poNumber: "PO-2026-002",
      rfqNumber: "RFQ-2026-002",
      supplierName: "Demo Supplier",
      orderDate: "2026-07-04",
      expectedDeliveryDate: "2026-07-18",
      totalValue: 39800,
      status: "PENDING_DELIVERY"
    }
  ];

  let purchaseOrders = [];
  let filteredPurchaseOrders = [];

  async function fetchSupplierPurchaseOrders() {
    try {
      const data = await PMS.getJson("/api/supplier-portal/purchase-orders");
      return Array.isArray(data) ? data : demoPurchaseOrders;
    } catch (error) {
      console.warn("Using demo supplier purchase order data:", error.message);
      return demoPurchaseOrders;
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById("poSearch");
    const statusFilter = document.getElementById("poStatusFilter");

    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const statusValue = statusFilter ? statusFilter.value : "ALL";

    filteredPurchaseOrders = purchaseOrders.filter(function (po) {
      const combinedText = `
        ${po.poNumber || ""}
        ${po.rfqNumber || ""}
        ${po.supplierName || ""}
        ${po.status || ""}
      `.toLowerCase();

      const matchesSearch = combinedText.includes(searchValue);
      const matchesStatus = statusValue === "ALL" || po.status === statusValue;

      return matchesSearch && matchesStatus;
    });

    renderTable();
  }

  function renderTable() {
    const tableArea = document.getElementById("poTableArea");

    if (!tableArea) return;

    if (!filteredPurchaseOrders || filteredPurchaseOrders.length === 0) {
      tableArea.innerHTML = PMS.emptyState(
        "No purchase orders found",
        "No purchase orders match your current search or filter."
      );
      return;
    }

    tableArea.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>PO Number</th>
              <th>RFQ Number</th>
              <th>Supplier</th>
              <th>Order Date</th>
              <th>Expected Delivery</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${filteredPurchaseOrders.map(function (po) {
              return `
                <tr>
                  <td>${PMS.escapeHtml(po.poNumber || "-")}</td>
                  <td>${PMS.escapeHtml(po.rfqNumber || "-")}</td>
                  <td>${PMS.escapeHtml(po.supplierName || "-")}</td>
                  <td>${PMS.escapeHtml(po.orderDate || "-")}</td>
                  <td>${PMS.escapeHtml(po.expectedDeliveryDate || "-")}</td>
                  <td>${PMS.formatCurrency(po.totalValue)}</td>
                  <td>${PMS.statusBadge(po.status)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-sm btn-secondary" type="button" data-view-po="${po.id}">
                        View
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

    document.querySelectorAll("[data-view-po]").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = this.getAttribute("data-view-po");
        alert("Supplier purchase order detail page can be connected next. Selected PO ID: " + id);
      });
    });
  }

  function renderPage() {
    PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>My Purchase Orders</h2>
            <p class="muted">View purchase orders awarded to your supplier account.</p>
          </div>

          <div class="form-actions">
            <a class="btn btn-secondary" href="/supplier-dashboard.html">Back to Supplier Dashboard</a>
          </div>
        </div>

        <div class="filter-row">
          <div class="form-group">
            <label for="poSearch">Search Purchase Orders</label>
            <input id="poSearch" type="text" placeholder="Search by PO number, RFQ number or supplier">
          </div>

          <div class="form-group">
            <label for="poStatusFilter">Status</label>
            <select id="poStatusFilter">
              <option value="ALL">All Statuses</option>
              <option value="AWARDED">Awarded</option>
              <option value="PENDING_DELIVERY">Pending Delivery</option>
              <option value="RECEIVED">Received</option>
              <option value="DISCREPANCY">Discrepancy</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Purchase Order List</h2>
            <p class="muted">Supplier purchase orders will load from the backend once the endpoint is available.</p>
          </div>
        </div>

        <div id="poTableArea"></div>
      </section>
    `);

    document.getElementById("poSearch").addEventListener("input", applyFilters);
    document.getElementById("poStatusFilter").addEventListener("change", applyFilters);

    applyFilters();
  }

  async function start() {
    PMS.renderLayout(
      "supplier-dashboard",
      "My Purchase Orders",
      "Supplier portal purchase order list"
    );

    PMS.showLoading("Loading supplier purchase orders...");

    purchaseOrders = await fetchSupplierPurchaseOrders();
    filteredPurchaseOrders = purchaseOrders;

    renderPage();
  }

  start();
})();