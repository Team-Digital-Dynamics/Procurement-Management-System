document.addEventListener("DOMContentLoaded", function () {
  PMS.renderLayout(
    "notifications",
    "Notifications",
    "View, filter and manage your system notifications."
  );

  renderNotificationsPage();
});

let backendNotifications = [];

async function renderNotificationsPage() {
  if (!PMS.getNotifications || !PMS.renderDataTable || !PMS.confirmAction) {
    PMS.setContent(`
      <section class="view-section">
        <div class="message error">
          Notifications require the updated api.js file. Please replace api.js with the upgraded version first.
        </div>
      </section>
    `);
    return;
  }

  const notifications = await getMergedNotifications();

  PMS.setContent(`
    <section class="view-section">
      <div class="section-header">
        <div>
          <h2>Notification Centre</h2>
          <p>Keep track of unread alerts, system updates and action reminders.</p>
        </div>

        <div class="page-actions">
          <button id="addDemoNotificationBtn" class="btn btn-soft" type="button">
            Add Demo Notification
          </button>

          <button id="markAllReadBtn" class="btn btn-primary" type="button">
            Mark All as Read
          </button>

          <button id="clearReadBtn" class="btn btn-danger" type="button">
            Clear Read
          </button>
        </div>
      </div>

      <div class="grid-4">
        <article class="stat-card">
          <div class="label">Total Notifications</div>
          <div class="value">${notifications.length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Unread</div>
          <div class="value">${notifications.filter(function (item) { return !item.read; }).length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Read</div>
          <div class="value">${notifications.filter(function (item) { return item.read; }).length}</div>
        </article>

        <article class="stat-card">
          <div class="label">Latest</div>
          <div class="value">${notifications.length ? PMS.formatDate(notifications[0].createdAt) : "-"}</div>
        </article>
      </div>

      <div class="card">
        <div class="section-header">
          <div>
            <h2>All Notifications</h2>
            <p>Filter, mark as read or unread, and delete notifications.</p>
          </div>
        </div>

        <div id="notificationsTable"></div>
      </div>
    </section>
  `);

  renderNotificationsTable(notifications);
  attachNotificationEvents();
}

async function getMergedNotifications() {
  const localNotifications = Array.isArray(PMS.getNotifications())
    ? PMS.getNotifications().map(function (item) {
        return {
          ...item,
          source: "local"
        };
      })
    : [];

  const fetched = await fetchBackendNotifications();
  backendNotifications = fetched;

  const merged = [
    ...fetched,
    ...localNotifications
  ];

  return merged
    .map(normalizeNotificationItem)
    .sort(function (a, b) {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
}

async function fetchBackendNotifications() {
  try {
    const token = PMS.getToken ? PMS.getToken() : "";
    const response = await fetch("/api/v1/notifications", {
      method: "GET",
      headers: token
        ? {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        : {
            Accept: "application/json"
          }
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const list = extractNotificationList(payload);

    return list.map(function (item, index) {
      return {
        id: item.id || item.notificationId || `backend-${index + 1}`,
        title: item.title || item.subject || "Notification",
        message: item.message || item.body || item.content || "",
        type: item.type || item.alertType || "INFO",
        templateType: item.templateType || item.template || item.payloadTemplateType || "",
        deliveryStatus: item.deliveryStatus || item.emailStatus || item.transportStatus || "",
        assignedTo: item.assignedTo || item.assignee || item.owner || item.actor || "Unassigned",
        read: Boolean(item.read),
        createdAt: item.createdAt || item.timestamp || item.dateCreated || new Date().toISOString(),
        link: item.link || "/notifications.html",
        source: "backend"
      };
    });
  } catch (error) {
    return [];
  }
}

async function callBackendNotificationsApi(path, options) {
  const token = PMS.getToken ? PMS.getToken() : "";
  const response = await fetch(path, {
    method: (options && options.method) || "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options && options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw new Error("Unable to update notifications.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json().catch(function () {
    return null;
  });
}

async function setBackendNotificationRead(id, read) {
  await callBackendNotificationsApi(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    body: { read: read }
  });
}

async function markAllBackendNotificationsRead() {
  await callBackendNotificationsApi("/api/v1/notifications/read-all", {
    method: "PATCH"
  });
}

async function deleteBackendNotification(id) {
  await callBackendNotificationsApi(`/api/v1/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

async function clearBackendReadNotifications() {
  await callBackendNotificationsApi("/api/v1/notifications/read", {
    method: "DELETE"
  });
}

function extractNotificationList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  return [];
}

function normalizeNotificationItem(item) {
  const templateType = String(item.templateType || item.template || "");
  const message = String(item.message || "");
  const title = String(item.title || "");
  const combinedText = `${templateType} ${title} ${message}`;
  const poRefMatch = combinedText.match(/\bPO-[A-Za-z0-9_-]+\b/i);

  const isRfqAlert =
    /^RFQ-/i.test(templateType.trim()) ||
    /\bRFQ-[A-Za-z0-9_-]+\b/i.test(message) ||
    /\bRFQ-[A-Za-z0-9_-]+\b/i.test(title);

  const isPoAlert =
    /\bPO-[A-Za-z0-9_-]+\b/i.test(combinedText) ||
    /purchase order|order fulfillment|fulfillment release|dispatch(ed)?|issued|released/i.test(combinedText);

  const isInventoryAlert =
    /\bGRN\b/i.test(combinedText) ||
    /goods received|inventory intake|delivery receipt|warehouse intake|receipt posted/i.test(combinedText);

  const hasVarianceFlag =
    /discrepancy|variance during delivery|delivery variance|quantity variance|financial variance/i.test(combinedText);

  const deliveryStatus = String(item.deliveryStatus || "").toUpperCase();
  const isEmailDeliveryFailed =
    deliveryStatus === "EMAIL_FAILED" ||
    /smtp delivery failed|email failed|delivery failed/i.test(combinedText);

  const poReference = poRefMatch ? poRefMatch[0].toUpperCase() : "";
  const matchesClientPoTracking = isPoStateMatchedWithClientTrackingLog(poReference, combinedText);

  return {
    ...item,
    isRfqAlert: isRfqAlert,
    isPoAlert: isPoAlert,
    isInventoryAlert: isInventoryAlert,
    hasVarianceFlag: hasVarianceFlag,
    isEmailDeliveryFailed: isEmailDeliveryFailed,
    isCoreProcurementAction: isPoAlert && matchesClientPoTracking,
    poReference: poReference,
    templateType: templateType
  };
}

function isPoStateMatchedWithClientTrackingLog(poReference, combinedText) {
  const sourceText = String(combinedText || "").toUpperCase();
  const transitionKeywords = ["PO_CREATED", "AWARDED", "DISPATCHED", "FULFILLED", "CLOSED", "COMPLETED", "RELEASED"];

  const hasTransitionKeyword = transitionKeywords.some(function (keyword) {
    return sourceText.includes(keyword) || sourceText.includes(keyword.replace("_", " "));
  });

  let localLog = [];
  try {
    const raw = localStorage.getItem("pmsNotifications");
    localLog = raw ? JSON.parse(raw) : [];
  } catch (error) {
    localLog = [];
  }

  const hasPoReferenceMatch = poReference
    ? localLog.some(function (entry) {
        const text = `${entry?.title || ""} ${entry?.message || ""}`.toUpperCase();
        return text.includes(poReference);
      })
    : false;

  return hasTransitionKeyword || hasPoReferenceMatch;
}

function renderNotificationsTable(notifications) {
  PMS.renderDataTable({
    container: "notificationsTable",
    title: "Notifications",
    rows: notifications,
    pageSize: 10,
    searchPlaceholder: "Filter notifications...",
    emptyTitle: "No notifications yet",
    emptyText: "You do not have any notifications to display.",
    columns: [
      {
        label: "Status",
        key: "read",
        render: function (item) {
          return item.read
            ? '<span class="badge success">Read</span>'
            : '<span class="badge warning">Unread</span>';
        },
        searchValue: function (item) {
          return item.read ? "Read" : "Unread";
        }
      },
      {
        label: "Notification",
        key: "title",
        render: function (item) {
          const rfqBadge = item.isRfqAlert
            ? '<span class="badge warning" style="margin-left:8px;">RFQ Alert</span>'
            : "";

          const poBadge = item.isPoAlert
            ? '<span class="badge info" style="margin-left:8px;">PO Alert</span>'
            : "";

          const inventoryBadge = item.isInventoryAlert
            ? '<span class="badge" style="margin-left:8px;background:#0ea5a4;color:#ffffff;">Inventory Intake</span>'
            : "";

          const varianceBadge = item.hasVarianceFlag
            ? '<span class="badge warning" style="margin-left:8px;">Variance Flag</span>'
            : "";

          const smtpFailureLabel = item.isEmailDeliveryFailed
            ? '<span class="badge error" style="margin-left:8px;">System Alert: SMTP delivery failed. Error logged.</span>'
            : "";

          const coreActionClass = item.isCoreProcurementAction ? "procurement-core-action" : "";
          const priorityClass = item.hasVarianceFlag ? " inventory-variance-priority" : "";

          const assignmentText = item.assignedTo || "Unassigned";

          const timeText = PMS.formatDateTime
            ? PMS.formatDateTime(item.createdAt)
            : String(item.createdAt || "-");

          const poMeta = item.poReference ? ` | ${PMS.escapeHtml(item.poReference)}` : "";

          return `
            <div class="${coreActionClass}${priorityClass}">
              <strong>${PMS.escapeHtml(item.title || "Notification")}</strong>
              ${rfqBadge}
              ${poBadge}
              ${inventoryBadge}
              ${varianceBadge}
              ${smtpFailureLabel}
              <p class="muted">${PMS.escapeHtml(item.message || "")}</p>
              <p class="muted">Assigned: ${PMS.escapeHtml(assignmentText)} | ${PMS.escapeHtml(timeText)}${poMeta}</p>
            </div>
          `;
        },
        searchValue: function (item) {
          return `${item.title || ""} ${item.message || ""} ${item.templateType || ""} ${item.poReference || ""} ${item.assignedTo || ""} ${item.isInventoryAlert ? "GRN Inventory" : ""} ${item.hasVarianceFlag ? "Discrepancy Variance" : ""} ${item.isEmailDeliveryFailed ? "EMAIL_FAILED SMTP delivery failed" : ""}`;
        }
      },
      {
        label: "Type",
        key: "type",
        render: function (item) {
          return PMS.statusBadge(item.type || "INFO");
        },
        searchValue: function (item) {
          return item.type || "INFO";
        }
      },
      {
        label: "Date",
        key: "createdAt",
        render: function (item) {
          return PMS.escapeHtml(PMS.formatDateTime(item.createdAt));
        },
        searchValue: function (item) {
          return PMS.formatDateTime(item.createdAt);
        }
      },
      {
        label: "Actions",
        key: "actions",
        render: function (item) {
          const id = PMS.escapeHtml(item.id);
          const source = PMS.escapeHtml(item.source || "local");

          return `
            <div class="action-row">
              ${
                item.read
                  ? `<button class="btn btn-soft btn-sm" data-action="mark-unread" data-id="${id}" data-source="${source}" type="button">Mark Unread</button>`
                  : `<button class="btn btn-soft btn-sm" data-action="mark-read" data-id="${id}" data-source="${source}" type="button">Mark Read</button>`
              }

              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${id}" data-source="${source}" type="button">
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

function attachNotificationEvents() {
  const table = document.getElementById("notificationsTable");
  const markAllReadBtn = document.getElementById("markAllReadBtn");
  const clearReadBtn = document.getElementById("clearReadBtn");
  const addDemoNotificationBtn = document.getElementById("addDemoNotificationBtn");

  if (table) {
    table.addEventListener("click", async function (event) {
      const button = event.target.closest("button[data-action]");

      if (!button) return;

      const action = button.dataset.action;
      const id = button.dataset.id;
      const source = (button.dataset.source || "local").toLowerCase();
      const backendId = Number(id);

      try {
        if (action === "mark-read") {
          if (source === "backend" && Number.isFinite(backendId)) {
            await setBackendNotificationRead(backendId, true);
          } else {
            PMS.markNotificationRead(id);
          }
          PMS.showToast("success", "Notification marked as read.");
          renderNotificationsPage();
        }

        if (action === "mark-unread") {
          if (source === "backend" && Number.isFinite(backendId)) {
            await setBackendNotificationRead(backendId, false);
          } else {
            markNotificationUnread(id);
          }
          PMS.showToast("info", "Notification marked as unread.");
          renderNotificationsPage();
        }

        if (action === "delete") {
          const confirmed = await PMS.confirmAction({
            title: "Delete notification",
            message: "Are you sure you want to delete this notification?",
            confirmText: "Delete",
            cancelText: "Cancel",
            danger: true
          });

          if (!confirmed) return;

          if (source === "backend" && Number.isFinite(backendId)) {
            await deleteBackendNotification(backendId);
          } else {
            PMS.deleteNotification(id);
          }
          PMS.showToast("success", "Notification deleted.");
          renderNotificationsPage();
        }
      } catch (error) {
        PMS.showToast("error", error.message || "Unable to update notifications.");
      }
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", async function () {
      try {
        await markAllBackendNotificationsRead();
        PMS.markAllNotificationsRead();
        PMS.showToast("success", "All notifications marked as read.");
        renderNotificationsPage();
      } catch (error) {
        PMS.showToast("error", error.message || "Unable to mark all as read.");
      }
    });
  }

  if (clearReadBtn) {
    clearReadBtn.addEventListener("click", async function () {
      const confirmed = await PMS.confirmAction({
        title: "Clear read notifications",
        message: "This will delete all notifications that are already marked as read.",
        confirmText: "Clear Read",
        cancelText: "Cancel",
        danger: true
      });

      if (!confirmed) return;

      try {
        await clearBackendReadNotifications();

        const unreadOnly = PMS.getNotifications().filter(function (item) {
          return !item.read;
        });

        PMS.saveNotifications(unreadOnly);
        PMS.updateNotificationBadge();
        PMS.showToast("success", "Read notifications cleared.");
        renderNotificationsPage();
      } catch (error) {
        PMS.showToast("error", error.message || "Unable to clear read notifications.");
      }
    });
  }

  if (addDemoNotificationBtn) {
    addDemoNotificationBtn.addEventListener("click", function () {
      PMS.addNotification({
        title: "Demo Notification",
        message: "This is a sample notification for testing the notification centre.",
        type: "INFO",
        read: false,
        link: "/notifications.html"
      });

      PMS.showToast("success", "Demo notification added.");
      renderNotificationsPage();
    });
  }
}

function markNotificationUnread(id) {
  const notifications = PMS.getNotifications().map(function (item) {
    if (item.id === id) {
      return {
        ...item,
        read: false
      };
    }

    return item;
  });

  PMS.saveNotifications(notifications);
  PMS.updateNotificationBadge();
}