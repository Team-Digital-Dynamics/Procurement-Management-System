(function () {
  const TOKEN_KEY = "pmsToken";
  const USER_KEY = "pmsUser";

  const ROLE_LABELS = {
    ADMIN: "System Administrator",
    PROCUREMENT_OFFICER: "Procurement Officer",
    REQUESTER: "Requester",
    APPROVER_LEVEL_1: "Approver Level 1",
    APPROVER_LEVEL_2: "Approver Level 2",
    APPROVER_LEVEL_3: "Approver Level 3",
    RECEIVING_CLERK: "Receiving Clerk"
  };

  const NAV_ITEMS = [
    { href: "/dashboard.html", label: "Dashboard", page: "dashboard", roles: "all" },
    { href: "/requisitions.html", label: "Requisitions", page: "requisitions", roles: "all" },
    { href: "/approvals.html", label: "Approvals", page: "approvals", roles: ["ADMIN", "APPROVER_LEVEL_1", "APPROVER_LEVEL_2", "APPROVER_LEVEL_3"] },
    { href: "/suppliers.html", label: "Suppliers", page: "suppliers", roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
    { href: "/rfqs.html", label: "RFQs", page: "rfqs", roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
    { href: "/purchase-orders.html", label: "Purchase Orders", page: "purchase-orders", roles: "all" },
    { href: "/reports.html", label: "Reports", page: "reports", roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
    { href: "/audit-logs.html", label: "Audit Logs", page: "audit-logs", roles: ["ADMIN"] },
    { href: "/users.html", label: "Users", page: "users", roles: ["ADMIN"] }
  ];

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function getUser() {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) return null;

    try {
      return JSON.parse(rawUser);
    } catch (error) {
      return null;
    }
  }

  function saveSession(authResponse) {
    localStorage.setItem(TOKEN_KEY, authResponse.token);
    localStorage.setItem(USER_KEY, JSON.stringify({
      userId: authResponse.userId,
      email: authResponse.email,
      fullName: authResponse.fullName,
      roles: authResponse.roles || []
    }));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function logout() {
    clearSession();
    window.location.href = "/index.html";
  }

  function requireAuth() {
    if (!getToken() || !getUser()) {
      window.location.href = "/index.html";
      return null;
    }

    return getUser();
  }

  function hasAnyRole(allowedRoles) {
    if (allowedRoles === "all") return true;

    const user = getUser();
    if (!user || !Array.isArray(user.roles)) return false;

    return allowedRoles.some(function (role) {
      return user.roles.includes(role);
    });
  }

  async function api(path, options) {
    const token = getToken();
    const requestOptions = options || {};
    const headers = {
      "Content-Type": "application/json",
      ...(requestOptions.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(path, {
      ...requestOptions,
      headers
    });

    const text = await response.text();
    let body = null;

    try {
      body = text ? JSON.parse(text) : null;
    } catch (error) {
      body = text;
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("You are not allowed to perform this action with the current signed-in role.");
      }

      throw new Error(body?.message || response.statusText || "Request failed");
    }

    return body;
  }

  function getJson(path) {
    return api(path);
  }

  function postJson(path, data) {
    return api(path, {
      method: "POST",
      body: JSON.stringify(data || {})
    });
  }

  function putJson(path, data) {
    return api(path, {
      method: "PUT",
      body: JSON.stringify(data || {})
    });
  }

  function renderLayout(activePage, title, subtitle) {
    const user = requireAuth();
    if (!user) return;

    const app = document.getElementById("app");
    if (!app) return;

    const allowedNav = NAV_ITEMS.filter(function (item) {
      return hasAnyRole(item.roles);
    });

    app.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand">
            <h2>Digital Dynamics</h2>
            <p>Procurement System</p>
          </div>

          <nav class="sidebar-nav">
            ${allowedNav.map(function (item) {
              return `<a class="nav-link ${activePage === item.page ? "active" : ""}" href="${item.href}">${escapeHtml(item.label)}</a>`;
            }).join("")}
          </nav>

          <div class="sidebar-user-card">
            <small>Signed in as</small>
            <h4>${escapeHtml(user.fullName || user.email)}</h4>
            <p>${escapeHtml(formatRoles(user.roles))}</p>
          </div>

          <button id="logoutBtn" class="btn btn-outline btn-full" type="button">Logout</button>
        </aside>

        <div class="main-area">
          <header class="topbar">
            <div class="page-heading">
              <h1>${escapeHtml(title)}</h1>
              <p>${escapeHtml(subtitle)}</p>
            </div>
            <div class="role-chip">${escapeHtml(formatRoles(user.roles))}</div>
          </header>

          <main id="content" class="view-container"></main>
        </div>
      </div>
    `;

    document.getElementById("logoutBtn").addEventListener("click", logout);
  }

  function setContent(html) {
    const content = document.getElementById("content");
    if (content) content.innerHTML = html;
  }

  function showLoading(message) {
    setContent(`<section class="view-section"><p class="muted">${escapeHtml(message || "Loading...")}</p></section>`);
  }

  function message(type, text) {
    return `<div class="message ${type}">${escapeHtml(text)}</div>`;
  }

  function emptyState(title, text) {
    return `
      <div class="empty-state">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(text)}</p>
      </div>
    `;
  }

  function statusBadge(status) {
    const value = String(status || "UNKNOWN");
    let type = "";

    if (["APPROVED", "OPEN", "ACTIVE", "RECEIVED"].includes(value)) type = "success";
    if (["DRAFT", "SUBMITTED", "PENDING", "RFQ_CREATED"].includes(value)) type = "warning";
    if (["REJECTED", "SUSPENDED", "DISCREPANCY"].includes(value)) type = "danger";

    return `<span class="badge ${type}">${escapeHtml(formatStatus(value))}</span>`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR"
    }).format(amount);
  }

  function formatDateTime(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-ZA");
  }

  function formatStatus(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function formatRoles(roles) {
    if (!Array.isArray(roles) || roles.length === 0) return "Administrator";

    return roles.map(function (role) {
      return ROLE_LABELS[role] || formatStatus(role);
    }).join(", ");
  }

  function formDataToObject(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  window.PMS = {
    ROLE_LABELS,
    getToken,
    getUser,
    saveSession,
    clearSession,
    logout,
    requireAuth,
    hasAnyRole,
    api,
    getJson,
    postJson,
    putJson,
    renderLayout,
    setContent,
    showLoading,
    message,
    emptyState,
    statusBadge,
    escapeHtml,
    formatCurrency,
    formatDateTime,
    formatStatus,
    formatRoles,
    formDataToObject
  };
})();
