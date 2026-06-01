document.addEventListener("DOMContentLoaded", () => {

  const API_URL = "https://todo-pro-web-backend.onrender.com/api";

  const taskInput = document.getElementById("taskInput");
  const taskDate = document.getElementById("taskDate");
  const taskPriority = document.getElementById("taskPriority");
  const addBtn = document.getElementById("addTaskBtn");
  const taskList = document.getElementById("taskList");

  const totalTasksEl = document.getElementById("totalTasks");
  const completedTasksEl = document.getElementById("completedTasks");
  const pendingTasksEl = document.getElementById("pendingTasks");
  const productivityEl = document.getElementById("productivityScore");

  const userId = localStorage.getItem("userId");

  // ❗ SAFETY CHECK (THIS WAS MISSING)
  if (!addBtn || !taskInput || !taskList) {
    console.error("Dashboard DOM not loaded properly");
    return;
  }

  if (!userId) {
    alert("Please log in to access your dashboard");
    window.location.href = "login.html";
    return;
  }

  let tasks = [];

  // ================= LOAD TASKS =================
  async function loadTasks() {
    try {
      const res = await fetch(`${API_URL}?userId=${userId}`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Invalid API response");
        tasks = [];
      } else {
        tasks = data;
      }

      renderTasks();
      updateStats();
      updateChart();
      updateProductivityChart();

    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  }

  // ================= ADD TASK =================
  addBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const text = taskInput.value.trim();
    if (!text) {
      alert("Enter a task");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          dueDate: taskDate.value || null,
          priority: taskPriority.value || "Medium",
          userId: userId
        })
      });

      if (!res.ok) {
        alert("Failed to add task");
        return;
      }

      taskInput.value = "";
      taskDate.value = "";
      taskPriority.value = "Medium";

      await loadTasks();

    } catch (err) {
      console.error("Add task failed", err);
    }
  });

  // ================= TOGGLE =================
  window.toggleTask = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: "PUT" });
    loadTasks();
  };

  // ================= DELETE =================
  window.deleteTask = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    loadTasks();
  };

  // ================= RENDER =================
  function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach(task => {
      const li = document.createElement("li");

      li.innerHTML = `
        <input type="checkbox" ${task.completed ? "checked" : ""}
          onchange="toggleTask('${task._id}')">
        <span>${task.text}</span>
        <button onclick="deleteTask('${task._id}')">❌</button>
      `;

      taskList.appendChild(li);
    });
  }

  // ================= STATS =================
  function updateStats() {
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = done;
    pendingTasksEl.textContent = total - done;
    productivityEl.textContent = total ? Math.round(done / total * 100) + "%" : "0%";
  }

  // ================= CHARTS =================
  const weeklyChart = new Chart(document.getElementById("weeklyChart"), {
    type: "bar",
    data: {
      labels: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
      datasets: [
        { label: "Low", data: [0,0,0,0,0,0,0], backgroundColor: "#22c55e" },
        { label: "Medium", data: [0,0,0,0,0,0,0], backgroundColor: "#facc15" },
        { label: "High", data: [0,0,0,0,0,0,0], backgroundColor: "#ef4444" }
      ]
    }
  });

  function updateChart() {
    const low = Array(7).fill(0);
    const med = Array(7).fill(0);
    const high = Array(7).fill(0);

    tasks.forEach(t => {
      const dateVal = t.dueDate || t.createdAt || new Date();
      const d = new Date(dateVal).getDay();
      if (t.priority === "Low") low[d]++;
      else if (t.priority === "Medium") med[d]++;
      else high[d]++;
    });

    weeklyChart.data.datasets[0].data = low;
    weeklyChart.data.datasets[1].data = med;
    weeklyChart.data.datasets[2].data = high;
    weeklyChart.update();
  }

  const productivityChart = new Chart(document.getElementById("productivityChart"), {
    type: "line",
    data: {
      labels: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
      datasets: [{ label: "Productivity", data: [0,0,0,0,0,0,0] }]
    }
  });

  function updateProductivityChart() {
    const total = Array(7).fill(0);
    const done = Array(7).fill(0);

    tasks.forEach(t => {
      const dateVal = t.dueDate || t.createdAt || new Date();
      const d = new Date(dateVal).getDay();
      total[d]++;
      if (t.completed) done[d]++;
    });

    productivityChart.data.datasets[0].data =
      total.map((t,i)=>t?Math.round(done[i]/t*100):0);

    productivityChart.update();
  }

  // ================= EXPORT =================
  window.exportCSV = () => {
    if (!tasks.length) return alert("No tasks");
    let csv = "Task\n";
    tasks.forEach(t => csv += `${t.text}\n`);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv]));
    a.download = "tasks.csv";
    a.click();
  };

  window.exportPDF = () => {
    if (!tasks.length) return alert("No tasks");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    tasks.forEach((t,i)=>doc.text(`${i+1}. ${t.text}`,10,10+i*8));
    doc.save("tasks.pdf");
  };

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
  };

  loadTasks();
});
