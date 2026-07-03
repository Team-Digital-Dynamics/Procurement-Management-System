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
          ${suggestionButton("How do approvals work?")}
          ${suggestionButton("When can I create an RFQ?")}
          ${suggestionButton("What happens after quotation evaluation?")}
          ${suggestionButton("When is a purchase order created?")}
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

  document.querySelectorAll("[data-ai-question]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.getElementById("assistantInput").value = button.dataset.aiQuestion;
      document.getElementById("assistantForm").dispatchEvent(new Event("submit"));
    });
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

  return `
    <div class="ai-message-row ${isUser ? "user" : "assistant"}">
      <div class="ai-avatar">
        ${isUser ? "You" : "AI"}
      </div>

      <div class="ai-message-bubble">
        <p>${PMS.escapeHtml(message.text)}</p>
      </div>
    </div>
  `;
}

async function handleAssistantSubmit(event) {
  event.preventDefault();

  const input = document.getElementById("assistantInput");
  const question = input.value.trim();

  if (!question) return;

  assistantMessages.push({
    sender: "user",
    text: question
  });

  input.value = "";
  refreshMessages();

  assistantMessages.push({
    sender: "assistant",
    text: "Thinking..."
  });

  refreshMessages();

  try {
    const response = await PMS.postJson("/api/assistant", {
      message: question
    });

    assistantMessages.pop();

    assistantMessages.push({
      sender: "assistant",
      text: response.answer || "I received your question, but no answer was returned by the backend."
    });

    refreshMessages();
  } catch (error) {
    assistantMessages.pop();

    assistantMessages.push({
      sender: "assistant",
      text: "I could not get a response from the backend. Please make sure the Spring Boot API is running."
    });

    refreshMessages();
  }
}

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