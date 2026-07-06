document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout("profile", "My Profile", "View and update your own account details.");
  loadProfile();
});

async function loadProfile(messageHtml) {
  PMS.showLoading("Loading profile...");

  try {
    const profile = await PMS.getJson("/api/users/me");

    PMS.setContent(`
      ${messageHtml || ""}

      <section class="grid-3">
        ${profileCard("Account Status", PMS.formatStatus(profile.status), "Current user account status")}
        ${profileCard("Role", PMS.formatRoles(profile.roles), "System access role")}
        ${profileCard("Approval Limit", PMS.formatCurrency(profile.approvalLimit), "Approval authority limit")}
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Account Details</h2>
            <p>Update your personal profile information.</p>
          </div>
        </div>

        <form id="profileForm" class="auth-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value="${PMS.escapeHtml(profile.fullName)}"
                required
              >
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value="${PMS.escapeHtml(profile.email)}"
                required
              >
            </div>

            <div class="form-group">
              <label>Account Status</label>
              <input type="text" value="${PMS.formatStatus(profile.status)}" disabled>
            </div>

            <div class="form-group">
              <label>Role</label>
              <input type="text" value="${PMS.formatRoles(profile.roles)}" disabled>
            </div>

            <div class="form-group">
              <label>Approval Limit</label>
              <input type="text" value="${PMS.formatCurrency(profile.approvalLimit)}" disabled>
            </div>
          </div>

          <div class="action-row">
            <button class="btn btn-primary" type="submit">Save Changes</button>
            <button class="btn btn-soft" type="button" id="refreshBtn">Refresh</button>
          </div>
        </form>
      </section>

      <section class="view-section">
        <div class="section-header">
          <div>
            <h2>Security Note</h2>
            <p>Your role, approval limit and account status are managed by the System Administrator.</p>
          </div>
        </div>

        <div class="simple-list">
          <div class="list-item">
            <h4>Editable Details</h4>
            <p>You can update your name and email address from this page.</p>
          </div>

          <div class="list-item">
            <h4>Administrator Controlled Details</h4>
            <p>Role, account status and approval limit can only be changed by an Administrator.</p>
          </div>
        </div>
      </section>
    `);

    document.getElementById("profileForm").addEventListener("submit", updateProfile);
    document.getElementById("refreshBtn").addEventListener("click", function () {
      loadProfile();
    });
  } catch (error) {
    PMS.setContent(`<section class="view-section">${PMS.message("error", error.message)}</section>`);
  }
}

function profileCard(label, value, text) {
  return `
    <div class="stat-card">
      <p class="label">${PMS.escapeHtml(label)}</p>
      <p class="value" style="font-size: 1.25rem;">${PMS.escapeHtml(value)}</p>
      <p class="muted">${PMS.escapeHtml(text)}</p>
    </div>
  `;
}

async function updateProfile(event) {
  event.preventDefault();

  const form = event.target;
  const data = PMS.formDataToObject(form);

  try {
    const updatedProfile = await PMS.putJson("/api/users/me", {
      fullName: data.fullName,
      email: data.email
    });

    updateLocalUser(updatedProfile);

    loadProfile(PMS.message("success", "Profile updated successfully."));
  } catch (error) {
    loadProfile(PMS.message("error", error.message));
  }
}

function updateLocalUser(updatedProfile) {
  const storedUser = localStorage.getItem("pmsUser");

  if (!storedUser) return;

  try {
    const user = JSON.parse(storedUser);

    user.fullName = updatedProfile.fullName;
    user.email = updatedProfile.email;
    user.roles = updatedProfile.roles || user.roles;

    localStorage.setItem("pmsUser", JSON.stringify(user));
  } catch (error) {
    // If local storage cannot be updated, the backend update still succeeded.
  }
}