(function () {
  const demoQuotations = [
    {
      id: 1,
      quotationNumber: "QTN-2026-001",
      rfqNumber: "RFQ-2026-001",
      supplierName: "Demo Supplier",
      amount: 17650,
      deliveryDays: 7,
      status: "SUBMITTED",
      submittedDate: "2026-07-02"
    },
    {
      id: 2,
      quotationNumber: "QTN-2026-002",
      rfqNumber: "RFQ-2026-002",
      supplierName: "Demo Supplier",
      amount: 39800,
      deliveryDays: 10,
      status: "UNDER_REVIEW",
      submittedDate: "2026-07-04"
    }
  ];

  let quotations = [];
  let filteredQuotations = [];
  let quotationListNotice = null;
  let nativeAlert = null;

  const QUOTATION_LIST_PATHS = [
    "/api/v1/quotations/my",
    "/api/quotations/my",
    "/api/v1/quotations",
    "/api/quotations"
  ];

  const QUOTATION_SUBMIT_PATHS = [
    "/api/v1/quotations",
    "/api/quotations"
  ];

  function installInlineAlertBridge() {
    if (typeof window === "undefined" || typeof window.alert !== "function") {
      return;
    }

    if (!nativeAlert) {
      nativeAlert = window.alert.bind(window);
    }

    window.alert = function (message) {
      const text = String(message || "Unexpected error.");
      const lowered = text.toLowerCase();

      if (lowered.includes("access denied") || lowered.includes("forbidden")) {
        showSubmissionMessage(
          "error",
          "Access denied for this action.",
          "Your current role cannot submit this quotation. Confirm you are signed in as the invited supplier."
        );
        return;
      }

      showSubmissionMessage("error", "Action could not be completed.", text);
    };
  }

  async function fetchSupplierQuotations() {
    try {
      const data = await fetchQuotationListPayload(QUOTATION_LIST_PATHS);
      quotationListNotice = null;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("Unable to load supplier quotation data:", error.message);

      const friendlyError = mapQuotationErrorToUiMessage(error, "load");
      if (friendlyError.code === "endpoint-missing") {
        quotationListNotice = {
          tone: "error",
          title: friendlyError.title,
          detail: `${friendlyError.detail} Demo records are shown below until the endpoint is available.`
        };
        return demoQuotations;
      }

      quotationListNotice = {
        tone: "error",
        title: friendlyError.title,
        detail: friendlyError.detail
      };
      return [];
    }
  }

  async function fetchQuotationListPayload(paths) {
    const token = PMS.getToken ? PMS.getToken() : "";

    const headers = token
      ? {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      : {
          Accept: "application/json"
        };

    let lastError = null;

    for (const path of paths) {
      const response = await fetch(path, {
        method: "GET",
        headers: headers
      });

      const responseBody = await parseResponseBody(response);

      if (response.ok) {
        return responseBody;
      }

      const error = buildHttpError(response, responseBody);
      if (shouldTryAlternateRoute(path, response.status)) {
        lastError = error;
        continue;
      }

      throw error;
    }

    throw lastError || new Error("Unable to load quotations.");
  }

  function getRfqIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("rfqId");
  }

  function applyFilters() {
    const searchInput = document.getElementById("quotationSearch");
    const statusFilter = document.getElementById("quotationStatusFilter");

    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const statusValue = statusFilter ? statusFilter.value : "ALL";

    filteredQuotations = quotations.filter(function (quotation) {
      const combinedText = `
        ${quotation.quotationNumber || ""}
        ${quotation.rfqNumber || ""}
        ${quotation.supplierName || ""}
        ${quotation.status || ""}
      `.toLowerCase();

      const matchesSearch = combinedText.includes(searchValue);
      const matchesStatus = statusValue === "ALL" || quotation.status === statusValue;

      return matchesSearch && matchesStatus;
    });

    renderTable();
  }

  function renderTable() {
    const tableArea = document.getElementById("quotationTableArea");

    if (!tableArea) return;

    if (!filteredQuotations || filteredQuotations.length === 0) {
      tableArea.innerHTML = PMS.emptyState(
        "No quotations found",
        "No quotations match your current search or filter."
      );
      return;
    }

    tableArea.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Quotation Number</th>
              <th>RFQ Number</th>
              <th>Supplier</th>
              <th>Amount</th>
              <th>Delivery Days</th>
              <th>Submitted Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            ${filteredQuotations.map(function (quotation) {
              return `
                <tr>
                  <td>${PMS.escapeHtml(quotation.quotationNumber || "-")}</td>
                  <td>${PMS.escapeHtml(quotation.rfqNumber || "-")}</td>
                  <td>${PMS.escapeHtml(quotation.supplierName || "-")}</td>
                  <td>${PMS.formatCurrency(quotation.amount)}</td>
                  <td>${PMS.escapeHtml(quotation.deliveryDays || "-")} days</td>
                  <td>${PMS.escapeHtml(quotation.submittedDate || "-")}</td>
                  <td>${PMS.statusBadge(quotation.status)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  async function handleQuotationSubmit(event) {
    event.preventDefault();

    const form = event.target;

    const payload = {
      rfqId: form.rfqId.value.trim(),
      totalBidAmount: Number(form.totalBidAmount.value),
      itemLineDetails: collectItemLineDetails(form),
      notes: form.notes.value.trim()
    };

    const validationErrors = validateQuotationPayload(payload);
    if (validationErrors.length > 0) {
      showSubmissionMessage(
        "error",
        "Quotation could not be submitted.",
        "Fix the following issues and submit again.",
        validationErrors
      );
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    const originalButtonText = submitButton ? submitButton.textContent : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Saving...";
    }

    try {
      clearSubmissionMessage();
      const { response, responseBody } = await submitQuotationPayload(payload);

      if (response.status !== 201) {
        throw buildHttpError(response, responseBody);
      }

      const generatedId = getGeneratedQuotationId(responseBody);

      appendQuotationSaveConfirmation(generatedId);

      const savedQuotation = {
        id: generatedId,
        quotationNumber: responseBody.quotationNumber || `QTN-${generatedId}`,
        rfqNumber: payload.rfqId,
        supplierName: responseBody.supplierName || "Current Supplier",
        amount: payload.totalBidAmount,
        deliveryDays: responseBody.deliveryDays || "-",
        status: "Saved",
        submittedDate: new Date().toISOString().split("T")[0]
      };

      quotations.unshift(savedQuotation);
      form.reset();
      renderDefaultLineItemRows();

      applyFilters();
    } catch (error) {
      const friendlyError = mapQuotationErrorToUiMessage(error, "submit");
      showSubmissionMessage(
        "error",
        friendlyError.title,
        friendlyError.detail,
        friendlyError.errors || []
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  }

  async function submitQuotationPayload(payload) {
    const token = PMS.getToken ? PMS.getToken() : "";
    let lastError = null;

    for (const path of QUOTATION_SUBMIT_PATHS) {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(path, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
      });

      const responseBody = await parseResponseBody(response);

      if (response.ok || !shouldTryAlternateRoute(path, response.status)) {
        return { response, responseBody };
      }

      lastError = buildHttpError(response, responseBody);
    }

    throw lastError || new Error("Unable to submit quotation.");
  }

  function collectItemLineDetails(form) {
    return Array.from(form.querySelectorAll("[data-line-item-row]"))
      .map(function (row) {
        const description = row.querySelector("[name='itemDescription']")?.value.trim() || "";
        const quantity = Number(row.querySelector("[name='itemQuantity']")?.value || 0);
        const unitPrice = Number(row.querySelector("[name='itemUnitPrice']")?.value || 0);

        return {
          description: description,
          quantity: quantity,
          unitPrice: unitPrice,
          lineTotal: Number((quantity * unitPrice).toFixed(2))
        };
      })
      .filter(function (line) {
        return line.description && line.quantity > 0 && line.unitPrice > 0;
      });
  }

  async function parseResponseBody(response) {
    const contentType = response.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/json")) {
        return await response.json();
      }

      const text = await response.text();
      return text ? { message: text } : {};
    } catch (error) {
      return {};
    }
  }

  function shouldTryAlternateRoute(path, status) {
    if (!(status === 403 || status === 404 || status === 405)) {
      return false;
    }

    return String(path || "").includes("/api/v1/");
  }

  function buildHttpError(response, responseBody) {
    const message =
      (responseBody && (responseBody.message || responseBody.error || responseBody.details)) ||
      response.statusText ||
      "Request failed";

    const error = new Error(typeof message === "string" ? message : "Request failed");
    error.status = response.status;
    error.responseBody = responseBody;
    return error;
  }

  function mapQuotationErrorToUiMessage(error, mode) {
    const status = Number(error?.status || 0);
    const message = String(error?.message || "");
    const normalized = message.toLowerCase();
    const parsedErrors = extractBackendErrorList(error);

    if (normalized.includes("cannot deserialize") && normalized.includes("rfqid")) {
      return {
        code: "rfq-format-invalid",
        title: "RFQ ID format is invalid.",
        detail: "Use the numeric RFQ ID (example: 9303), not the RFQ reference string.",
        errors: parsedErrors
      };
    }

    if (status === 401 || normalized.includes("session has expired")) {
      return {
        code: "session-expired",
        title: "Your session has expired.",
        detail: "Sign in again and retry your quotation action.",
        errors: parsedErrors
      };
    }

    if (status === 403 || normalized.includes("access denied") || normalized.includes("not allowed")) {
      return {
        code: "access-denied",
        title: "Access denied for this action.",
        detail: "Your current role cannot perform this quotation action. Confirm you are signed in as the correct supplier account.",
        errors: parsedErrors
      };
    }

    if (status === 404 && normalized.includes("rfq")) {
      return {
        code: "rfq-not-found",
        title: "RFQ does not exist.",
        detail: "The RFQ you entered was not found. Check the RFQ ID and try again.",
        errors: parsedErrors
      };
    }

    if (status === 404) {
      return {
        code: "endpoint-missing",
        title: mode === "submit" ? "Quotation submission endpoint is missing." : "Quotation list endpoint is missing.",
        detail: "The backend API route was not found on this environment.",
        errors: parsedErrors
      };
    }

    if (status === 405 || normalized.includes("method") && normalized.includes("not supported")) {
      return {
        code: "endpoint-method-mismatch",
        title: "Quotation endpoint does not accept this action.",
        detail: "This route exists, but it does not support the current request method. The system will retry a compatible quotation route.",
        errors: parsedErrors
      };
    }

    if (status === 409 || normalized.includes("already submitted")) {
      return {
        code: "duplicate-quotation",
        title: "Quotation already submitted.",
        detail: "A quotation already exists for this RFQ and supplier. Open the existing one instead of creating a duplicate.",
        errors: parsedErrors
      };
    }

    if (normalized.includes("deadline has passed") || normalized.includes("rfq is closed") || normalized.includes("closed or deadline")) {
      return {
        code: "rfq-closed",
        title: "RFQ deadline has passed.",
        detail: "Submissions are closed for this RFQ. Choose an open RFQ with an active deadline.",
        errors: parsedErrors
      };
    }

    if (normalized.includes("rfq not found") || normalized.includes("non-existent") || normalized.includes("does not exist")) {
      return {
        code: "rfq-not-found",
        title: "RFQ does not exist.",
        detail: "The selected RFQ could not be found. Validate the RFQ number before submitting.",
        errors: parsedErrors
      };
    }

    if (normalized.includes("supplierid") || normalized.includes("supplier id") || normalized.includes("supplier not approved")) {
      return {
        code: "supplier-validation",
        title: "Supplier details are invalid for submission.",
        detail: "This account is not currently linked to an approved supplier profile for the selected RFQ.",
        errors: parsedErrors
      };
    }

    if (status === 400) {
      return {
        code: "bad-request",
        title: "Quotation request is invalid.",
        detail: message || "Please review the form fields and submit again.",
        errors: parsedErrors
      };
    }

    if (status >= 500 || normalized.includes("unexpected internal error")) {
      return {
        code: "server-error",
        title: mode === "submit" ? "Unable to submit quotation." : "Unable to load quotations.",
        detail: "The server returned an internal error. Check the likely causes below.",
        errors: parsedErrors.length > 0
          ? parsedErrors
          : [
              "RFQ ID may not exist in the system.",
              "Your supplier profile may not be linked or approved for this RFQ.",
              "The quotation endpoint may not support this request shape yet."
            ]
      };
    }

    return {
      code: "unknown",
      title: mode === "submit" ? "Unable to submit quotation." : "Unable to load quotations.",
      detail: message || "An unexpected error occurred. Please try again.",
      errors: parsedErrors
    };
  }

  function validateQuotationPayload(payload) {
    const errors = [];

    if (!payload.rfqId) {
      errors.push("RFQ ID is required.");
    } else if (!/^\d+$/.test(String(payload.rfqId))) {
      errors.push("RFQ ID must be numeric (example: 9303). Do not use RFQ reference text.");
    }

    if (!(Number(payload.totalBidAmount) > 0)) {
      errors.push("Total bid amount must be greater than zero.");
    }

    if (!Array.isArray(payload.itemLineDetails) || payload.itemLineDetails.length === 0) {
      errors.push("Add at least one valid line item with description, quantity, and unit price.");
    }

    return errors;
  }

  function splitMessageIntoErrors(message) {
    return String(message || "")
      .split(/[;\n]+/)
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  function simplifyErrorMessage(message) {
    const text = String(message || "").trim();
    if (!text) {
      return "Submission could not be completed.";
    }

    const normalized = text.toLowerCase();

    if (normalized.includes("deadline") || normalized.includes("rfq is closed") || normalized.includes("closed or deadline")) {
      return "Late submission is not allowed for this RFQ.";
    }

    if (normalized.includes("deliverydays") && normalized.includes("greater than or equal to 1")) {
      return "Late submission is not allowed for this RFQ.";
    }

    if (normalized.includes("supplierid") && normalized.includes("must not be null")) {
      return "Your supplier account is not linked for quotation submission.";
    }

    if (normalized.includes("request method") && normalized.includes("not supported")) {
      return "This quotation endpoint cannot process the submission method.";
    }

    if (normalized.includes("rfq not found") || normalized.includes("does not exist") || normalized.includes("non-existent")) {
      return "The selected RFQ could not be found.";
    }

    if (normalized.includes("access denied") || normalized.includes("forbidden") || normalized.includes("not allowed")) {
      return "You are not allowed to submit this quotation with the current role.";
    }

    return text;
  }

  function extractBackendErrorList(error) {
    const body = error?.responseBody;
    const list = [];
    const seen = new Set();

    function pushUnique(value) {
      const text = String(value || "").trim();
      if (!text) {
        return;
      }

      const simplified = simplifyErrorMessage(text);

      const key = simplified.toLowerCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      list.push(simplified);
    }

    if (Array.isArray(body?.errors)) {
      body.errors.forEach(pushUnique);
    }

    if (Array.isArray(body?.data?.errors)) {
      body.data.errors.forEach(pushUnique);
    }

    if (typeof body?.message === "string") {
      splitMessageIntoErrors(body.message).forEach(pushUnique);
    }

    if (typeof error?.message === "string") {
      splitMessageIntoErrors(error.message).forEach(pushUnique);
    }

    return list.slice(0, 3);
  }

  function clearSubmissionMessage() {
    const host = document.getElementById("quotationSubmissionResult");
    if (host) {
      host.innerHTML = "";
    }
  }

  function showSubmissionMessage(tone, title, detail, details) {
    const host = document.getElementById("quotationSubmissionResult");
    if (!host) {
      return;
    }

    const detailItems = Array.isArray(details) ? details.filter(Boolean) : [];
    const detailListHtml = detailItems.length > 0
      ? `
        <ul>
          ${detailItems.map(function (item) {
            return `<li>${PMS.escapeHtml(item)}</li>`;
          }).join("")}
        </ul>
      `
      : "";

    host.innerHTML = `
      <div class="message ${PMS.escapeHtml(tone)}" role="alert" aria-live="assertive">
        <strong>${PMS.escapeHtml(title)}</strong>
        <p>${PMS.escapeHtml(detail)}</p>
        ${detailListHtml}
      </div>
    `;
  }

  function getGeneratedQuotationId(responseBody) {
    const id =
      responseBody?.id ||
      responseBody?.quotationId ||
      responseBody?.data?.id ||
      responseBody?.data?.quotationId;

    return id ? String(id) : `temp-${Date.now()}`;
  }

  function appendQuotationSaveConfirmation(generatedId) {
    const host = document.getElementById("quotationSubmissionResult");
    if (!host) {
      return;
    }

    host.innerHTML = `
      <div class="message success" role="status" aria-live="polite">
        <strong>Quotation saved successfully.</strong>
        <p>Database ID: <strong>${PMS.escapeHtml(generatedId)}</strong></p>
        <p>State: <strong>Saved</strong></p>
      </div>
    `;
  }

  function renderDefaultLineItemRows() {
    const container = document.getElementById("quoteLineItems");
    if (!container) {
      return;
    }

    container.innerHTML = createLineItemRowHtml();
  }

  function createLineItemRowHtml() {
    return `
      <div class="grid-3" data-line-item-row>
        <div class="form-group">
          <label>Item Description</label>
          <input name="itemDescription" type="text" placeholder="Item description" required>
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input name="itemQuantity" type="number" min="1" step="1" placeholder="0" required>
        </div>
        <div class="form-group">
          <label>Unit Price</label>
          <input name="itemUnitPrice" type="number" min="0.01" step="0.01" placeholder="0.00" required>
        </div>
      </div>
    `;
  }

  function renderPage() {
    const selectedRfqId = getRfqIdFromUrl();

    PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>My Quotations</h2>
            <p class="muted">View submitted quotations and create a quotation for an RFQ.</p>
          </div>

          <div class="form-actions">
            <a class="btn btn-secondary" href="/supplier-dashboard.html">Back to Supplier Dashboard</a>
          </div>
        </div>

        ${quotationListNotice ? `
          <div class="message ${quotationListNotice.tone}" role="alert" aria-live="assertive">
            <strong>${PMS.escapeHtml(quotationListNotice.title)}</strong>
            <p>${PMS.escapeHtml(quotationListNotice.detail)}</p>
          </div>
        ` : ""}

        ${selectedRfqId ? `
          <div class="message info">
            You opened this page from RFQ ID: ${PMS.escapeHtml(selectedRfqId)}.
            When the backend is connected, this form can auto-load the full RFQ details.
          </div>
        ` : ""}
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Submit Quotation</h2>
            <p class="muted">This form works as a frontend placeholder until backend quotation submission is available.</p>
          </div>
        </div>

        <form id="quotationForm" class="form-grid">
          <div class="form-group">
            <label for="rfqId">RFQ ID</label>
            <input id="rfqId" name="rfqId" type="text" value="${PMS.escapeHtml(selectedRfqId || "")}" placeholder="Example: 1001" required>
          </div>

          <div class="form-group">
            <label for="totalBidAmount">Total Bid Amount</label>
            <input id="totalBidAmount" name="totalBidAmount" type="number" min="0.01" step="0.01" placeholder="0.00" required>
          </div>

          <div class="form-group full-width">
            <label>Item Line Details</label>
            <div id="quoteLineItems"></div>
            <button id="addQuoteLineItemBtn" type="button" class="btn btn-soft">Add Line Item</button>
          </div>

          <div class="form-group full-width">
            <label for="notes">Notes</label>
            <textarea id="notes" name="notes" rows="4" placeholder="Add any supplier notes, delivery terms or important information"></textarea>
          </div>

          <div id="quotationSubmissionResult" class="full-width"></div>

          <div class="form-actions full-width">
            <button type="submit" class="btn btn-primary">Submit Quotation</button>
            <button type="reset" class="btn btn-secondary">Clear</button>
          </div>
        </form>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Quotation List</h2>
            <p class="muted">Search and filter supplier quotations.</p>
          </div>
        </div>

        <div class="filter-row">
          <div class="form-group">
            <label for="quotationSearch">Search Quotations</label>
            <input id="quotationSearch" type="text" placeholder="Search by quotation, RFQ or supplier">
          </div>

          <div class="form-group">
            <label for="quotationStatusFilter">Status</label>
            <select id="quotationStatusFilter">
              <option value="ALL">All Statuses</option>
              <option value="Saved">Saved</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div id="quotationTableArea"></div>
      </section>
    `);

    document.getElementById("quotationForm").addEventListener("submit", handleQuotationSubmit);
    document.getElementById("addQuoteLineItemBtn").addEventListener("click", function () {
      const container = document.getElementById("quoteLineItems");
      if (!container) {
        return;
      }

      container.insertAdjacentHTML("beforeend", createLineItemRowHtml());
    });
    document.getElementById("quotationForm").addEventListener("reset", function () {
      setTimeout(renderDefaultLineItemRows, 0);
      const confirmation = document.getElementById("quotationSubmissionResult");
      if (confirmation) {
        confirmation.innerHTML = "";
      }
    });
    document.getElementById("quotationSearch").addEventListener("input", applyFilters);
    document.getElementById("quotationStatusFilter").addEventListener("change", applyFilters);

    renderDefaultLineItemRows();

    applyFilters();
  }

  async function start() {
    installInlineAlertBridge();

    PMS.renderLayout(
      "supplier-dashboard",
      "My Quotations",
      "Supplier portal quotation list"
    );

    PMS.showLoading("Loading supplier quotations...");

    quotations = await fetchSupplierQuotations();
    filteredQuotations = quotations;

    renderPage();
  }

  start();
})();