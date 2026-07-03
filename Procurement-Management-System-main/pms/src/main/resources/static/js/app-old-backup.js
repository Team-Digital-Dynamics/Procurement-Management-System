let token = localStorage.getItem("pmsToken") || "";
const content = document.querySelector("#content");
const session = document.querySelector("#session");

function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { ...options, headers }).then(async response => {
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(body?.message || response.statusText);
    return body;
  });
}

function showSession(user) {
  session.innerHTML = user
    ? `<div class="card">Signed in as <strong>${user.email}</strong><br><span class="muted">${user.roles.join(", ")}</span></div>`
    : `<div class="card muted">Sign in with a seeded account to use the system.</div>`;
}

document.querySelector("#loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.querySelector("#email").value,
        password: document.querySelector("#password").value
      })
    });
    token = data.token;
    localStorage.setItem("pmsToken", token);
    showSession(data);
    loadDashboard();
  } catch (error) {
    content.innerHTML = `<div class="card">${error.message}</div>`;
  }
});

document.querySelectorAll("nav button").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.view === "dashboard") loadDashboard();
    if (button.dataset.view === "requisition") requisitionForm();
    if (button.dataset.view === "supplier") supplierForm();
    if (button.dataset.view === "assistant") assistantForm();
  });
});

async function loadDashboard() {
  const data = await api("/api/dashboard");
  content.innerHTML = `<h2>Dashboard</h2><div class="grid">${Object.entries(data)
    .map(([key, value]) => `<div class="card"><strong>${value}</strong><br><span class="muted">${key}</span></div>`)
    .join("")}</div>`;
}

function requisitionForm() {
  content.innerHTML = `<h2>New requisition</h2><form id="req" class="card">
    <label>Title <input name="title" required></label>
    <label>Justification <textarea name="businessJustification" required></textarea></label>
    <label>Item <input name="description" required></label>
    <label>Quantity <input name="quantity" type="number" value="1" min="1" required></label>
    <label>Estimated unit price <input name="price" type="number" value="100" min="1" required></label>
    <button>Create</button>
  </form>`;
  document.querySelector("#req").addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const result = await api("/api/requisitions", {
      method: "POST",
      body: JSON.stringify({
        title: form.get("title"),
        businessJustification: form.get("businessJustification"),
        items: [{ description: form.get("description"), quantity: form.get("quantity"), estimatedUnitPrice: form.get("price") }]
      })
    });
    content.innerHTML = `<div class="card">Created requisition #${result.id} with total ${result.totalAmount}</div>`;
  });
}

function supplierForm() {
  content.innerHTML = `<h2>Supplier register</h2><form id="sup" class="card">
    <label>Name <input name="name" required></label>
    <label>Email <input name="contactEmail" type="email" required></label>
    <label>Phone <input name="phone"></label>
    <label>Tax number <input name="taxNumber"></label>
    <button>Create supplier</button>
  </form>`;
  document.querySelector("#sup").addEventListener("submit", async event => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.target));
    const result = await api("/api/suppliers", { method: "POST", body: JSON.stringify(form) });
    content.innerHTML = `<div class="card">Supplier ${result.name} created with status ${result.status}</div>`;
  });
}

function assistantForm() {
  content.innerHTML = `<h2>Assistant</h2><form id="chat" class="card">
    <label>Question <input name="message" value="How do approvals work?"></label>
    <button>Ask</button>
  </form><div id="answer"></div>`;
  document.querySelector("#chat").addEventListener("submit", async event => {
    event.preventDefault();
    const answer = await api("/api/assistant", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
    document.querySelector("#answer").innerHTML = `<div class="card">${answer.answer}</div>`;
  });
}

showSession(null);
