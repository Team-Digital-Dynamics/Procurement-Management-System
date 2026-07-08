document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "purchase-orders",
    "Purchase Orders",
    "View purchase orders created from awarded RFQs."
  );

  loadPurchaseOrders();
});

const poGenerationInFlight = new Set();
const PO_ALREADY_GENERATED_WARNING = "Action Blocked: A Purchase Order has already been generated for this item.";

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

        <div id="poActionAlert"></div>

        ${purchaseOrdersTable(purchaseOrders)}
      </section>
    `);

    const refreshBtn = document.getElementById("refreshBtn");

    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        loadPurchaseOrders();
      });
    }

    wireGeneratePoHandlers(purchaseOrders);
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
            const isGenerated = hasPurchaseOrderAlready(po);
            const trackId = po.id || po.rfqId || po.requisitionId || "";

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

                    <button
                      class="btn btn-sm btn-soft"
                      type="button"
                      data-generate-po-btn="${PMS.escapeHtml(trackId)}"
                      data-track-id="${PMS.escapeHtml(trackId)}"
                      data-rfq-id="${PMS.escapeHtml(po.rfqId || "")}"
                      data-requisition-id="${PMS.escapeHtml(po.requisitionId || "")}"
                      data-supplier-id="${PMS.escapeHtml(po.supplierId || "")}"
                      ${isGenerated ? "disabled aria-disabled=\"true\"" : ""}
                    >
                      ${isGenerated ? "PO Generated" : "Generate PO"}
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

function hasPurchaseOrderAlready(item) {
  const status = String(item?.status || "").toUpperCase();

  return Boolean(
    item?.poGenerated ||
    item?.poId ||
    item?.purchaseOrderId ||
    item?.poNumber ||
    status === "AWARDED" ||
    status === "PO_CREATED" ||
    status === "PO_GENERATED" ||
    status === "DISPATCHED"
  );
}

function wireGeneratePoHandlers(items) {
  const buttons = document.querySelectorAll("[data-generate-po-btn]");

  buttons.forEach(function (button) {
    const trackId = String(button.dataset.trackId || "");
    const item = Array.isArray(items)
      ? items.find(function (entry) {
          const entryId = String(entry.id || entry.rfqId || entry.requisitionId || "");
          return entryId === trackId;
        })
      : null;

    if (hasPurchaseOrderAlready(item || {})) {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      return;
    }

    button.addEventListener("click", function () {
      attemptGeneratePo(item || {}, button);
    });
  });
}

async function attemptGeneratePo(item, button) {
  const trackId = String(
    item?.id ||
    item?.rfqId ||
    item?.requisitionId ||
    button?.dataset?.trackId ||
    ""
  );

  if (button && button.disabled) {
    showPoAlreadyGeneratedWarning();
    return;
  }

  if (poGenerationInFlight.has(trackId)) {
    showPoAlreadyGeneratedWarning();
    return;
  }

  const payload = {
    rfqId: Number(item?.rfqId || button?.dataset?.rfqId || 0) || null,
    requisitionId: Number(item?.requisitionId || button?.dataset?.requisitionId || 0) || null,
    supplierId: Number(item?.supplierId || button?.dataset?.supplierId || 0) || null
  };

  poGenerationInFlight.add(trackId);

  if (button) {
    button.disabled = true;
    button.textContent = "Generating...";
  }

  try {
    const response = await fetch("/api/v1/purchase-orders/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 409 || response.status === 400) {
      showPoAlreadyGeneratedWarning();
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to generate purchase order.");
    }

    if (button) {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.textContent = "PO Generated";
    }

    if (typeof PMS !== "undefined" && PMS.showToast) {
      PMS.showToast("success", "Purchase order generated successfully.");
    }
  } catch (error) {
    if (button) {
      button.disabled = false;
      button.textContent = "Generate PO";
    }

    if (typeof PMS !== "undefined" && PMS.showToast) {
      PMS.showToast("error", error.message || "Unable to generate purchase order.");
    }
  } finally {
    poGenerationInFlight.delete(trackId);
  }
}

function showPoAlreadyGeneratedWarning() {
  const host = document.getElementById("poActionAlert");

  if (host) {
    host.innerHTML = PMS.message("warning", PO_ALREADY_GENERATED_WARNING);
  }

  if (typeof PMS !== "undefined" && PMS.showToast) {
    PMS.showToast("warning", PO_ALREADY_GENERATED_WARNING);
  }
}