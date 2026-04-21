const STORAGE_KEYS = {
  tasks: "mediaBoxWorkflowTasks",
  teams: "mediaBoxTeams",
  session: "mediaBoxDashboardSession"
};

const WORKFLOW_STATUSES = ["Will Do", "Ongoing", "Completed"];
const DEFAULT_TEAMS = [
  "Design Team",
  "Content Team",
  "PR Team",
  "Social Media Team",
  "Daily Digest Team"
];

const loginShell = document.querySelector("#loginShell");
const dashboardApp = document.querySelector("#dashboardApp");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const logoutButton = document.querySelector("#logoutButton");
const metricsGrid = document.querySelector("#metricsGrid");
const categoryTabs = document.querySelector("#categoryTabs");
const monitorTableBody = document.querySelector("#monitorTableBody");
const archiveGroups = document.querySelector("#archiveGroups");
const exportButton = document.querySelector("#exportButton");

const filters = {
  search: document.querySelector("#searchInput"),
  status: document.querySelector("#statusFilter"),
  category: document.querySelector("#categoryFilter"),
  priority: document.querySelector("#priorityFilter")
};
let activeCategoryTab = "";

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getTasks() {
  return readJsonStorage(STORAGE_KEYS.tasks, []);
}

function setTasks(tasks) {
  writeJsonStorage(STORAGE_KEYS.tasks, tasks);
}

function getTeams() {
  const teams = readJsonStorage(STORAGE_KEYS.teams, []);
  return teams.length ? teams : DEFAULT_TEAMS;
}

function setSession(isLoggedIn) {
  localStorage.setItem(STORAGE_KEYS.session, isLoggedIn ? "active" : "");
}

function hasSession() {
  return localStorage.getItem(STORAGE_KEYS.session) === "active";
}

function sanitizeText(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...(String(value).includes("T") ? { timeStyle: "short" } : {})
  }).format(date);
}

function formatMonthYear(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown Month";
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function populateCategoryFilter() {
  const currentValue = filters.category.value;
  const categories = Array.from(new Set(getTasks().map((task) => task.category).filter(Boolean))).sort();

  filters.category.innerHTML = '<option value="">All categories</option>'
    + categories.map((category) => `<option>${sanitizeText(category)}</option>`).join("");

  filters.category.value = categories.includes(currentValue) ? currentValue : "";
}

function getActiveTasks() {
  return getTasks()
    .filter((task) => task.status !== "Completed")
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
}

function getVisibleTasks() {
  const searchTerm = filters.search.value.trim().toLowerCase();

  return getActiveTasks().filter((task) => {
    const matchesSearch = !searchTerm || [
      task.id,
      task.title,
      task.requesterName,
      task.department,
      task.summary
    ].some((value) => String(value || "").toLowerCase().includes(searchTerm));

    const matchesStatus = !filters.status.value || task.status === filters.status.value;
    const categoryValue = filters.category.value || activeCategoryTab;
    const matchesCategory = !categoryValue || task.category === categoryValue;
    const matchesPriority = !filters.priority.value || task.priority === filters.priority.value;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });
}

function getRecentArchiveGroups() {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const completedTasks = getTasks()
    .filter((task) => task.status === "Completed" && task.completedAt)
    .filter((task) => {
      const completedDate = new Date(task.completedAt);
      return !Number.isNaN(completedDate.getTime()) && completedDate >= cutoff;
    })
    .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt));

  const grouped = completedTasks.reduce((accumulator, task) => {
    const monthKey = formatMonthYear(task.completedAt);
    if (!accumulator[monthKey]) {
      accumulator[monthKey] = [];
    }
    accumulator[monthKey].push(task);
    return accumulator;
  }, {});

  return Object.entries(grouped).slice(0, 2);
}

function renderMetrics() {
  const tasks = getTasks();
  const activeTasks = getActiveTasks();
  const ongoingCount = tasks.filter((task) => task.status === "Ongoing").length;
  const completedCount = tasks.filter((task) => task.status === "Completed").length;
  const highPriorityCount = tasks.filter((task) => task.priority === "High Touch" || task.priority === "Fast Turnaround").length;
  const dailyDigestLive = activeTasks.filter((task) => task.category === "Daily Digest").length;

  metricsGrid.innerHTML = `
    <article class="ops-metric-card">
      <p>Total</p>
      <strong>${tasks.length}</strong>
      <span>All requests</span>
    </article>
    <article class="ops-metric-card">
      <p>Open</p>
      <strong>${activeTasks.filter((task) => task.status === "Will Do").length}</strong>
      <span>Waiting to be picked up</span>
    </article>
    <article class="ops-metric-card">
      <p>In progress</p>
      <strong>${ongoingCount}</strong>
      <span>Being handled now</span>
    </article>
    <article class="ops-metric-card">
      <p>Resolved</p>
      <strong>${completedCount}</strong>
      <span>Moved to repository</span>
    </article>
    <article class="ops-metric-card">
      <p>High priority</p>
      <strong>${highPriorityCount}</strong>
      <span>Needs close attention</span>
    </article>
    <article class="ops-metric-card">
      <p>Daily Digest live</p>
      <strong>${dailyDigestLive}</strong>
      <span>Tracked in active monitor</span>
    </article>
  `;
}

function renderCategoryTabs() {
  const activeTasks = getActiveTasks();
  const categories = ["PR", "Social Media", "Daily Digest", "Achievements"];

  categoryTabs.innerHTML = categories.map((category) => {
    const count = activeTasks.filter((task) => task.category === category).length;
    const isActive = activeCategoryTab === category;
    return `
      <button class="ops-category-tab${isActive ? " is-active" : ""}" type="button" data-category-tab="${sanitizeText(category)}">
        <span>${sanitizeText(category)}</span>
        <strong>${count}</strong>
        <small>Open works</small>
      </button>
    `;
  }).join("");

  categoryTabs.querySelectorAll("[data-category-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextCategory = button.dataset.categoryTab;
      activeCategoryTab = activeCategoryTab === nextCategory ? "" : nextCategory;
      filters.category.value = "";
      renderMonitor();
    });
  });
}

function renderTable() {
  const tasks = getVisibleTasks();
  monitorTableBody.innerHTML = "";

  if (!tasks.length) {
    monitorTableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="ops-empty-cell">No active requests match the current filters.</div>
        </td>
      </tr>
    `;
    return;
  }

  tasks.forEach((task, index) => {
    const priorityClass = `ops-priority-${sanitizeText(task.priority).toLowerCase().replace(/\s+/g, "-")}`;
    const statusClass = `ops-status-${sanitizeText(task.status).toLowerCase().replace(/\s+/g, "-")}`;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>MB-${String(index + 1).padStart(3, "0")}</td>
      <td>
        <strong>${sanitizeText(task.title)}</strong>
        <small>${sanitizeText(task.summary)}</small>
      </td>
      <td>${sanitizeText(task.category)}</td>
      <td>
        <select class="ops-table-select ops-table-priority ${priorityClass}" data-priority-task="${sanitizeText(task.id)}">
          <option value="Standard"${task.priority === "Standard" ? " selected" : ""}>Standard</option>
          <option value="High Touch"${task.priority === "High Touch" ? " selected" : ""}>High Touch</option>
          <option value="Fast Turnaround"${task.priority === "Fast Turnaround" ? " selected" : ""}>Fast Turnaround</option>
        </select>
      </td>
      <td>
        <select class="ops-table-select ops-table-status ${statusClass}" data-status-task="${sanitizeText(task.id)}">
          <option value="Will Do"${task.status === "Will Do" ? " selected" : ""}>Will Do</option>
          <option value="Ongoing"${task.status === "Ongoing" ? " selected" : ""}>Ongoing</option>
          <option value="Completed"${task.status === "Completed" ? " selected" : ""}>Completed</option>
        </select>
      </td>
      <td>${sanitizeText(formatDate(task.createdAt))}</td>
      <td>${sanitizeText(task.assignee)}</td>
    `;
    monitorTableBody.appendChild(row);
  });

  monitorTableBody.querySelectorAll("[data-priority-task]").forEach((select) => {
    select.addEventListener("change", () => {
      updateTask(select.dataset.priorityTask, { priority: select.value });
    });
  });

  monitorTableBody.querySelectorAll("[data-status-task]").forEach((select) => {
    select.addEventListener("change", () => {
      updateTask(select.dataset.statusTask, { status: select.value });
    });
  });
}

function updateTask(taskId, updates) {
  const hasStatusUpdate = Object.prototype.hasOwnProperty.call(updates, "status");
  const tasks = getTasks().map((task) => (
    task.id === taskId
      ? {
          ...task,
          ...updates,
          completedAt: hasStatusUpdate
            ? updates.status === "Completed"
              ? task.completedAt || new Date().toISOString()
              : ""
            : task.completedAt || ""
        }
      : task
  ));

  setTasks(tasks);
  renderMonitor();
}

function renderArchive() {
  const archive = getRecentArchiveGroups();
  archiveGroups.innerHTML = "";

  if (!archive.length) {
    archiveGroups.innerHTML = `
      <section class="ops-archive-empty">
        <p class="ops-kicker">No archived items</p>
        <h3>Completed requests will appear here.</h3>
      </section>
    `;
    return;
  }

  archive.forEach(([monthLabel, tasks]) => {
    const section = document.createElement("section");
    section.className = "ops-archive-group";
    section.innerHTML = `
      <div class="ops-archive-header">
        <h3>${sanitizeText(monthLabel)}</h3>
        <span>${tasks.length} item${tasks.length === 1 ? "" : "s"}</span>
      </div>
      <div class="ops-archive-list">
        ${tasks.map((task) => `
          <article class="ops-archive-card">
            <strong>${sanitizeText(task.title)}</strong>
            <p>${sanitizeText(task.category)} · ${sanitizeText(task.requesterName)} · ${sanitizeText(task.department)}</p>
            <span>${sanitizeText(formatDate(task.completedAt))}</span>
          </article>
        `).join("")}
      </div>
    `;
    archiveGroups.appendChild(section);
  });
}

function exportCsv() {
  const tasks = getVisibleTasks();
  const rows = [
    ["ID", "Title", "Category", "Priority", "Status", "Date", "Assigned Team", "Assignee"],
    ...tasks.map((task, index) => [
      `MB-${String(index + 1).padStart(3, "0")}`,
      task.title,
      task.category,
      task.priority,
      task.status,
      formatDate(task.createdAt),
      task.team,
      task.assignee
    ])
  ];

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "media-box-workflow.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function renderMonitor() {
  populateCategoryFilter();
  renderMetrics();
  renderCategoryTabs();
  renderTable();
  renderArchive();
}

[filters.search, filters.status, filters.category, filters.priority].forEach((element) => {
  element.addEventListener("input", renderMonitor);
  element.addEventListener("change", renderMonitor);
});

filters.category.addEventListener("change", () => {
  activeCategoryTab = "";
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (username === "admin" && password === "mediabox") {
    setSession(true);
    loginStatus.textContent = "";
    loginStatus.classList.remove("is-error");
    loginShell.classList.add("is-hidden");
    dashboardApp.classList.remove("is-hidden");
    logoutButton.classList.remove("is-hidden");
    renderMonitor();
    return;
  }

  loginStatus.textContent = "Incorrect login. Use the demo credentials shown below the form.";
  loginStatus.classList.add("is-error");
});

logoutButton.addEventListener("click", () => {
  setSession(false);
  dashboardApp.classList.add("is-hidden");
  loginShell.classList.remove("is-hidden");
  logoutButton.classList.add("is-hidden");
});

exportButton.addEventListener("click", exportCsv);

if (hasSession()) {
  loginShell.classList.add("is-hidden");
  dashboardApp.classList.remove("is-hidden");
  logoutButton.classList.remove("is-hidden");
  renderMonitor();
}
