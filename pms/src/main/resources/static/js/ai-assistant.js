document.addEventListener("DOMContentLoaded", function () {
    PMS.renderLayout("ai-assistant", "AI Assistant", "Ask procurement workflow questions and receive system guidance.");
    renderAssistantScreen();
});

const assistantMessages = [
    {
        sender: "assistant",
        text: "Hello, I am your Procurement Assistant. You can ask me about requisitions, approvals, RFQs, suppliers, quotations, purchase orders, GRNs or reports."
    }
];

function renderAssistantScreen() {
    PMS.setContent(`
    <section class="ai-page">
      <div class="ai-chat-shell">
        <div class="ai-chat-header">
          <div>
            <p class="eyebrow">Digital Dynamics AI</p>
            <h2>Procurement Assistant</h2>
            <p>Ask a question about the procurement process.</p>
          </div>

          <div class="ai-status-pill">
            <span></span>
            Assistant Ready
          </div>
        </div>

        <div class="ai-suggestion-grid">
          ${suggestionButton("How do I create a requisition?")}
          ${suggestionButton("How do I create an RFQ?")}
          ${suggestionButton("How do I evaluate quotes?")}
          ${suggestionButton("What is the procurement workflow?")}
        </div>

        <div id="chatMessages" class="ai-chat-messages">
          ${assistantMessages.map(messageTemplate).join("")}
        </div>

        <form id="assistantForm" class="ai-input-area">
          <textarea
            id="assistantInput"
            rows="1"
            placeholder="Message the Procurement Assistant..."
            required
          ></textarea>

          <button class="btn btn-primary" type="submit">
            Send
          </button>
        </form>
      </div>
    </section>
  `);

    document.getElementById("assistantForm").addEventListener("submit", handleAssistantSubmit);

    document.querySelector(".ai-chat-shell").addEventListener("click", function (event) {
        const button = event.target.closest("[data-ai-question]");
        if (!button) return;

        submitAssistantQuestion(button.dataset.aiQuestion);
    });

    scrollToLatestMessage();
}

function suggestionButton(text) {
    return `
    <button class="ai-suggestion-card" type="button" data-ai-question="${PMS.escapeHtml(text)}">
      ${PMS.escapeHtml(text)}
    </button>
  `;
}

function messageTemplate(message) {
    const isUser = message.sender === "user";
    const suggestions = !isUser && Array.isArray(message.suggestions) && message.suggestions.length
        ? `
        <div class="ai-followup-list">
          ${message.suggestions.map(assistantFollowupButton).join("")}
        </div>
      `
  const isNotice = message.tone === "notice" && !isUser;
  const messageHtml = isUser
    ? `<p>${PMS.escapeHtml(message.text)}</p>`
    : renderMarkdownMessageBox(message.text || "");

    const routeChip = !isUser && message.targetPage
        ? `<a class="btn btn-soft btn-sm" href="${PMS.escapeHtml(message.targetPage)}" style="margin-top:8px;display:inline-flex;">Go to Page</a>`
        : "";

    return `
    <div class="ai-message-row ${isUser ? "user" : "assistant"}">
      <div class="ai-avatar">
        ${isUser ? "You" : "AI"}
      </div>

      <div class="ai-message-bubble">
        <p>${formatAssistantText(message.text)}</p>
        ${suggestions}
      <div class="ai-message-bubble${isNotice ? " ai-message-notice" : ""}"${isNotice ? ' style="background:#f8f9fb;border:1px solid #d5dbe6;color:#2f3b52;"' : ""}>
    ${messageHtml}
    ${routeChip}
      </div>
    </div>
  `;
}

function assistantFollowupButton(text) {
    return `
    <button class="ai-followup-button" type="button" data-ai-question="${PMS.escapeHtml(text)}">
      ${PMS.escapeHtml(text)}
    </button>
  `;
}

function formatAssistantText(text) {
    return PMS.escapeHtml(text || "").replace(/\n/g, "<br>");
function renderMarkdownMessageBox(text) {
  const escaped = PMS.escapeHtml(String(text || ""));
  const lines = escaped.split(/\r?\n/);
  const html = [];
  let inList = false;

  lines.forEach(function (line) {
    const trimmed = line.trim();
    const bulletMatch = /^(-|\*)\s+(.+)$/.exec(trimmed);
    const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed);

    if (bulletMatch || orderedMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }

      const itemText = bulletMatch ? bulletMatch[2] : orderedMatch[1];
      html.push(`<li>${applyInlineMarkdown(itemText)}</li>`);
      return;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    if (!trimmed) {
      html.push("<br>");
      return;
    }

    html.push(`<p>${applyInlineMarkdown(trimmed)}</p>`);
  });

  if (inList) {
    html.push("</ul>");
  }

  return `<div class="assistant-markdown-box">${html.join("")}</div>`;
}

function applyInlineMarkdown(text) {
  return String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

// Dedicated function to get responses based on keywords
function getAssistantResponse(inputText) {
    const text = inputText.toLowerCase().trim();


    if (text.includes("workflow") || text.includes("process") || text.includes("full")) {
        return `The full workflow is:
1. Requisition Created: Employee creates purchase requisition with required items and quantities
2. Submitted for Approval: Requisition submitted to approver
3. Approved: Approver reviews and approves the requisition
4. RFQ Created: Procurement officer creates RFQ from approved requisition
5. RFQ Issued: RFQ sent to multiple approved suppliers requesting quotations
6. Quotes Evaluated: Procurement officer enters supplier quotations and scores each supplier
7. Supplier Recommended: System recommends best supplier based on evaluation scores
8. Purchase Order Created: PO created with recommended supplier details
9. Purchase Order Sent: PO transmitted to supplier
10. Goods Delivered: Supplier delivers goods to warehouse
11. GRN Captured: Warehouse confirms receipt of goods and records delivery details
12. Process Complete: Procurement cycle is complete`;
    }

    if (text.includes("requisition")) {
        return `To create a requisition, follow these steps:
1. Navigate to the Requisitions menu from the sidebar
2. Click the "New Requisition" button in the Requisition Management section
3. Fill in the requisition title, selecting a department and setting request dates
4. Specify the priority level (Normal, High, or Urgent)
5. Enter the business reason or motivation for the purchase
6. Add line items with description, category, quantity, and unit price
7. Save as Draft or Submit for Approval
8. Once submitted, the requisition awaits approver review`;
    }

    if (text.includes("supplier")) {
        return `To add a supplier to the system:
1. Go to the Suppliers section
2. Click "Add Supplier"
3. Enter supplier details: Supplier Name, Category, Contact Person, Email Address, Phone Number, and Address (optional)
4. Set the supplier Status: Approved, Pending Review, or Inactive
5. Click "Save Supplier"
Note: Only suppliers with "Approved" status can be selected when creating RFQs.`;
    }

    if (text.includes("rfq")) {
        return `To create an RFQ:
1. Navigate to the RFQ Management section
2. Click "Create RFQ"
3. Select an Approved requisition from the dropdown (must be in Approved status)
4. Enter the RFQ Title (auto-fills with "RFQ - [Requisition Title]")
5. Set the Closing Date (deadline for supplier quotations)
6. Select at least one Approved supplier (using checkboxes)
7. Enter RFQ Notes describing quotation requirements, delivery expectations, and supplier instructions
8. Save as Draft or directly Save the RFQ`;
    }

    if (text.includes("evaluation") || text.includes("quote") || text.includes("score")) {
        return `To begin quote evaluation:
1. Go to Quote Evaluation section
2. Click "New Evaluation"
3. Select an Issued RFQ from the dropdown (must be in Issued, Evaluation, or Closed status)
4. Set the Evaluation Date
5. Enter the Status (Draft or Completed)
6. Score each supplier on four criteria (0-25 points each): Price, Delivery, Compliance, and Quality
7. Enter the amount each supplier quoted for the goods or services
8. Save the evaluation. The highest scoring supplier is automatically recommended.`;
    }

    if (text.includes("purchase order") || text.includes("po")) {
        return `To create a PO:
1. Navigate to Purchase Orders section
2. Click "Create Purchase Order"
3. Select a Completed evaluation from the dropdown
4. Confirm system populated details: Supplier Name and PO Amount
5. Set the Order Date (defaults to today)
6. Set the Expected Delivery Date (required)
7. Set Status (Draft initially)
8. Add any PO Notes (delivery instructions, special conditions, etc.)
9. Click "Save Purchase Order"`;
    }

    if (text.includes("grn") || text.includes("delivery") || text.includes("received")) {
        return `To record goods received:
1. Navigate to GRN / Delivery section
2. Click "Capture GRN"
3. Select the Purchase Order from the dropdown (PO must be in Sent or Partial Delivery status)
4. Confirm system auto-filled supplier information
5. Set the Received Date (when goods arrived)
6. Enter Received By (person who received the goods)
7. Select Delivery Status (Complete, Partial, or Rejected)
8. Enter Amount Received (usually matches PO amount)
9. Add Delivery Notes if partial or rejected explaining discrepancies
10. Click "Save GRN"`;
    }

    if (text.includes("report")) {
        return `The system provides the following reports from the Reports section:
1. Requisition Report: Summary of all requisitions, statuses, and amounts
2. Supplier Performance: Approved supplier count and status breakdown
3. RFQ Activity: Total RFQs, issued vs draft, status distribution
4. Evaluation History: Quote evaluations completed and recommendations made
5. Purchase Order Report: PO values, suppliers, and status tracking
6. Goods Received: GRN records showing delivery confirmations
Note: You can export all report data as CSV files directly to your device.`;
    }

    if (text.includes("user") || text.includes("role")) {
        return `Administrators can manage user permissions inside settings:
1. Add new users with assigned roles (Requestor, Procurement Officer, Approver, Finance, Warehouse/GRN, Management, System Administrator)
2. Edit user details (name, department, role)
3. Delete custom user accounts
4. Reset passwords (default is Password123)
Note: The sidebar dynamically shows only modules available for that specific role.`;
    }

    return `I can help you navigate the Procurement Management System. Try asking about:
- Requisitions (How to create or submit)
- Suppliers (How to add or verify)
- RFQs (How to create or issue)
- Quote Evaluation (How to score criteria)
- Purchase Orders (How to generate or send)
- GRN (How to capture goods delivery)
- Reports (How to view or export data)
- User Management (Roles and permissions)`;

}

async function handleAssistantSubmit(event) {
    event.preventDefault();

    const input = document.getElementById("assistantInput");
    const question = (input.value || "").trim();

    await submitAssistantQuestion(question);
}

async function submitAssistantQuestion(question) {
    if (!question) return;
    if (!question) {
      assistantMessages.push({
        sender: "assistant",
        text: "Please type a question or procurement query before sending."
      });
      refreshMessages();
      return;
    }

    const input = document.getElementById("assistantInput");

    // 1. Add user message
    assistantMessages.push({
        sender: "user",
        text: question
    });

    if (input) {
        input.value = "";
    }
    refreshMessages();

    // 2. Add temporary loading state
    assistantMessages.push({
        sender: "assistant",
        text: "Thinking..."
    });
    refreshMessages();

    try {
        const response = await PMS.postJson("/api/assistant", {
            message: question,
            roles: getCurrentUserRoles()
        });

        assistantMessages.pop(); // Remove "Thinking..."

        const finalAnswer = response?.answer || getAssistantResponse(question);

        assistantMessages.push({
            sender: "assistant",
            text: finalAnswer,
            suggestions: Array.isArray(response?.suggestions) ? response.suggestions : []
        });

        refreshMessages();
    } catch (error) {
        assistantMessages.pop(); // Remove "Thinking..."
    // 3. Submit to backend AI endpoint and append response as markdown-rendered assistant message
    try {
      const response = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain"
        },
        body: JSON.stringify({
          query: question
        })
      });

      if (response.status === 400) {
        const message = await buildAiBadRequestMessage(response);
        assistantMessages.pop();
        assistantMessages.push({
          sender: "assistant",
          text: message
        });
        refreshMessages();
        return;
      }

      if (!response.ok) {
        const httpError = new Error("AI assistant service is currently unavailable.");
        httpError.httpStatus = response.status;
        throw httpError;
      }

      const assistantPayload = await parseAssistantResponsePayload(response);
      const intercepted = interceptAssistantResponse(assistantPayload.text);

      assistantMessages.pop(); // Remove "Thinking..."
      assistantMessages.push({
        sender: "assistant",
        text: intercepted.text || "No response received from assistant service.",
        targetPage: intercepted.blocked ? "" : (assistantPayload.targetPage || "")
      });

      refreshMessages();
    } catch (error) {
      const status = Number(error?.httpStatus || error?.status || 0);
      const isConnectivityFailure =
        error?.name === "TypeError" ||
        error?.code === "ECONNABORTED" ||
        status === 503 ||
        status === 504 ||
        /network|failed to fetch|timeout|gateway/i.test(String(error?.message || ""));

      // Remove active assistant loading placeholder(s) so the UI never gets stuck.
      for (let i = assistantMessages.length - 1; i >= 0; i -= 1) {
        const msg = assistantMessages[i];
        if (
          msg?.sender === "assistant" &&
          String(msg?.text || "").trim().toLowerCase() === "thinking..."
        ) {
          assistantMessages.splice(i, 1);
        }
      }

      if (isConnectivityFailure) {
        assistantMessages.push({
            sender: "assistant",
            text: getAssistantResponse(question)
          sender: "assistant",
          text: "The AI Copilot engine is temporarily unavailable. Core procurement operations remain active—please try your assistant request again shortly.",
          tone: "notice"
        });
      } else {
        const fallbackAnswer = getAssistantResponse(question);
        assistantMessages.push({
          sender: "assistant",
          text: fallbackAnswer || (error.message || "Unable to reach assistant service.")
        });
      }

        refreshMessages();
    }
}

function getCurrentUserRoles() {
    const user = PMS.getUser ? PMS.getUser() : null;
    return user && Array.isArray(user.roles) ? user.roles : [];
      refreshMessages();
    }
}

async function buildAiBadRequestMessage(response) {
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  const backendDetail = (
    payload?.message ||
    payload?.error ||
    payload?.details ||
    payload?.data?.message ||
    ""
  ).toString().trim();

  if (backendDetail) {
    return `I could not process that request: ${backendDetail}. Please rephrase with a clear procurement action, module name, and any document reference (e.g., RFQ-1021, PO-550).`;
  }

  return "I could not process that request because the format is invalid. Please rephrase with a clear procurement action, module name, and any document reference (e.g., RFQ-1021, PO-550).";
}

function interceptAssistantResponse(rawText) {
  const original = String(rawText || "");
  const normalized = original.replace(/\u0000/g, "").trim();

  const vetoSignals = [
    /\b(policy\s*veto|blocked\s*by\s*policy|response\s*withheld|deny[_\s-]*render)\b/i,
    /\b(system[_\s-]*block|security[_\s-]*block|compliance[_\s-]*block)\b/i,
    /"action"\s*:\s*"block"/i,
    /"decision"\s*:\s*"deny"/i,
    /"policy"\s*:\s*\{[^}]*"enforce"\s*:\s*true/i
  ];

  const structuralAnomalies = [
    /(?:^|\n)\s*{[\s\S]*"system(?:Config|Blocks|Policy|Metrics)"/i,
    /(?:^|\n)\s*---\s*BEGIN\s+SYSTEM/i,
    /(?:^|\n)\s*<\s*policy\s*>[\s\S]*<\s*\/\s*policy\s*>/i
  ];

  const isVetoed =
    vetoSignals.some(function (rx) {
      return rx.test(normalized);
    }) ||
    structuralAnomalies.some(function (rx) {
      return rx.test(normalized);
    });

  const redactions = [
    {
      rx: /\b(AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|AZURE_CLIENT_SECRET|OPENAI_API_KEY|DB_PASSWORD|JWT_SECRET|API_KEY|TOKEN)\b\s*[:=]\s*["']?[^"'\s,;]+["']?/gi,
      to: "$1=[REDACTED]"
    },
    { rx: /\bAKIA[0-9A-Z]{16}\b/g, to: "[REDACTED_AWS_KEY]" },
    { rx: /\bghp_[A-Za-z0-9]{36,}\b/g, to: "[REDACTED_GITHUB_TOKEN]" },
    { rx: /\bAIza[0-9A-Za-z\-_]{35}\b/g, to: "[REDACTED_GOOGLE_KEY]" },
    { rx: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, to: "[REDACTED_SLACK_TOKEN]" },
    { rx: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, to: "[REDACTED_PRIVATE_KEY]" },
    { rx: /\b(?:[a-z]+):\/\/[^/\s:@]+:[^/\s@]+@/gi, to: "https://[REDACTED]:[REDACTED]@" }
  ];

  let safeText = normalized;
  redactions.forEach(function (entry) {
    safeText = safeText.replace(entry.rx, entry.to);
  });

  if (isVetoed) {
    return {
      blocked: true,
      text:
        "Your request hit protected backend policy controls, so the raw response was not rendered. " +
        "System metrics and credential profiles remain private."
    };
  }

  if (!safeText) {
    return {
      blocked: false,
      text:
        "The assistant returned an empty response after security filtering. " +
        "System metrics and credential profiles remain private."
    };
  }

  return {
    blocked: false,
    text: safeText
  };
}

  function normalizeAssistantRoute(targetPage) {
    const value = String(targetPage || "").trim();

    if (!value) {
      return "";
    }

    if (/^(https?:|javascript:|data:)/i.test(value)) {
      return "";
    }

    if (value.startsWith("/")) {
      return value;
    }

    return `/${value}`;
  }

  async function parseAssistantResponsePayload(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await response.json();

      return {
        text: (
          body.text ||
          body.message ||
          body.reply ||
          body.answer ||
          body.data?.text ||
          body.data?.message ||
          ""
        ),
        targetPage: normalizeAssistantRoute(
          body.targetPage ||
          body.metadata?.targetPage ||
          body.uiAction?.targetPage ||
          body.route?.targetPage ||
          body.data?.targetPage ||
          body.data?.metadata?.targetPage
        )
      };
    }

    if (response.body && response.body.getReader) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamed = "";

      while (true) {
        const chunk = await reader.read();

        if (chunk.done) {
          break;
        }

        streamed += decoder.decode(chunk.value, { stream: true });
      }

      streamed += decoder.decode();

      return {
        text: streamed,
        targetPage: ""
      };
    }

    return {
      text: await response.text(),
      targetPage: ""
    };
  }

// Fixed UI refresh function so it renders to the DOM again
function refreshMessages() {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    chatMessages.innerHTML = assistantMessages.map(messageTemplate).join("");
    scrollToLatestMessage();
}

function scrollToLatestMessage() {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    chatMessages.scrollTop = chatMessages.scrollHeight;
}
