(function () {
  const demoRfqs = [
    {
      id: 1,
      rfqNumber: "RFQ-2026-001",
      title: "Office Equipment Supply",
      linkedRequisition: "REQ-2026-004",
      closingDate: "2026-07-20",
      status: "OPEN",
      estimatedValue: 18500
    },
    {
      id: 2,
      rfqNumber: "RFQ-2026-002",
      title: "IT Hardware Procurement",
      linkedRequisition: "REQ-2026-006",
      closingDate: "2026-07-25",
      status: "OPEN",
      estimatedValue: 42500
    },
    {
      id: 3,
      rfqNumber: "RFQ-2026-003",
      title: "Warehouse Consumables",
      linkedRequisition: "REQ-2026-008",
      closingDate: "2026-07-30",
      status: "PENDING_QUOTE",
      estimatedValue: 9700
    }
  ];

  let rfqs = [];
  let filteredRfqs = [];

  async function fetchSupplierRfqs() {
    try {
      const data = await PMS.getJson("/api/supplier-portal/rfqs");
      return Array.isArray(data) ? data : demoRfqs;
    } catch (error) {
      console.warn("Using demo supplier RFQ data:", error.message);
      return demoRfqs;
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById("rfqSearch");
    const statusFilter = document.getElementById("statusFilter");

    const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const statusValue = statusFilter ? statusFilter.value : "ALL";

    filteredRfqs = rfqs.filter(function (rfq) {
      const combinedText = `
        ${rfq.rfqNumber || ""}
        ${rfq.title || ""}
        ${rfq.linkedRequisition || ""}
        ${rfq.status || ""}
      `.toLowerCase();

      const matchesSearch = combinedText.includes(searchValue);
      const matchesStatus = statusValue === "ALL" || rfq.status === statusValue;

      return matchesSearch && matchesStatus;
    });

    renderTable();
  }

  function renderTable() {
    const tableArea = document.getElementById("rfqTableArea");

    if (!tableArea) return;

    if (!filteredRfqs || filteredRfqs.length === 0) {
      tableArea.innerHTML = PMS.emptyState(
        "No RFQs found",
        "No RFQs match your current search or filter."
      );
      return;
    }

    tableArea.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>RFQ Number</th>
              <th>Title</th>
              <th>Linked Requisition</th>
              <th>Closing Date</th>
              <th>Estimated Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            ${filteredRfqs.map(function (rfq) {
              return `
                <tr>
                  <td>${PMS.escapeHtml(rfq.rfqNumber || "-")}</td>
                  <td>${PMS.escapeHtml(rfq.title || "-")}</td>
                  <td>${PMS.escapeHtml(rfq.linkedRequisition || "-")}</td>
                  <td>${PMS.escapeHtml(rfq.closingDate || "-")}</td>
                  <td>${PMS.formatCurrency(rfq.estimatedValue)}</td>
                  <td>${PMS.statusBadge(rfq.status)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-sm btn-secondary" type="button" data-view-rfq="${rfq.id}">
                        View
                      </button>

                      <button class="btn btn-sm btn-primary" type="button" data-quote-rfq="${rfq.id}">
                        Submit Quote
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

    document.querySelectorAll("[data-view-rfq]").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = this.getAttribute("data-view-rfq");
        alert("Supplier RFQ detail page can be connected later. Selected RFQ ID: " + id);
      });
    });

    document.querySelectorAll("[data-quote-rfq]").forEach(function (button) {
      button.addEventListener("click", function () {
        const id = this.getAttribute("data-quote-rfq");
        window.location.href = "/supplier-quotations.html?rfqId=" + encodeURIComponent(id);
      });
    });
  }

  function renderPage() {
    PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>My RFQs</h2>
            <p class="muted">View RFQs sent to your supplier account and submit quotations.</p>
          </div>

          <div class="form-actions">
            <a class="btn btn-secondary" href="/supplier-dashboard.html">Back to Supplier Dashboard</a>
          </div>
        </div>

        <div class="filter-row">
          <div class="form-group">
            <label for="rfqSearch">Search RFQs</label>
            <input id="rfqSearch" type="text" placeholder="Search by RFQ number, title or requisition">
          </div>

          <div class="form-group">
            <label for="statusFilter">Status</label>
            <select id="statusFilter">
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="PENDING_QUOTE">Pending Quote</option>
              <option value="CLOSED">Closed</option>
              <option value="AWARDED">Awarded</option>
            </select>
          </div>
        </div>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>RFQ List</h2>
            <p class="muted">Supplier RFQs will load from the backend once the endpoint is available.</p>
          </div>
        </div>

        <div id="rfqTableArea"></div>
      </section>
    `);

    document.getElementById("rfqSearch").addEventListener("input", applyFilters);
    document.getElementById("statusFilter").addEventListener("change", applyFilters);

    applyFilters();
  }

  async function start() {
    PMS.renderLayout(
      "supplier-dashboard",
      "My RFQs",
      "Supplier portal RFQ list"
    );

    PMS.showLoading("Loading supplier RFQs...");

    rfqs = await fetchSupplierRfqs();
    filteredRfqs = rfqs;

    renderPage();
  }

  start();
})();