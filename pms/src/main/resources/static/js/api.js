(function () {
  const TOKEN_KEY = "pmsToken";
  const USER_KEY = "pmsUser";
  const NOTIFICATIONS_KEY = "pmsNotifications";

  const ROLE_LABELS = {
    ADMIN: "System Administrator",
    ADMINISTRATOR: "System Administrator",
    PROCUREMENT_OFFICER: "Procurement Officer",
    REQUESTER: "Requester",
    APPROVER_LEVEL_1: "Approver Level 1",
    APPROVER_LEVEL_2: "Approver Level 2",
    APPROVER_LEVEL_3: "Approver Level 3",
    RECEIVING_CLERK: "Receiving Clerk",
    SUPPLIER: "Supplier"
  };

  const NAV_ITEMS = [
    { href: "/dashboard.html", label: "Dashboard", page: "dashboard", roles: "all" },

    { href: "/requisitions.html", label: "Requisitions", page: "requisitions", roles: "all" },
    { href: "/my-requisitions.html", label: "My Requisitions", page: "my-requisitions", roles: ["REQUESTER", "ADMIN", "ADMINISTRATOR"] },

    { href: "/approvals.html", label: "Approvals", page: "approvals", roles: ["ADMIN", "ADMINISTRATOR", "APPROVER_LEVEL_1", "APPROVER_LEVEL_2", "APPROVER_LEVEL_3"] },
    { href: "/decision-history.html", label: "Decision History", page: "decision-history", roles: ["ADMIN", "ADMINISTRATOR", "APPROVER_LEVEL_1", "APPROVER_LEVEL_2", "APPROVER_LEVEL_3"] },
    { href: "/approval-thresholds.html", label: "Approval Thresholds", page: "approval-thresholds", roles: ["ADMIN", "ADMINISTRATOR"] },

    { href: "/suppliers.html", label: "Suppliers", page: "suppliers", roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"] },
    { href: "/rfqs.html", label: "RFQs", page: "rfqs", roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"] },

    { href: "/supplier-dashboard.html", label: "Supplier Portal", page: "supplier-dashboard", roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER", "SUPPLIER"] },
    { href: "/my-quotations.html", label: "My Quotations", page: "my-quotations", roles: ["SUPPLIER", "ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"] },

    { href: "/purchase-orders.html", label: "Purchase Orders", page: "purchase-orders", roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER", "RECEIVING_CLERK"] },
    { href: "/my-purchase-orders.html", label: "My Purchase Orders", page: "my-purchase-orders", roles: ["SUPPLIER", "ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"] },

    { href: "/reports.html", label: "Reports", page: "reports", roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"] },
    { href: "/reports-hub.html", label: "Reports Hub", page: "reports-hub", roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"] },
    { href: "/spend-reports.html", label: "Spend Reports", page: "spend-reports", roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"] },
    { href: "/budget-dashboard.html", label: "Budget Dashboard", page: "budget-dashboard", roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"] },
    { href: "/compliance-reports.html", label: "Compliance Reports", page: "compliance-reports", roles: ["ADMIN", "ADMINISTRATOR", "PROCUREMENT_OFFICER"] },

    { href: "/notifications.html", label: "Notifications", page: "notifications", roles: "all" },
    { href: "/profile.html", label: "My Profile", page: "profile", roles: "all" },
    { href: "/ai-assistant.html", label: "AI Assistant", page: "ai-assistant", roles: "all" },

    { href: "/audit-logs.html", label: "Audit Logs", page: "audit-logs", roles: ["ADMIN", "ADMINISTRATOR"] },
    { href: "/system-settings.html", label: "System Settings", page: "system-settings", roles: ["ADMIN", "ADMINISTRATOR"] },
    { href: "/users.html", label: "Users", page: "users", roles: ["ADMIN", "ADMINISTRATOR"] }
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

  async function logout() {
  const confirmed = await confirmAction({
    title: "Confirm Logout",
    message: "Are you sure you want to logout?",
    confirmText: "Logout",
    cancelText: "Cancel",
    danger: true
  });

  if (!confirmed) return;

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

  function normalizeRole(role) {
    if (role === "ADMINISTRATOR") return "ADMIN";
    return role;
  }

  function hasAnyRole(allowedRoles) {
    if (allowedRoles === "all") return true;

    const user = getUser();

    if (!user || !Array.isArray(user.roles)) return false;

    const userRoles = user.roles.map(normalizeRole);
    const cleanAllowedRoles = allowedRoles.map(normalizeRole);

    return cleanAllowedRoles.some(function (role) {
      return userRoles.includes(role);
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
  const requestPath = String(path || "");

  if (
    (response.status === 401 || response.status === 403) &&
    requestPath.includes("/api/auth/login")
  ) {
    throw new Error("Incorrect email address or password. Please try again.");
  }

  if (response.status === 401) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (response.status === 403) {
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
              return `
                <a class="nav-link ${activePage === item.page ? "active" : ""}" href="${item.href}">
                  ${escapeHtml(item.label)}
                </a>
              `;
            }).join("")}
          </nav>

          <div class="sidebar-user-card">
            <small>Signed in as</small>
            <h4>${escapeHtml(user.fullName || user.email)}</h4>
            <p>${escapeHtml(formatRoles(user.roles))}</p>
          </div>

          <button id="logoutBtn" class="btn btn-outline btn-full" type="button">
            Logout
          </button>
        </aside>

        <div class="main-area">
          <header class="topbar app-topbar">
            <div class="topbar-left">
              <a class="topbar-logo" href="/dashboard.html" aria-label="Go to Dashboard">
                <img src="/images/logo1.png" alt="Digital Dynamics Logo">
              </a>

              <div class="page-heading">
                <h1>${escapeHtml(title)}</h1>
                <p>${escapeHtml(subtitle)}</p>
              </div>
            </div>

            <div class="topbar-right">
              <form id="globalSearchForm" class="global-search-form">
                <input
                  id="globalSearchInput"
                  type="search"
                  placeholder="Search pages..."
                  autocomplete="off"
                >

                <div id="globalSearchResults" class="global-search-results hidden"></div>
              </form>

              <div class="notification-wrap">
                <button id="notificationBellBtn" class="topbar-icon-btn" type="button" aria-label="Notifications">
                  🔔
                  <span id="notificationUnreadBadge" class="topbar-badge">0</span>
                </button>

                <div id="notificationPreview" class="notification-preview hidden"></div>
              </div>

              <div class="topbar-user-menu">
                <button id="userMenuBtn" class="user-menu-btn" type="button">
                  <span class="user-avatar">${escapeHtml(getInitials(user.fullName || user.email))}</span>

                  <span class="user-menu-text">
                    <strong>${escapeHtml(user.fullName || user.email)}</strong>
                    <small>${escapeHtml(formatRoles(user.roles))}</small>
                  </span>
                </button>

                <div id="userMenuDropdown" class="user-menu-dropdown hidden">
                  <a href="/profile.html">My Profile</a>
                  <a href="/notifications.html">Notifications</a>
                  <a href="/ai-assistant.html">AI Assistant</a>
                  <button type="button" id="topbarLogoutBtn">Logout</button>
                </div>
              </div>
            </div>
          </header>

          <main id="content" class="view-container"></main>
        </div>
      </div>

      <div id="pmsToastContainer" class="pms-toast-container"></div>
      <div id="pmsConfirmDialog" class="pms-confirm-overlay hidden"></div>

      ${activePage === "ai-assistant" ? "" : scoutPopupTemplate()}
    `;

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }

    attachTopbarEvents(allowedNav);
    attachScoutPopupEvents();
    updateNotificationBadge();
  }

  function setContent(html) {
    const content = document.getElementById("content");

    if (content) {
      content.innerHTML = html;
    }
  }

  function showLoading(message) {
    setContent(`
      <section class="view-section">
        <p class="muted">${escapeHtml(message || "Loading...")}</p>
      </section>
    `);
  }

  function message(type, text) {
    return `<div class="message ${escapeHtml(type)}">${escapeHtml(text)}</div>`;
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

    if (["APPROVED", "OPEN", "ACTIVE", "RECEIVED", "PAID", "COMPLETED"].includes(value)) {
      type = "success";
    }

    if (["DRAFT", "SUBMITTED", "PENDING", "RFQ_CREATED", "IN_PROGRESS"].includes(value)) {
      type = "warning";
    }

    if (["REJECTED", "SUSPENDED", "DISCREPANCY", "CANCELLED", "FAILED"].includes(value)) {
      type = "danger";
    }

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

  function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-ZA");
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
    if (!Array.isArray(roles) || roles.length === 0) return "User";

    return roles.map(function (role) {
      return ROLE_LABELS[role] || ROLE_LABELS[normalizeRole(role)] || formatStatus(role);
    }).join(", ");
  }

  function formDataToObject(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function getInitials(value) {
    const text = String(value || "User").trim();

    if (!text) return "U";

    const parts = text.split(" ").filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  function attachTopbarEvents(allowedNav) {
    const searchForm = document.getElementById("globalSearchForm");
    const searchInput = document.getElementById("globalSearchInput");
    const searchResults = document.getElementById("globalSearchResults");
    const notificationBellBtn = document.getElementById("notificationBellBtn");
    const notificationPreview = document.getElementById("notificationPreview");
    const userMenuBtn = document.getElementById("userMenuBtn");
    const userMenuDropdown = document.getElementById("userMenuDropdown");
    const topbarLogoutBtn = document.getElementById("topbarLogoutBtn");

    if (topbarLogoutBtn) {
      topbarLogoutBtn.addEventListener("click", logout);
    }

    if (userMenuBtn && userMenuDropdown) {
      userMenuBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        userMenuDropdown.classList.toggle("hidden");

        if (searchResults) {
          searchResults.classList.add("hidden");
        }

        if (notificationPreview) {
          notificationPreview.classList.add("hidden");
        }
      });
    }

    if (notificationBellBtn) {
      notificationBellBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleNotificationPreview();
      });
    }

    if (notificationPreview) {
      notificationPreview.addEventListener("click", function (event) {
        event.stopPropagation();

        const action = event.target.dataset.action;

        if (action === "mark-all-read") {
          markAllNotificationsRead();
          renderNotificationPreview();
          updateNotificationBadge();
        }
      });
    }

    if (searchInput && searchResults) {
      searchInput.addEventListener("input", function () {
        renderGlobalSearchResults(searchInput.value, allowedNav || []);
      });
    }

    if (searchForm) {
      searchForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const query = searchInput.value.trim().toLowerCase();

        if (!query) return;

        const match = (allowedNav || []).find(function (item) {
          return item.label.toLowerCase().includes(query);
        });

        if (match) {
          window.location.href = match.href;
        }
      });
    }

    document.addEventListener("click", function () {
      if (userMenuDropdown) userMenuDropdown.classList.add("hidden");
      if (searchResults) searchResults.classList.add("hidden");
      if (notificationPreview) notificationPreview.classList.add("hidden");
    });
  }

  function renderGlobalSearchResults(query, allowedNav) {
    const searchResults = document.getElementById("globalSearchResults");

    if (!searchResults) return;

    const cleanQuery = String(query || "").trim().toLowerCase();

    if (!cleanQuery) {
      searchResults.classList.add("hidden");
      searchResults.innerHTML = "";
      return;
    }

    const matches = allowedNav.filter(function (item) {
      return item.label.toLowerCase().includes(cleanQuery);
    });

    if (matches.length === 0) {
      searchResults.innerHTML = `
        <div class="global-search-empty">
          No matching pages found.
        </div>
      `;

      searchResults.classList.remove("hidden");
      return;
    }

    searchResults.innerHTML = matches.map(function (item) {
      return `
        <a href="${escapeHtml(item.href)}">
          ${escapeHtml(item.label)}
        </a>
      `;
    }).join("");

    searchResults.classList.remove("hidden");
  }

  function getNotifications() {
    const rawNotifications = localStorage.getItem(NOTIFICATIONS_KEY);

    if (!rawNotifications) return [];

    try {
      const notifications = JSON.parse(rawNotifications);
      return Array.isArray(notifications) ? notifications : [];
    } catch (error) {
      return [];
    }
  }

  function saveNotifications(notifications) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications || []));
  }

  function addNotification(notification) {
    const notifications = getNotifications();

    const newNotification = {
      id: notification.id || `N-${Date.now()}`,
      title: notification.title || "Notification",
      message: notification.message || "",
      type: notification.type || "info",
      read: Boolean(notification.read),
      createdAt: notification.createdAt || new Date().toISOString(),
      link: notification.link || "/notifications.html"
    };

    notifications.unshift(newNotification);
    saveNotifications(notifications);
    updateNotificationBadge();

    return newNotification;
  }

  function markNotificationRead(id) {
    const notifications = getNotifications().map(function (notification) {
      if (notification.id === id) {
        return {
          ...notification,
          read: true
        };
      }

      return notification;
    });

    saveNotifications(notifications);
    updateNotificationBadge();
  }

  function markAllNotificationsRead() {
    const notifications = getNotifications().map(function (notification) {
      return {
        ...notification,
        read: true
      };
    });

    saveNotifications(notifications);
    updateNotificationBadge();
  }

  function deleteNotification(id) {
    const notifications = getNotifications().filter(function (notification) {
      return notification.id !== id;
    });

    saveNotifications(notifications);
    updateNotificationBadge();
  }

  function getUnreadNotificationCount() {
    return getNotifications().filter(function (notification) {
      return !notification.read;
    }).length;
  }

  function updateNotificationBadge() {
    const badge = document.getElementById("notificationUnreadBadge");

    if (!badge) return;

    const count = getUnreadNotificationCount();

    badge.textContent = String(count);
    badge.classList.toggle("hidden", count === 0);
  }

  function toggleNotificationPreview() {
    const preview = document.getElementById("notificationPreview");

    if (!preview) return;

    if (preview.classList.contains("hidden")) {
      renderNotificationPreview();
      preview.classList.remove("hidden");
    } else {
      preview.classList.add("hidden");
    }
  }

  function renderNotificationPreview() {
    const preview = document.getElementById("notificationPreview");

    if (!preview) return;

    const notifications = getNotifications();
    const unreadCount = getUnreadNotificationCount();
    const latestNotifications = notifications.slice(0, 5);

    preview.innerHTML = `
      <div class="notification-preview-header">
        <div>
          <strong>Notifications</strong>
          <span>${unreadCount} unread</span>
        </div>

        ${unreadCount > 0
          ? `<button type="button" data-action="mark-all-read">Mark all read</button>`
          : ""}
      </div>

      <div class="notification-preview-body">
        ${latestNotifications.length === 0
          ? `<p>No notifications yet.</p>`
          : latestNotifications.map(notificationPreviewItemTemplate).join("")}
      </div>

      <div class="notification-preview-footer">
        <a href="/notifications.html">View all notifications</a>
      </div>
    `;
  }

  function notificationPreviewItemTemplate(notification) {
    return `
      <a class="notification-preview-item ${notification.read ? "read" : "unread"}" href="${escapeHtml(notification.link || "/notifications.html")}">
        <div>
          <strong>${escapeHtml(notification.title)}</strong>
          <p>${escapeHtml(notification.message)}</p>
          <small>${escapeHtml(formatDateTime(notification.createdAt))}</small>
        </div>
      </a>
    `;
  }

  function confirmAction(options) {
    const settings = typeof options === "string"
      ? { message: options }
      : (options || {});

    const title = settings.title || "Please confirm";
    const messageText = settings.message || "Are you sure you want to continue?";
    const confirmText = settings.confirmText || "Confirm";
    const cancelText = settings.cancelText || "Cancel";
    const danger = Boolean(settings.danger);

    return new Promise(function (resolve) {
      let dialog = document.getElementById("pmsConfirmDialog");

      if (!dialog) {
        dialog = document.createElement("div");
        dialog.id = "pmsConfirmDialog";
        dialog.className = "pms-confirm-overlay hidden";
        document.body.appendChild(dialog);
      }

      dialog.innerHTML = `
        <div class="pms-confirm-box">
          <div class="pms-confirm-header">
            <h3>${escapeHtml(title)}</h3>
          </div>

          <div class="pms-confirm-body">
            <p>${escapeHtml(messageText)}</p>
          </div>

          <div class="pms-confirm-actions">
            <button id="pmsConfirmCancelBtn" class="btn btn-outline" type="button">
              ${escapeHtml(cancelText)}
            </button>

            <button id="pmsConfirmOkBtn" class="btn ${danger ? "btn-danger" : "btn-primary"}" type="button">
              ${escapeHtml(confirmText)}
            </button>
          </div>
        </div>
      `;

      function close(result) {
        dialog.classList.add("hidden");
        dialog.innerHTML = "";
        resolve(result);
      }

      dialog.classList.remove("hidden");

      const cancelBtn = document.getElementById("pmsConfirmCancelBtn");
      const okBtn = document.getElementById("pmsConfirmOkBtn");

      cancelBtn.addEventListener("click", function () {
        close(false);
      });

      okBtn.addEventListener("click", function () {
        close(true);
      });

      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) {
          close(false);
        }
      });
    });
  }

  function showToast(type, text) {
    let container = document.getElementById("pmsToastContainer");

    if (!container) {
      container = document.createElement("div");
      container.id = "pmsToastContainer";
      container.className = "pms-toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `pms-toast ${type || "info"}`;
    toast.textContent = text || "Done";

    container.appendChild(toast);

    setTimeout(function () {
      toast.remove();
    }, 3500);
  }

  function installGlobalAlertBridge() {
    if (typeof window === "undefined" || typeof window.alert !== "function") {
      return;
    }

    const originalAlert = window.alert.bind(window);

    if (window.__pmsAlertBridgeInstalled) {
      return;
    }

    window.__pmsAlertBridgeInstalled = true;

    window.alert = function (message) {
      const text = String(message || "Action could not be completed.");
      const lowered = text.toLowerCase();

      if (lowered.includes("access denied") || lowered.includes("forbidden")) {
        showToast(
          "error",
          "Access denied. You do not have permission to perform this action with the current role."
        );
        return;
      }

      if (lowered.includes("deadline") && lowered.includes("passed")) {
        showToast("error", "RFQ deadline has passed. Choose an open RFQ and try again.");
        return;
      }

      if (lowered.includes("not found") || lowered.includes("non-existent")) {
        showToast("error", "Requested record was not found. Verify the ID and try again.");
        return;
      }

      // Keep a safety fallback for unexpected environments where toast rendering may fail.
      try {
        showToast("error", text);
      } catch (error) {
        originalAlert(text);
      }
    };
  }

  function renderDataTable(config) {
    const tableConfig = config || {};
    const container = typeof tableConfig.container === "string"
      ? document.getElementById(tableConfig.container)
      : tableConfig.container || document.getElementById(tableConfig.containerId);

    if (!container) return;

    const rows = Array.isArray(tableConfig.rows) ? tableConfig.rows : [];
    const columns = Array.isArray(tableConfig.columns) ? tableConfig.columns : [];
    const pageSizeOptions = tableConfig.pageSizeOptions || [5, 10, 20, 50];
    let pageSize = Number(tableConfig.pageSize || 10);
    let currentPage = 1;
    let searchQuery = "";

    function getFilteredRows() {
      const cleanQuery = searchQuery.trim().toLowerCase();

      if (!cleanQuery) return rows;

      return rows.filter(function (row) {
        return columns.some(function (column) {
          const value = column.searchValue
            ? column.searchValue(row)
            : getNestedValue(row, column.key);

          return String(value ?? "").toLowerCase().includes(cleanQuery);
        });
      });
    }

    function draw() {
      const filteredRows = getFilteredRows();
      const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

      if (currentPage > totalPages) {
        currentPage = totalPages;
      }

      const start = (currentPage - 1) * pageSize;
      const pageRows = filteredRows.slice(start, start + pageSize);

      container.innerHTML = `
        <div class="data-table-shell">
          <div class="data-table-toolbar">
            <div>
              <strong>${escapeHtml(tableConfig.title || "Records")}</strong>
              <span>${filteredRows.length} item${filteredRows.length === 1 ? "" : "s"}</span>
            </div>

            <div class="data-table-actions">
              <input
                id="dataTableSearchInput"
                type="search"
                placeholder="${escapeHtml(tableConfig.searchPlaceholder || "Filter table...")}"
                value="${escapeHtml(searchQuery)}"
              >

              <select id="dataTablePageSize">
                ${pageSizeOptions.map(function (option) {
                  return `
                    <option value="${option}" ${Number(option) === pageSize ? "selected" : ""}>
                      ${option} rows
                    </option>
                  `;
                }).join("")}
              </select>
            </div>
          </div>

          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  ${columns.map(function (column) {
                    return `<th>${escapeHtml(column.label || column.key)}</th>`;
                  }).join("")}
                </tr>
              </thead>

              <tbody>
                ${pageRows.length === 0
                  ? `
                    <tr>
                      <td colspan="${columns.length || 1}">
                        ${emptyState(
                          tableConfig.emptyTitle || "No records found",
                          tableConfig.emptyText || "There is no data to display yet."
                        )}
                      </td>
                    </tr>
                  `
                  : pageRows.map(function (row, rowIndex) {
                    return `
                      <tr>
                        ${columns.map(function (column) {
                          const value = column.render
                            ? column.render(row, start + rowIndex)
                            : escapeHtml(getNestedValue(row, column.key));

                          return `<td>${value}</td>`;
                        }).join("")}
                      </tr>
                    `;
                  }).join("")}
              </tbody>
            </table>
          </div>

          <div class="data-table-pagination">
            <span>
              Page ${currentPage} of ${totalPages}
            </span>

            <div>
              <button id="dataTablePrevBtn" class="btn btn-outline btn-sm" type="button" ${currentPage === 1 ? "disabled" : ""}>
                Previous
              </button>

              <button id="dataTableNextBtn" class="btn btn-outline btn-sm" type="button" ${currentPage === totalPages ? "disabled" : ""}>
                Next
              </button>
            </div>
          </div>
        </div>
      `;

      const searchInput = container.querySelector("#dataTableSearchInput");
      const pageSizeSelect = container.querySelector("#dataTablePageSize");
      const prevBtn = container.querySelector("#dataTablePrevBtn");
      const nextBtn = container.querySelector("#dataTableNextBtn");

      if (searchInput) {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);

        searchInput.addEventListener("input", function () {
          searchQuery = searchInput.value;
          currentPage = 1;
          draw();
        });
      }

      if (pageSizeSelect) {
        pageSizeSelect.addEventListener("change", function () {
          pageSize = Number(pageSizeSelect.value);
          currentPage = 1;
          draw();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          if (currentPage > 1) {
            currentPage -= 1;
            draw();
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          if (currentPage < totalPages) {
            currentPage += 1;
            draw();
          }
        });
      }
    }

    draw();
  }

  function getNestedValue(row, key) {
    if (!key) return "";

    return String(key)
      .split(".")
      .reduce(function (value, part) {
        if (value === null || value === undefined) return "";
        return value[part];
      }, row);
  }

  let scoutPopupMessages = [
    {
      sender: "assistant",
      text: "Hi, I'm Scout. Choose a path below and I will guide you step-by-step.",
      options: buildScoutMainMenuOptions()
    }
  ];

  const scoutPopupState = {
    lastIntent: "",
    currentStep: 0
  };

  const scoutFlowSteps = {
    requisition: [
      {
        title: "What is a Requisition?",
        text: "A requisition is a formal request to purchase goods or services. It is the starting point of the entire procurement cycle — nothing proceeds without one.\n\nWho creates it: Any user with the Requester role.\nWho approves it: An Approver assigned based on the total value threshold.\n\nPress Next Step to begin creating one.",
        issue: "Can't see the New Requisition button? Your account may not have the Requester role. Ask your System Administrator to check your role under System Settings > Users."
      },
      {
        title: "Step 1 — Create the Requisition",
        text: "1. Go to My Requisitions in the sidebar\n2. Click New Requisition\n3. Enter a clear title — e.g. 'Office Chairs Q3 2026'\n4. Enter a business justification explaining why the purchase is needed\n5. The requisition saves as a Draft — it does not enter approval until you explicitly submit it",
        issue: "Title or justification rejected? Both fields are mandatory and must contain meaningful text. Very short entries or entries with only symbols are not accepted."
      },
      {
        title: "Step 2 — Add Line Items",
        text: "Each line item is a product or service you are requesting:\n\n1. Inside the open requisition, click Add Item\n2. Enter a description — e.g. 'Ergonomic Mesh Chair Model X'\n3. Set the quantity — must be greater than 0\n4. Enter the estimated unit price\n5. Add all required items — the total calculates automatically\n\nThe total value determines which approval threshold applies to your request.",
        issue: "Items not saving? Both quantity and unit price are required and must be positive numbers. A quantity of 0 or a blank price will block submission of the requisition."
      },
      {
        title: "Step 3 — Submit for Approval",
        text: "When your requisition is ready:\n\n1. Review all items and confirm the total amount looks correct\n2. Click Submit for Approval\n3. Status changes from Draft to Submitted\n4. The system automatically routes it to the correct approver based on total value\n5. You will receive a notification once a decision is made\n\nYou cannot edit the requisition while it is under review.",
        issue: "Submit button missing or disabled? Confirm at least one line item exists with a positive quantity and unit price. All mandatory header fields must be completed before submission."
      },
      {
        title: "Step 4 — Track Status and Outcome",
        text: "Monitor your requisition from My Requisitions:\n\nSubmitted — Waiting for the approver to review\nApproved — A Procurement Officer can now create an RFQ from it\nRejected — Read the rejection comment, make corrections, and resubmit\n\nAll status changes are permanently logged in Audit Logs.\n\nNext stage in the workflow: Once approved, a Procurement Officer will create an RFQ to invite supplier quotations.",
        issue: "Stuck in Submitted for a long time? The approver may not have reviewed it yet. An Admin can check the Approvals queue to locate pending items. You cannot approve your own requisition — a different user must action it."
      }
    ],
    approvals: [
      {
        title: "What is the Approvals Flow?",
        text: "Approvals are submitted requisitions waiting for your review. The system routes each requisition to the correct approver based on total value and your configured threshold.\n\nWho can approve: Approver Level 1, Level 2, Level 3, or Admin.\nKey rule: You cannot approve a requisition you created yourself.\n\nPress Next Step to find and review pending items.",
        issue: "No Approvals option in your sidebar? Your role may not include approval rights. Contact your System Administrator to verify your current role assignment."
      },
      {
        title: "Step 1 — Find Pending Approvals",
        text: "1. Click Approvals in the sidebar\n2. The Approval Queue lists all requisitions assigned to you\n3. The counter at the top shows how many are waiting for your decision\n4. If the queue is empty but you expect items — confirm the requester clicked Submit, not just saved as Draft\n5. Admin users can see all pending approvals system-wide regardless of threshold",
        issue: "Queue is empty unexpectedly? Confirm the requester clicked Submit for Approval. A requisition saved as Draft does not appear in the approval queue at all."
      },
      {
        title: "Step 2 — Review a Requisition",
        text: "1. Click on a requisition row to open the full detail view\n2. Read the title and business justification carefully\n3. Review all line items — descriptions, quantities, and unit prices\n4. Verify the total amount is within your approval limit\n5. Consider whether the purchase aligns with current policy and budget\n\nTake time with this step — your decision is permanent once recorded.",
        issue: "Not sure whether to approve? If the total exceeds your threshold, the item should not have been routed to you — flag it to an Admin. If the requisition looks incomplete or unjustified, reject it with a clear explanatory comment."
      },
      {
        title: "Step 3 — Record Your Decision",
        text: "1. Scroll to the decision section at the bottom of the requisition\n2. Enter a comment explaining your reasoning — strongly recommended for audit trail\n3. Click Approve or Reject\n4. Status updates immediately and cannot be undone\n5. The requester receives a notification with your decision and comment\n\nApproved: Procurement Officer can now create an RFQ from the requisition.\nRejected: Requester can correct and resubmit.",
        issue: "Approve or Reject buttons not visible? The requisition must be in Submitted status. If it was already actioned, it will show Approved or Rejected and the decision cannot be changed through the UI."
      },
      {
        title: "Step 4 — After Your Decision",
        text: "After approving:\n- Status moves to Approved\n- Procurement Officer can create an RFQ from it\n- Your decision is recorded in Decision History\n\nAfter rejecting:\n- Status moves to Rejected\n- Requester is notified with your comment\n- They can correct details and resubmit when ready\n\nAll decisions are permanently logged in Audit Logs and visible to Admin users for full traceability.",
        issue: "Approved by mistake? Decisions cannot be reversed through the UI. Contact your System Administrator who can assist through the appropriate corrective process."
      }
    ],
    rfq: [
      {
        title: "What is an RFQ?",
        text: "A Request for Quotation (RFQ) invites approved suppliers to submit pricing for a specific procurement need.\n\nPrerequisite: The source requisition must be in Approved status before an RFQ can be created from it.\nWho creates RFQs: Procurement Officers and Admins.\n\nThe RFQ sets a deadline — quotations submitted after it are automatically rejected by the system.",
        issue: "RFQs not visible in your sidebar? Only Procurement Officers and Admins can create and manage RFQs. Ask your System Administrator to check your role assignment."
      },
      {
        title: "Step 1 — Create the RFQ",
        text: "1. Go to RFQs in the sidebar\n2. Click Create RFQ\n3. Select the approved requisition from the dropdown\n4. Set the submission deadline — quotes submitted after this date are auto-rejected\n5. Enter requirements or scope notes so suppliers know exactly what is needed\n6. Save — RFQ status is now Open and suppliers can be invited",
        issue: "No requisitions appearing in the dropdown? Only Approved requisitions not already linked to an active RFQ will appear. Check the requisition status on the Requisitions list page."
      },
      {
        title: "Step 2 — Invite Suppliers",
        text: "1. Open the saved RFQ from the list\n2. In the supplier section, select which suppliers to invite\n3. Only Approved suppliers are available — Pending or Suspended suppliers cannot participate\n4. Each invited supplier receives a notification to submit their quotation\n5. Invite multiple suppliers for competitive pricing\n\nBest practice: Invite at least 3 suppliers for a fair market comparison and defensible audit trail.",
        issue: "No suppliers available to invite? Suppliers must be in Approved status. Go to the Suppliers page, check their status, and approve eligible suppliers before returning to the RFQ."
      },
      {
        title: "Step 3 — Manage Responses",
        text: "While the RFQ is Open:\n\n1. Suppliers submit their quotations before the set deadline\n2. Monitor which suppliers have responded in the RFQ detail view\n3. Quotations received after the deadline are automatically rejected — no exceptions\n4. You need at least one valid quotation to proceed to evaluation\n5. When ready, close the RFQ — status changes from Open to Closed",
        issue: "Supplier says they submitted but it is not showing? Check whether their submission was made before the deadline. Late submissions are rejected automatically and will not appear in the evaluation list."
      },
      {
        title: "Step 4 — Close and Move to Evaluation",
        text: "Once you have enough valid responses:\n\n1. Confirm all submitted quotations are complete\n2. Close the RFQ to lock it for scoring — no further submissions accepted\n3. The RFQ is now ready for the evaluation stage\n4. Each supplier quotation will be scored across weighted criteria\n5. The highest weighted score identifies the recommended winner\n\nNext stage: Supplier Evaluation — score and formally award the best-value supplier.",
        issue: "Only one supplier responded? You can still evaluate with a single quotation. However, procurement best practice recommends at least 3 comparable quotes for sound decision-making and a complete audit record."
      }
    ],
    supplier: [
      {
        title: "What is Supplier Evaluation?",
        text: "Supplier evaluation scores each quotation across multiple criteria to select the best-value supplier — not simply the cheapest.\n\nPrerequisite: A Closed RFQ with at least one valid submitted quotation.\nWho evaluates: Procurement Officers and Admins.\n\nAll evaluation weights must total exactly 100 for scoring to produce correct results.",
        issue: "Can't find the evaluation screen? Navigate to RFQs, open a Closed RFQ, and look for the Evaluate tab or button. Evaluation is only available after the RFQ has been closed."
      },
      {
        title: "Step 1 — Open the Evaluation Screen",
        text: "1. Go to RFQs in the sidebar\n2. Open a Closed RFQ that has received quotations\n3. Click Evaluate or open the Evaluation tab\n4. You will see a list of every supplier who submitted a valid quotation\n5. Work through each supplier one by one before saving\n\nDo not skip any supplier — missing data produces unfair rankings.",
        issue: "Evaluate option not showing? The RFQ must be in Closed status. If it is still Open, close it first. Also confirm that at least one supplier submitted before the deadline."
      },
      {
        title: "Step 2 — Enter Quotation Data Per Supplier",
        text: "For each responding supplier:\n\n1. Enter the total quoted price from their submission\n2. Enter their proposed delivery time in working days\n3. Score their quality based on past performance — 0 to 100\n4. Score their terms compliance from their submitted terms — 0 to 100\n5. Performance score is pulled automatically from the supplier profile\n\nComplete all fields for every supplier before saving the evaluation.",
        issue: "Score fields not accepting values? Scores must be numbers between 0 and 100. Prices must be positive. Fields left blank default to 0 and will unfairly reduce that supplier's weighted total score."
      },
      {
        title: "Step 3 — Weighted Scoring Explained",
        text: "The system calculates a total score for each supplier using configured weights:\n\nPrice weight — rewards cost-competitive bids\nDelivery weight — favours faster fulfilment\nQuality weight — reflects historical quality performance\nTerms weight — compliance with procurement terms\nPerformance weight — overall supplier track record\n\nAll five weights must sum to exactly 100. Configure them under Approval Thresholds in System Settings. The supplier with the highest weighted total is recommended as the winner.",
        issue: "Winner seems wrong or unexpected? Check that all five criteria weights sum to exactly 100 in settings. Then verify scores were entered for all suppliers — any score left at 0 significantly reduces that supplier's ranking."
      },
      {
        title: "Step 4 — Award the Winning Supplier",
        text: "1. Review the ranked supplier list — highest weighted score is recommended\n2. Confirm the selection aligns with procurement policy and value for money\n3. Click Award to formally select the winning supplier\n4. A Purchase Order is generated automatically from the winning quotation\n5. All participating suppliers receive outcome notifications\n\nThe award decision and all evaluation scores are permanently recorded in Audit Logs.\n\nNext stage: Purchase Order — review and dispatch the generated PO to the supplier.",
        issue: "Award button not available? All supplier quotations must be fully scored. The RFQ must remain in Closed status. If the RFQ was reopened, close it again before the Award option becomes available."
      }
    ],
    purchaseOrder: [
      {
        title: "What is a Purchase Order?",
        text: "A Purchase Order (PO) is the organisation's formal commitment to purchase from the selected supplier at the agreed price and terms.\n\nPrerequisite: A completed RFQ evaluation with an awarded winning supplier.\nWho manages POs: Procurement Officers and Admins.\n\nPOs are immutable once approved — they form part of the financial audit trail and cannot be edited directly.",
        issue: "PO not appearing after evaluation? The evaluation must have a formally awarded winner. Return to the RFQ and confirm the Award action was completed — simply scoring suppliers is not enough to generate the PO."
      },
      {
        title: "Step 1 — Review the Generated PO",
        text: "After awarding a supplier:\n\n1. Go to Purchase Orders in the sidebar\n2. Find the newly created PO — status will show as Issued\n3. Review all details: supplier name, line items, total value, and delivery terms\n4. Confirm the values match both the approved requisition and the winning quotation\n5. Check the PO reference number has been assigned — e.g. PO-2026-0041\n\nIf everything looks correct, proceed to dispatch.",
        issue: "PO details look incorrect? A PO is built directly from the winning quotation data. If there is a genuine discrepancy, note it on the PO record. You cannot edit an approved PO — raise a corrective requisition through the normal process if changes are required."
      },
      {
        title: "Step 2 — Dispatch to the Supplier",
        text: "1. Open the PO from the Purchase Orders list\n2. Review all details one final time before sending\n3. Click Dispatch to formally send the PO to the supplier\n4. The supplier receives a notification with full PO details\n5. PO status changes from Issued to Dispatched\n\nThe supplier will now prepare the goods or services for delivery. Keep the PO reference number available — the supplier will use it on their delivery documentation.",
        issue: "Dispatch button not available? The PO must be in Issued status. If it was already dispatched, the status shows Dispatched and it cannot be sent again."
      },
      {
        title: "Step 3 — Track the Delivery",
        text: "After dispatching the PO:\n\n1. The supplier prepares and ships the goods or delivers the services\n2. Monitor the expected delivery date shown on the PO record\n3. When goods arrive, the Receiving Clerk captures a GRN to confirm receipt\n4. View live delivery status from the Purchase Orders list at any time\n\nStatus progression: Issued → Dispatched → Partially Received → Received\n\nIf delivery is overdue, contact the supplier directly and add a note to the PO.",
        issue: "Supplier says goods were delivered but status has not changed? The GRN has not been captured yet. The Receiving Clerk must log the delivery through GRN Capture before the PO status updates to Received."
      },
      {
        title: "Step 4 — Confirm Receipt (GRN) and Complete the Cycle",
        text: "When goods arrive at your facility:\n\n1. Receiving Clerk opens GRN Capture from the sidebar\n2. Selects the relevant PO from the list\n3. Records received quantities, total value received, and condition of goods\n4. Flags any discrepancies — short delivery, damaged items, or wrong goods\n5. Saves the GRN — PO status updates to Received\n\nThe procurement cycle is now complete. All documents are available in Reports Hub and Audit Logs.",
        issue: "GRN flagged with a discrepancy? The received quantity or value does not match the PO. The Procurement Officer is notified automatically. Follow up with the supplier to arrange remaining delivery or to issue a credit note for the shortfall."
      }
    ],
    workflow: [
      {
        title: "The Full Procurement Cycle",
        text: "The PMS follows a 6-stage cycle. Each stage must complete before the next begins:\n\n1. Requisition — purchase request raised\n2. Approval — reviewed and approved\n3. RFQ — suppliers invited to quote\n4. Evaluation — best-value supplier selected\n5. Purchase Order — formal order dispatched\n6. GRN — delivery confirmed\n\nPress Next Step to walk through each stage in detail.",
        issue: "Not sure where you are in the cycle? Open the Dashboard — it shows live counts across all stages. You can also check status of any document from its module page."
      },
      {
        title: "Stages 1–2: Requisition and Approval",
        text: "Stage 1 — Requisition:\nA Requester creates a purchase request with line items and a business justification. It saves as a Draft then is submitted for approval.\n\nStage 2 — Approval:\nAn Approver reviews and either approves the requisition — moving it forward — or rejects it with a comment so the requester can correct and resubmit.\n\nKey rule: An Approved requisition is required before Stage 3 can begin. Draft and Rejected requisitions cannot be used to create an RFQ.",
        issue: "Blocked between stages 1 and 2? Confirm the requisition is in Submitted status — not Draft. Also verify that an approver with a sufficient approval limit threshold is configured under Approval Thresholds."
      },
      {
        title: "Stages 3–4: RFQ and Supplier Evaluation",
        text: "Stage 3 — RFQ:\nA Procurement Officer creates an RFQ from the approved requisition, sets a deadline, and invites approved suppliers. Suppliers respond with quotations before the deadline.\n\nStage 4 — Evaluation:\nThe Procurement Officer scores each quotation across weighted criteria (price, delivery, quality, terms, performance). The highest weighted score wins and is formally awarded.\n\nKey rule: RFQ requires Approved requisition. Evaluation requires a Closed RFQ with at least one valid quotation.",
        issue: "Blocked between stages 3 and 4? For RFQ: confirm the requisition is Approved. For evaluation: confirm the RFQ is Closed and at least one supplier submitted a quotation before the deadline."
      },
      {
        title: "Stages 5–6: Purchase Order and GRN",
        text: "Stage 5 — Purchase Order:\nAfter awarding the winner, a PO is generated automatically. The Procurement Officer reviews and dispatches it. The supplier fulfils and delivers the order.\n\nStage 6 — GRN:\nWhen goods arrive, the Receiving Clerk captures a Goods Received Note recording quantity, value, and condition. Discrepancies are flagged. This closes the cycle.\n\nKey rule: PO requires a completed evaluation with an awarded winner. GRN requires a Dispatched PO.",
        issue: "Blocked between stages 5 and 6? For PO: confirm a winner was awarded in evaluation. For GRN: confirm the Procurement Officer dispatched the PO — an Issued-only PO is not sufficient for GRN capture."
      },
      {
        title: "Reporting and Audit Trail",
        text: "After completing the full cycle, all data is available for review and export:\n\nReports Hub — summaries for requisitions, RFQs, POs, and GRNs\nSpend Reports — spending by supplier, category, and time period\nBudget Dashboard — committed vs received value tracking\nCompliance Reports — policy adherence across all stages\nAudit Logs — every action by every user permanently recorded\n\nAll reports are exportable as CSV files for further analysis or compliance submissions.",
        issue: "Reports showing no data? Data appears only after at least one complete procurement cycle exists. Ensure the full flow from Requisition through to GRN has been completed at least once in the system."
      }
    ]
  };

  const scoutIntentReplies = {
    grn: "To capture GRN: go to GRN Capture in the sidebar, select the dispatched Purchase Order, record received quantities, value, and condition, flag any discrepancies, and save. The PO status updates to Received automatically.",
    reports: "Reports Hub summarises all procurement activity. Use Spend Reports for cost analysis by supplier or category, Budget Dashboard for committed vs received values, and Compliance Reports for policy adherence. All data is exportable as CSV.",
    role: "Access is controlled by your assigned role:\n- Requester: creates requisitions\n- Approver: reviews and decides on requisitions\n- Procurement Officer: manages RFQs, evaluation, and POs\n- Receiving Clerk: captures GRNs\n- Admin: full system access including settings\n\nContact your System Administrator to check or update your role.",
    tech: "The PMS is built on Java 17, Spring Boot 3.x, MySQL 8.x, and Vanilla JavaScript with a REST API backend. It is containerised with Docker and enforces role-based access control throughout."
  };

  function buildScoutMainMenuOptions() {
    return [
      { label: "Requisition Flow", query: "__path_requisition__" },
      { label: "Approvals Flow", query: "__path_approvals__" },
      { label: "RFQ Flow", query: "__path_rfq__" },
      { label: "Supplier Evaluation", query: "__path_supplier__" },
      { label: "Purchase Order Flow", query: "__path_purchase_order__" },
      { label: "Full Workflow", query: "__path_workflow__" }
    ];
  }

  function buildScoutFlowOptions(intent, step, totalSteps) {
    const options = [];

    if (step < totalSteps - 1) {
      options.push({ label: "Next Step \u2192", query: "__step_next__" });
    } else {
      options.push({ label: "Start Over", query: "__step_restart__" });
    }

    if (step > 0) {
      options.push({ label: "\u2190 Back", query: "__step_prev__" });
    }

    options.push({ label: "I have an issue here", query: "__step_issue__" });
    options.push({ label: "Main Menu", query: "__menu__" });

    return options;
  }

  function detectScoutIntent(cleanQuery) {
    if (/\b(create|new)\b.*\b(requisition)\b|\b(requisition)\b/.test(cleanQuery)) return "requisition";
    if (/\b(approve|approval|own requisition|segregation)\b/.test(cleanQuery)) return "approvals";
    if (/\b(why|rejected|rejection|deadline)\b/.test(cleanQuery)) return "rejection";
    if (/\b(rfq|request for quotation|quote request)\b/.test(cleanQuery)) return "rfq";
    if (/\b(winning supplier|supplier|selected|selection|score)\b/.test(cleanQuery)) return "supplier";
    if (/\b(edit|modify)\b.*\b(purchase order|po)\b|\b(purchase order|\bpo\b)\b/.test(cleanQuery)) return "purchaseOrder";
    if (/\b(grn|goods received|received note|delivery)\b/.test(cleanQuery)) return "grn";
    if (/\b(report|dashboard|analytics|spend)\b/.test(cleanQuery)) return "reports";
    if (/\b(role|permission|who can|access)\b/.test(cleanQuery)) return "role";
    if (/\b(stack|built|technology|tech)\b/.test(cleanQuery)) return "tech";
    if (/\b(workflow|lifecycle|steps|process)\b/.test(cleanQuery)) return "workflow";
    if (/\b(approve|reject|modify transaction|override)\b/.test(cleanQuery)) return "guardrail";
    return "";
  }

  function isScoutGreeting(cleanQuery) {
    return /^(hi|hello|hey|yo|good\s+morning|good\s+afternoon|good\s+evening|howdy)\b/.test(cleanQuery);
  }

  function isScoutFollowUp(cleanQuery) {
    return /\b(next|then|after that|what next|more|details|explain further|go on|continue)\b/.test(cleanQuery);
  }

  function isScoutThanks(cleanQuery) {
    return /\b(thanks|thank you|great|awesome|perfect)\b/.test(cleanQuery);
  }

  function buildScoutReply(cleanQuery) {
    const pathMap = {
      "__path_requisition__": "requisition",
      "__path_approvals__": "approvals",
      "__path_rfq__": "rfq",
      "__path_supplier__": "supplier",
      "__path_purchase_order__": "purchaseOrder",
      "__path_workflow__": "workflow"
    };

    if (pathMap[cleanQuery]) {
      const intent = pathMap[cleanQuery];
      const steps = scoutFlowSteps[intent];
      scoutPopupState.currentStep = 0;
      return {
        intent: intent,
        text: steps[0].text,
        options: buildScoutFlowOptions(intent, 0, steps.length)
      };
    }

    if (cleanQuery === "__menu__") {
      scoutPopupState.lastIntent = "";
      scoutPopupState.currentStep = 0;
      return {
        intent: "",
        text: "Choose a workflow path and I will guide you step-by-step with actions and common fixes.",
        options: buildScoutMainMenuOptions()
      };
    }

    if (cleanQuery === "__step_next__") {
      const intent = scoutPopupState.lastIntent;
      const steps = scoutFlowSteps[intent];
      if (!steps) return { intent: "", text: "Choose a path from the menu to continue.", options: buildScoutMainMenuOptions() };
      const nextStep = Math.min(scoutPopupState.currentStep + 1, steps.length - 1);
      scoutPopupState.currentStep = nextStep;
      return {
        intent: intent,
        text: steps[nextStep].text,
        options: buildScoutFlowOptions(intent, nextStep, steps.length)
      };
    }

    if (cleanQuery === "__step_prev__") {
      const intent = scoutPopupState.lastIntent;
      const steps = scoutFlowSteps[intent];
      if (!steps) return { intent: "", text: "Choose a path from the menu to continue.", options: buildScoutMainMenuOptions() };
      const prevStep = Math.max(scoutPopupState.currentStep - 1, 0);
      scoutPopupState.currentStep = prevStep;
      return {
        intent: intent,
        text: steps[prevStep].text,
        options: buildScoutFlowOptions(intent, prevStep, steps.length)
      };
    }

    if (cleanQuery === "__step_issue__") {
      const intent = scoutPopupState.lastIntent;
      const steps = scoutFlowSteps[intent];
      if (!steps) return { intent: "", text: "Choose a path from the menu to continue.", options: buildScoutMainMenuOptions() };
      const issueText = steps[scoutPopupState.currentStep].issue;
      return {
        intent: intent,
        text: issueText,
        options: buildScoutFlowOptions(intent, scoutPopupState.currentStep, steps.length)
      };
    }

    if (cleanQuery === "__step_restart__") {
      const intent = scoutPopupState.lastIntent;
      const steps = scoutFlowSteps[intent];
      if (!steps) return { intent: "", text: "Choose a path from the menu.", options: buildScoutMainMenuOptions() };
      scoutPopupState.currentStep = 0;
      return {
        intent: intent,
        text: steps[0].text,
        options: buildScoutFlowOptions(intent, 0, steps.length)
      };
    }

    if (isScoutGreeting(cleanQuery)) {
      return {
        intent: scoutPopupState.lastIntent,
        text: "Hi. I can help with requisitions, approvals, RFQs, supplier selection, purchase orders, GRN, and reports.",
        options: buildScoutMainMenuOptions()
      };
    }

    if (isScoutThanks(cleanQuery)) {
      return {
        intent: scoutPopupState.lastIntent,
        text: "Glad to help. Choose any next path below.",
        options: buildScoutMainMenuOptions()
      };
    }

    if (isScoutFollowUp(cleanQuery) && scoutPopupState.lastIntent && scoutFlowSteps[scoutPopupState.lastIntent]) {
      const intent = scoutPopupState.lastIntent;
      const steps = scoutFlowSteps[intent];
      const nextStep = Math.min(scoutPopupState.currentStep + 1, steps.length - 1);
      scoutPopupState.currentStep = nextStep;
      return {
        intent: intent,
        text: steps[nextStep].text,
        options: buildScoutFlowOptions(intent, nextStep, steps.length)
      };
    }

    const detectedIntent = detectScoutIntent(cleanQuery);

    if (detectedIntent && scoutFlowSteps[detectedIntent]) {
      const steps = scoutFlowSteps[detectedIntent];
      scoutPopupState.currentStep = 0;
      return {
        intent: detectedIntent,
        text: steps[0].text,
        options: buildScoutFlowOptions(detectedIntent, 0, steps.length)
      };
    }

    if (detectedIntent && scoutIntentReplies[detectedIntent]) {
      return {
        intent: detectedIntent,
        text: scoutIntentReplies[detectedIntent],
        options: buildScoutMainMenuOptions()
      };
    }

    return {
      intent: scoutPopupState.lastIntent,
      text: "I didn't quite catch that. Choose a workflow path below or try asking about requisitions, approvals, RFQs, purchase orders, or the full workflow.",
      options: buildScoutMainMenuOptions()
    };
  }

  function scoutPopupTemplate() {
    return `
      <div class="scout-widget">
        <section id="scoutChatBox" class="scout-chat-box hidden">
          <div class="scout-chat-header">
            <div class="scout-header-left">
              <img src="/images/Ai_popup.png" alt="Scout AI Assistant" class="scout-header-avatar">

              <div>
                <h3>Scout</h3>
                <p><span></span>Assistant Ready</p>
              </div>
            </div>

            <button id="scoutCloseBtn" class="scout-close-btn" type="button" aria-label="Close Scout chat">
              ×
            </button>
          </div>

          <div id="scoutMessages" class="scout-chat-messages">
            ${scoutPopupMessages.map(scoutMessageTemplate).join("")}
          </div>

          <form id="scoutForm" class="scout-input-area">
            <input
              id="scoutInput"
              type="text"
              placeholder="Ask Scout..."
              autocomplete="off"
              required
            >

            <button type="submit" aria-label="Send message">
              ➤
            </button>
          </form>
        </section>

        <button id="scoutBubbleBtn" class="scout-bubble-btn" type="button" aria-label="Open Scout assistant">
          <img src="/images/Ai_popup.png" alt="Scout">
        </button>
      </div>
    `;
  }

  function formatScoutText(text) {
    return escapeHtml(String(text || "")).replace(/\n/g, "<br>");
  }

  function scoutMessageTemplate(message) {
    const isUser = message.sender === "user";
    const optionButtons = !isUser && Array.isArray(message.options) && message.options.length
      ? `
          <div class="scout-option-grid">
            ${message.options.map(function (option) {
              return `<button class="scout-option-btn" type="button" data-scout-option="${escapeHtml(option.query)}" data-scout-label="${escapeHtml(option.label)}">${escapeHtml(option.label)}</button>`;
            }).join("")}
          </div>
        `
      : "";

    return `
      <div class="scout-message-row ${isUser ? "user" : "assistant"}">
        ${!isUser ? `<img src="/images/Ai_popup.png" alt="Scout" class="scout-message-avatar">` : ""}

        <div class="scout-message-bubble">
          ${isUser ? escapeHtml(message.text) : formatScoutText(message.text)}
          ${optionButtons}
        </div>
      </div>
    `;
  }

  function decodeScoutDataValue(value) {
    return String(value || "")
      .replaceAll("&quot;", '"')
      .replaceAll("&#039;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&");
  }

  function bindScoutOptionButtons() {
    const optionButtons = document.querySelectorAll("#scoutMessages .scout-option-btn");

    optionButtons.forEach(function (button) {
      if (button.dataset.bound === "1") return;

      button.dataset.bound = "1";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        const optionQuery = decodeScoutDataValue(button.getAttribute("data-scout-option") || "");
        const optionLabel = decodeScoutDataValue(button.getAttribute("data-scout-label") || optionQuery);

        submitScoutPrompt(optionQuery, optionLabel);
      });
    });
  }

  function attachScoutPopupEvents() {
    const bubbleBtn = document.getElementById("scoutBubbleBtn");
    const chatBox = document.getElementById("scoutChatBox");
    const closeBtn = document.getElementById("scoutCloseBtn");
    const form = document.getElementById("scoutForm");

    if (!bubbleBtn || !chatBox || !closeBtn || !form) return;

    bubbleBtn.addEventListener("click", function () {
      chatBox.classList.toggle("hidden");
      refreshScoutMessages();
    });

    closeBtn.addEventListener("click", function () {
      chatBox.classList.add("hidden");
    });

    form.addEventListener("submit", handleScoutSubmit);

    bindScoutOptionButtons();
  }



  
 async function handleScoutSubmit(event) {
     event.preventDefault();

     const input = document.getElementById("scoutInput");
     const originalQuestion = (input && input.value ? input.value : "").trim();

     if (!originalQuestion) return;

     submitScoutPrompt(originalQuestion, originalQuestion);

     if (input) {
       input.value = "";
     }
 }

 async function submitScoutPrompt(promptQuery, promptLabel) {
     const messagesContainer = document.getElementById("scoutMessages");
     const originalQuestion = String(promptQuery || "").trim();
     const displayQuestion = String(promptLabel || promptQuery || "").trim();

     if (!originalQuestion || !messagesContainer) return;

     // 1. Push user message to local state and update UI
     scoutPopupMessages.push({
         sender: "user",
         text: displayQuestion
     });
     refreshScoutMessages();

     // 2. Normalize input and apply intent-based conversational handling
     const cleanQuery = originalQuestion.toLowerCase();
     const result = buildScoutReply(cleanQuery);
     const reply = result.text;
     scoutPopupState.lastIntent = result.intent;
    const replyOptions = Array.isArray(result.options) ? result.options : [];

     // 4. Mimic a brief natural delay before processing the answer text
     const loadingId = `loading-${Date.now()}`;
     const loadingRow = document.createElement("div");
     loadingRow.id = loadingId;
     loadingRow.className = "scout-message-row assistant";
     loadingRow.innerHTML = `
   <img src="/images/Ai_popup.png" alt="Scout" class="scout-message-avatar">
   <div class="scout-message-bubble typing-indicator">Scout typing...</div>
 `;
     messagesContainer.appendChild(loadingRow);
     messagesContainer.scrollTop = messagesContainer.scrollHeight;

     setTimeout(function () {
         document.getElementById(loadingId)?.remove();

         scoutPopupMessages.push({
             sender: "assistant",
           text: reply,
           options: replyOptions
         });

         refreshScoutMessages();
     }, 450);
 }

  function refreshScoutMessages() {
    const messages = document.getElementById("scoutMessages");

    if (!messages) return;

    messages.innerHTML = scoutPopupMessages.map(scoutMessageTemplate).join("");
    bindScoutOptionButtons();
    messages.scrollTop = messages.scrollHeight;
  }

  installGlobalAlertBridge();

  window.PMS = {
    ROLE_LABELS,
    NAV_ITEMS,

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
    formatDate,
    formatStatus,
    formatRoles,
    formDataToObject,

    getNotifications,
    saveNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    getUnreadNotificationCount,
    updateNotificationBadge,

    confirmAction,
    showToast,
    renderDataTable
  };
})();
