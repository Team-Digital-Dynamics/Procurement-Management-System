document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("users", "Users", "Review registered users and manage system access.");
  loadUsers();
});

const USER_ROLES = [
  { value: "REQUESTER", label: "Requester" },
  { value: "PROCUREMENT_OFFICER", label: "Procurement Officer" },
  { value: "APPROVER_LEVEL_1", label: "Approver Level 1" },
  { value: "APPROVER_LEVEL_2", label: "Approver Level 2" },
  { value: "APPROVER_LEVEL_3", label: "Approver Level 3" },
  { value: "RECEIVING_CLERK", label: "Receiving Clerk" },
  { value: "ADMIN", label: "System Administrator" }
];

const USER_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "LOCKED", label: "Locked" }
];

async function loadUsers(messageHtml) {
  PMS.showLoading("Loading users...");

  try {
    const users = await PMS.getJson("/api/users");
    const currentUser = PMS.getUser();

    PMS.setContent(`
      ${messageHtml || ""}

      <section class="grid-3">
        ${statCard("Pending Users", countByStatus(users, "PENDING"), "Awaiting administrator approval")}
        ${statCard("Active Users", countByStatus(users, "ACTIVE"), "Approved users with system access")}
        ${statCard("Locked Users", countByStatus(users, "LOCKED"), "Accounts currently blocked")}
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>User Access Register</h2>
            <p>Activate new registrations, assign roles and manage approval limits.</p>
          </div>
          <button class="btn btn-soft" type="button" id="refreshBtn">Refresh</button>
        </div>

        ${usersTable(users, currentUser)}
      </section>
    `);

    document.getElementById("refreshBtn").addEventListener("click", function () {
      loadUsers();
    });

    document.querySelectorAll("[data-save-user]").forEach(function (button) {
      button.addEventListener("click", function () {
        saveUserAccess(button.dataset.saveUser);
      });
    });
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function statCard(label, value, text) {
  return `
    <div class="stat-card">
      <p class="label">${PMS.escapeHtml(label)}</p>
      <p class="value">${PMS.escapeHtml(value)}</p>
      <p class="muted">${PMS.escapeHtml(text)}</p>
    </div>
  `;
}

function countByStatus(users, status) {
  if (!Array.isArray(users)) return 0;

  return users.filter(function (user) {
    return String(user.status || "").toUpperCase() === status;
  }).length;
}

function usersTable(users, currentUser) {
  if (!Array.isArray(users) || users.length === 0) {
    return PMS.emptyState("No users found", "Registered users will appear here.");
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Role</th>
            <th>Approval Limit</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(function (user) {
            return userRow(user, currentUser);
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function userRow(user, currentUser) {
  const selectedRole = getPrimaryRole(user.roles);
  const isCurrentUser = currentUser && Number(currentUser.userId) === Number(user.id);

  return `
    <tr data-user-row="${PMS.escapeHtml(user.id)}">
      <td>${PMS.escapeHtml(user.id)}</td>
      <td>${PMS.escapeHtml(user.fullName)}</td>
      <td>${PMS.escapeHtml(user.email)}</td>
      <td>${PMS.statusBadge(user.status)}</td>
      <td>
        <select data-user-role ${isCurrentUser ? "disabled" : ""}>
          ${USER_ROLES.map(function (role) {
            return `<option value="${role.value}" ${selectedRole === role.value ? "selected" : ""}>${role.label}</option>`;
          }).join("")}
        </select>
      </td>
      <td>
        <input data-user-limit type="number" min="0" step="0.01" value="${PMS.escapeHtml(user.approvalLimit ?? 0)}" ${isCurrentUser ? "disabled" : ""}>
      </td>
      <td>
        <div class="action-row">
          <select data-user-status ${isCurrentUser ? "disabled" : ""}>
            ${USER_STATUSES.map(function (status) {
              return `<option value="${status.value}" ${String(user.status) === status.value ? "selected" : ""}>${status.label}</option>`;
            }).join("")}
          </select>

          ${isCurrentUser
            ? `<span class="badge">Current Admin</span>`
            : `<button class="btn btn-primary" type="button" data-save-user="${PMS.escapeHtml(user.id)}">Save</button>`
          }
        </div>
      </td>
    </tr>
  `;
}

function getPrimaryRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return "REQUESTER";

  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("PROCUREMENT_OFFICER")) return "PROCUREMENT_OFFICER";
  if (roles.includes("APPROVER_LEVEL_3")) return "APPROVER_LEVEL_3";
  if (roles.includes("APPROVER_LEVEL_2")) return "APPROVER_LEVEL_2";
  if (roles.includes("APPROVER_LEVEL_1")) return "APPROVER_LEVEL_1";
  if (roles.includes("RECEIVING_CLERK")) return "RECEIVING_CLERK";

  return roles[0];
}

async function saveUserAccess(userId) {
  const row = document.querySelector(`[data-user-row="${CSS.escape(String(userId))}"]`);
  if (!row) return;

  const role = row.querySelector("[data-user-role]").value;
  const status = row.querySelector("[data-user-status]").value;
  const approvalLimit = Number(row.querySelector("[data-user-limit]").value || 0);

  try {
    await PMS.putJson(`/api/users/${userId}/roles`, {
      roles: [role],
      status: status,
      approvalLimit: approvalLimit
    });

    loadUsers(PMS.message("success", "User access updated successfully."));
  } catch (error) {
    loadUsers(PMS.message("error", error.message));
  }
}