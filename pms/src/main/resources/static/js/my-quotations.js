let quotationRecords = [];
let quotationUsesDemoData = false;

document.addEventListener("DOMContentLoaded", async function () {
  PMS.renderLayout(
    "my-quotations",
    "My Quotations",
    "View quotations previously submitted through the supplier portal."
  );

  await loadMyQuotationsPage();
});

async function loadMyQuotationsPage() {
  if (!PMS.hasAnyRole(["SUPPLIER", "ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"])) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", "You do not have permission to access supplier quotations.")}
      </section>
    `);
    return;
  }

  PMS.showLoading("Loading quotations...");

  try {
    quotationRecords = await loadQuotationRecords();
    quotationUsesDemoData = false;
  } catch (error) {
    quotationRecords = getDemoQuotations();
    quotationUsesDemoData = true;
  }

  renderMyQuotationsPage();
}

async function loadQuotationRecords() {
  const possibleEndpoints = [
    "/api/quotations/my",
    "/api/v1/quotations/my",
    "/api/supplier/quotations",
    "/api/v1/supplier/quotations",
    "/api/quotations",
    "/api/v1/quotations"
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await PMS.getJson(endpoint);
      const list = extractList(response);

      if (list.length > 0) {
        return list.map(normaliseQuotationRecord);
      }
    } catch (error) {
      // Try next endpoint.
    }
  }

  throw new Error("No quotation endpoint returned data.");
}

function extractList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.quotations)) return response.quotations;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.quotations)) return response.data.quotations;

  return [];
}

function normaliseQuotationRecord(item, index) {
  const supplier = item.supplier || {};
  const rfq = item.rfq || {};

  return {
    id: item.id || item.quotationId || `QT-${index + 1}`,
    quotationNumber: item.quotationNumber || item.reference || `QT-${item.id || index + 1}`,
    rfqId: item.rfqId || rfq.id || "-",
    rfqNumber: item.rfqNumber || rfq.rfqNumber || `RFQ-${item.rfqId || rfq.id || "-"}`,
    supplierId: item.supplierId || supplier.id || "-",
    supplierName: item.supplierName || supplier.name || "Supplier",
    totalAmount: item.totalAmount || item.amount || item.price || 0,
    deliveryDays: item.deliveryDays || item.deliveryTime || "-",
    evaluationScore: item.evaluationScore || item.score || null,
    status: getQuotationStatus(item),
    submittedAt: item.submittedAt || item.createdAt || item.createdDate || null,
    winning: Boolean(item.winning || item.isWinning)
  };
}

function getQuotationStatus(item) {
  if (item.status) return item.status;
  if (item.winning || item.isWinning) return "AWARDED";
  if (item.evaluationScore) return "EVALUATED";
  return "SUBMITTED";
}

function renderMyQuotationsPage() {
  const totalValue = quotationRecords.reduce(function (sum, item) {
    return sum + Number(item.totalAmount || 0);
  }, 0);

  const awardedCount = quotationRecords.filter(function (item) {
    return item.status === "AWARDED" || item.winning;
  }).length;

  const evaluatedCount = quotationRecords.filter(function (item) {
    return item.status === "EVALUATED";
  }).length;

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Submitted Quotations</h2>
          <p>Review quotations submitted against RFQs, including amount, delivery days and outcome.</p>
        </div>

        <div class="page-actions">
          <button id="refreshQuotationsBtn" class="btn btn-soft" type="button">
            Refresh
          </button>

          <button id="exportQuotationsBtn" class="btn btn-primary" type="button">
            Export CSV
          </button>
        </div>
      </div>

      ${
        quotationUsesDemoData
          ? PMS.message(
              "error",
              "No backend quotation endpoint was found yet. This page is currently showing demo data so the frontend checklist item can be tested."
            )
          : ""
      }

      <div class="grid-4">
        <article class="stat-card">
          <div class="label">Total Quotations</div>
          <div class="value">${quotationRecords.length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Total Quoted Value</div>
          <div class="value">${PMS.formatCurrency(totalValue)}</div>
        </article>

        <article class="stat-card">
          <div class="label">Awarded</div>
          <div class="value">${awardedCount}</div>
        </article>

        <article class="stat-card">
          <div class="label">Evaluated</div>
          <div class="value">${evaluatedCount}</div>
        </article>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Quotation Records</h2>
            <p>Use the filter to search by quotation number, RFQ, supplier, amount or status.</p>
          </div>
        </div>

        <div id="myQuotationsTable"></div>
      </div>
    </section>
  `);

  renderMyQuotationsTable();
  attachMyQuotationEvents();
}

function renderMyQuotationsTable() {
  PMS.renderDataTable({
    container: "myQuotationsTable",
    title: "My Quotations",
    rows: quotationRecords,
    pageSize: 10,
    searchPlaceholder: "Filter quotations...",
    emptyTitle: "No quotations found",
    emptyText: "There are no submitted quotations to display yet.",
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
        label: "Quotation",
        key: "quotationNumber",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.quotationNumber)}</strong>
            <p class="muted">ID: ${PMS.escapeHtml(item.id)}</p>
          `;
        },
        searchValue: function (item) {
          return `${item.quotationNumber} ${item.id}`;
        }
      },
      {
        label: "RFQ",
        key: "rfqNumber",
        render: function (item) {
          return `
            <strong>${PMS.escapeHtml(item.rfqNumber)}</strong>
            <p class="muted">RFQ ID: ${PMS.escapeHtml(item.rfqId)}</p>
          `;
        },
        searchValue: function (item) {
          return `${item.rfqNumber} ${item.rfqId}`;
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
        label: "Amount",
        key: "totalAmount",
        render: function (item) {
          return PMS.formatCurrency(item.totalAmount);
        }
      },
      {
        label: "Delivery",
        key: "deliveryDays",
        render: function (item) {
          return `${PMS.escapeHtml(item.deliveryDays)} days`;
        }
      },
      {
        label: "Score",
        key: "evaluationScore",
        render: function (item) {
          return item.evaluationScore === null || item.evaluationScore === undefined
            ? "-"
            : PMS.escapeHtml(Number(item.evaluationScore).toFixed(2));
        }
      },
      {
        label: "Submitted",
        key: "submittedAt",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatDateTime(item.submittedAt));
        },
        searchValue: function (item) {
          return PMS.formatDateTime(item.submittedAt);
        }
      }
    ]
  });
}

function attachMyQuotationEvents() {
  const refreshBtn = document.getElementById("refreshQuotationsBtn");
  const exportBtn = document.getElementById("exportQuotationsBtn");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async function () {
      PMS.showToast("info", "Refreshing quotations...");
      await loadMyQuotationsPage();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      exportQuotationsCsv();
    });
  }
}

function exportQuotationsCsv() {
  if (quotationRecords.length === 0) {
    PMS.showToast("warning", "There are no quotations to export.");
    return;
  }

  const headers = [
    "Status",
    "Quotation Number",
    "Quotation ID",
    "RFQ Number",
    "RFQ ID",
    "Supplier",
    "Amount",
    "Delivery Days",
    "Evaluation Score",
    "Submitted Date"
  ];

  const rows = quotationRecords.map(function (item) {
    return [
      item.status,
      item.quotationNumber,
      item.id,
      item.rfqNumber,
      item.rfqId,
      item.supplierName,
      item.totalAmount,
      item.deliveryDays,
      item.evaluationScore ?? "",
      PMS.formatDateTime(item.submittedAt)
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
  link.download = `my-quotations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);

  PMS.showToast("success", "Quotations exported.");
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function getDemoQuotations() {
  return [
    {
      id: "QT-001",
      quotationNumber: "QT-2026-001",
      rfqId: "RFQ-101",
      rfqNumber: "RFQ-2026-101",
      supplierId: "SUP-001",
      supplierName: "ABC Office Supplies",
      totalAmount: 18500,
      deliveryDays: 7,
      evaluationScore: 91.35,
      status: "AWARDED",
      submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      winning: true
    },
    {
      id: "QT-002",
      quotationNumber: "QT-2026-002",
      rfqId: "RFQ-102",
      rfqNumber: "RFQ-2026-102",
      supplierId: "SUP-001",
      supplierName: "ABC Office Supplies",
      totalAmount: 42500,
      deliveryDays: 14,
      evaluationScore: 82.1,
      status: "EVALUATED",
      submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      winning: false
    },
    {
      id: "QT-003",
      quotationNumber: "QT-2026-003",
      rfqId: "RFQ-103",
      rfqNumber: "RFQ-2026-103",
      supplierId: "SUP-001",
      supplierName: "ABC Office Supplies",
      totalAmount: 12900,
      deliveryDays: 5,
      evaluationScore: null,
      status: "SUBMITTED",
      submittedAt: new Date(Date.now() - 86400000).toISOString(),
      winning: false
    }
  ];
}