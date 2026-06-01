// ================= LOGIN =================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // ❌ stop page refresh

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Save the authenticated user details
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("userName", data.name);
        
        alert("Login successful! Welcome, " + data.name);
        window.location.href = "dashboard.html"; // ✅ redirect
      } else {
        alert("Wrong email and password, try the sign up option.");
      }
    } catch (err) {
      console.error("Login failed", err);
      alert("Failed to connect to the backend server.");
    }
  });
}

// ================= SIGNUP =================
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // ❌ stop page refresh

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        alert("Signup successful! Please login.");
        window.location.href = "login.html"; // ✅ go to login
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup failed", err);
      alert("Failed to connect to the backend server.");
    }
  });
}
