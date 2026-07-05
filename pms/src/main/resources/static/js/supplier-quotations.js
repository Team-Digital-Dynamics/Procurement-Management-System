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
      rfqNumber: form.rfqNumber.value.trim(),
      supplierName: form.supplierName.value.trim(),
      amount: Number(form.amount.value),
      deliveryDays: Number(form.deliveryDays.value),
      notes: form.notes.value.trim()
    };

    if (!payload.rfqNumber || !payload.supplierName || payload.amount <= 0 || payload.deliveryDays <= 0) {
      alert("Please complete RFQ Number, Supplier Name, Amount and Delivery Days.");
      return;
    }

    try {
      const savedQuotation = await PMS.postJson("/api/supplier-portal/quotations", payload);

      quotations.unshift(savedQuotation);
      form.reset();

      alert("Quotation submitted successfully.");
      applyFilters();
    } catch (error) {
      console.warn("Backend quotation submit not available yet:", error.message);

      const newQuotation = {
        id: Date.now(),
        quotationNumber: "QTN-DEMO-" + Date.now(),
        rfqNumber: payload.rfqNumber,
        supplierName: payload.supplierName,
        amount: payload.amount,
        deliveryDays: payload.deliveryDays,
        status: "SUBMITTED",
        submittedDate: new Date().toISOString().split("T")[0]
      };

      quotations.unshift(newQuotation);
      form.reset();

      alert("Quotation added to this page as demo data. Backend submit can be connected later.");
      applyFilters();
    }
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
            <label for="rfqNumber">RFQ Number</label>
            <input id="rfqNumber" name="rfqNumber" type="text" placeholder="Example: RFQ-2026-001" required>
          </div>

          <div class="form-group">
            <label for="supplierName">Supplier Name</label>
            <input id="supplierName" name="supplierName" type="text" placeholder="Supplier name" required>
          </div>

          <div class="form-group">
            <label for="amount">Quotation Amount</label>
            <input id="amount" name="amount" type="number" min="1" step="0.01" placeholder="0.00" required>
          </div>

          <div class="form-group">
            <label for="deliveryDays">Delivery Days</label>
            <input id="deliveryDays" name="deliveryDays" type="number" min="1" placeholder="Example: 7" required>
          </div>

          <div class="form-group full-width">
            <label for="notes">Notes</label>
            <textarea id="notes" name="notes" rows="4" placeholder="Add any supplier notes, delivery terms or important information"></textarea>
          </div>

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
    document.getElementById("quotationSearch").addEventListener("input", applyFilters);
    document.getElementById("quotationStatusFilter").addEventListener("change", applyFilters);

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