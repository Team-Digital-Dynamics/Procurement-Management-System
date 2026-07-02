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
        ${statCard("Submitted Requisitions", data.submittedRequisitions, "Waiting for approval")}
        ${statCard("Approved Requisitions", data.approvedRequisitions, "Ready for RFQ creation")}
        ${statCard("Open RFQs", data.openRfqs, "RFQs currently open")}
        ${statCard("Approved Suppliers", data.approvedSuppliers, "Suppliers ready to use")}
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
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function statCard(label, value, text) {
  return `
    <div class="stat-card">
      <p class="label">${PMS.escapeHtml(label)}</p>
      <p class="value">${PMS.escapeHtml(value ?? 0)}</p>
      <p class="muted">${PMS.escapeHtml(text)}</p>
    </div>
  `;
}
