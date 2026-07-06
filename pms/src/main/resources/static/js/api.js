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
  RECEIVING_CLERK: "Receiving Clerk",
  SUPPLIER: "Supplier"
};

  const NAV_ITEMS = [
    { href: "/dashboard.html", label: "Dashboard", page: "dashboard", roles: "all" },
    { href: "/requisitions.html", label: "Requisitions", page: "requisitions", roles: "all" },
    { href: "/my-requisitions.html", label: "My Requisitions", page: "my-requisitions", roles: ["REQUESTER", "ADMIN"] },
    { href: "/approvals.html", label: "Approvals", page: "approvals", roles: ["ADMIN", "APPROVER_LEVEL_1", "APPROVER_LEVEL_2", "APPROVER_LEVEL_3"] },
   { href: "/suppliers.html", label: "Suppliers", page: "suppliers", roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
{ href: "/rfqs.html", label: "RFQs", page: "rfqs", roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
{ href: "/supplier-dashboard.html", label: "Supplier Portal", page: "supplier-dashboard", roles: ["ADMIN", "PROCUREMENT_OFFICER", "SUPPLIER"] },
{ href: "/purchase-orders.html", label: "Purchase Orders", page: "purchase-orders", roles: ["ADMIN", "PROCUREMENT_OFFICER", "RECEIVING_CLERK"] },
    { href: "/reports.html", label: "Reports", page: "reports", roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
    { href: "/profile.html", label: "My Profile", page: "profile", roles: "all" },
    { href: "/ai-assistant.html", label: "AI Assistant", page: "ai-assistant", roles: "all" },
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
        <span class="topbar-badge">0</span>
      </button>
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
        <a href="/ai-assistant.html">AI Assistant</a>
        <button type="button" id="topbarLogoutBtn">Logout</button>
      </div>
    </div>
  </div>
</header>

          <main id="content" class="view-container"></main>
        </div>
      </div>
       ${activePage === "ai-assistant" ? "" : scoutPopupTemplate()}
    `;

    document.getElementById("logoutBtn").addEventListener("click", logout);
    attachTopbarEvents(allowedNav);
    attachScoutPopupEvents();
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
    if (!Array.isArray(roles) || roles.length === 0) return "User";

    return roles.map(function (role) {
      return ROLE_LABELS[role] || formatStatus(role);
    }).join(", ");
  }

  function formDataToObject(form) {
    return Object.fromEntries(new FormData(form).entries());
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
  const question = input.value.trim();

  if (!question) return;

  scoutPopupMessages.push({
    sender: "user",
    text: question
  });

  input.value = "";

  scoutPopupMessages.push({
    sender: "assistant",
    text: "Thinking..."
  });

  refreshScoutMessages();

  try {
    const response = await api("/api/assistant", {
      method: "POST",
      body: JSON.stringify({
        message: question
      })
    });

    scoutPopupMessages.pop();

    scoutPopupMessages.push({
      sender: "assistant",
      text: response.answer || "I received your question, but no answer was returned."
    });

    refreshScoutMessages();
  } catch (error) {
    scoutPopupMessages.pop();

    scoutPopupMessages.push({
      sender: "assistant",
      text: "Sorry, I could not reach the assistant service right now."
    });

    refreshScoutMessages();
  }
}

function refreshScoutMessages() {
  const messages = document.getElementById("scoutMessages");

  if (!messages) return;

  messages.innerHTML = scoutPopupMessages.map(scoutMessageTemplate).join("");
  messages.scrollTop = messages.scrollHeight;
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
    });
  }

  if (notificationBellBtn) {
    notificationBellBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      showNotificationPreview();
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

    const existingPreview = document.getElementById("notificationPreview");
    if (existingPreview) existingPreview.remove();
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

function showNotificationPreview() {
  const oldPreview = document.getElementById("notificationPreview");

  if (oldPreview) {
    oldPreview.remove();
    return;
  }

  const button = document.getElementById("notificationBellBtn");

  if (!button) return;

  const preview = document.createElement("div");
  preview.id = "notificationPreview";
  preview.className = "notification-preview";

  preview.innerHTML = `
    <div class="notification-preview-header">
      <strong>Notifications</strong>
      <span>0 unread</span>
    </div>

    <div class="notification-preview-body">
      <p>No unread notifications.</p>
    </div>
  `;

  button.parentElement.appendChild(preview);
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
