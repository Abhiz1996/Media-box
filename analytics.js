const STORAGE_KEYS = {
  tasks: "mediaBoxWorkflowTasks",
  teams: "mediaBoxTeams",
  session: "mediaBoxDashboardSession"
};

const DEFAULT_TEAMS = [
  "Design Team",
  "Content Team",
  "PR Team",
  "Social Media Team",
  "Daily Digest Team"
];

const loginShell = document.querySelector("#loginShell");
const analyticsApp = document.querySelector("#analyticsApp");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const logoutButton = document.querySelector("#logoutButton");
const metricsGrid = document.querySelector("#metricsGrid");
const categoryBreakdown = document.querySelector("#categoryBreakdown");
const statusBreakdown = document.querySelector("#statusBreakdown");
const teamBreakdown = document.querySelector("#teamBreakdown");
const monthlyCompletions = document.querySelector("#monthlyCompletions");
const activeTableBody = document.querySelector("#activeTableBody");

function readJsonStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function setSession(isLoggedIn) {
  localStorage.setItem(STORAGE_KEYS.session, isLoggedIn ? "active" : "");
}

function hasSession() {
  return localStorage.getItem(STORAGE_KEYS.session) === "active";
}

function getTasks() {
  return readJsonStorage(STORAGE_KEYS.tasks, []);
}

function getTeams() {
  const teams = readJsonStorage(STORAGE_KEYS.teams, []);
  return teams.length ? teams : DEFAULT_TEAMS;
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

function getActiveTasks() {
  return getTasks()
    .filter((task) => task.status !== "Completed")
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
}

function renderMetrics() {
  const tasks = getTasks();
  const activeTasks = getActiveTasks();
  const completedTasks = tasks.filter((task) => task.status === "Completed");
  const dailyDigestLive = activeTasks.filter((task) => task.category === "Daily Digest").length;
  const unassignedCount = activeTasks.filter((task) => !task.assignee || task.assignee === "To be assigned").length;
  const highPriorityCount = activeTasks.filter((task) => task.priority === "High Touch" || task.priority === "Fast Turnaround").length;

  metricsGrid.innerHTML = `
    <article class="ops-metric-card">
      <p>Total Requests</p>
      <strong>${tasks.length}</strong>
      <span>All submissions captured</span>
    </article>
    <article class="ops-metric-card">
      <p>Live Requests</p>
      <strong>${activeTasks.length}</strong>
      <span>Still active in workflow</span>
    </article>
    <article class="ops-metric-card">
      <p>Completed</p>
      <strong>${completedTasks.length}</strong>
      <span>Moved to the repository</span>
    </article>
    <article class="ops-metric-card">
      <p>Unassigned</p>
      <strong>${unassignedCount}</strong>
      <span>Needs owner allocation</span>
    </article>
    <article class="ops-metric-card">
      <p>High Priority</p>
      <strong>${highPriorityCount}</strong>
      <span>Fast-moving or high touch</span>
    </article>
    <article class="ops-metric-card">
      <p>Daily Digest Live</p>
      <strong>${dailyDigestLive}</strong>
      <span>Currently active digest items</span>
    </article>
  `;
}

function buildBarMarkup(label, count, total, accentClass = "") {
  const safeTotal = total || 1;
  const width = Math.max((count / safeTotal) * 100, count ? 8 : 0);
  return `
    <article class="ops-bar-item">
      <div class="ops-bar-copy">
        <strong>${sanitizeText(label)}</strong>
        <span>${count} request${count === 1 ? "" : "s"}</span>
      </div>
      <div class="ops-bar-track">
        <div class="ops-bar-fill ${accentClass}" style="width:${width}%"></div>
      </div>
    </article>
  `;
}

function renderCategoryBreakdown() {
  const tasks = getTasks();
  const grouped = tasks.reduce((accumulator, task) => {
    const key = task.category || "Unclassified";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const entries = Object.entries(grouped).sort((left, right) => right[1] - left[1]);
  const total = tasks.length;

  if (!entries.length) {
    categoryBreakdown.innerHTML = '<p class="ops-empty-copy">No submissions yet.</p>';
    return;
  }

  categoryBreakdown.innerHTML = entries
    .map(([label, count], index) => buildBarMarkup(label, count, total, `ops-bar-accent-${(index % 3) + 1}`))
    .join("");
}

function renderStatusBreakdown() {
  const tasks = getTasks();
  const statuses = ["Will Do", "Ongoing", "Completed"];
  const total = tasks.length || 1;

  statusBreakdown.innerHTML = statuses.map((status) => {
    const count = tasks.filter((task) => task.status === status).length;
    const percentage = Math.round((count / total) * 100);
    const statusClass = `ops-status-${status.toLowerCase().replace(/\s+/g, "-")}`;

    return `
      <article class="ops-donut-card">
        <div class="ops-donut-ring">
          <div class="ops-donut-value">${percentage}%</div>
        </div>
        <div class="ops-donut-copy">
          <span class="ops-status-pill ${statusClass}">${sanitizeText(status)}</span>
          <strong>${count} request${count === 1 ? "" : "s"}</strong>
        </div>
      </article>
    `;
  }).join("");
}

function renderTeamBreakdown() {
  const activeTasks = getActiveTasks();
  const grouped = getTeams().reduce((accumulator, team) => {
    accumulator[team] = 0;
    return accumulator;
  }, {});

  activeTasks.forEach((task) => {
    const team = task.team || "Unassigned";
    grouped[team] = (grouped[team] || 0) + 1;
  });

  const entries = Object.entries(grouped).sort((left, right) => right[1] - left[1]);
  const highest = entries.reduce((max, [, count]) => Math.max(max, count), 0);

  teamBreakdown.innerHTML = entries
    .filter(([, count]) => count > 0)
    .map(([team, count], index) => buildBarMarkup(team, count, highest, `ops-bar-accent-${(index % 3) + 1}`))
    .join("") || '<p class="ops-empty-copy">No active team allocation yet.</p>';
}

function renderMonthlyCompletions() {
  const completedTasks = getTasks()
    .filter((task) => task.status === "Completed" && task.completedAt)
    .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt));

  const grouped = completedTasks.reduce((accumulator, task) => {
    const key = formatMonthYear(task.completedAt);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  const entries = Object.entries(grouped).slice(0, 2);

  if (!entries.length) {
    monthlyCompletions.innerHTML = '<p class="ops-empty-copy">No completed items yet.</p>';
    return;
  }

  const max = entries.reduce((highest, [, count]) => Math.max(highest, count), 0);

  monthlyCompletions.innerHTML = entries.map(([month, count]) => `
    <article class="ops-timeline-item">
      <div class="ops-timeline-copy">
        <strong>${sanitizeText(month)}</strong>
        <span>${count} completed item${count === 1 ? "" : "s"}</span>
      </div>
      <div class="ops-bar-track">
        <div class="ops-bar-fill ops-bar-accent-2" style="width:${Math.max((count / (max || 1)) * 100, count ? 12 : 0)}%"></div>
      </div>
    </article>
  `).join("");
}

function renderActiveTable() {
  const activeTasks = getActiveTasks();
  activeTableBody.innerHTML = "";

  if (!activeTasks.length) {
    activeTableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="ops-empty-cell">No active requests in the workflow at the moment.</div>
        </td>
      </tr>
    `;
    return;
  }

  activeTasks.forEach((task) => {
    const row = document.createElement("tr");
    const statusClass = `ops-status-${sanitizeText(task.status).toLowerCase().replace(/\s+/g, "-")}`;
    row.innerHTML = `
      <td>
        <strong>${sanitizeText(task.title)}</strong>
        <small>${sanitizeText(task.summary)}</small>
      </td>
      <td>${sanitizeText(task.category)}</td>
      <td><span class="ops-status-pill ${statusClass}">${sanitizeText(task.status)}</span></td>
      <td>${sanitizeText(task.team)}</td>
      <td>${sanitizeText(task.assignee)}</td>
      <td>${sanitizeText(formatDate(task.createdAt))}</td>
    `;
    activeTableBody.appendChild(row);
  });
}

function renderAnalytics() {
  renderMetrics();
  renderCategoryBreakdown();
  renderStatusBreakdown();
  renderTeamBreakdown();
  renderMonthlyCompletions();
  renderActiveTable();
}

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
    analyticsApp.classList.remove("is-hidden");
    logoutButton.classList.remove("is-hidden");
    renderAnalytics();
    return;
  }

  loginStatus.textContent = "Incorrect login. Use the demo credentials shown below the form.";
  loginStatus.classList.add("is-error");
});

logoutButton.addEventListener("click", () => {
  setSession(false);
  analyticsApp.classList.add("is-hidden");
  loginShell.classList.remove("is-hidden");
  logoutButton.classList.add("is-hidden");
});

if (hasSession()) {
  loginShell.classList.add("is-hidden");
  analyticsApp.classList.remove("is-hidden");
  logoutButton.classList.remove("is-hidden");
  renderAnalytics();
}
