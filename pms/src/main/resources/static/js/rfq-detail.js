document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "rfq-detail",
    "RFQ Detail",
    "View RFQ information, quotation progress and award status."
  );

  loadRfqDetail();
});

async function loadRfqDetail() {
  PMS.showLoading("Loading RFQ detail...");

  try {
    const params = new URLSearchParams(window.location.search);
    const rfqId = params.get("id");

    if (!rfqId) {
      PMS.setContent(`
        <section class="view-section">
          ${PMS.message("error", "No RFQ ID was provided.")}
          <a class="btn btn-soft" href="/rfqs.html">Back to RFQs</a>
        </section>
      `);
      return;
    }

    const rfqs = await safeGet("/api/rfqs", []);
    const requisitions = await safeGet("/api/requisitions", []);
    const purchaseOrders = await safeGet("/api/purchase-orders", []);

    const rfq = rfqs.find(function (item) {
      return String(item.id) === String(rfqId);
    });

    if (!rfq) {
      PMS.setContent(`
        <section class="view-section">
          ${PMS.message("error", "RFQ could not be found.")}
          <a class="btn btn-soft" href="/rfqs.html">Back to RFQs</a>
        </section>
      `);
      return;
    }

    const linkedRequisition = findLinkedRequisition(rfq, requisitions);
    const linkedPurchaseOrder = findLinkedPurchaseOrder(rfq, purchaseOrders);
    const quotations = getRfqQuotations(rfq, rfqId);

    PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>${PMS.escapeHtml(getRfqTitle(rfq))}</h2>
            <p>RFQ ID: ${PMS.escapeHtml(rfq.id)}</p>
          </div>

          <div class="action-row">
            <a class="btn btn-soft" href="/rfqs.html">Back to RFQs</a>
            ${linkedRequisition
              ? `<a class="btn btn-soft" href="/requisition-detail.html?id=${PMS.escapeHtml(linkedRequisition.id)}">View Requisition</a>`
              : ""
            }
          </div>
        </div>

        <section class="grid-4">
          ${detailCard("RFQ Status", PMS.statusBadge(rfq.status), "Current RFQ workflow status", true)}
          ${detailCard("RFQ ID", rfq.id, "System reference number")}
          ${detailCard("Linked Requisition", linkedRequisition ? linkedRequisition.title : "Not available", "Original approved request")}
          ${detailCard("Purchase Order", linkedPurchaseOrder ? `PO #${linkedPurchaseOrder.id}` : "Not yet created", "Award outcome")}
        </section>
      </section>

      <section class="grid-2">
        <div class="view-section">
          <div class="section-header">
            <div>
              <h2>RFQ Summary</h2>
              <p>Key information linked to this request for quotation.</p>
            </div>
          </div>

          ${rfqSummary(rfq, linkedRequisition)}
        </div>

        <div class="view-section">
          <div class="section-header">
            <div>
              <h2>RFQ Progress</h2>
              <p>Current position in the RFQ process.</p>
            </div>
          </div>

          ${rfqTimeline(rfq.status, linkedPurchaseOrder)}
        </div>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Supplier Quotations</h2>
            <p>Quotations and evaluation information received for this RFQ.</p>
          </div>
        </div>

        ${quotationsTable(quotations)}
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Award Status</h2>
            <p>Recommended or awarded supplier information.</p>
          </div>
        </div>

        ${awardStatus(rfq, quotations, linkedPurchaseOrder)}
      </section>
    `);
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

async function safeGet(url, fallback) {
  try {
    return await PMS.getJson(url);
  } catch (error) {
    return fallback;
  }
}

function getRfqTitle(rfq) {
  return rfq.title || rfq.reference || rfq.rfqNumber || `RFQ #${rfq.id}`;
}

function findLinkedRequisition(rfq, requisitions) {
  const requisitionId =
    rfq.requisitionId ||
    rfq.requisition?.id ||
    rfq.requestId;

  if (!requisitionId || !Array.isArray(requisitions)) {
    return null;
  }

  return requisitions.find(function (item) {
    return String(item.id) === String(requisitionId);
  }) || null;
}

function findLinkedPurchaseOrder(rfq, purchaseOrders) {
  if (!Array.isArray(purchaseOrders)) {
    return null;
  }

  return purchaseOrders.find(function (po) {
    return (
      String(po.rfqId || po.rfq?.id || "") === String(rfq.id) ||
      String(po.requisitionId || po.requisition?.id || "") === String(rfq.requisitionId || rfq.requisition?.id || "")
    );
  }) || null;
}

function getRfqQuotations(rfq, rfqId) {
  const directQuotations =
    rfq.quotations ||
    rfq.quotes ||
    rfq.supplierQuotations ||
    rfq.evaluations ||
    [];

  if (Array.isArray(directQuotations) && directQuotations.length > 0) {
    return directQuotations;
  }

  const stored = getStoredEvaluatedQuotations();

  return stored.filter(function (item) {
    return String(item.rfqId || item.rfq?.id || "") === String(rfqId);
  });
}

function getStoredEvaluatedQuotations() {
  try {
    const raw = sessionStorage.getItem("pmsEvaluatedQuotations");
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function detailCard(label, value, text, isHtml) {
  return `
    <div class="stat-card detail-card">
      <p class="label">${PMS.escapeHtml(label)}</p>
      <p class="value detail-card-value">${isHtml ? value : PMS.escapeHtml(value)}</p>
      <p class="muted">${PMS.escapeHtml(text)}</p>
    </div>
  `;
}

function rfqSummary(rfq, linkedRequisition) {
  return `
    <div class="detail-list">
      <div>
        <span>RFQ ID</span>
        <strong>${PMS.escapeHtml(rfq.id)}</strong>
      </div>

      <div>
        <span>Status</span>
        <strong>${PMS.escapeHtml(PMS.formatStatus ? PMS.formatStatus(rfq.status) : rfq.status)}</strong>
      </div>

      <div>
        <span>Linked Requisition</span>
        <strong>${PMS.escapeHtml(linkedRequisition ? linkedRequisition.title : "Not available")}</strong>
      </div>

      <div>
        <span>Requisition Value</span>
        <strong>${linkedRequisition ? PMS.formatCurrency(linkedRequisition.totalAmount) : "Not available"}</strong>
      </div>

      <div>
        <span>Created Date</span>
        <strong>${formatPossibleDate(rfq.createdAt || rfq.createdDate || rfq.dateCreated)}</strong>
      </div>

     <div>
  <span>Submission Deadline</span>
  <strong>${formatPossibleDate(rfq.submissionDeadline || rfq.closingDate || rfq.deadline || rfq.validUntil)}</strong>
</div>
  `;
}

function formatPossibleDate(value) {
  if (!value) {
    return "Not available";
  }

  try {
    return PMS.formatDateTime ? PMS.formatDateTime(value) : String(value);
  } catch (error) {
    return String(value);
  }
}

function rfqTimeline(status, purchaseOrder) {
  const currentStatus = String(status || "").toUpperCase();

  const steps = [
    {
      key: "OPEN",
      label: "RFQ Created",
      text: "The RFQ has been opened for supplier quotations."
    },
    {
      key: "QUOTATIONS_RECEIVED",
      label: "Quotations Received",
      text: "Suppliers have submitted quotations."
    },
    {
      key: "EVALUATED",
      label: "Evaluated",
      text: "Supplier quotations have been evaluated."
    },
    {
      key: "AWARDED",
      label: "Awarded",
      text: "A supplier has been selected."
    },
    {
      key: "PO_CREATED",
      label: "Purchase Order Created",
      text: "A purchase order has been generated."
    }
  ];

  const statusOrder = {
    DRAFT: 0,
    OPEN: 0,
    RFQ_CREATED: 0,
    SUBMITTED: 1,
    QUOTATIONS_RECEIVED: 1,
    EVALUATED: 2,
    CLOSED: 2,
    AWARDED: 3,
    PO_CREATED: 4
  };

  let activeIndex = statusOrder[currentStatus];

  if (purchaseOrder) {
    activeIndex = 4;
  }

  if (activeIndex === undefined) {
    activeIndex = 0;
  }

  return `
    <div class="workflow-timeline">
      ${steps.map(function (step, index) {
        return timelineItem(step, activeIndex >= index);
      }).join("")}
    </div>
  `;
}

function timelineItem(step, complete) {
  return `
    <div class="timeline-item ${complete ? "complete" : ""}">
      <div class="timeline-dot"></div>
      <div>
        <strong>${PMS.escapeHtml(step.label)}</strong>
        <p>${PMS.escapeHtml(step.text)}</p>
      </div>
    </div>
  `;
}

function quotationsTable(quotations) {
  if (!Array.isArray(quotations) || quotations.length === 0) {
    return PMS.emptyState(
      "No quotations found",
      "No supplier quotations are currently linked to this RFQ, or the backend response does not include quotation details yet."
    );
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Amount</th>
            <th>Delivery Days</th>
            <th>Quality Score</th>
            <th>Terms Score</th>
            <th>Total Score</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          ${quotations.map(function (quote) {
            return `
              <tr>
                <td>${PMS.escapeHtml(getSupplierName(quote))}</td>
                <td>${PMS.formatCurrency(getQuoteAmount(quote))}</td>
                <td>${PMS.escapeHtml(quote.deliveryDays || quote.deliveryLeadTime || "N/A")}</td>
                <td>${PMS.escapeHtml(quote.qualityScore || quote.quality || "N/A")}</td>
                <td>${PMS.escapeHtml(quote.termsScore || quote.terms || "N/A")}</td>
                <td><strong>${PMS.escapeHtml(getTotalScore(quote))}</strong></td>
                <td>${PMS.statusBadge(getQuoteStatus(quote))}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getSupplierName(quote) {
  return (
    quote.supplierName ||
    quote.supplier?.name ||
    quote.supplierEmail ||
    quote.supplier?.email ||
    "Supplier"
  );
}

function getQuoteAmount(quote) {
  return (
    quote.totalAmount ||
    quote.amount ||
    quote.quotedAmount ||
    quote.price ||
    0
  );
}

function getTotalScore(quote) {
  return (
    quote.totalScore ||
    quote.score ||
    quote.evaluationScore ||
    quote.weightedScore ||
    "N/A"
  );
}

function getQuoteStatus(quote) {
  return (
    quote.status ||
    quote.awardStatus ||
    "RECEIVED"
  );
}

function awardStatus(rfq, quotations, purchaseOrder) {
  if (purchaseOrder) {
    return `
      <div class="success-panel">
        <h3>Purchase Order Created</h3>
        <p>This RFQ has progressed to purchase order stage.</p>
        <a class="btn btn-primary" href="/purchase-orders.html">Open Purchase Orders</a>
      </div>
    `;
  }

  const recommended = findRecommendedQuotation(quotations);

  if (recommended) {
    return `
      <div class="success-panel">
        <h3>Recommended Supplier</h3>
        <p>
          ${PMS.escapeHtml(getSupplierName(recommended))} is currently recommended based on the available evaluation score.
        </p>
        <div class="detail-list">
          <div>
            <span>Supplier</span>
            <strong>${PMS.escapeHtml(getSupplierName(recommended))}</strong>
          </div>
          <div>
            <span>Amount</span>
            <strong>${PMS.formatCurrency(getQuoteAmount(recommended))}</strong>
          </div>
          <div>
            <span>Total Score</span>
            <strong>${PMS.escapeHtml(getTotalScore(recommended))}</strong>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="info-panel">
      <h3>No Award Yet</h3>
      <p>This RFQ has not yet been awarded. Continue the process from the RFQ page.</p>
      <a class="btn btn-soft" href="/rfqs.html">Open RFQs</a>
    </div>
  `;
}

function findRecommendedQuotation(quotations) {
  if (!Array.isArray(quotations) || quotations.length === 0) {
    return null;
  }

  const withScores = quotations
    .map(function (quote) {
      return {
        quote: quote,
        score: Number(getTotalScore(quote) || 0)
      };
    })
    .filter(function (item) {
      return !Number.isNaN(item.score);
    });

  if (withScores.length === 0) {
    return quotations[0];
  }

  withScores.sort(function (a, b) {
    return b.score - a.score;
  });

  return withScores[0].quote;
}