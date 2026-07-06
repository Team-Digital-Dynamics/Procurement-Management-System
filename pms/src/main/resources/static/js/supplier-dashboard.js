(function () {
  const demoDashboard = {
    supplierName: "Demo Supplier",
    activeRfqs: 3,
    submittedQuotations: 2,
    awardedPurchaseOrders: 1,
    pendingActions: 2,
    recentActivity: [
      {
        date: "2026-07-01",
        action: "RFQ received",
        details: "RFQ-2026-001 for office equipment was received."
      },
      {
        date: "2026-07-02",
        action: "Quotation submitted",
        details: "Quotation QTN-2026-002 was submitted successfully."
      },
      {
        date: "2026-07-03",
        action: "Purchase order awarded",
        details: "PO-2026-001 was awarded and is awaiting delivery."
      }
    ]
  };

  async function fetchSupplierDashboard() {
    try {
      const data = await PMS.getJson("/api/supplier-portal/dashboard");
      return data || demoDashboard;
    } catch (error) {
      console.warn("Using demo supplier dashboard data:", error.message);
      return demoDashboard;
    }
  }

  function initPageLayout() {
    PMS.renderLayout(
      "supplier-dashboard",
      "Supplier Dashboard",
      "Supplier RFQs, quotations and purchase orders"
    );
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-ZA");
  }

  function createStatCard(title, value, subtitle) {
    return `
      <div class="stat-card">
        <div>
          <p class="stat-label">${PMS.escapeHtml(title)}</p>
          <h3>${formatNumber(value)}</h3>
          <span>${PMS.escapeHtml(subtitle)}</span>
        </div>
      </div>
    `;
  }

  function renderRecentActivity(items) {
    if (!items || items.length === 0) {
      return PMS.emptyState(
        "No recent activity",
        "Supplier activity will appear here once RFQs, quotations and purchase orders are connected."
      );
    }

    return `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(function (item) {
              return `
                <tr>
                  <td>${PMS.escapeHtml(item.date || "-")}</td>
                  <td>${PMS.escapeHtml(item.action || "-")}</td>
                  <td>${PMS.escapeHtml(item.details || "-")}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderDashboard(data) {
    PMS.setContent(`
      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Supplier Dashboard</h2>
            <p class="muted">
              Welcome, ${PMS.escapeHtml(data.supplierName || "Supplier")}. View RFQs, quotations and purchase orders from one place.
            </p>
          </div>
        </div>

        <div class="dashboard-grid">
          ${createStatCard("Active RFQs", data.activeRfqs || 0, "RFQs waiting for supplier action")}
          ${createStatCard("Submitted Quotations", data.submittedQuotations || 0, "Quotations already submitted")}
          ${createStatCard("Awarded POs", data.awardedPurchaseOrders || 0, "Purchase orders awarded")}
          ${createStatCard("Pending Actions", data.pendingActions || 0, "Items requiring attention")}
        </div>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Quick Actions</h2>
            <p class="muted">Use these shortcuts to manage supplier activities.</p>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-primary" id="viewMyRfqsBtn">
            View My RFQs
          </button>

          <button type="button" class="btn btn-secondary" id="viewMyQuotationsBtn">
            View My Quotations
          </button>

          <button type="button" class="btn btn-secondary" id="viewMyPurchaseOrdersBtn">
            View My Purchase Orders
          </button>
        </div>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Recent Activity</h2>
            <p class="muted">Latest supplier portal activity.</p>
          </div>
        </div>

        ${renderRecentActivity(data.recentActivity)}
      </section>
    `);

    document.getElementById("viewMyRfqsBtn").addEventListener("click", function () {
      window.location.href = "/supplier-rfqs.html";
    });

    document.getElementById("viewMyQuotationsBtn").addEventListener("click", function () {
      window.location.href = "/supplier-quotations.html";
    });

    document.getElementById("viewMyPurchaseOrdersBtn").addEventListener("click", function () {
      window.location.href = "/supplier-pos.html";
    });
  }

  async function start() {
    initPageLayout();
    PMS.showLoading("Loading supplier dashboard...");

    const dashboardData = await fetchSupplierDashboard();
    renderDashboard(dashboardData);
  }

  start();
})();