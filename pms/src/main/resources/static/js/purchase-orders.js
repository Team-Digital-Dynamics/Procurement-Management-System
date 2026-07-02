document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("purchase-orders", "Purchase Orders", "View purchase orders created from awarded RFQs.");
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
            <p>Purchase orders are created after an RFQ has been evaluated and awarded.</p>
          </div>

          <button class="btn btn-soft" type="button" id="refreshBtn">Refresh</button>
        </div>

        ${purchaseOrdersTable(purchaseOrders)}
      </section>
    `);

    document.getElementById("refreshBtn").addEventListener("click", function () {
      loadPurchaseOrders();
    });
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
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>PO Number</th>
            <th>Supplier ID</th>
            <th>Total Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          ${purchaseOrders.map(function (po) {
            return `
              <tr>
                <td>${PMS.escapeHtml(po.id)}</td>
                <td>${PMS.escapeHtml(po.poNumber)}</td>
                <td>${PMS.escapeHtml(po.supplierId)}</td>
                <td>${PMS.formatCurrency(po.totalAmount)}</td>
                <td>${PMS.statusBadge(po.status)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}