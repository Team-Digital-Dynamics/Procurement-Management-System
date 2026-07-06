const THRESHOLD_KEY = "pmsApprovalThresholds";

let approvalThresholds = [];

document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "approval-thresholds",
    "Approval Thresholds",
    "Configure approval levels and monetary approval limits."
  );

  renderApprovalThresholdsPage();
});

function renderApprovalThresholdsPage() {
  const user = PMS.getUser();

  if (!PMS.hasAnyRole(["ADMIN", "ADMINISTRATOR"])) {
    PMS.setContent(`
      <section class="view-section">
        ${PMS.message("error", "You do not have permission to access approval threshold settings.")}
      </section>
    `);
    return;
  }

  approvalThresholds = getApprovalThresholds();

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Approval Threshold Configuration</h2>
          <p>Define which approval level is required based on the requisition value.</p>
        </div>

        <div class="page-actions">
          <button id="resetThresholdsBtn" class="btn btn-danger" type="button">
            Reset Defaults
          </button>
        </div>
      </div>

      ${PMS.message(
        "error",
        "Frontend checklist version only: these settings are saved in the browser. The backend still uses the hard-coded thresholds in ProcurementService.java until we connect this page to the database."
      )}

      <div class="grid-3">
        <article class="stat-card">
          <div class="label">Approval Levels</div>
          <div class="value">${approvalThresholds.length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Lowest Threshold</div>
          <div class="value">${PMS.formatCurrency(getLowestThreshold())}</div>
        </article>

        <article class="stat-card">
          <div class="label">Highest Level</div>
          <div class="value">Level ${getHighestLevel()}</div>
        </article>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="section-header">
            <div>
              <h2>Add / Edit Threshold</h2>
              <p>Update approval level limits and assigned approver role.</p>
            </div>
          </div>

          <form id="thresholdForm">
            <input id="thresholdId" type="hidden">

            <div class="form-grid">
              <div class="form-group">
                <label for="level">Approval Level</label>
                <select id="level" name="level" required>
                  <option value="">Select level</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                </select>
              </div>

              <div class="form-group">
                <label for="role">Approver Role</label>
                <select id="role" name="role" required>
                  <option value="">Select role</option>
                  <option value="APPROVER_LEVEL_1">Approver Level 1</option>
                  <option value="APPROVER_LEVEL_2">Approver Level 2</option>
                  <option value="APPROVER_LEVEL_3">Approver Level 3</option>
                </select>
              </div>

              <div class="form-group">
                <label for="minAmount">Minimum Amount</label>
                <input id="minAmount" name="minAmount" type="number" min="0" step="0.01" required>
              </div>

              <div class="form-group">
                <label for="maxAmount">Maximum Amount</label>
                <input id="maxAmount" name="maxAmount" type="number" min="0" step="0.01" placeholder="Leave blank for unlimited">
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" placeholder="Example: Standard low-value requisition approval."></textarea>
            </div>

            <div class="form-actions">
              <button id="cancelEditBtn" class="btn btn-soft hidden" type="button">
                Cancel Edit
              </button>

              <button class="btn btn-primary" type="submit">
                Save Threshold
              </button>
            </div>
          </form>
        </div>

        <div class="card">
          <div class="section-header">
            <div>
              <h2>Current Approval Flow</h2>
              <p>This is how requisitions are routed based on total value.</p>
            </div>
          </div>

          <div class="info-panel">
            ${approvalThresholds
              .sort(function (a, b) { return Number(a.level) - Number(b.level); })
              .map(flowItemTemplate)
              .join("")}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>Threshold Records</h2>
            <p>Review, filter, edit or remove approval thresholds.</p>
          </div>
        </div>

        <div id="thresholdsTable"></div>
      </div>
    </section>
  `);

  renderThresholdsTable();
  attachThresholdEvents();
}

function renderThresholdsTable() {
  PMS.renderDataTable({
    container: "thresholdsTable",
    title: "Approval Thresholds",
    rows: approvalThresholds.sort(function (a, b) {
      return Number(a.level) - Number(b.level);
    }),
    pageSize: 10,
    searchPlaceholder: "Filter thresholds...",
    emptyTitle: "No thresholds configured",
    emptyText: "Add a threshold to define approval routing.",
    columns: [
      {
        label: "Level",
        key: "level",
        render: function (item) {
          return `<strong>Level ${PMS.escapeHtml(item.level)}</strong>`;
        },
        searchValue: function (item) {
          return `Level ${item.level}`;
        }
      },
      {
        label: "Role",
        key: "role",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatRoles([item.role]));
        }
      },
      {
        label: "Minimum",
        key: "minAmount",
        render: function (item) {
          return PMS.formatCurrency(item.minAmount);
        }
      },
      {
        label: "Maximum",
        key: "maxAmount",
        render: function (item) {
          return item.maxAmount === null || item.maxAmount === ""
            ? "Unlimited"
            : PMS.formatCurrency(item.maxAmount);
        }
      },
      {
        label: "Description",
        key: "description",
        render: function (item) {
          return PMS.escapeHtml(item.description || "-");
        }
      },
      {
        label: "Actions",
        key: "actions",
        render: function (item) {
          return `
            <div class="action-row">
              <button class="btn btn-soft btn-sm" data-action="edit" data-id="${PMS.escapeHtml(item.id)}" type="button">
                Edit
              </button>

              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${PMS.escapeHtml(item.id)}" type="button">
                Delete
              </button>
            </div>
          `;
        },
        searchValue: function () {
          return "";
        }
      }
    ]
  });
}

function attachThresholdEvents() {
  const form = document.getElementById("thresholdForm");
  const table = document.getElementById("thresholdsTable");
  const resetBtn = document.getElementById("resetThresholdsBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      saveThreshold();
    });
  }

  if (table) {
    table.addEventListener("click", async function (event) {
      const button = event.target.closest("button[data-action]");

      if (!button) return;

      const action = button.dataset.action;
      const id = button.dataset.id;

      if (action === "edit") {
        editThreshold(id);
      }

      if (action === "delete") {
        const confirmed = await PMS.confirmAction({
          title: "Delete approval threshold",
          message: "Are you sure you want to delete this approval threshold?",
          confirmText: "Delete",
          cancelText: "Cancel",
          danger: true
        });

        if (!confirmed) return;

        approvalThresholds = approvalThresholds.filter(function (item) {
          return item.id !== id;
        });

        saveApprovalThresholds(approvalThresholds);
        PMS.showToast("success", "Approval threshold deleted.");
        renderApprovalThresholdsPage();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", async function () {
      const confirmed = await PMS.confirmAction({
        title: "Reset approval thresholds",
        message: "This will replace the current approval thresholds with the default Level 1, Level 2 and Level 3 setup.",
        confirmText: "Reset Defaults",
        cancelText: "Cancel",
        danger: true
      });

      if (!confirmed) return;

      approvalThresholds = getDefaultThresholds();
      saveApprovalThresholds(approvalThresholds);

      PMS.showToast("success", "Approval thresholds reset to defaults.");
      renderApprovalThresholdsPage();
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", function () {
      clearThresholdForm();
    });
  }
}

function saveThreshold() {
  const id = document.getElementById("thresholdId").value;
  const level = Number(document.getElementById("level").value);
  const role = document.getElementById("role").value;
  const minAmount = Number(document.getElementById("minAmount").value);
  const maxAmountRaw = document.getElementById("maxAmount").value;
  const maxAmount = maxAmountRaw === "" ? null : Number(maxAmountRaw);
  const description = document.getElementById("description").value.trim();

  if (!level || !role) {
    PMS.showToast("error", "Please select both approval level and role.");
    return;
  }

  if (maxAmount !== null && maxAmount < minAmount) {
    PMS.showToast("error", "Maximum amount cannot be lower than minimum amount.");
    return;
  }

  const threshold = {
    id: id || `TH-${Date.now()}`,
    level,
    role,
    minAmount,
    maxAmount,
    description
  };

  if (id) {
    approvalThresholds = approvalThresholds.map(function (item) {
      return item.id === id ? threshold : item;
    });
  } else {
    approvalThresholds = approvalThresholds.filter(function (item) {
      return Number(item.level) !== level;
    });

    approvalThresholds.push(threshold);
  }

  saveApprovalThresholds(approvalThresholds);
  PMS.showToast("success", "Approval threshold saved.");
  renderApprovalThresholdsPage();
}

function editThreshold(id) {
  const threshold = approvalThresholds.find(function (item) {
    return item.id === id;
  });

  if (!threshold) return;

  document.getElementById("thresholdId").value = threshold.id;
  document.getElementById("level").value = threshold.level;
  document.getElementById("role").value = threshold.role;
  document.getElementById("minAmount").value = threshold.minAmount;
  document.getElementById("maxAmount").value = threshold.maxAmount === null ? "" : threshold.maxAmount;
  document.getElementById("description").value = threshold.description || "";

  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (cancelEditBtn) {
    cancelEditBtn.classList.remove("hidden");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function clearThresholdForm() {
  const form = document.getElementById("thresholdForm");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  if (form) {
    form.reset();
  }

  document.getElementById("thresholdId").value = "";

  if (cancelEditBtn) {
    cancelEditBtn.classList.add("hidden");
  }
}

function getApprovalThresholds() {
  const raw = localStorage.getItem(THRESHOLD_KEY);

  if (!raw) {
    const defaults = getDefaultThresholds();
    saveApprovalThresholds(defaults);
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultThresholds();
  } catch (error) {
    return getDefaultThresholds();
  }
}

function saveApprovalThresholds(thresholds) {
  localStorage.setItem(THRESHOLD_KEY, JSON.stringify(thresholds || []));
}

function getDefaultThresholds() {
  return [
    {
      id: "TH-LEVEL-1",
      level: 1,
      role: "APPROVER_LEVEL_1",
      minAmount: 0,
      maxAmount: 25000,
      description: "Level 1 approval for low-value requisitions."
    },
    {
      id: "TH-LEVEL-2",
      level: 2,
      role: "APPROVER_LEVEL_2",
      minAmount: 25000.01,
      maxAmount: 100000,
      description: "Level 2 approval for medium-value requisitions."
    },
    {
      id: "TH-LEVEL-3",
      level: 3,
      role: "APPROVER_LEVEL_3",
      minAmount: 100000.01,
      maxAmount: null,
      description: "Level 3 approval for high-value requisitions."
    }
  ];
}

function flowItemTemplate(item) {
  return `
    <div style="margin-bottom: 14px;">
      <strong>Level ${PMS.escapeHtml(item.level)} — ${PMS.escapeHtml(PMS.formatRoles([item.role]))}</strong>
      <p>
        ${PMS.formatCurrency(item.minAmount)}
        to
        ${item.maxAmount === null || item.maxAmount === "" ? "Unlimited" : PMS.formatCurrency(item.maxAmount)}
      </p>
      <p>${PMS.escapeHtml(item.description || "")}</p>
    </div>
  `;
}

function getLowestThreshold() {
  if (approvalThresholds.length === 0) return 0;

  return Math.min.apply(null, approvalThresholds.map(function (item) {
    return Number(item.minAmount || 0);
  }));
}

function getHighestLevel() {
  if (approvalThresholds.length === 0) return "-";

  return Math.max.apply(null, approvalThresholds.map(function (item) {
    return Number(item.level || 0);
  }));
}