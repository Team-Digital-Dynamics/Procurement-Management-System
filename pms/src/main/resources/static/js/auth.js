document.addEventListener("DOMContentLoaded", function () {
  const loginPanel = document.getElementById("loginPanel");
  const registerPanel = document.getElementById("registerPanel");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginMessage = document.getElementById("loginMessage");
  const registerMessage = document.getElementById("registerMessage");
  const showRegisterBtn = document.getElementById("showRegisterBtn");
  const showLoginBtn = document.getElementById("showLoginBtn");

  if (PMS.getToken() && PMS.getUser()) {
    window.location.href = "/dashboard.html";
    return;
  }

  showRegisterBtn.addEventListener("click", function () {
    loginMessage.innerHTML = "";
    registerMessage.innerHTML = "";
    loginPanel.classList.add("hidden");
    registerPanel.classList.remove("hidden");
  });

  showLoginBtn.addEventListener("click", function () {
    registerMessage.innerHTML = "";
    loginMessage.innerHTML = "";
    registerPanel.classList.add("hidden");
    loginPanel.classList.remove("hidden");
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
      registerPanel.classList.add("hidden");
      loginPanel.classList.remove("hidden");

      loginMessage.innerHTML = PMS.message(
        "success",
        "Registration submitted successfully. Your account is pending administrator approval before you can sign in."
      );
    } catch (error) {
      registerMessage.innerHTML = PMS.message("error", error.message);
    }
  });
});