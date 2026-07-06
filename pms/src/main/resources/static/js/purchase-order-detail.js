(function () {
  const demoPurchaseOrder = {
    id: 1,
    poNumber: "PO-2026-001",
    rfqNumber: "RFQ-2026-001",
    requisitionNumber: "REQ-2026-004",
    supplierName: "Demo Supplier",
    supplierEmail: "supplier@example.com",
    orderDate: "2026-07-03",
    expectedDeliveryDate: "2026-07-15",
    totalValue: 17650,
    status: "AWARDED",
    createdBy: "Procurement Officer",
    notes: "Purchase order generated from awarded RFQ.",
    lineItems: [
      {
        description: "Office chairs",
        quantity: 10,
        unitPrice: 950,
        total: 9500
      },
      {
        description: "Office desks",
        quantity: 5,
        unitPrice: 1630,
        total: 8150
      }
    ]
  };

  function getPurchaseOrderId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "1";
  }

  async function fetchPurchaseOrder() {
    const id = getPurchaseOrderId();

    try {
      const data = await PMS.getJson("/api/purchase-orders/" + encodeURIComponent(id));
      return data || demoPurchaseOrder;
    } catch (error) {
      console.warn("Using demo purchase order detail data:", error.message);
      return demoPurchaseOrder;
    }
  }

  function renderLineItems(items) {
    if (!items || items.length === 0) {
      return PMS.emptyState(
        "No line items",
        "Line items will appear here once purchase order detail data is connected."
      );
    }

    return `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${items.map(function (item) {
              return `
                <tr>
                  <td>${PMS.escapeHtml(item.description || "-")}</td>
                  <td>${PMS.escapeHtml(item.quantity || "0")}</td>
                  <td>${PMS.formatCurrency(item.unitPrice || 0)}</td>
                  <td>${PMS.formatCurrency(item.total || 0)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderPurchaseOrder(po) {
    PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>${PMS.escapeHtml(po.poNumber || "Purchase Order Detail")}</h2>
            <p class="muted">
              View awarded supplier, linked RFQ, value and delivery information.
            </p>
          </div>

          <div class="form-actions">
            <a class="btn btn-secondary" href="/purchase-orders.html">Back to Purchase Orders</a>
            <button type="button" class="btn btn-secondary" id="printPoBtn">Print PO</button>
            <button type="button" class="btn btn-primary" id="captureGrnBtn">Capture GRN</button>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="stat-card">
            <div>
              <p class="stat-label">PO Status</p>
              <h3>${PMS.statusBadge(po.status)}</h3>
              <span>Current purchase order status</span>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <p class="stat-label">Total Value</p>
              <h3>${PMS.formatCurrency(po.totalValue || 0)}</h3>
              <span>Total purchase order amount</span>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <p class="stat-label">Order Date</p>
              <h3>${PMS.escapeHtml(po.orderDate || "-")}</h3>
              <span>Date the PO was created</span>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <p class="stat-label">Expected Delivery</p>
              <h3>${PMS.escapeHtml(po.expectedDeliveryDate || "-")}</h3>
              <span>Expected supplier delivery date</span>
            </div>
          </div>
        </div>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Purchase Order Information</h2>
            <p class="muted">Main purchase order details.</p>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span>PO Number</span>
            <strong>${PMS.escapeHtml(po.poNumber || "-")}</strong>
          </div>

          <div class="detail-item">
            <span>Linked RFQ</span>
            <strong>${PMS.escapeHtml(po.rfqNumber || "-")}</strong>
          </div>

          <div class="detail-item">
            <span>Linked Requisition</span>
            <strong>${PMS.escapeHtml(po.requisitionNumber || "-")}</strong>
          </div>

          <div class="detail-item">
            <span>Awarded Supplier</span>
            <strong>${PMS.escapeHtml(po.supplierName || "-")}</strong>
          </div>

          <div class="detail-item">
            <span>Supplier Email</span>
            <strong>${PMS.escapeHtml(po.supplierEmail || "-")}</strong>
          </div>

          <div class="detail-item">
            <span>Created By</span>
            <strong>${PMS.escapeHtml(po.createdBy || "-")}</strong>
          </div>
        </div>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Line Items</h2>
            <p class="muted">Items included in this purchase order.</p>
          </div>
        </div>

        ${renderLineItems(po.lineItems)}
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Notes</h2>
            <p class="muted">Additional purchase order information.</p>
          </div>
        </div>

        <p>${PMS.escapeHtml(po.notes || "No notes captured.")}</p>
      </section>
    `);

    document.getElementById("printPoBtn").addEventListener("click", function () {
      window.print();
    });

    document.getElementById("captureGrnBtn").addEventListener("click", function () {
      alert("GRN capture page is the next feature. We will connect this button after creating the GRN page.");
    });
  }

  async function start() {
    PMS.renderLayout(
      "purchase-orders",
      "Purchase Order Detail",
      "View awarded RFQ, supplier and order information"
    );

    PMS.showLoading("Loading purchase order detail...");

    const purchaseOrder = await fetchPurchaseOrder();
    renderPurchaseOrder(purchaseOrder);
  }

  start();
})();