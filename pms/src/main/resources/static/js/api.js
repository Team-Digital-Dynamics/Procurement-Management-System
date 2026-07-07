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
      text: "Hi, I'm Scout. How can I help you today?"
    }
  ];

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

  function scoutMessageTemplate(message) {
    const isUser = message.sender === "user";

    return `
      <div class="scout-message-row ${isUser ? "user" : "assistant"}">
        ${!isUser ? `<img src="/images/Ai_popup.png" alt="Scout" class="scout-message-avatar">` : ""}

        <div class="scout-message-bubble">
          ${escapeHtml(message.text)}
        </div>
      </div>
    `;
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
  }



  
 async function handleScoutSubmit(event) {
     event.preventDefault();

     const input = document.getElementById("scoutInput");
     const messagesContainer = document.getElementById("scoutMessages");
     const originalQuestion = input.value.trim();

     if (!originalQuestion) return;

     // 1. Push user message to local state and update UI
     scoutPopupMessages.push({
         sender: "user",
         text: originalQuestion
     });

     input.value = "";
     refreshScoutMessages();

     // 2. Normalize input for strict matching evaluation
     const cleanQuery = originalQuestion.toLowerCase();
     let reply = "";

     // 3. Rule-based conditional parsing matching the Knowledge Base
     if (cleanQuery.includes("create") || cleanQuery.includes("requisition")) {
         reply = "To create a requisition: Navigate to Requisition Management, select New Requisition, complete all mandatory fields, add line items and submit.";
     }
     else if (cleanQuery.includes("approve") || cleanQuery.includes("own")) {
         reply = "You cannot approve your own requisition because the system enforces segregation of duties to reduce fraud and maintain governance.";
     }
     else if (cleanQuery.includes("why") || cleanQuery.includes("rejected")) {
         reply = "Quotations submitted after the RFQ deadline are automatically rejected. Additionally, make sure your parameters align with predefined compliance frameworks.";
     }
     else if (cleanQuery.includes("winning") || cleanQuery.includes("supplier") || cleanQuery.includes("selected")) {
         reply = "The system calculates weighted evaluation scores using predefined criteria such as price, delivery, supplier performance, and quality to select the winning supplier.";
     }
     else if (cleanQuery.includes("edit") || (cleanQuery.includes("purchase order") || cleanQuery.includes("po"))) {
         reply = "No, you cannot edit an approved purchase order. Purchase orders form part of the procurement audit trail and follow controlled, immutable business processes.";
     }
     else if (cleanQuery.includes("role") || cleanQuery.includes("permission") || cleanQuery.includes("who can")) {
         reply = "Access is strictly controlled by your assigned user role. For example:\n" +
             "- Requisition creation is handled by RequeSTERS.\n" +
             "- RFQs and PO modifications are performed by Procurement Officers.\n" +
             "- System configurations and Threshold settings are managed by System Administrators.";
     }
     else if (cleanQuery.includes("stack") || cleanQuery.includes("built") || cleanQuery.includes("technology")) {
         reply = "The PMS is a web-based platform built using Java 17, Spring Boot 3.x, MySQL 8.x, and Vanilla JavaScript with REST APIs over HTTPS.";
     }
     else if (cleanQuery.includes("workflow") || cleanQuery.includes("lifecycle") || cleanQuery.includes("steps")) {
         reply = "The complete procurement lifecycle tracks: Login → Purchase Requisition → Multi-level Approval → RFQ → Supplier Quotation Submission → Weighted Evaluation → Purchase Order Generation → Delivery → Goods Received Note (GRN) → Audit Logging → Dashboard updates.";
     }
     else if (cleanQuery.includes("approve") || cleanQuery.includes("reject") || cleanQuery.includes("modify")) {
         // Security Guardrails from Guidelines
         reply = "As an integrated automated assistant, I am not authorized to directly modify procurement data, approve transactions, or override system business logic rules. Please use the corresponding module interfaces instead.";
     }
     else {
         // Default Fallback Response
         reply = "I'm sorry, I couldn't find a direct match for that request. I can help guide you through workflow steps, explaining system terminology, and checking status validations. Try asking about requisitions, purchase orders, or how the winning supplier is selected.";
     }

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
             text: reply
         });

         refreshScoutMessages();
     }, 450);
 }

 function refreshScoutMessages() {
     const messagesContainer = document.getElementById("scoutMessages");
     if (!messagesContainer) return;

     messagesContainer.innerHTML = scoutPopupMessages.map(scoutMessageTemplate).join("");
     messagesContainer.scrollTop = messagesContainer.scrollHeight;
 }



  
  function refreshScoutMessages() {
    const messages = document.getElementById("scoutMessages");

    if (!messages) return;

    messages.innerHTML = scoutPopupMessages.map(scoutMessageTemplate).join("");
    messages.scrollTop = messages.scrollHeight;
  }

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
