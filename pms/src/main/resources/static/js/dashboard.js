document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("dashboard", "Dashboard", "Monitor procurement activity and pending actions.");
  loadDashboard();
});

async function loadDashboard() {
  PMS.showLoading("Loading dashboard...");

  try {
    const data = await PMS.getJson("/api/dashboard");

    PMS.setContent(`
      <section class="grid-4">
        ${statCard("Submitted Requisitions", data.submittedRequisitions, "Waiting for approval", "kpiSubmittedRequisitions")}
        ${statCard("Approved Requisitions", data.approvedRequisitions, "Ready for RFQ creation", "kpiApprovedRequisitions")}
        ${statCard("Open RFQs", data.openRfqs, "RFQs currently open", "kpiOpenRfqs")}
        ${statCard("Approved Suppliers", data.approvedSuppliers, "Suppliers ready to use", "kpiApprovedSuppliers")}
      </section>

      <section class="grid-1" style="margin-top:12px;">
        ${statCard("Total Active Spend", data.totalActiveSpend, "Total active procurement spend", "kpiTotalActiveSpend", true)}
      </section>

      <section class="grid-2">
        <div class="view-section">
          <div class="section-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Open the main procurement areas from here.</p>
            </div>
          </div>

          <div class="action-row">
            <a class="btn btn-primary" href="/requisitions.html">Open Requisitions</a>
            <a class="btn btn-soft" href="/approvals.html">Open Approvals</a>
            <a class="btn btn-soft" href="/suppliers.html">Manage Suppliers</a>
            <a class="btn btn-soft" href="/rfqs.html">Manage RFQs</a>
            <a class="btn btn-soft" href="/reports.html">View Reports</a>
          </div>
        </div>

        <div class="view-section">
          <div class="section-header">
            <div>
              <h2>Procurement Overview</h2>
              <p>A quick summary of the current procurement cycle.</p>
            </div>
          </div>

          <div class="simple-list">
            <div class="list-item">
              <h4>Requisition Stage</h4>
              <p>Submitted requisitions are reviewed and approved before moving to RFQ creation.</p>
            </div>

            <div class="list-item">
              <h4>Supplier Readiness</h4>
              <p>Only approved suppliers should be considered for quotation activity.</p>
            </div>

            <div class="list-item">
              <h4>RFQ Progress</h4>
              <p>Open RFQs can be monitored and evaluated once supplier quotations are received.</p>
            </div>
          </div>
        </div>
      </section>
    `);

    bindDashboardSummaryMetrics();
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

async function bindDashboardSummaryMetrics() {
  try {
    const response = await fetch("/api/v1/reports/dashboard-summary", {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return;
    }

    const summary = await response.json();

    const totalActiveSpend =
      summary?.totalActiveSpend ??
      summary?.activeSpend ??
      summary?.aggregates?.totalActiveSpend ??
      0;

    const pendingRequisitions =
      summary?.pendingRequisitions ??
      summary?.counts?.pendingRequisitions ??
      summary?.submittedRequisitions ??
      0;

    const openRfqs =
      summary?.openRfqs ??
      summary?.counts?.openRfqs ??
      0;

    bindKpiValue("kpiTotalActiveSpend", totalActiveSpend, true);
    bindKpiValue("kpiSubmittedRequisitions", pendingRequisitions, false);
    bindKpiValue("kpiOpenRfqs", openRfqs, false);
  } catch (error) {
    bindKpiValue("kpiTotalActiveSpend", 0, true);
    bindKpiValue("kpiSubmittedRequisitions", 0, false);
    bindKpiValue("kpiOpenRfqs", 0, false);
  }
}

function bindKpiValue(containerId, value, isCurrency) {
  const node = document.getElementById(containerId);

  if (!node) {
    return;
  }

  const numeric = Number(value);
  const safeNumber = Number.isFinite(numeric) ? numeric : 0;

  node.textContent = isCurrency
    ? PMS.formatCurrency(safeNumber)
    : String(safeNumber);
}

function statCard(label, value, text, valueId, isCurrency) {
  const numeric = Number(value);
  const safeNumber = Number.isFinite(numeric) ? numeric : 0;
  const formattedValue = isCurrency ? PMS.formatCurrency(safeNumber) : String(safeNumber);

  return `
    <div class="stat-card">
      <p class="label">${PMS.escapeHtml(label)}</p>
      <p class="value" ${valueId ? `id="${PMS.escapeHtml(valueId)}"` : ""}>${PMS.escapeHtml(formattedValue)}</p>
      <p class="muted">${PMS.escapeHtml(text)}</p>
    </div>
  `;
}
