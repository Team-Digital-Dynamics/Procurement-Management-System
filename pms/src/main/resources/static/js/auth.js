document.addEventListener("DOMContentLoaded", function () {
  const loginPanel = document.getElementById("loginPanel");
  const registerPanel = document.getElementById("registerPanel");
  const forgotPanel = document.getElementById("forgotPanel");

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotForm = document.getElementById("forgotForm");

  const loginMessage = document.getElementById("loginMessage");
  const registerMessage = document.getElementById("registerMessage");
  const forgotMessage = document.getElementById("forgotMessage");

  const showRegisterBtn = document.getElementById("showRegisterBtn");
  const showLoginBtn = document.getElementById("showLoginBtn");
  const showForgotBtn = document.getElementById("showForgotBtn");
  const showLoginFromForgotBtn = document.getElementById("showLoginFromForgotBtn");

  if (PMS.getToken() && PMS.getUser()) {
    window.location.href = "/dashboard.html";
    return;
  }

  function clearMessages() {
    if (loginMessage) loginMessage.innerHTML = "";
    if (registerMessage) registerMessage.innerHTML = "";
    if (forgotMessage) forgotMessage.innerHTML = "";
  }

  function showPanel(panelName) {
    clearMessages();

    loginPanel.classList.add("hidden");
    registerPanel.classList.add("hidden");
    forgotPanel.classList.add("hidden");

    if (panelName === "login") loginPanel.classList.remove("hidden");
    if (panelName === "register") registerPanel.classList.remove("hidden");
    if (panelName === "forgot") forgotPanel.classList.remove("hidden");
  }

  showRegisterBtn.addEventListener("click", function () {
    showPanel("register");
  });

  showLoginBtn.addEventListener("click", function () {
    showPanel("login");
  });

  showForgotBtn.addEventListener("click", function () {
    showPanel("forgot");
  });

  showLoginFromForgotBtn.addEventListener("click", function () {
    showPanel("login");
  });

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    loginMessage.innerHTML = "";

    try {
      const response = await PMS.postJson("/api/auth/login", {
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
      });

      PMS.saveSession(response);
      window.location.href = "/dashboard.html";
    } catch (error) {
      loginMessage.innerHTML = PMS.message("error", error.message);
    }
  });

  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    registerMessage.innerHTML = "";

    try {
      await PMS.postJson("/api/auth/register", PMS.formDataToObject(registerForm));

      registerForm.reset();
      showPanel("login");

      loginMessage.innerHTML = PMS.message(
        "success",
        "Registration submitted successfully. Your account is pending administrator approval before you can sign in."
      );
    } catch (error) {
      registerMessage.innerHTML = PMS.message("error", error.message);
    }
  });

  forgotForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    forgotMessage.innerHTML = "";

    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      forgotMessage.innerHTML = PMS.message("error", "Passwords do not match.");
      return;
    }

    try {
      const response = await PMS.postJson("/api/auth/reset-password", {
        email: document.getElementById("forgotEmail").value.trim(),
        newPassword: newPassword,
        confirmPassword: confirmPassword
      });

      forgotForm.reset();
      showPanel("login");

      loginMessage.innerHTML = PMS.message(
        "success",
        response.message || "Password reset successfully. You can now sign in."
      );
    } catch (error) {
      forgotMessage.innerHTML = PMS.message("error", error.message);
    }
  });
});