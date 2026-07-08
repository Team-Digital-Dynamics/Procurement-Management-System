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

  async function fetchSupplierQuotations() {
    try {
      const data = await PMS.getJson("/api/supplier-portal/quotations");
      return Array.isArray(data) ? data : demoQuotations;
    } catch (error) {
      console.warn("Using demo supplier quotation data:", error.message);
      return demoQuotations;
    }
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

    if (!payload.rfqId || payload.totalBidAmount <= 0 || payload.itemLineDetails.length === 0) {
      alert("Please complete RFQ ID, Total Bid Amount and at least one valid line item.");
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    const originalButtonText = submitButton ? submitButton.textContent : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Saving...";
    }

    try {
      const response = await fetch("/api/v1/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const responseBody = await parseResponseBody(response);

      if (response.status !== 201) {
        throw new Error(
          (responseBody && (responseBody.message || responseBody.error || responseBody.details)) ||
          "Unable to save quotation."
        );
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
      alert(error.message || "Unable to save quotation.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
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