const STORAGE_KEYS = {
  requests: "mediaBoxRequests",
  tasks: "mediaBoxWorkflowTasks",
  teams: "mediaBoxTeams",
  session: "mediaBoxDashboardSession"
};

const WORKFLOW_STATUSES = ["Will Do", "Ongoing", "Completed"];

const loginShell = document.querySelector("#loginShell");
const dashboardApp = document.querySelector("#dashboardApp");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const logoutButton = document.querySelector("#logoutButton");
const metricsGrid = document.querySelector("#metricsGrid");
const detailPanel = document.querySelector("#detailPanel");
const teamForm = document.querySelector("#teamForm");
const teamInput = document.querySelector("#teamInput");
const teamChipRow = document.querySelector("#teamChipRow");
const drawerOverlay = document.querySelector("#drawerOverlay");
const drawerClose = document.querySelector("#drawerClose");
const drawerTaskTitle = document.querySelector("#drawerTaskTitle");
const drawerTaskSummary = document.querySelector("#drawerTaskSummary");
const drawerMeta = document.querySelector("#drawerMeta");
const drawerStatus = document.querySelector("#drawerStatus");
const drawerTeam = document.querySelector("#drawerTeam");
const drawerAssignee = document.querySelector("#drawerAssignee");
const drawerPriority = document.querySelector("#drawerPriority");
const drawerNotes = document.querySelector("#drawerNotes");
const requestDetailGrid = document.querySelector("#requestDetailGrid");

const filters = {
  search: document.querySelector("#searchInput"),
  category: document.querySelector("#categoryFilter"),
  department: document.querySelector("#departmentFilter"),
  team: document.querySelector("#teamFilter")
};

let activeTaskId = "";
let dragTaskId = "";

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

function ensureSeedData() {
  const teams = readJsonStorage(STORAGE_KEYS.teams, []);
  const tasks = readJsonStorage(STORAGE_KEYS.tasks, []);

  if (!teams.length) {
    writeJsonStorage(STORAGE_KEYS.teams, [
      "Design Team",
      "Content Team",
      "PR Team",
      "Social Media Team"
    ]);
  }

  if (!tasks.length) {
    const timestamp = new Date().toISOString();
    writeJsonStorage(STORAGE_KEYS.tasks, [
      {
        id: "TASK-DEMO-1",
        requestId: "REQ-DEMO-1",
        title: "Founders meetup teaser reel",
        category: "Social Media",
        socialType: "New Creative",
        department: "IEDC",
        requesterName: "Aparna",
        status: "Will Do",
        team: "Social Media Team",
        assignee: "To be assigned",
        priority: "Fast Turnaround",
        summary: "Need a short teaser reel with speaker highlights and registration CTA.",
        createdAt: timestamp,
        dueText: "2026-04-24",
        notes: "",
        payload: {
          employeeName: "Aparna",
          department: "IEDC",
          category: "Social Media",
          socialType: "New Creative",
          newCreativeEventName: "Founders Meetup",
          newCreativeDescription: "Build anticipation for the session and push registrations.",
          newCreativeRegistrationLink: "https://example.com/register",
          submittedAt: timestamp
        }
      },
      {
        id: "TASK-DEMO-2",
        requestId: "REQ-DEMO-2",
        title: "Quarterly funding milestone PR",
        category: "PR",
        socialType: "",
        department: "Investment",
        requesterName: "Midhun",
        status: "Ongoing",
        team: "PR Team",
        assignee: "To be assigned",
        priority: "High Touch",
        summary: "Draft press note for latest funding milestone with quotes and context.",
        createdAt: timestamp,
        dueText: "2026-04-26T11:00",
        notes: "Waiting for final approval quote.",
        payload: {
          employeeName: "Midhun",
          department: "Investment",
          category: "PR",
          prEventAnnouncement: "Funding milestone announcement",
          prWhySignificant: "Highlights ecosystem momentum and startup impact.",
          prContactPerson: "Communications desk",
          submittedAt: timestamp
        }
      },
      {
        id: "TASK-DEMO-3",
        requestId: "REQ-DEMO-3",
        title: "Startup award achievement card",
        category: "Achievements",
        socialType: "",
        department: "Incubation",
        requesterName: "Riya",
        status: "Completed",
        team: "Content Team",
        assignee: "To be assigned",
        priority: "Standard",
        summary: "Achievement creative documenting the startup's latest award.",
        createdAt: timestamp,
        dueText: "",
        notes: "Published on LinkedIn and archived in the deck.",
        payload: {
          employeeName: "Riya",
          department: "Incubation",
          category: "Achievements",
          achievementStartupName: "SeedSpark Labs",
          achievementDescription: "Won a national innovation award.",
          submittedAt: timestamp
        }
      }
    ]);
  }
}

function getTasks() {
  return readJsonStorage(STORAGE_KEYS.tasks, []);
}

function setTasks(tasks) {
  writeJsonStorage(STORAGE_KEYS.tasks, tasks);
}

function getTeams() {
  return readJsonStorage(STORAGE_KEYS.teams, []);
}

function setTeams(teams) {
  writeJsonStorage(STORAGE_KEYS.teams, teams);
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
    return "No due date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...(value.includes("T") ? { timeStyle: "short" } : {})
  }).format(date);
}

function populateFilters() {
  const currentDepartment = filters.department.value;
  const currentTeam = filters.team.value;
  const tasks = getTasks();
  const teams = getTeams();
  const departments = Array.from(new Set(tasks.map((task) => task.department).filter(Boolean))).sort();

  filters.department.innerHTML = '<option value="">All departments</option>'
    + departments.map((department) => `<option>${sanitizeText(department)}</option>`).join("");

  const teamOptions = ['<option value="">All teams</option>']
    .concat(teams.map((team) => `<option>${sanitizeText(team)}</option>`))
    .join("");

  filters.team.innerHTML = teamOptions;
  drawerTeam.innerHTML = teams.map((team) => `<option>${sanitizeText(team)}</option>`).join("");
  drawerStatus.innerHTML = WORKFLOW_STATUSES.map((status) => `<option>${status}</option>`).join("");

  filters.department.value = departments.includes(currentDepartment) ? currentDepartment : "";
  filters.team.value = teams.includes(currentTeam) ? currentTeam : "";
}

function getFilteredTasks() {
  const tasks = getTasks();
  const searchTerm = filters.search.value.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesSearch = !searchTerm || [
      task.title,
      task.requesterName,
      task.team,
      task.assignee,
      task.summary
    ].some((value) => String(value || "").toLowerCase().includes(searchTerm));

    const matchesCategory = !filters.category.value || task.category === filters.category.value;
    const matchesDepartment = !filters.department.value || task.department === filters.department.value;
    const matchesTeam = !filters.team.value || task.team === filters.team.value;

    return matchesSearch && matchesCategory && matchesDepartment && matchesTeam;
  });
}

function renderMetrics(tasks) {
  const willDoCount = tasks.filter((task) => task.status === "Will Do").length;
  const ongoingCount = tasks.filter((task) => task.status === "Ongoing").length;
  const completedCount = tasks.filter((task) => task.status === "Completed").length;
  const prCount = tasks.filter((task) => task.category === "PR").length;
  const assignedCount = tasks.filter((task) => task.assignee && task.assignee !== "To be assigned").length;

  metricsGrid.innerHTML = `
    <article class="metric-card">
      <p class="metric-label">Queue</p>
      <strong>${tasks.length}</strong>
      <span>Total cards across all categories</span>
    </article>
    <article class="metric-card">
      <p class="metric-label">Live Work</p>
      <strong>${ongoingCount}</strong>
      <span>Items currently in production or review</span>
    </article>
    <article class="metric-card">
      <p class="metric-label">Assigned</p>
      <strong>${assignedCount}</strong>
      <span>Cards already mapped to an owner or team lead</span>
    </article>
    <article class="metric-card">
      <p class="metric-label">PR Focus</p>
      <strong>${prCount}</strong>
      <span>Press-release work currently in the system</span>
    </article>
  `;

  document.querySelector('[data-count-for="Will Do"]').textContent = willDoCount;
  document.querySelector('[data-count-for="Ongoing"]').textContent = ongoingCount;
  document.querySelector('[data-count-for="Completed"]').textContent = completedCount;
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.taskId = task.id;

  const categoryClass = task.category === "PR" ? "pill is-pr" : "pill";
  const ownerInitial = (task.assignee && task.assignee !== "To be assigned")
    ? task.assignee.trim().charAt(0).toUpperCase()
    : task.team.trim().charAt(0).toUpperCase();
  const dueLabel = task.dueText ? formatDate(task.dueText) : "No due date";
  const taskType = task.socialType || task.category;

  card.innerHTML = `
    <div class="task-topline">
      <span class="${categoryClass}">${sanitizeText(task.category)}</span>
      <span class="priority-pill">${sanitizeText(task.priority)}</span>
    </div>
    <h4 class="task-title">${sanitizeText(task.title)}</h4>
    <p class="task-subtitle">${sanitizeText(task.summary)}</p>
    <div class="task-meta-grid">
      <div class="task-meta-card">
        <span class="task-meta-label">Due date</span>
        <strong>${sanitizeText(dueLabel)}</strong>
      </div>
      <div class="task-meta-card">
        <span class="task-meta-label">Owner</span>
        <div class="task-owner-row">
          <span class="task-owner-avatar">${sanitizeText(ownerInitial)}</span>
          <strong>${sanitizeText(task.assignee)}</strong>
        </div>
      </div>
    </div>
    <div class="task-automation-list">
      <span class="automation-chip">
        <strong>${sanitizeText(taskType)}</strong>
        <small>workflow type</small>
      </span>
      <span class="automation-chip">
        <strong>${sanitizeText(task.team)}</strong>
        <small>assigned team</small>
      </span>
      <span class="automation-chip">
        <strong>${sanitizeText(task.department)}</strong>
        <small>origin department</small>
      </span>
    </div>
  `;

  card.addEventListener("click", () => openTask(task.id));
  card.addEventListener("dragstart", () => {
    dragTaskId = task.id;
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => {
    dragTaskId = "";
    card.classList.remove("dragging");
  });

  return card;
}

function renderTeamChips() {
  const teams = getTeams();
  teamChipRow.innerHTML = teams
    .map((team) => `
      <span class="team-chip">
        ${sanitizeText(team)}
        <button type="button" data-remove-team="${sanitizeText(team)}">x</button>
      </span>
    `)
    .join("");

  teamChipRow.querySelectorAll("[data-remove-team]").forEach((button) => {
    button.addEventListener("click", () => {
      const teamName = button.dataset.removeTeam;
      setTeams(getTeams().filter((team) => team !== teamName));

      const tasks = getTasks().map((task) => ({
        ...task,
        team: task.team === teamName ? "Content Team" : task.team
      }));
      setTasks(tasks);
      rerender();
    });
  });
}

function renderDetailPanel(task) {
  if (!task) {
    detailPanel.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">Request Details</p>
        <h2>Open a card</h2>
        <p>Card details, headings, notes, and ownership controls will appear here.</p>
      </div>
    `;
    return;
  }

  detailPanel.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Selected Card</p>
      <h2>${sanitizeText(task.title)}</h2>
      <p>${sanitizeText(task.summary)}</p>
    </div>
    <div class="task-meta">
      <p>${sanitizeText(task.category)}</p>
      <p>${sanitizeText(task.status)}</p>
      <p>${sanitizeText(task.team)}</p>
    </div>
    <div class="drawer-actions">
      <button class="primary-button" type="button" id="openDrawerButton">Open Full Details</button>
    </div>
  `;

  document.querySelector("#openDrawerButton").addEventListener("click", () => openTask(task.id));
}

function renderBoard() {
  const tasks = getFilteredTasks();
  renderMetrics(tasks);

  WORKFLOW_STATUSES.forEach((status) => {
    const laneNode = document.querySelector(`[data-lane-cards="${status}"]`);
    laneNode.innerHTML = "";

    const laneTasks = tasks.filter((task) => task.status === status);

    laneTasks.forEach((task) => laneNode.appendChild(createTaskCard(task)));

    if (!laneTasks.length) {
      laneNode.innerHTML = '<div class="lane-empty">No cards in this stage right now.</div>';
    }
  });

  document.querySelectorAll(".lane-cards").forEach((laneNode) => {
    laneNode.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    laneNode.addEventListener("drop", () => {
      if (!dragTaskId) {
        return;
      }

      const newStatus = laneNode.dataset.laneCards;
      updateTask(dragTaskId, { status: newStatus });
    });
  });

  if (!tasks.length) {
    detailPanel.innerHTML = `
      <section class="empty-dashboard">
        <p class="eyebrow">No Matching Cards</p>
        <h2>No requests match the current filters.</h2>
        <p>Try clearing one of the filters or submit a new request from the intake form.</p>
      </section>
    `;
  }
}

function requestEntries(payload) {
  return Object.entries(payload || {}).filter(([, value]) => value);
}

function renderRequestDetails(payload) {
  const groupedHeadings = [
    {
      title: "Requester",
      keys: ["employeeName", "department", "category", "socialType", "submittedAt"]
    },
    {
      title: "Social Media",
      keys: [
        "newCreativeEventName",
        "newCreativeEventDate",
        "newCreativeEventTime",
        "newCreativeLocation",
        "newCreativeRegistrationLink",
        "newCreativeDescription",
        "postEventTitle",
        "postEventDate",
        "postEventLocation",
        "postEventPhotoDriveLink",
        "postEventTaggingDetails",
        "externalEventName",
        "externalPartnerOrganisation",
        "externalRegistrationLink",
        "externalEventDate",
        "externalEventLocation",
        "externalCreativeToBePublished",
        "externalTaggingLinks"
      ]
    },
    {
      title: "PR",
      keys: [
        "prEventAnnouncement",
        "prWhoIsInvolved",
        "prWhen",
        "prWhere",
        "prWhySignificant",
        "prKeyHighlights",
        "prNotableSpeakers",
        "prBackgroundContext",
        "prQuotes",
        "prTestimonials",
        "prFollowUpEvents",
        "prMoreInformation",
        "prMediaAssets",
        "prCaptions",
        "prContactPerson"
      ]
    },
    {
      title: "Achievements",
      keys: [
        "achievementStartupName",
        "achievementDescription",
        "achievementPhotos",
        "achievementLogos",
        "achievementTaggingLinks",
        "achievementContactDetails"
      ]
    }
  ];

  requestDetailGrid.innerHTML = groupedHeadings
    .map((group) => {
      const rows = group.keys
        .filter((key) => payload[key])
        .map((key) => {
          const value = payload[key];
          const isUrl = /^https?:\/\//i.test(String(value));
          return `
            <div class="detail-group">
              <strong>${sanitizeText(key)}</strong>
              ${isUrl
                ? `<a href="${sanitizeText(value)}" target="_blank" rel="noopener noreferrer">${sanitizeText(value)}</a>`
                : `<span>${sanitizeText(value)}</span>`
              }
            </div>
          `;
        })
        .join("");

      if (!rows) {
        return "";
      }

      return `
        <section>
          <h4>${sanitizeText(group.title)}</h4>
          <div class="request-detail-grid">${rows}</div>
        </section>
      `;
    })
    .join("");
}

function openTask(taskId) {
  const task = getTasks().find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  activeTaskId = taskId;
  renderDetailPanel(task);

  drawerTaskTitle.textContent = task.title;
  drawerTaskSummary.textContent = task.summary;
  drawerMeta.innerHTML = `
    <p>${sanitizeText(task.category)}</p>
    <p>${sanitizeText(task.department)}</p>
    <p>${sanitizeText(task.requesterName)}</p>
    <p>${sanitizeText(formatDate(task.createdAt))}</p>
  `;

  drawerStatus.value = task.status;
  drawerTeam.value = task.team;
  drawerAssignee.value = task.assignee;
  drawerPriority.value = task.priority;
  drawerNotes.value = task.notes;

  renderRequestDetails(task.payload || {});
  drawerOverlay.classList.add("is-open");
  drawerOverlay.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  drawerOverlay.classList.remove("is-open");
  drawerOverlay.setAttribute("aria-hidden", "true");
}

function updateTask(taskId, updates) {
  const tasks = getTasks().map((task) => (
    task.id === taskId
      ? { ...task, ...updates }
      : task
  ));

  setTasks(tasks);
  rerender();

  if (activeTaskId === taskId) {
    const updatedTask = tasks.find((task) => task.id === taskId);
    renderDetailPanel(updatedTask);
    if (drawerOverlay.classList.contains("is-open")) {
      openTask(taskId);
    }
  }
}

function rerender() {
  populateFilters();
  renderTeamChips();
  renderBoard();

  const activeTask = getTasks().find((task) => task.id === activeTaskId);
  renderDetailPanel(activeTask);
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
    dashboardApp.classList.remove("is-hidden");
    logoutButton.classList.remove("is-hidden");
    rerender();
    return;
  }

  loginStatus.textContent = "Incorrect login. Use the demo credentials shown below the form.";
  loginStatus.classList.add("is-error");
});

logoutButton.addEventListener("click", () => {
  setSession(false);
  closeDrawer();
  dashboardApp.classList.add("is-hidden");
  loginShell.classList.remove("is-hidden");
  logoutButton.classList.add("is-hidden");
});

teamForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const teamName = teamInput.value.trim();

  if (!teamName) {
    return;
  }

  const teams = getTeams();

  if (!teams.includes(teamName)) {
    setTeams(teams.concat(teamName));
    teamInput.value = "";
    rerender();
  }
});

[filters.search, filters.category, filters.department, filters.team].forEach((element) => {
  element.addEventListener("input", renderBoard);
  element.addEventListener("change", renderBoard);
});

drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", (event) => {
  if (event.target === drawerOverlay) {
    closeDrawer();
  }
});

document.querySelector("#saveTaskButton").addEventListener("click", () => {
  if (!activeTaskId) {
    return;
  }

  updateTask(activeTaskId, {
    status: drawerStatus.value,
    team: drawerTeam.value,
    assignee: drawerAssignee.value.trim() || "To be assigned",
    priority: drawerPriority.value,
    notes: drawerNotes.value.trim()
  });
});

document.querySelector("#markOngoingButton").addEventListener("click", () => {
  if (activeTaskId) {
    updateTask(activeTaskId, { status: "Ongoing" });
  }
});

document.querySelector("#markCompletedButton").addEventListener("click", () => {
  if (activeTaskId) {
    updateTask(activeTaskId, { status: "Completed" });
  }
});

ensureSeedData();
populateFilters();

if (hasSession()) {
  loginShell.classList.add("is-hidden");
  dashboardApp.classList.remove("is-hidden");
  logoutButton.classList.remove("is-hidden");
  rerender();
}
