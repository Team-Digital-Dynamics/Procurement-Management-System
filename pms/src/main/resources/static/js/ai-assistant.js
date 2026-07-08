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
        : "";

    return `
    <div class="ai-message-row ${isUser ? "user" : "assistant"}">
      <div class="ai-avatar">
        ${isUser ? "You" : "AI"}
      </div>

      <div class="ai-message-bubble">
        <p>${formatAssistantText(message.text)}</p>
        ${suggestions}
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
    const question = input.value.trim();

    await submitAssistantQuestion(question);
}

async function submitAssistantQuestion(question) {
    if (!question) return;

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

        assistantMessages.push({
            sender: "assistant",
            text: getAssistantResponse(question)
        });

        refreshMessages();
    }
}

function getCurrentUserRoles() {
    const user = PMS.getUser ? PMS.getUser() : null;
    return user && Array.isArray(user.roles) ? user.roles : [];
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
