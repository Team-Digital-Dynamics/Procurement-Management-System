let purchaseOrderRecords = [];
let purchaseOrdersUseDemoData = false;

document.addEventListener("DOMContentLoaded", async function () {
  PMS.renderLayout(
    "my-purchase-orders",
    "My Purchase Orders",
    "View purchase orders awarded to suppliers."
  );

  await loadMyPurchaseOrdersPage();
});

async function loadMyPurchaseOrdersPage() {
  if (!PMS.hasAnyRole(["SUPPLIER", "ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"])) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", "You do not have permission to access supplier purchase orders.")}
      </section>
    `);
    return;
  }

  PMS.showLoading("Loading purchase orders...");

  try {
    purchaseOrderRecords = await loadPurchaseOrderRecords();
    purchaseOrdersUseDemoData = false;
  } catch (error) {
    purchaseOrderRecords = getDemoPurchaseOrders();
    purchaseOrdersUseDemoData = true;
  }

  renderMyPurchaseOrdersPage();
}

async function loadPurchaseOrderRecords() {
  const possibleEndpoints = [
    "/api/purchase-orders/my",
    "/api/v1/purchase-orders/my",
    "/api/supplier/purchase-orders",
    "/api/v1/supplier/purchase-orders",
    "/api/purchase-orders",
    "/api/v1/purchase-orders"
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await PMS.getJson(endpoint);
      const list = extractList(response);

      if (list.length > 0) {
        return list.map(normalisePurchaseOrderRecord);
      }
    } catch (error) {
      // Try next endpoint.
    }
  }

  throw new Error("No purchase order endpoint returned data.");
}

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.purchaseOrders)) return response.purchaseOrders;
  if (Array.isArray(response?.orders)) return response.orders;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.purchaseOrders)) return response.data.purchaseOrders;

  return [];
}

function normalisePurchaseOrderRecord(item, index) {
  const supplier = item.supplier || {};
  const quotation = item.quotation || {};
  const rfq = item.rfq || quotation.rfq || {};

  return {
    id: item.id || item.purchaseOrderId || item.poId || `PO-${index + 1}`,
    poNumber: item.poNumber || item.purchaseOrderNumber || `PO-${item.id || index + 1}`,
    supplierId: item.supplierId || supplier.id || "-",
    supplierName: item.supplierName || supplier.name || "Supplier",
    quotationId: item.quotationId || quotation.id || "-",
    rfqId: item.rfqId || rfq.id || "-",
    rfqNumber: item.rfqNumber || rfq.rfqNumber || `RFQ-${item.rfqId || rfq.id || "-"}`,
    totalAmount: item.totalAmount || item.amount || item.value || 0,
    status: item.status || item.purchaseOrderStatus || "OPEN",
    createdAt: item.createdAt || item.createdDate || item.poDate || item.issuedAt || null,
    deliveryDate: item.deliveryDate || item.expectedDeliveryDate || item.requiredDate || null,
    notes: item.notes || item.description || "-"
  };
}

function renderMyPurchaseOrdersPage() {
  const totalValue = purchaseOrderRecords.reduce(function (sum, item) {
    return sum + Number(item.totalAmount || 0);
  }, 0);

  const openCount = purchaseOrderRecords.filter(function (item) {
    return ["OPEN", "APPROVED", "ISSUED"].includes(String(item.status || "").toUpperCase());
  }).length;

  const receivedCount = purchaseOrderRecords.filter(function (item) {
    return String(item.status || "").toUpperCase() === "RECEIVED";
  }).length;

  const discrepancyCount = purchaseOrderRecords.filter(function (item) {
    return String(item.status || "").toUpperCase() === "DISCREPANCY";
  }).length;

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Supplier Purchase Orders</h2>
          <p>Track awarded purchase orders, values, delivery dates and receiving status.</p>
        </div>

        <div class="page-actions">
          <button id="refreshPurchaseOrdersBtn" class="btn btn-soft" type="button">
            Refresh
          </button>

          <button id="exportPurchaseOrdersBtn" class="btn btn-primary" type="button">
            Export CSV
          </button>
        </div>
      </div>

      ${
        purchaseOrdersUseDemoData
          ? `
            <div class="info-panel">
              No backend purchase order endpoint was found yet. This page is currently showing demo data so the frontend checklist item can be tested.
            </div>
          `
          : ""
      }

      <div class="grid-4">
        <article class="stat-card">
          <div class="label">Total POs</div>
          <div class="value">${purchaseOrderRecords.length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Total Value</div>
          <div class="value">${PMS.formatCurrency(totalValue)}</div>
        </article>

        <article class="stat-card">
          <div class="label">Open / Issued</div>
          <div class="value">${openCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Received</div>
          <div class="value">${receivedCount}</div>
        </article>
      </div>

      <div class="grid-3">
        <article class="stat-card">
          <div class="label">Discrepancies</div>
          <div class="value">${discrepancyCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Latest PO</div>
          <div class="value">${purchaseOrderRecords.length ? PMS.formatDate(purchaseOrderRecords[0].createdAt) : "-"}</div>
        </article>

        <article class="stat-card">
          <div class="label">Suppliers</div>
          <div class="value">${getUniqueValues(purchaseOrderRecords, "supplierName").length}</div>
        </article>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Purchase Order Records</h2>
            <p>Use the table filter to search by PO number, supplier, RFQ, value, status or date.</p>
          </div>
        </div>

        <div id="myPurchaseOrdersTable"></div>
      </div>
    </section>
  `);

  renderMyPurchaseOrdersTable();
  attachPurchaseOrderEvents();
}

function renderMyPurchaseOrdersTable() {
  PMS.renderDataTable({
    container: "myPurchaseOrdersTable",
    title: "My Purchase Orders",
    rows: purchaseOrderRecords,
    pageSize: 10,
    searchPlaceholder: "Filter purchase orders...",
    emptyTitle: "No purchase orders found",
    emptyText: "There are no purchase orders to display yet.",
    columns: [
      {
        label: "Status",
        key: "status",
        render: function (item) {
          return PMS.statusBadge(item.status);
        },
        searchValue: function (item) {
          return item.status;
        }
      },
      {
        label: "PO Number",
        key: "poNumber",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.poNumber)}</strong>
            <p class="muted">ID: ${PMS.escapeHtml(item.id)}</p>
          `;
        },
        searchValue: function (item) {
          return `${item.poNumber} ${item.id}`;
        }
      },
      {
        label: "Supplier",
        key: "supplierName",
        render: function (item) {
          return PMS.escapeHtml(item.supplierName);
        }
      },
      {
        label: "RFQ",
        key: "rfqNumber",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.rfqNumber)}</strong>
            <p class="muted">Quotation: ${PMS.escapeHtml(item.quotationId)}</p>
          `;
        },
        searchValue: function (item) {
          return `${item.rfqNumber} ${item.rfqId} ${item.quotationId}`;
        }
      },
      {
        label: "Amount",
        key: "totalAmount",
        render: function (item) {
          return PMS.formatCurrency(item.totalAmount);
        }
      },
      {
        label: "Issued",
        key: "createdAt",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatDateTime(item.createdAt));
        },
        searchValue: function (item) {
          return PMS.formatDateTime(item.createdAt);
        }
      },
      {
        label: "Expected Delivery",
        key: "deliveryDate",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatDate(item.deliveryDate));
        },
        searchValue: function (item) {
          return PMS.formatDate(item.deliveryDate);
        }
      },
      {
        label: "Notes",
        key: "notes",
        render: function (item) {
          return PMS.escapeHtml(item.notes || "-");
        }
      }
    ]
  });
}

function attachPurchaseOrderEvents() {
  const refreshBtn = document.getElementById("refreshPurchaseOrdersBtn");
  const exportBtn = document.getElementById("exportPurchaseOrdersBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async function () {
      PMS.showToast("info", "Refreshing purchase orders...");
      await loadMyPurchaseOrdersPage();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      exportPurchaseOrdersCsv();
    });
  }
}

function exportPurchaseOrdersCsv() {
  if (purchaseOrderRecords.length === 0) {
    PMS.showToast("warning", "There are no purchase orders to export.");
    return;
  }

  const headers = [
    "Status",
    "PO Number",
    "PO ID",
    "Supplier",
    "RFQ Number",
    "RFQ ID",
    "Quotation ID",
    "Amount",
    "Issued Date",
    "Expected Delivery",
    "Notes"
  ];

  const rows = purchaseOrderRecords.map(function (item) {
    return [
      item.status,
      item.poNumber,
      item.id,
      item.supplierName,
      item.rfqNumber,
      item.rfqId,
      item.quotationId,
      item.totalAmount,
      PMS.formatDateTime(item.createdAt),
      PMS.formatDate(item.deliveryDate),
      item.notes
    ];
  });

  const csv = [headers, ...rows]
    .map(function (row) {
      return row.map(csvValue).join(",");
    })
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `my-purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);

  PMS.showToast("success", "Purchase orders exported.");
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function getUniqueValues(records, key) {
  return Array.from(new Set(records.map(function (item) {
    return item[key];
  }).filter(Boolean))).sort();
}

function getDemoPurchaseOrders() {
  return [
    {
      id: "PO-001",
      poNumber: "PO-2026-001",
      supplierId: "SUP-001",
      supplierName: "ABC Office Supplies",
      quotationId: "QT-001",
      rfqId: "RFQ-101",
      rfqNumber: "RFQ-2026-101",
      totalAmount: 18500,
      status: "RECEIVED",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      deliveryDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      notes: "Laptop replacement order."
    },
    {
      id: "PO-002",
      poNumber: "PO-2026-002",
      supplierId: "SUP-002",
      supplierName: "TechWorld SA",
      quotationId: "QT-002",
      rfqId: "RFQ-102",
      rfqNumber: "RFQ-2026-102",
      totalAmount: 42500,
      status: "APPROVED",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      deliveryDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      notes: "IT hardware purchase order."
    },
    {
      id: "PO-003",
      poNumber: "PO-2026-003",
      supplierId: "SUP-003",
      supplierName: "ScanTech Supplies",
      quotationId: "QT-003",
      rfqId: "RFQ-103",
      rfqNumber: "RFQ-2026-103",
      totalAmount: 12900,
      status: "DISCREPANCY",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      deliveryDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      notes: "Warehouse scanner devices. GRN discrepancy flagged."
    }
  ];
}