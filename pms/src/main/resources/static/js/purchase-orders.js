document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "purchase-orders",
    "Purchase Orders",
    "View purchase orders created from awarded RFQs."
  );

  loadPurchaseOrders();
});

async function loadPurchaseOrders(messageHtml) {
  PMS.showLoading("Loading purchase orders...");

  try {
    const purchaseOrders = await PMS.getJson("/api/purchase-orders");

    PMS.setContent(`
      ${messageHtml || ""}

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Purchase Order Register</h2>
            <p class="muted">
              Purchase orders are created after an RFQ has been evaluated and awarded.
            </p>
          </div>

          <div class="form-actions">
            <button class="btn btn-secondary" type="button" id="refreshBtn">
              Refresh
            </button>
          </div>
        </div>

        ${purchaseOrdersTable(purchaseOrders)}
      </section>
    `);

    const refreshBtn = document.getElementById("refreshBtn");

    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        loadPurchaseOrders();
      });
    }
  } catch (error) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", error.message)}
      </section>
    `);
  }
}

function purchaseOrdersTable(purchaseOrders) {
  if (!Array.isArray(purchaseOrders) || purchaseOrders.length === 0) {
    return PMS.emptyState(
      "No purchase orders found",
      "A purchase order will appear here after an RFQ has been evaluated and awarded."
    );
  }

  return `
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>PO Number</th>
            <th>Supplier</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${purchaseOrders.map(function (po) {
            return `
              <tr>
                <td>${PMS.escapeHtml(po.id || "-")}</td>
                <td>${PMS.escapeHtml(po.poNumber || "-")}</td>
                <td>${PMS.escapeHtml(getSupplierDisplay(po))}</td>
                <td>${PMS.formatCurrency(getPoAmount(po))}</td>
                <td>${PMS.statusBadge(po.status)}</td>
                <td>
                  <div class="table-actions">
                    <a
                      class="btn btn-sm btn-secondary"
                      href="/purchase-order-detail.html?id=${encodeURIComponent(po.id)}"
                    >
                      View PO
                    </a>

                    <button
                      class="btn btn-sm btn-primary"
                      type="button"
                      onclick="goToGrnPlaceholder('${PMS.escapeHtml(po.id)}')"
                    >
                      Capture GRN
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

function getSupplierDisplay(po) {
  if (po.supplierName) {
    return po.supplierName;
  }

  if (po.supplierId) {
    return "Supplier ID: " + po.supplierId;
  }

  return "-";
}

function getPoAmount(po) {
  if (po.totalAmount !== undefined && po.totalAmount !== null) {
    return po.totalAmount;
  }

  if (po.totalValue !== undefined && po.totalValue !== null) {
    return po.totalValue;
  }

  if (po.amount !== undefined && po.amount !== null) {
    return po.amount;
  }

  return 0;
}

function goToGrnPlaceholder(poId) {
  window.location.href = "/grn-capture.html?poId=" + encodeURIComponent(poId);
}