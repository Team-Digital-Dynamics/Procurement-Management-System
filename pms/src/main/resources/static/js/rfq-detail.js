document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "rfq-detail",
    "RFQ Detail",
    "View RFQ information, quotation progress and award status."
  );

  loadRfqDetail();
});

let currentRecommendedSupplierId = null;
let currentAwardRfqId = null;

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
    currentAwardRfqId = rfq.id;

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

      <section class="view-section" id="evaluationPane">
        <div class="section-header">
          <div>
            <h2>Evaluation Scores</h2>
            <p>Backend-calculated weighted scoring for submitted quotations.</p>
          </div>
        </div>

        ${evaluationScoresSection()}
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

    wireContractAwardForm();

    await loadRfqEvaluationScores(rfq.id);

    wireRfqSubmissionHandler(rfq);
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
        <span>Closing Date</span>
        <strong>${formatPossibleDate(rfq.closingDate || rfq.deadline || rfq.validUntil)}</strong>
      </div>
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

function evaluationScoresSection() {
  return `
    <div id="evaluationScoresEmpty" class="message info">Loading evaluation scores...</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Quote</th>
            <th>Technical Score</th>
            <th>Financial Score</th>
            <th>Weighted Score</th>
          </tr>
        </thead>
        <tbody id="evaluationScoresTableBody"></tbody>
      </table>
    </div>
  `;
}

async function loadRfqEvaluationScores(rfqId) {
  const tableBody = document.getElementById("evaluationScoresTableBody");
  const emptyHost = document.getElementById("evaluationScoresEmpty");

  if (!rfqId || !tableBody || !emptyHost) {
    return;
  }

  try {
    const response = await fetch(`/api/v1/rfqs/${encodeURIComponent(rfqId)}/evaluation-scores`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Unable to load evaluation scores.");
    }

    const payload = await response.json();
    const rows = normalizeEvaluationScoreRows(payload);
    const recommended = findRecommendedEvaluationRow(rows);

    if (!rows.length) {
      tableBody.innerHTML = "";
      emptyHost.textContent = "No evaluation scores available for this RFQ.";
      renderAwardSupplierOptions([], null);
      populatePrimaryAwardSelection(null);
      return;
    }

    tableBody.innerHTML = rows.map(function (row, index) {
      const isRecommended =
        recommended &&
        String(getEvaluationRowId(row, index)) === String(getEvaluationRowId(recommended, rows.indexOf(recommended)));

      return `
        <tr ${isRecommended ? "style=\"background:#ecfdf3;\"" : ""}>
          <td>
            ${PMS.escapeHtml(row.supplierName || row.supplier || `Supplier ${index + 1}`)}
            ${isRecommended ? recommendationBadgeHtml() : ""}
          </td>
          <td>${PMS.escapeHtml(row.quoteNumber || row.quotationNumber || row.quoteId || "-")}</td>
          <td>${PMS.escapeHtml(formatScoreForScreen(row.technicalScore, 2))}</td>
          <td>${PMS.escapeHtml(formatScoreForScreen(row.financialScore, 2))}</td>
          <td><strong>${PMS.escapeHtml(formatScoreForScreen(row.weightedScore, 4))}</strong></td>
        </tr>
      `;
    }).join("");

    renderAwardSupplierOptions(rows, recommended);
    populatePrimaryAwardSelection(recommended);
    emptyHost.textContent = "";
  } catch (error) {
    tableBody.innerHTML = "";
    emptyHost.textContent = "Unable to load evaluation scores. Please try again.";
    renderAwardSupplierOptions([], null);
    populatePrimaryAwardSelection(null);
  }
}

function normalizeEvaluationScoreRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.matrix)) {
    return payload.matrix;
  }

  if (Array.isArray(payload?.evaluationScores)) {
    return payload.evaluationScores;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.matrix)) {
    return payload.data.matrix;
  }

  return [];
}

function recommendationBadgeHtml() {
  return "<span style=\"display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:#166534;color:#ffffff;font-size:12px;font-weight:700;\">Recommended</span>";
}

function getEvaluationRowId(row, index) {
  return row.id || row.quoteId || row.quotationId || row.quoteNumber || row.quotationNumber || index;
}

function findRecommendedEvaluationRow(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return rows.reduce(function (best, current) {
    const bestScore = best ? Number(best.weightedScore) : Number.NEGATIVE_INFINITY;
    const currentScore = Number(current.weightedScore);

    if (!Number.isFinite(currentScore)) {
      return best;
    }

    if (!Number.isFinite(bestScore) || currentScore > bestScore) {
      return current;
    }

    return best;
  }, null) || rows[0];
}

function populatePrimaryAwardSelection(recommendedRow) {
  const supplierField = document.getElementById("primaryAwardSupplier");
  const quoteField = document.getElementById("primaryAwardQuote");
  const scoreField = document.getElementById("primaryAwardWeightedScore");
  const statusField = document.getElementById("primaryAwardSelectionStatus");

  if (!supplierField || !quoteField || !scoreField || !statusField) {
    return;
  }

  if (!recommendedRow) {
    currentRecommendedSupplierId = null;
    supplierField.value = "";
    quoteField.value = "";
    scoreField.value = "";
    statusField.textContent = "No recommendation available yet.";
    return;
  }

  currentRecommendedSupplierId = String(
    recommendedRow.supplierId ||
    recommendedRow.supplier?.id ||
    recommendedRow.supplier?.supplierId ||
    ""
  ) || null;

  supplierField.value = recommendedRow.supplierName || recommendedRow.supplier || "";
  quoteField.value = recommendedRow.quoteNumber || recommendedRow.quotationNumber || recommendedRow.quoteId || "";
  scoreField.value = formatScoreForScreen(recommendedRow.weightedScore, 4);
  statusField.textContent = "Primary award fields were auto-populated from the highest weighted score.";
}

function formatScoreForScreen(value, scale) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return Number(0).toFixed(scale);
  }

  return numericValue.toFixed(scale);
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
      ${primaryAwardSelectionContainer()}
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
      ${primaryAwardSelectionContainer()}
    `;
  }

  return `
    <div class="info-panel">
      <h3>No Award Yet</h3>
      <p>This RFQ has not yet been awarded. Continue the process from the RFQ page.</p>
      <a class="btn btn-soft" href="/rfqs.html">Open RFQs</a>
    </div>
    ${primaryAwardSelectionContainer()}
  `;
}

function primaryAwardSelectionContainer() {
  return `
    <div class="view-section" id="primaryAwardSelectionContainer">
      <div class="section-header">
        <div>
          <h2>Primary Award Selection</h2>
          <p>Auto-filled with the current top recommendation from weighted scoring.</p>
        </div>
      </div>

      <div class="detail-list">
        <div>
          <span>Recommended Supplier</span>
          <strong><input id="primaryAwardSupplier" type="text" readonly placeholder="Will auto-populate" /></strong>
        </div>
        <div>
          <span>Quote Reference</span>
          <strong><input id="primaryAwardQuote" type="text" readonly placeholder="Will auto-populate" /></strong>
        </div>
        <div>
          <span>Weighted Score</span>
          <strong><input id="primaryAwardWeightedScore" type="text" readonly placeholder="Will auto-populate" /></strong>
        </div>
      </div>

      <p id="primaryAwardSelectionStatus" class="muted">Awaiting evaluation score data.</p>

      <form id="contractAwardForm" class="form-grid" style="margin-top:12px;">
        <div class="form-group">
          <label for="awardSupplierId">Award Supplier</label>
          <select id="awardSupplierId" name="supplierId" required>
            <option value="">Select supplier</option>
          </select>
        </div>

        <div class="form-group full-width">
          <label for="overrideReason">Override Reason</label>
          <textarea id="overrideReason" name="overrideReason" rows="3" placeholder="Required when selecting a supplier other than the recommended one."></textarea>
        </div>

        <div id="contractAwardError" class="full-width"></div>

        <div class="form-actions full-width">
          <button class="btn btn-primary" type="submit">Submit Contract Award</button>
        </div>
      </form>
    </div>
  `;
}

function wireContractAwardForm() {
  const form = document.getElementById("contractAwardForm");

  if (!form) {
    return;
  }

  form.addEventListener("submit", handleContractAwardSubmit);
}

function renderAwardSupplierOptions(rows, recommendedRow) {
  const select = document.getElementById("awardSupplierId");

  if (!select) {
    return;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    select.innerHTML = "<option value=\"\">Select supplier</option>";
    return;
  }

  const options = rows.map(function (row, index) {
    const supplierId = String(
      row.supplierId ||
      row.supplier?.id ||
      row.supplier?.supplierId ||
      ""
    );

    const supplierName = row.supplierName || row.supplier || `Supplier ${index + 1}`;
    const scoreText = formatScoreForScreen(row.weightedScore, 4);
    const isRecommended =
      recommendedRow &&
      String(supplierId) === String(
        recommendedRow.supplierId ||
        recommendedRow.supplier?.id ||
        recommendedRow.supplier?.supplierId ||
        ""
      );

    return `
      <option value="${PMS.escapeHtml(supplierId)}" ${isRecommended ? "selected" : ""}>
        ${PMS.escapeHtml(supplierName)} | Score ${PMS.escapeHtml(scoreText)} ${isRecommended ? "(Recommended)" : ""}
      </option>
    `;
  }).join("");

  select.innerHTML = `<option value="">Select supplier</option>${options}`;
}

async function handleContractAwardSubmit(event) {
  event.preventDefault();

  clearContractAwardError();

  const form = event.currentTarget;
  const selectedSupplierId = String(form.querySelector("[name='supplierId']")?.value || "").trim();
  const topSupplierId = String(currentRecommendedSupplierId || "").trim();
  const overrideReason = String(form.querySelector("[name='overrideReason']")?.value || "").trim();

  if (!selectedSupplierId) {
    showContractAwardError("Please select a supplier before submitting the award.");
    return;
  }

  if (topSupplierId && selectedSupplierId !== topSupplierId && !overrideReason) {
    showContractAwardError("An explicit justification reason is required to override the highest-scoring supplier recommendation.");
    return;
  }

  const submitButton = form.querySelector("button[type='submit']");
  const originalText = submitButton ? submitButton.textContent : "";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
  }

  try {
    const response = await fetch("/api/awards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        rfqId: Number(currentAwardRfqId),
        supplierId: Number(selectedSupplierId),
        recommendedSupplierId: topSupplierId ? Number(topSupplierId) : null,
        overrideJustification: selectedSupplierId !== topSupplierId ? overrideReason : null
      })
    });

    if (!response.ok) {
      const errorInfo = await readErrorResponseBody(response);
      throw new Error(errorInfo.message || "Unable to submit contract award.");
    }

    await triggerPurchaseOrderGenerationAfterAward(
      Number(currentAwardRfqId),
      Number(selectedSupplierId)
    );

    if (typeof PMS !== "undefined" && PMS.showToast) {
      PMS.showToast("success", "Contract award submitted successfully.");
    }
  } catch (error) {
    showContractAwardError(error.message || "Unable to submit contract award.");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
}

async function triggerPurchaseOrderGenerationAfterAward(currentRfqId, selectedSupplierId) {
  const poResponse = await fetch("/api/v1/purchase-orders/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      rfqId: currentRfqId,
      supplierId: selectedSupplierId
    })
  });

  if (poResponse.status !== 201) {
    const errorInfo = await readErrorResponseBody(poResponse);
    throw new Error(errorInfo.message || "Award saved but purchase order generation failed.");
  }

  const poBody = await readSuccessfulResponseBody(poResponse);
  const poReference = extractPurchaseOrderReference(poBody);
  const statusHost = document.getElementById("primaryAwardSelectionStatus");

  if (statusHost) {
    statusHost.textContent = poReference
      ? `Purchase order provisioned successfully. Reference: ${poReference}.`
      : "Purchase order provisioned successfully.";
  }

  return poReference;
}

async function readSuccessfulResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();
    return text || null;
  } catch (error) {
    return null;
  }
}

function extractPurchaseOrderReference(body) {
  if (!body) {
    return null;
  }

  if (typeof body === "string") {
    return body.trim() || null;
  }

  return (
    body.purchaseOrderReference ||
    body.poReference ||
    body.reference ||
    body.purchaseOrderNumber ||
    body.poNumber ||
    body.sequence ||
    body.id ||
    null
  );
}

function showContractAwardError(message) {
  const host = document.getElementById("contractAwardError");

  if (!host) {
    return;
  }

  host.innerHTML = `<div class="message error" role="alert">${PMS.escapeHtml(message)}</div>`;
}

function clearContractAwardError() {
  const host = document.getElementById("contractAwardError");

  if (host) {
    host.innerHTML = "";
  }
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

function wireRfqSubmissionHandler(rfq) {
  const entry = locateRfqSubmissionEntry();
  const form = entry.form;
  const submitButton = entry.button || (form ? form.querySelector("button[type='submit']") : null);

  if (!form || !submitButton) {
    return;
  }

  const submissionDeadlineRaw =
    rfq.submissionDeadline ||
    rfq.closingDate ||
    rfq.deadline ||
    rfq.validUntil ||
    null;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    submitRfqResponse(form, submitButton, rfq, submissionDeadlineRaw);
  });
}

function locateRfqSubmissionEntry() {
  let form =
    document.querySelector("#rfqSubmissionForm") ||
    document.querySelector("#quotationForm") ||
    document.querySelector("form[data-rfq-submit]") ||
    document.querySelector("form[action*='submission']");

  const button =
    document.querySelector("[data-submit-rfq-response]") ||
    document.querySelector("#submitQuoteBtn") ||
    document.querySelector("#submitQuotationBtn") ||
    (form ? form.querySelector("button[type='submit']") : null);

  if (!form && button) {
    form = button.closest("form");
  }

  return { form: form, button: button };
}

async function submitRfqResponse(form, submitButton, rfq, submissionDeadlineRaw) {
  clearSubmissionBanner(form);

  const deadline = parseSubmissionDeadline(submissionDeadlineRaw);
  if (deadline && new Date() > deadline) {
    showSubmissionBanner(form, "Submission Rejected: The deadline for this RFQ has passed.");
    return;
  }

  const payload = Object.fromEntries(new FormData(form).entries());

  submitButton.disabled = true;
  const originalText = submitButton.textContent;
  submitButton.textContent = "Submitting...";

  try {
    const response = await fetch(`/api/v1/rfqs/${encodeURIComponent(rfq.id)}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorInfo = await readErrorResponseBody(response);
      const combined = `${errorInfo.message || ""} ${errorInfo.raw || ""}`;
      const deadlineRejected =
        (response.status === 400 || response.status === 403) &&
        /deadline|closing|expired|late|passed/i.test(combined);

      if (deadlineRejected) {
        showSubmissionBanner(form, "Submission Rejected: The deadline for this RFQ has passed.");
        return;
      }

      throw new Error(errorInfo.message || "Unable to submit RFQ response.");
    }

    if (typeof PMS !== "undefined" && PMS.showToast) {
      PMS.showToast("success", "Response submitted successfully.");
    }
  } catch (error) {
    showSubmissionBanner(form, error.message || "Unable to submit RFQ response.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

function parseSubmissionDeadline(rawValue) {
  if (!rawValue) {
    return null;
  }

  if (typeof rawValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return new Date(`${rawValue}T23:59:59.999`);
  }

  const parsed = new Date(rawValue);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function readErrorResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const json = await response.json();

      return {
        message: json.message || json.error || json.details || json.title || "Request failed.",
        raw: JSON.stringify(json)
      };
    }

    const text = await response.text();

    return {
      message: text || "Request failed.",
      raw: text || ""
    };
  } catch (error) {
    return {
      message: "Request failed.",
      raw: ""
    };
  }
}

function showSubmissionBanner(form, text) {
  let banner = form.querySelector("#rfqSubmissionWarningBanner");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "rfqSubmissionWarningBanner";
    banner.setAttribute("role", "alert");
    banner.style.background = "#fdecea";
    banner.style.border = "2px solid #d93025";
    banner.style.color = "#7f1d1d";
    banner.style.padding = "12px 14px";
    banner.style.marginBottom = "12px";
    banner.style.fontWeight = "700";
    banner.style.borderRadius = "8px";
    form.prepend(banner);
  }

  banner.textContent = text;
}

function clearSubmissionBanner(form) {
  const banner = form.querySelector("#rfqSubmissionWarningBanner");

  if (banner) {
    banner.remove();
  }
}