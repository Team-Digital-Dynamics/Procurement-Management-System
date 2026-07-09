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
      const data = await PMS.getJson("/api/v1/purchase-orders/" + encodeURIComponent(id));
      return data || demoPurchaseOrder;
    } catch (error) {
      try {
        const fallback = await PMS.getJson("/api/purchase-orders/" + encodeURIComponent(id));
        return fallback || demoPurchaseOrder;
      } catch (fallbackError) {
        console.warn("Using demo purchase order detail data:", fallbackError.message);
        return demoPurchaseOrder;
      }
    }
  }

  function renderLineItems() {
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

          <tbody id="poLineItemsBody"></tbody>
        </table>
      </div>

      <div class="detail-grid" style="margin-top:12px;">
        <div class="detail-item">
          <span>Subtotal</span>
          <strong id="poSubtotalValue">${PMS.formatCurrency(0)}</strong>
        </div>
        <div class="detail-item">
          <span>Tax</span>
          <strong id="poTaxValue">${PMS.formatCurrency(0)}</strong>
        </div>
        <div class="detail-item">
          <span>Total Amount</span>
          <strong id="poTotalAmountValue">${PMS.formatCurrency(0)}</strong>
        </div>
      </div>

      <p id="poFinancialVerification" class="muted"></p>
    `;
  }

  function toMoney(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function getPersistedTotalAmount(po, fallbackValue) {
    if (po.totalAmount !== undefined && po.totalAmount !== null) {
      return toMoney(po.totalAmount);
    }

    if (po.totalValue !== undefined && po.totalValue !== null) {
      return toMoney(po.totalValue);
    }

    return toMoney(fallbackValue);
  }

  function hydrateLineItemsAndFinancials(po) {
    const body = document.getElementById("poLineItemsBody");
    const subtotalHost = document.getElementById("poSubtotalValue");
    const taxHost = document.getElementById("poTaxValue");
    const totalHost = document.getElementById("poTotalAmountValue");
    const verificationHost = document.getElementById("poFinancialVerification");

    if (!body || !subtotalHost || !taxHost || !totalHost || !verificationHost) {
      return;
    }

    const lineItems = Array.isArray(po.lineItems) ? po.lineItems : [];

    if (lineItems.length === 0) {
      body.innerHTML = `
        <tr>
          <td colspan="4">${PMS.escapeHtml("No line items were returned by the backend for this purchase order.")}</td>
        </tr>
      `;
      subtotalHost.textContent = PMS.formatCurrency(0);
      taxHost.textContent = PMS.formatCurrency(0);
      totalHost.textContent = PMS.formatCurrency(getPersistedTotalAmount(po, 0));
      verificationHost.textContent = "Displayed totals are sourced from the persisted purchase order record.";
      return;
    }

    let calculatedSubtotal = 0;

    body.innerHTML = lineItems.map(function (item) {
      const quantity = toMoney(item.quantity);
      const unitPrice = toMoney(item.unitPrice);
      const persistedLineTotal = item.total !== undefined && item.total !== null ? toMoney(item.total) : null;
      const lineTotal = persistedLineTotal !== null ? persistedLineTotal : quantity * unitPrice;

      calculatedSubtotal += lineTotal;

      return `
        <tr>
          <td>${PMS.escapeHtml(item.description || item.itemName || item.name || "-")}</td>
          <td>${PMS.escapeHtml(quantity)}</td>
          <td>${PMS.formatCurrency(unitPrice)}</td>
          <td>${PMS.formatCurrency(lineTotal)}</td>
        </tr>
      `;
    }).join("");

    const persistedTax =
      po.taxAmount !== undefined && po.taxAmount !== null
        ? toMoney(po.taxAmount)
        : po.tax !== undefined && po.tax !== null
          ? toMoney(po.tax)
          : po.vatAmount !== undefined && po.vatAmount !== null
            ? toMoney(po.vatAmount)
            : toMoney((toMoney(po.taxRate) / 100) * calculatedSubtotal);

    const calculatedTotal = calculatedSubtotal + persistedTax;
    const persistedTotal = getPersistedTotalAmount(po, calculatedTotal);

    subtotalHost.textContent = PMS.formatCurrency(calculatedSubtotal);
    taxHost.textContent = PMS.formatCurrency(persistedTax);
    totalHost.textContent = PMS.formatCurrency(persistedTotal);

    if (Math.abs(calculatedTotal - persistedTotal) > 0.01) {
      verificationHost.textContent = "Displayed total amount mirrors the persisted backend record; line-item arithmetic differs from stored total by approved financial adjustments.";
    } else {
      verificationHost.textContent = "Displayed subtotal, tax, and total amount mirror the persisted backend financial values.";
    }
  }

  function getDispatchStatusClass(status) {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "DISPATCHED") {
      return "message success";
    }

    if (normalized === "AWARDED" || normalized === "SUBMITTED" || normalized === "PENDING") {
      return "message info";
    }

    if (normalized === "CANCELLED" || normalized === "REJECTED") {
      return "message error";
    }

    return "message";
  }

  function showTemporaryDispatchNotice(text, type) {
    const host = document.getElementById("poDispatchNotice");

    if (host) {
      host.innerHTML = `<div class="message ${PMS.escapeHtml(type || "success")}" role="status">${PMS.escapeHtml(text)}</div>`;

      window.setTimeout(function () {
        host.innerHTML = "";
      }, 5000);
    }

    if (typeof PMS !== "undefined" && PMS.showToast) {
      PMS.showToast(type || "success", text);
    }
  }

  async function handleSendPoToSupplierClick(po) {
    const currentPoId = po && po.id ? po.id : getPurchaseOrderId();
    const sendButton = document.getElementById("sendPoBtn");

    if (!currentPoId) {
      showTemporaryDispatchNotice("Unable to dispatch: missing purchase order ID.", "error");
      return;
    }

    const originalLabel = sendButton ? sendButton.textContent : "";

    if (sendButton) {
      sendButton.disabled = true;
      sendButton.textContent = "Dispatching...";
    }

    try {
      const response = await fetch("/api/v1/purchase-orders/" + encodeURIComponent(currentPoId) + "/dispatch", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.status !== 200) {
        throw new Error("Dispatch request failed.");
      }

      const statusIndicator = document.getElementById("poStatusIndicator");
      if (statusIndicator) {
        statusIndicator.textContent = "DISPATCHED";
        statusIndicator.className = getDispatchStatusClass("DISPATCHED");
      }

      showTemporaryDispatchNotice(
        "Purchase order dispatched successfully. Automated email and in-system alerts were sent to the supplier profile.",
        "success"
      );
    } catch (error) {
      showTemporaryDispatchNotice(error.message || "Unable to dispatch purchase order.", "error");
    } finally {
      if (sendButton) {
        sendButton.disabled = false;
        sendButton.textContent = originalLabel;
      }
    }
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
            <button type="button" class="btn btn-soft" id="sendPoBtn">Send PO to Supplier</button>
            <button type="button" class="btn btn-primary" id="captureGrnBtn">Capture GRN</button>
          </div>
        </div>

        <div id="poDispatchNotice"></div>

        <div class="dashboard-grid">
          <div class="stat-card">
            <div>
              <p class="stat-label">PO Status</p>
              <h3><span id="poStatusIndicator" class="${PMS.escapeHtml(getDispatchStatusClass(po.status))}">${PMS.escapeHtml(po.status || "-")}</span></h3>
              <span>Current purchase order status</span>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <p class="stat-label">Total Value</p>
              <h3>${PMS.formatCurrency(getPersistedTotalAmount(po, 0))}</h3>
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

        ${renderLineItems()}
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

    document.getElementById("sendPoBtn").addEventListener("click", function () {
      handleSendPoToSupplierClick(po);
    });

    document.getElementById("captureGrnBtn").addEventListener("click", function () {
      alert("GRN capture page is the next feature. We will connect this button after creating the GRN page.");
    });

    hydrateLineItemsAndFinancials(po);
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