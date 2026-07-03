document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("rfqs", "RFQs", "Create, view and manage requests for quotation.");
  loadRfqs();
});

const EVALUATED_QUOTES_KEY = "pmsEvaluatedQuotations";

async function loadRfqs(messageHtml) {
  PMS.showLoading("Loading RFQs...");

  try {
    const [rfqs, requisitions, suppliers] = await Promise.all([
      PMS.getJson("/api/rfqs"),
      PMS.getJson("/api/requisitions"),
      PMS.getJson("/api/suppliers")
    ]);

    const canManage = PMS.hasAnyRole(["ADMIN", "PROCUREMENT_OFFICER"]);
    const evaluatedQuotations = loadEvaluatedQuotations();

    PMS.setContent(`
      ${messageHtml || ""}

      ${canManage ? rfqFormSection(requisitions) : ""}

      ${canManage ? quotationFormSection(rfqs, suppliers) : ""}

      ${canManage ? awardFormSection(evaluatedQuotations) : ""}

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>RFQ List</h2>
            <p>View all RFQs created from approved requisitions.</p>
          </div>
          <button class="btn btn-soft" type="button" id="refreshBtn">Refresh</button>
        </div>

        ${rfqsTable(rfqs, canManage)}
      </section>
    `);

    document.getElementById("refreshBtn").addEventListener("click", function () {
      loadRfqs();
    });

    if (canManage) {
      document.getElementById("rfqForm").addEventListener("submit", createRfq);
      document.getElementById("quotationForm").addEventListener("submit", submitQuotation);

      const awardForm = document.getElementById("awardForm");
      if (awardForm) {
        awardForm.addEventListener("submit", awardRfq);
      }

      const clearAwardBtn = document.getElementById("clearAwardBtn");
      if (clearAwardBtn) {
        clearAwardBtn.addEventListener("click", function () {
          sessionStorage.removeItem(EVALUATED_QUOTES_KEY);
          loadRfqs();
        });
      }

      document.querySelectorAll("[data-evaluate-rfq]").forEach(function (button) {
        button.addEventListener("click", function () {
          evaluateRfq(button.dataset.evaluateRfq);
        });
      });
    }
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function rfqFormSection(requisitions) {
  const approvedRequisitions = (requisitions || []).filter(function (item) {
    return String(item.status || "").toUpperCase() === "APPROVED";
  });

  return `
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>New RFQ</h2>
          <p>Select an approved requisition and define the quotation deadline and weightings.</p>
        </div>
      </div>

      ${approvedRequisitions.length === 0
        ? PMS.message("error", "No approved requisitions are available yet. A requisition must be approved before an RFQ can be created.")
        : ""}

      <form id="rfqForm" class="auth-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="requisitionId">Approved Requisition</label>
            <select id="requisitionId" name="requisitionId" required>
              <option value="">Select approved requisition</option>
              ${approvedRequisitions.map(function (item) {
                return `<option value="${PMS.escapeHtml(item.id)}">REQ-${PMS.escapeHtml(item.id)} | ${PMS.escapeHtml(item.title)}</option>`;
              }).join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="submissionDeadline">Submission Deadline</label>
            <input id="submissionDeadline" name="submissionDeadline" type="datetime-local" required>
          </div>

          <div class="form-group">
            <label for="priceWeight">Price Weight</label>
            <input id="priceWeight" name="priceWeight" type="number" min="0" max="100" value="40" required>
          </div>

          <div class="form-group">
            <label for="deliveryWeight">Delivery Weight</label>
            <input id="deliveryWeight" name="deliveryWeight" type="number" min="0" max="100" value="20" required>
          </div>

          <div class="form-group">
            <label for="qualityWeight">Quality Weight</label>
            <input id="qualityWeight" name="qualityWeight" type="number" min="0" max="100" value="20" required>
          </div>

          <div class="form-group">
            <label for="termsWeight">Terms Weight</label>
            <input id="termsWeight" name="termsWeight" type="number" min="0" max="100" value="10" required>
          </div>

          <div class="form-group">
            <label for="performanceWeight">Performance Weight</label>
            <input id="performanceWeight" name="performanceWeight" type="number" min="0" max="100" value="10" required>
          </div>
        </div>

        <div class="action-row">
          <button class="btn btn-primary" type="submit" ${approvedRequisitions.length === 0 ? "disabled" : ""}>
            Create RFQ
          </button>
        </div>
      </form>
    </section>
  `;
}

function quotationFormSection(rfqs, suppliers) {
  const openRfqs = (rfqs || []).filter(function (rfq) {
    return String(rfq.status || "").toUpperCase() === "OPEN";
  });

  const approvedSuppliers = (suppliers || []).filter(function (supplier) {
    return String(supplier.status || "").toUpperCase() === "APPROVED";
  });

  const formDisabled = openRfqs.length === 0 || approvedSuppliers.length === 0;

  return `
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Submit Supplier Quotation</h2>
          <p>Capture a supplier quotation for an open RFQ before evaluation.</p>
        </div>
      </div>

      ${openRfqs.length === 0
        ? PMS.message("error", "No open RFQs are available for quotation submission.")
        : ""}

      ${approvedSuppliers.length === 0
        ? PMS.message("error", "No approved suppliers are available. A supplier must be approved before submitting a quotation.")
        : ""}

      <form id="quotationForm" class="auth-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="quoteRfqId">Open RFQ</label>
            <select id="quoteRfqId" name="quoteRfqId" required ${formDisabled ? "disabled" : ""}>
              <option value="">Select RFQ</option>
              ${openRfqs.map(function (rfq) {
                return `<option value="${PMS.escapeHtml(rfq.id)}">${PMS.escapeHtml(rfq.rfqNumber)} | REQ-${PMS.escapeHtml(rfq.requisitionId)}</option>`;
              }).join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="quoteSupplierId">Approved Supplier</label>
            <select id="quoteSupplierId" name="quoteSupplierId" required ${formDisabled ? "disabled" : ""}>
              <option value="">Select supplier</option>
              ${approvedSuppliers.map(function (supplier) {
                return `<option value="${PMS.escapeHtml(supplier.id)}">${PMS.escapeHtml(supplier.name)}</option>`;
              }).join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="totalAmount">Quoted Amount</label>
            <input id="totalAmount" name="totalAmount" type="number" min="0.01" step="0.01" required ${formDisabled ? "disabled" : ""}>
          </div>

          <div class="form-group">
            <label for="deliveryDays">Delivery Days</label>
            <input id="deliveryDays" name="deliveryDays" type="number" min="1" step="1" required ${formDisabled ? "disabled" : ""}>
          </div>

          <div class="form-group">
            <label for="qualityScore">Quality Score</label>
            <input id="qualityScore" name="qualityScore" type="number" min="0" max="100" value="80" required ${formDisabled ? "disabled" : ""}>
          </div>

          <div class="form-group">
            <label for="termsScore">Terms Score</label>
            <input id="termsScore" name="termsScore" type="number" min="0" max="100" value="80" required ${formDisabled ? "disabled" : ""}>
          </div>
        </div>

        <div class="action-row">
          <button class="btn btn-primary" type="submit" ${formDisabled ? "disabled" : ""}>
            Submit Quotation
          </button>
        </div>
      </form>
    </section>
  `;
}

function awardFormSection(evaluatedQuotations) {
  if (!Array.isArray(evaluatedQuotations) || evaluatedQuotations.length === 0) {
    return "";
  }

  const sortedQuotes = [...evaluatedQuotations].sort(function (a, b) {
    return Number(b.evaluationScore || 0) - Number(a.evaluationScore || 0);
  });

  const recommended = sortedQuotes[0];

  return `
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Award RFQ</h2>
          <p>Select the winning quotation. The highest evaluation score is recommended.</p>
        </div>

        <button class="btn btn-soft" type="button" id="clearAwardBtn">Clear</button>
      </div>

      <div class="message success">
        Recommended quotation: Quote ${PMS.escapeHtml(recommended.id)} with score ${PMS.escapeHtml(recommended.evaluationScore ?? "-")}.
      </div>

      <form id="awardForm" class="auth-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="quotationId">Recommended Quotation</label>
            <select id="quotationId" name="quotationId" required>
              ${sortedQuotes.map(function (quote) {
                return `
                  <option value="${PMS.escapeHtml(quote.id)}" ${quote.id === recommended.id ? "selected" : ""}>
                    Quote ${PMS.escapeHtml(quote.id)}
                    | Supplier ${PMS.escapeHtml(quote.supplierId)}
                    | ${PMS.formatCurrency(quote.totalAmount)}
                    | Score ${PMS.escapeHtml(quote.evaluationScore ?? "-")}
                  </option>
                `;
              }).join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="overrideQuotationId">Override Quotation</label>
            <select id="overrideQuotationId" name="overrideQuotationId">
              <option value="">No override</option>
              ${sortedQuotes.map(function (quote) {
                return `
                  <option value="${PMS.escapeHtml(quote.id)}">
                    Quote ${PMS.escapeHtml(quote.id)}
                    | Supplier ${PMS.escapeHtml(quote.supplierId)}
                    | ${PMS.formatCurrency(quote.totalAmount)}
                    | Score ${PMS.escapeHtml(quote.evaluationScore ?? "-")}
                  </option>
                `;
              }).join("")}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="overrideJustification">Override Justification</label>
          <textarea id="overrideJustification" name="overrideJustification" placeholder="Only required if you select a different supplier than the recommended quotation."></textarea>
        </div>

        <div class="action-row">
          <button class="btn btn-primary" type="submit">Award RFQ and Create Purchase Order</button>
        </div>
      </form>
    </section>
  `;
}

function rfqsTable(rfqs, canManage) {
  if (!Array.isArray(rfqs) || rfqs.length === 0) {
    return PMS.emptyState("No RFQs found", "Create an RFQ after a requisition has been approved.");
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>RFQ Number</th>
            <th>Requisition ID</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rfqs.map(function (rfq) {
            const canEvaluate = canManage && String(rfq.status || "").toUpperCase() === "OPEN";

            return `
              <tr>
                <td>${PMS.escapeHtml(rfq.id)}</td>
                <td>${PMS.escapeHtml(rfq.rfqNumber)}</td>
                <td>${PMS.escapeHtml(rfq.requisitionId)}</td>
                <td>${PMS.escapeHtml(PMS.formatDateTime(rfq.submissionDeadline))}</td>
                <td>${PMS.statusBadge(rfq.status)}</td>
                <td>
                  ${canEvaluate
                    ? `<button class="btn btn-primary" type="button" data-evaluate-rfq="${PMS.escapeHtml(rfq.id)}">Evaluate</button>`
                    : `<span class="badge">No action</span>`
                  }
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function createRfq(event) {
  event.preventDefault();
  const form = event.target;
  const data = PMS.formDataToObject(form);

  try {
    await PMS.postJson("/api/rfqs", {
      requisitionId: Number(data.requisitionId),
      submissionDeadline: new Date(data.submissionDeadline).toISOString(),
      priceWeight: Number(data.priceWeight),
      deliveryWeight: Number(data.deliveryWeight),
      qualityWeight: Number(data.qualityWeight),
      termsWeight: Number(data.termsWeight),
      performanceWeight: Number(data.performanceWeight)
    });

    form.reset();
    loadRfqs(PMS.message("success", "RFQ created successfully."));
  } catch (error) {
    loadRfqs(PMS.message("error", error.message));
  }
}

async function submitQuotation(event) {
  event.preventDefault();
  const form = event.target;
  const data = PMS.formDataToObject(form);

  try {
    await PMS.postJson("/api/quotations", {
      rfqId: Number(data.quoteRfqId),
      supplierId: Number(data.quoteSupplierId),
      totalAmount: Number(data.totalAmount),
      deliveryDays: Number(data.deliveryDays),
      qualityScore: Number(data.qualityScore),
      termsScore: Number(data.termsScore)
    });

    form.reset();
    loadRfqs(PMS.message("success", "Supplier quotation submitted successfully. You can now evaluate the RFQ."));
  } catch (error) {
    loadRfqs(PMS.message("error", error.message));
  }
}

async function evaluateRfq(id) {
  try {
    const result = await PMS.postJson(`/api/rfqs/${id}/evaluate`, {});

    sessionStorage.setItem(EVALUATED_QUOTES_KEY, JSON.stringify(result || []));

    loadRfqs(PMS.message("success", `RFQ evaluated successfully. ${result.length} quotation(s) were scored. You can now award the RFQ.`));
  } catch (error) {
    loadRfqs(PMS.message("error", error.message));
  }
}

async function awardRfq(event) {
  event.preventDefault();
  const form = event.target;
  const data = PMS.formDataToObject(form);

  const quotationId = Number(data.quotationId);
  const overrideQuotationId = data.overrideQuotationId ? Number(data.overrideQuotationId) : null;

  try {
    await PMS.postJson("/api/awards", {
      quotationId: quotationId,
      overrideQuotationId: overrideQuotationId,
      overrideJustification: data.overrideJustification || null
    });

    sessionStorage.removeItem(EVALUATED_QUOTES_KEY);

    loadRfqs(PMS.message("success", "RFQ awarded successfully. Purchase order created."));
  } catch (error) {
    loadRfqs(PMS.message("error", error.message));
  }
}

function loadEvaluatedQuotations() {
  const stored = sessionStorage.getItem(EVALUATED_QUOTES_KEY);

  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch (error) {
    return [];
  }
}