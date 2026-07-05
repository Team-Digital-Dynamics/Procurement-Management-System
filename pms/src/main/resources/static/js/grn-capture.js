(function () {
  const demoPurchaseOrder = {
    id: 1,
    poNumber: "PO-2026-001",
    supplierName: "Demo Supplier",
    rfqNumber: "RFQ-2026-001",
    requisitionNumber: "REQ-2026-004",
    totalAmount: 42000,
    status: "ISSUED",
    expectedDeliveryDate: "2026-07-15"
  };

  function getPurchaseOrderId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("poId") || params.get("id") || "1";
  }

  async function fetchPurchaseOrder() {
    const poId = getPurchaseOrderId();

    try {
      const data = await PMS.getJson("/api/purchase-orders/" + encodeURIComponent(poId));
      return data || demoPurchaseOrder;
    } catch (error) {
      console.warn("Using demo PO data for GRN:", error.message);
      return demoPurchaseOrder;
    }
  }

  function getPoTotal(po) {
    if (po.totalAmount !== undefined && po.totalAmount !== null) {
      return Number(po.totalAmount);
    }

    if (po.totalValue !== undefined && po.totalValue !== null) {
      return Number(po.totalValue);
    }

    if (po.amount !== undefined && po.amount !== null) {
      return Number(po.amount);
    }

    return 0;
  }

  function getTodayDate() {
    return new Date().toISOString().split("T")[0];
  }

  function calculateGrnStatus(poTotal, receivedValue) {
    if (Number(poTotal) === Number(receivedValue)) {
      return "RECEIVED";
    }

    return "DISCREPANCY";
  }

  function renderDiscrepancyPreview(po) {
    const receivedInput = document.getElementById("receivedValue");
    const preview = document.getElementById("discrepancyPreview");

    if (!receivedInput || !preview) return;

    const poTotal = getPoTotal(po);
    const receivedValue = Number(receivedInput.value || 0);
    const difference = receivedValue - poTotal;
    const status = calculateGrnStatus(poTotal, receivedValue);

    if (!receivedInput.value) {
      preview.innerHTML = PMS.message(
        "info",
        "Enter the received value to see whether the GRN will be marked as received or discrepancy."
      );
      return;
    }

    if (status === "RECEIVED") {
      preview.innerHTML = PMS.message(
        "success",
        "Received value matches the purchase order value. This GRN will be marked as RECEIVED."
      );
      return;
    }

    preview.innerHTML = PMS.message(
      "warning",
      "Discrepancy detected. Difference: " + PMS.formatCurrency(difference) + ". This GRN will be marked as DISCREPANCY."
    );
  }

  async function submitGrn(event, po) {
    event.preventDefault();

    const form = event.target;
    const poTotal = getPoTotal(po);
    const receivedValue = Number(form.receivedValue.value || 0);
    const receivedDate = form.receivedDate.value;
    const notes = form.notes.value.trim();
    const grnStatus = calculateGrnStatus(poTotal, receivedValue);

    if (receivedValue <= 0) {
      alert("Please enter a received value greater than zero.");
      return;
    }

    if (!receivedDate) {
      alert("Please select the received date.");
      return;
    }

    const payload = {
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      orderedValue: poTotal,
      receivedValue: receivedValue,
      receivedDate: receivedDate,
      notes: notes,
      status: grnStatus
    };

    try {
      await PMS.postJson("/api/grns", payload);

      PMS.setContent(`
        <section class="view-section">
          ${PMS.message("success", "GRN captured successfully. Status: " + PMS.formatStatus(grnStatus))}

          <div class="form-actions">
            <a class="btn btn-secondary" href="/purchase-orders.html">Back to Purchase Orders</a>
            <a class="btn btn-primary" href="/purchase-order-detail.html?id=${encodeURIComponent(po.id)}">View Purchase Order</a>
          </div>
        </section>
      `);
    } catch (error) {
      console.warn("GRN backend endpoint not available yet:", error.message);

      PMS.setContent(`
        <section class="view-section">
          ${PMS.message("success", "GRN captured as frontend demo data. Status: " + PMS.formatStatus(grnStatus))}

          <div class="detail-grid">
            <div class="detail-item">
              <span>PO Number</span>
              <strong>${PMS.escapeHtml(payload.poNumber || "-")}</strong>
            </div>

            <div class="detail-item">
              <span>Ordered Value</span>
              <strong>${PMS.formatCurrency(payload.orderedValue)}</strong>
            </div>

            <div class="detail-item">
              <span>Received Value</span>
              <strong>${PMS.formatCurrency(payload.receivedValue)}</strong>
            </div>

            <div class="detail-item">
              <span>GRN Status</span>
              <strong>${PMS.statusBadge(payload.status)}</strong>
            </div>

            <div class="detail-item">
              <span>Received Date</span>
              <strong>${PMS.escapeHtml(payload.receivedDate)}</strong>
            </div>

            <div class="detail-item">
              <span>Notes</span>
              <strong>${PMS.escapeHtml(payload.notes || "No notes captured.")}</strong>
            </div>
          </div>

          <div class="form-actions">
            <a class="btn btn-secondary" href="/purchase-orders.html">Back to Purchase Orders</a>
            <a class="btn btn-primary" href="/purchase-order-detail.html?id=${encodeURIComponent(po.id)}">View Purchase Order</a>
          </div>
        </section>
      `);
    }
  }

  function renderGrnPage(po) {
    const poTotal = getPoTotal(po);

    PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Capture GRN</h2>
            <p class="muted">
              Capture goods received against a purchase order and identify any discrepancies.
            </p>
          </div>

          <div class="form-actions">
            <a class="btn btn-secondary" href="/purchase-orders.html">Back to Purchase Orders</a>
            <a class="btn btn-secondary" href="/purchase-order-detail.html?id=${encodeURIComponent(po.id)}">View PO</a>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="stat-card">
            <div>
              <p class="stat-label">PO Number</p>
              <h3>${PMS.escapeHtml(po.poNumber || "-")}</h3>
              <span>Purchase order being received</span>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <p class="stat-label">Supplier</p>
              <h3>${PMS.escapeHtml(po.supplierName || "Supplier ID: " + (po.supplierId || "-"))}</h3>
              <span>Awarded supplier</span>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <p class="stat-label">Ordered Value</p>
              <h3>${PMS.formatCurrency(poTotal)}</h3>
              <span>Expected purchase order value</span>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <p class="stat-label">PO Status</p>
              <h3>${PMS.statusBadge(po.status)}</h3>
              <span>Current purchase order status</span>
            </div>
          </div>
        </div>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Goods Received Note</h2>
            <p class="muted">
              Enter the received value. If it does not match the ordered value, the system will mark a discrepancy.
            </p>
          </div>
        </div>

        <form id="grnForm" class="form-grid">
          <div class="form-group">
            <label for="orderedValue">Ordered Value</label>
            <input
              id="orderedValue"
              name="orderedValue"
              type="text"
              value="${PMS.formatCurrency(poTotal)}"
              readonly
            >
          </div>

          <div class="form-group">
            <label for="receivedValue">Received Value</label>
            <input
              id="receivedValue"
              name="receivedValue"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter received value"
              required
            >
          </div>

          <div class="form-group">
            <label for="receivedDate">Received Date</label>
            <input
              id="receivedDate"
              name="receivedDate"
              type="date"
              value="${getTodayDate()}"
              required
            >
          </div>

          <div class="form-group">
            <label for="expectedDeliveryDate">Expected Delivery Date</label>
            <input
              id="expectedDeliveryDate"
              name="expectedDeliveryDate"
              type="text"
              value="${PMS.escapeHtml(po.expectedDeliveryDate || "-")}"
              readonly
            >
          </div>

          <div class="form-group full-width">
            <label for="notes">Receiving Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows="4"
              placeholder="Example: Goods received in full, damaged items, partial delivery, shortage, or other notes."
            ></textarea>
          </div>

          <div class="full-width" id="discrepancyPreview">
            ${PMS.message("info", "Enter the received value to see whether the GRN will be marked as received or discrepancy.")}
          </div>

          <div class="form-actions full-width">
            <button type="submit" class="btn btn-primary">Submit GRN</button>
            <button type="reset" class="btn btn-secondary">Clear</button>
          </div>
        </form>
      </section>
    `);

    document.getElementById("receivedValue").addEventListener("input", function () {
      renderDiscrepancyPreview(po);
    });

    document.getElementById("grnForm").addEventListener("submit", function (event) {
      submitGrn(event, po);
    });

    document.getElementById("grnForm").addEventListener("reset", function () {
      setTimeout(function () {
        renderDiscrepancyPreview(po);
      }, 0);
    });
  }

  async function start() {
    PMS.renderLayout(
      "purchase-orders",
      "Capture GRN",
      "Record goods received against a purchase order"
    );

    PMS.showLoading("Loading purchase order for GRN...");

    const po = await fetchPurchaseOrder();
    renderGrnPage(po);
  }

  start();
})();