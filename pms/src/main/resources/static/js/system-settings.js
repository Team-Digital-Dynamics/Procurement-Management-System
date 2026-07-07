const SYSTEM_SETTINGS_KEY = "pmsSystemSettings";

let systemSettings = {};

document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "system-settings",
    "System Settings",
    "Manage core procurement system configuration and admin preferences."
  );

  renderSystemSettingsPage();
});

function renderSystemSettingsPage() {
  if (!PMS.hasAnyRole(["ADMIN", "ADMINISTRATOR"])) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", "You do not have permission to access system settings.")}
      </section>
    `);
    return;
  }

  systemSettings = getSystemSettings();

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Admin Configuration</h2>
          <p>Configure general PMS settings, supplier portal options, notifications and approval controls.</p>
        </div>

        <div class="page-actions">
          <button id="resetSettingsBtn" class="btn btn-danger" type="button">
            Reset Defaults
          </button>

          <button id="exportSettingsBtn" class="btn btn-soft" type="button">
            Export Settings
          </button>
        </div>
      </div>

      <div class="info-panel">
        Frontend checklist version only: these settings are saved in the browser using localStorage. Backend connection can be added later when a system settings endpoint is created.
      </div>

      <div class="grid-4">
        <article class="stat-card">
          <div class="label">Company</div>
          <div class="value">${PMS.escapeHtml(systemSettings.companyShortName)}</div>
        </article>

        <article class="stat-card">
          <div class="label">Currency</div>
          <div class="value">${PMS.escapeHtml(systemSettings.defaultCurrency)}</div>
        </article>

        <article class="stat-card">
          <div class="label">Supplier Portal</div>
          <div class="value">${systemSettings.supplierPortalEnabled ? "On" : "Off"}</div>
        </article>

        <article class="stat-card">
          <div class="label">Maintenance</div>
          <div class="value">${systemSettings.maintenanceMode ? "On" : "Off"}</div>
        </article>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="section-header">
            <div>
              <h2>General Settings</h2>
              <p>Basic organisation and system display settings.</p>
            </div>
          </div>

          <form id="generalSettingsForm">
            <div class="form-grid">
              <div class="form-group">
                <label for="companyName">Company Name</label>
                <input id="companyName" name="companyName" type="text" required value="${PMS.escapeHtml(systemSettings.companyName)}">
              </div>

              <div class="form-group">
                <label for="companyShortName">Short Name</label>
                <input id="companyShortName" name="companyShortName" type="text" required value="${PMS.escapeHtml(systemSettings.companyShortName)}">
              </div>

              <div class="form-group">
                <label for="defaultCurrency">Default Currency</label>
                <select id="defaultCurrency" name="defaultCurrency" required>
                  ${currencyOption("ZAR")}
                  ${currencyOption("USD")}
                  ${currencyOption("EUR")}
                  ${currencyOption("GBP")}
                </select>
              </div>

              <div class="form-group">
                <label for="financialYear">Financial Year</label>
                <input id="financialYear" name="financialYear" type="text" required value="${PMS.escapeHtml(systemSettings.financialYear)}">
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" type="submit">
                Save General Settings
              </button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="section-header">
            <div>
              <h2>Procurement Rules</h2>
              <p>Default procurement and RFQ configuration.</p>
            </div>
          </div>

          <form id="procurementSettingsForm">
            <div class="form-grid">
              <div class="form-group">
                <label for="defaultRfqDays">Default RFQ Days</label>
                <input id="defaultRfqDays" name="defaultRfqDays" type="number" min="1" required value="${PMS.escapeHtml(systemSettings.defaultRfqDays)}">
              </div>

              <div class="form-group">
                <label for="minimumQuotationCount">Minimum Quotations</label>
                <input id="minimumQuotationCount" name="minimumQuotationCount" type="number" min="1" required value="${PMS.escapeHtml(systemSettings.minimumQuotationCount)}">
              </div>

              <div class="form-group">
                <label for="purchaseOrderPrefix">PO Prefix</label>
                <input id="purchaseOrderPrefix" name="purchaseOrderPrefix" type="text" required value="${PMS.escapeHtml(systemSettings.purchaseOrderPrefix)}">
              </div>

              <div class="form-group">
                <label for="rfqPrefix">RFQ Prefix</label>
                <input id="rfqPrefix" name="rfqPrefix" type="text" required value="${PMS.escapeHtml(systemSettings.rfqPrefix)}">
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" type="submit">
                Save Procurement Rules
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="section-header">
            <div>
              <h2>Feature Toggles</h2>
              <p>Enable or disable key system features.</p>
            </div>
          </div>

          <form id="featureSettingsForm">
            ${toggleTemplate("supplierPortalEnabled", "Supplier Portal", "Allow suppliers to access the supplier portal.")}
            ${toggleTemplate("notificationBellEnabled", "Notification Bell", "Show the notification bell dropdown in the topbar.")}
            ${toggleTemplate("auditLoggingEnabled", "Audit Logging", "Record important system activities in the audit log.")}
            ${toggleTemplate("csvExportEnabled", "CSV Export", "Allow report and table exports to CSV.")}
            ${toggleTemplate("maintenanceMode", "Maintenance Mode", "Display the system as under maintenance for testing purposes.")}

            <div class="form-actions">
              <button class="btn btn-primary" type="submit">
                Save Feature Toggles
              </button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="section-header">
            <div>
              <h2>Notification Settings</h2>
              <p>Configure when system notifications should be created.</p>
            </div>
          </div>

          <form id="notificationSettingsForm">
            ${toggleTemplate("notifyOnRequisitionSubmit", "Requisition Submitted", "Notify approvers when a requisition is submitted.")}
            ${toggleTemplate("notifyOnApprovalDecision", "Approval Decision", "Notify requesters when a requisition is approved or rejected.")}
            ${toggleTemplate("notifyOnRfqCreated", "RFQ Created", "Notify procurement users when an RFQ is created.")}
            ${toggleTemplate("notifyOnQuotationSubmitted", "Quotation Submitted", "Notify procurement users when suppliers submit quotations.")}
            ${toggleTemplate("notifyOnGrnDiscrepancy", "GRN Discrepancy", "Notify responsible users when a GRN discrepancy is captured.")}

            <div class="form-actions">
              <button class="btn btn-primary" type="submit">
                Save Notification Settings
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Current Settings Summary</h2>
            <p>Search and review the current saved settings.</p>
          </div>
        </div>

        <div id="settingsTable"></div>
      </div>
    </section>
  `);

  renderSettingsTable();
  attachSystemSettingsEvents();
}

function attachSystemSettingsEvents() {
  const generalForm = document.getElementById("generalSettingsForm");
  const procurementForm = document.getElementById("procurementSettingsForm");
  const featureForm = document.getElementById("featureSettingsForm");
  const notificationForm = document.getElementById("notificationSettingsForm");
  const resetBtn = document.getElementById("resetSettingsBtn");
  const exportBtn = document.getElementById("exportSettingsBtn");

  if (generalForm) {
    generalForm.addEventListener("submit", function (event) {
      event.preventDefault();

      updateSettings({
        companyName: document.getElementById("companyName").value.trim(),
        companyShortName: document.getElementById("companyShortName").value.trim(),
        defaultCurrency: document.getElementById("defaultCurrency").value,
        financialYear: document.getElementById("financialYear").value.trim()
      });

      PMS.showToast("success", "General settings saved.");
      renderSystemSettingsPage();
    });
  }

  if (procurementForm) {
    procurementForm.addEventListener("submit", function (event) {
      event.preventDefault();

      updateSettings({
        defaultRfqDays: Number(document.getElementById("defaultRfqDays").value),
        minimumQuotationCount: Number(document.getElementById("minimumQuotationCount").value),
        purchaseOrderPrefix: document.getElementById("purchaseOrderPrefix").value.trim(),
        rfqPrefix: document.getElementById("rfqPrefix").value.trim()
      });

      PMS.showToast("success", "Procurement rules saved.");
      renderSystemSettingsPage();
    });
  }

  if (featureForm) {
    featureForm.addEventListener("submit", function (event) {
      event.preventDefault();

      updateSettings({
        supplierPortalEnabled: getChecked("supplierPortalEnabled"),
        notificationBellEnabled: getChecked("notificationBellEnabled"),
        auditLoggingEnabled: getChecked("auditLoggingEnabled"),
        csvExportEnabled: getChecked("csvExportEnabled"),
        maintenanceMode: getChecked("maintenanceMode")
      });

      PMS.showToast("success", "Feature toggles saved.");
      renderSystemSettingsPage();
    });
  }

  if (notificationForm) {
    notificationForm.addEventListener("submit", function (event) {
      event.preventDefault();

      updateSettings({
        notifyOnRequisitionSubmit: getChecked("notifyOnRequisitionSubmit"),
        notifyOnApprovalDecision: getChecked("notifyOnApprovalDecision"),
        notifyOnRfqCreated: getChecked("notifyOnRfqCreated"),
        notifyOnQuotationSubmitted: getChecked("notifyOnQuotationSubmitted"),
        notifyOnGrnDiscrepancy: getChecked("notifyOnGrnDiscrepancy")
      });

      PMS.showToast("success", "Notification settings saved.");
      renderSystemSettingsPage();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", async function () {
      const confirmed = await PMS.confirmAction({
        title: "Reset system settings",
        message: "This will reset all system settings to the default checklist configuration.",
        confirmText: "Reset Defaults",
        cancelText: "Cancel",
        danger: true
      });

      if (!confirmed) return;

      systemSettings = getDefaultSystemSettings();
      saveSystemSettings(systemSettings);

      PMS.showToast("success", "System settings reset to defaults.");
      renderSystemSettingsPage();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      exportSettingsJson();
    });
  }
}

function renderSettingsTable() {
  const rows = Object.entries(systemSettings).map(function ([key, value]) {
    return {
      setting: key,
      value: typeof value === "boolean" ? (value ? "Enabled" : "Disabled") : value,
      type: typeof value
    };
  });

  PMS.renderDataTable({
    container: "settingsTable",
    title: "System Settings",
    rows,
    pageSize: 10,
    searchPlaceholder: "Filter settings...",
    emptyTitle: "No settings found",
    emptyText: "No system settings are currently available.",
    columns: [
      {
        label: "Setting",
        key: "setting",
        render: function (item) {
          return `<strong>${PMS.escapeHtml(formatSettingName(item.setting))}</strong>
                  <p class="muted">${PMS.escapeHtml(item.setting)}</p>`;
        },
        searchValue: function (item) {
          return `${item.setting} ${formatSettingName(item.setting)}`;
        }
      },
      {
        label: "Value",
        key: "value",
        render: function (item) {
          if (item.value === "Enabled") {
            return `<span class="badge success">Enabled</span>`;
          }

          if (item.value === "Disabled") {
            return `<span class="badge danger">Disabled</span>`;
          }

          return PMS.escapeHtml(item.value);
        }
      },
      {
        label: "Type",
        key: "type",
        render: function (item) {
          return PMS.statusBadge(item.type);
        }
      }
    ]
  });
}

function getSystemSettings() {
  const raw = localStorage.getItem(SYSTEM_SETTINGS_KEY);

  if (!raw) {
    const defaults = getDefaultSystemSettings();
    saveSystemSettings(defaults);
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultSystemSettings(),
      ...parsed
    };
  } catch (error) {
    return getDefaultSystemSettings();
  }
}

function saveSystemSettings(settings) {
  localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(settings || {}));
}

function updateSettings(updates) {
  systemSettings = {
    ...getSystemSettings(),
    ...updates
  };

  saveSystemSettings(systemSettings);
}

function getDefaultSystemSettings() {
  return {
    companyName: "Digital Dynamics",
    companyShortName: "DD PMS",
    defaultCurrency: "ZAR",
    financialYear: "2026",

    defaultRfqDays: 7,
    minimumQuotationCount: 3,
    purchaseOrderPrefix: "PO",
    rfqPrefix: "RFQ",

    supplierPortalEnabled: true,
    notificationBellEnabled: true,
    auditLoggingEnabled: true,
    csvExportEnabled: true,
    maintenanceMode: false,

    notifyOnRequisitionSubmit: true,
    notifyOnApprovalDecision: true,
    notifyOnRfqCreated: true,
    notifyOnQuotationSubmitted: true,
    notifyOnGrnDiscrepancy: true
  };
}

function currencyOption(currency) {
  return `
    <option value="${currency}" ${systemSettings.defaultCurrency === currency ? "selected" : ""}>
      ${currency}
    </option>
  `;
}

function toggleTemplate(id, title, description) {
  const checked = systemSettings[id] ? "checked" : "";

  return `
    <div class="info-panel" style="margin-bottom: 12px;">
      <label style="display: flex; gap: 12px; align-items: flex-start; cursor: pointer;">
        <input
          id="${PMS.escapeHtml(id)}"
          type="checkbox"
          ${checked}
          style="width: auto; margin-top: 4px;"
        >

        <span>
          <strong>${PMS.escapeHtml(title)}</strong>
          <br>
          <span class="muted">${PMS.escapeHtml(description)}</span>
        </span>
      </label>
    </div>
  `;
}

function getChecked(id) {
  const element = document.getElementById(id);
  return Boolean(element && element.checked);
}

function formatSettingName(value) {
  return String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, function (letter) {
      return letter.toUpperCase();
    });
}

function exportSettingsJson() {
  const blob = new Blob([JSON.stringify(getSystemSettings(), null, 2)], {
    type: "application/json;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `system-settings-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();

  URL.revokeObjectURL(url);

  PMS.showToast("success", "System settings exported.");
}