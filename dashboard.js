const STORAGE_KEYS = {
  tasks: "mediaBoxWorkflowTasks",
  teams: "mediaBoxTeams",
  session: "mediaBoxDashboardSession"
};

const WORKFLOW_STATUSES = ["Will Do", "Ongoing", "Completed"];

const TAB_CONFIG = {
  social: {
    label: "Social Media Creative",
    heading: "Social media and creative requests",
    description: "Track the event promotions, post-event creatives, and partner-event requests submitted through the intake form.",
    categories: ["Social Media"]
  },
  pr: {
    label: "PR",
    heading: "Press release requests",
    description: "Review announcements, background notes, and media support requests for the PR team.",
    categories: ["PR"]
  },
  achievements: {
    label: "Achievements",
    heading: "Achievement highlights",
    description: "Follow startup wins, mission milestones, and achievement stories that need communication support.",
    categories: ["Achievements"]
  },
  "daily-digest": {
    label: "Daily Digest",
    heading: "Daily digest overview",
    description: "See the live activity count and any requests filed directly under the daily digest category.",
    categories: ["Daily Digest"]
  }
};

const FIELD_LABELS = {
  employeeName: "Name",
  department: "Department",
  category: "Category",
  socialType: "Social Media Type",
  submittedAt: "Submitted At",
  newCreativeEventName: "Event Name",
  newCreativeEventDate: "Event Date",
  newCreativeEventTime: "Event Time",
  newCreativeLocation: "Location",
  newCreativeRegistrationLink: "Registration Link",
  newCreativeDescription: "Event Description",
  newCreativeSpeakerDetails: "Speaker Details",
  newCreativePhotoDriveLink: "Photo Drive Link",
  newCreativeLinkedinProfile: "LinkedIn Profile",
  newCreativePartnerInstitutions: "Partner Institutions and Logos",
  newCreativeTaggingLinks: "Tagging Links",
  postEventTitle: "Post Event Title",
  postEventDate: "Post Event Date",
  postEventLocation: "Post Event Location",
  postEventPhotoDriveLink: "Post Event Photo Drive Link",
  postEventTaggingDetails: "Post Event Tagging Details",
  externalEventName: "External Event Name",
  externalPartnerOrganisation: "Partner Organisation",
  externalRegistrationLink: "Registration Link",
  externalEventDate: "Event Date",
  externalEventLocation: "Event Location",
  externalCreativeToBePublished: "Creative to be Published",
  externalTaggingLinks: "External Tagging Links",
  achievementStartupName: "Startup or Mission",
  achievementDescription: "Achievement Description",
  achievementPhotos: "Photos",
  achievementLogos: "Logos",
  achievementTaggingLinks: "Tagging Links",
  achievementContactDetails: "Contact Details",
  prEventAnnouncement: "Event or Announcement",
  prWhoIsInvolved: "Who Is Involved",
  prWhen: "When",
  prWhere: "Where",
  prWhySignificant: "Why Significant",
  prKeyHighlights: "Key Highlights",
  prNotableSpeakers: "Notable Speakers",
  prBackgroundContext: "Background Context",
  prQuotes: "Quotes",
  prTestimonials: "Testimonials",
  prFollowUpEvents: "Follow-up Events",
  prMoreInformation: "More Information",
  prMediaAssets: "Media Assets",
  prCaptions: "Captions",
  prContactPerson: "Contact Person"
};

const loginShell = document.querySelector("#loginShell");
const dashboardApp = document.querySelector("#dashboardApp");
const loginForm = document.querySelector("#loginForm");
const loginStatus = document.querySelector("#loginStatus");
const logoutButton = document.querySelector("#logoutButton");
const metricsGrid = document.querySelector("#metricsGrid");
const plannerTabs = Array.from(document.querySelectorAll("[data-planner-tab]"));
const plannerEyebrow = document.querySelector("#plannerEyebrow");
const plannerHeading = document.querySelector("#plannerHeading");
const plannerCopy = document.querySelector("#plannerCopy");
const plannerVisibleCount = document.querySelector("#plannerVisibleCount");
const activeRequestTabs = document.querySelector("#activeRequestTabs");
const digestBoard = document.querySelector("#digestBoard");
const plannerList = document.querySelector("#plannerList");
const plannerDetail = document.querySelector("#plannerDetail");
const archiveGroups = document.querySelector("#archiveGroups");

const filters = {
  search: document.querySelector("#searchInput"),
  department: document.querySelector("#departmentFilter"),
  status: document.querySelector("#statusFilter")
};

let activeTab = "social";
let selectedTaskId = "";
const urlState = new URL(window.location.href);
const initialTaskId = urlState.searchParams.get("task") || "";
const initialTab = urlState.searchParams.get("tab") || "";

if (TAB_CONFIG[initialTab]) {
  activeTab = initialTab;
}

if (initialTaskId) {
  selectedTaskId = initialTaskId;
}

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

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(String(value));
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

function ensureSeedData() {
  const teams = getTeams();
  const tasks = getTasks();

  if (!teams.length) {
    setTeams([
      "Design Team",
      "Content Team",
      "PR Team",
      "Social Media Team",
      "Daily Digest Team"
    ]);
  }

  if (!tasks.length) {
    const timestamp = new Date().toISOString();
    setTasks([
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
        completedAt: timestamp,
        payload: {
          employeeName: "Riya",
          department: "Incubation",
          category: "Achievements",
          achievementStartupName: "SeedSpark Labs",
          achievementDescription: "Won a national innovation award.",
          submittedAt: timestamp
        }
      },
      {
        id: "TASK-DEMO-4",
        requestId: "REQ-DEMO-4",
        title: "Daily ecosystem digest",
        category: "Daily Digest",
        socialType: "",
        department: "Corporate Relations",
        requesterName: "Anu",
        status: "Ongoing",
        team: "Daily Digest Team",
        assignee: "To be assigned",
        priority: "Standard",
        summary: "Capture live activities across the day and prepare a digest summary.",
        createdAt: timestamp,
        dueText: "",
        notes: "",
        payload: {
          employeeName: "Anu",
          department: "Corporate Relations",
          category: "Daily Digest",
          submittedAt: timestamp
        }
      }
    ]);
  }
}

function populateDepartmentFilter() {
  const currentValue = filters.department.value;
  const departments = Array.from(new Set(getTasks().map((task) => task.department).filter(Boolean))).sort();

  filters.department.innerHTML = '<option value="">All departments</option>'
    + departments.map((department) => `<option>${sanitizeText(department)}</option>`).join("");

  filters.department.value = departments.includes(currentValue) ? currentValue : "";
}

function getTabTasks(tabId) {
  const tab = TAB_CONFIG[tabId];
  return getTasks().filter((task) => tab.categories.includes(task.category));
}

function getVisibleTasks() {
  const tasks = getTabTasks(activeTab);
  const searchTerm = filters.search.value.trim().toLowerCase();

  return tasks.filter((task) => {
    if (task.status === "Completed") {
      return false;
    }

    const matchesSearch = !searchTerm || [
      task.title,
      task.requesterName,
      task.summary,
      task.department,
      task.socialType
    ].some((value) => String(value || "").toLowerCase().includes(searchTerm));

    const matchesDepartment = !filters.department.value || task.department === filters.department.value;
    const matchesStatus = !filters.status.value || task.status === filters.status.value;

    return matchesSearch && matchesDepartment && matchesStatus;
  });
}

function getLiveActivities() {
  return getTasks().filter((task) => task.status !== "Completed");
}

function getActiveTasksForCurrentTab() {
  return getTabTasks(activeTab).filter((task) => task.status !== "Completed");
}

function openWorkflowTab(taskId) {
  const targetUrl = new URL(window.location.href);
  targetUrl.searchParams.set("tab", activeTab);
  targetUrl.searchParams.set("task", taskId);
  window.open(targetUrl.toString(), "_blank", "noopener,noreferrer");
}

function syncUrlState() {
  const nextUrl = new URL(window.location.href);

  if (selectedTaskId) {
    nextUrl.searchParams.set("tab", activeTab);
    nextUrl.searchParams.set("task", selectedTaskId);
  } else {
    nextUrl.searchParams.delete("task");
    nextUrl.searchParams.set("tab", activeTab);
  }

  window.history.replaceState({}, "", nextUrl.toString());
}

function renderTabs() {
  const socialCount = getTabTasks("social").length;
  const prCount = getTabTasks("pr").length;
  const achievementCount = getTabTasks("achievements").length;
  const dailyDigestCount = getLiveActivities().length;

  document.querySelector("#tabCountSocial").textContent = socialCount;
  document.querySelector("#tabCountPr").textContent = prCount;
  document.querySelector("#tabCountAchievements").textContent = achievementCount;
  document.querySelector("#tabCountDailyDigest").textContent = dailyDigestCount;

  plannerTabs.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.plannerTab === activeTab);
  });
}

function renderActiveRequestTabs() {
  const activeTasks = getActiveTasksForCurrentTab();
  activeRequestTabs.innerHTML = "";

  if (!activeTasks.length) {
    activeRequestTabs.innerHTML = `
      <div class="planner-empty active-requests-empty">
        <p>No open requests in this category right now.</p>
      </div>
    `;
    return;
  }

  activeTasks.forEach((task) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "active-request-tab";
    button.innerHTML = `
      <span>${sanitizeText(task.title)}</span>
      <small>${sanitizeText(task.status)} · ${sanitizeText(task.team)}</small>
    `;
    button.addEventListener("click", () => openWorkflowTab(task.id));
    activeRequestTabs.appendChild(button);
  });
}

function renderMetrics() {
  const tasks = getTasks();
  const visibleTasks = getVisibleTasks();
  const liveActivities = getLiveActivities();
  const ongoingCount = tasks.filter((task) => task.status === "Ongoing").length;
  const completedCount = tasks.filter((task) => task.status === "Completed").length;

  metricsGrid.innerHTML = `
    <article class="metric-card">
      <p class="metric-label">Active Tab</p>
      <strong>${visibleTasks.length}</strong>
      <span>Requests visible in the current planner view</span>
    </article>
    <article class="metric-card">
      <p class="metric-label">Live Activities</p>
      <strong>${liveActivities.length}</strong>
      <span>Items that are still open across all categories</span>
    </article>
    <article class="metric-card">
      <p class="metric-label">Ongoing</p>
      <strong>${ongoingCount}</strong>
      <span>Requests actively being worked on right now</span>
    </article>
    <article class="metric-card">
      <p class="metric-label">Completed</p>
      <strong>${completedCount}</strong>
      <span>Requests already wrapped and recorded</span>
    </article>
  `;
}

function ensureSelectedTask(tasks) {
  if (!tasks.length) {
    selectedTaskId = "";
    return null;
  }

  const matchingTask = tasks.find((task) => task.id === selectedTaskId);

  if (matchingTask) {
    return matchingTask;
  }

  selectedTaskId = tasks[0].id;
  return tasks[0];
}

function buildPlannerCard(task) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "planner-card";
  card.dataset.taskId = task.id;
  card.classList.toggle("is-active", task.id === selectedTaskId);

  card.innerHTML = `
    <div class="planner-card-top">
      <span class="planner-status-chip">${sanitizeText(task.status)}</span>
      <span class="planner-card-date">${sanitizeText(formatDate(task.createdAt))}</span>
    </div>
    <h4>${sanitizeText(task.title)}</h4>
    <p>${sanitizeText(task.summary)}</p>
    <div class="planner-card-meta">
      <span>${sanitizeText(task.requesterName)}</span>
      <span>${sanitizeText(task.department)}</span>
      <span>${sanitizeText(task.socialType || task.category)}</span>
    </div>
  `;

  card.addEventListener("click", () => {
    selectedTaskId = task.id;
    renderPlanner();
  });

  card.addEventListener("dblclick", () => {
    openWorkflowTab(task.id);
  });

  return card;
}

function renderDigestBoard() {
  if (activeTab !== "daily-digest") {
    digestBoard.classList.add("hidden");
    digestBoard.innerHTML = "";
    return;
  }

  const tasks = getTasks();
  const liveActivities = getLiveActivities();
  const byCategory = {
    social: tasks.filter((task) => task.category === "Social Media" && task.status !== "Completed").length,
    pr: tasks.filter((task) => task.category === "PR" && task.status !== "Completed").length,
    achievements: tasks.filter((task) => task.category === "Achievements" && task.status !== "Completed").length
  };

  digestBoard.classList.remove("hidden");
  digestBoard.innerHTML = `
    <article class="digest-card digest-card-primary">
      <p class="metric-label">Live Activities</p>
      <strong>${liveActivities.length}</strong>
      <span>All open work currently moving through the workflow.</span>
    </article>
    <article class="digest-card">
      <p class="metric-label">Social Media</p>
      <strong>${byCategory.social}</strong>
      <span>Open social and creative requests</span>
    </article>
    <article class="digest-card">
      <p class="metric-label">PR</p>
      <strong>${byCategory.pr}</strong>
      <span>Open press and note preparation items</span>
    </article>
    <article class="digest-card">
      <p class="metric-label">Achievements</p>
      <strong>${byCategory.achievements}</strong>
      <span>Open milestone and recognition updates</span>
    </article>
  `;
}

function renderPlannerList(tasks) {
  const activeConfig = TAB_CONFIG[activeTab];

  plannerEyebrow.textContent = activeConfig.label;
  plannerHeading.textContent = activeConfig.heading;
  plannerCopy.textContent = activeConfig.description;
  plannerVisibleCount.textContent = `${tasks.length} item${tasks.length === 1 ? "" : "s"}`;

  renderDigestBoard();
  renderActiveRequestTabs();

  plannerList.innerHTML = "";

  if (!tasks.length) {
    plannerList.innerHTML = `
      <section class="planner-empty">
        <p class="eyebrow">No Matching Requests</p>
        <h3>Nothing is showing in this planner view right now.</h3>
        <p>Try another tab or clear a filter to see more requests from the intake form.</p>
      </section>
    `;
    return;
  }

  tasks.forEach((task) => plannerList.appendChild(buildPlannerCard(task)));
}

function buildCompactBrief(task) {
  const payload = task.payload || {};
  const briefItems = [
    ["Requester", task.requesterName],
    ["Department", task.department],
    ["Category", task.category],
    ["Type", task.socialType || task.category],
    ["Submitted", formatDate(task.createdAt)],
    ["Due", task.dueText ? formatDate(task.dueText) : "Not provided"]
  ];

  const importantNote = (
    payload.newCreativeDescription
    || payload.prEventAnnouncement
    || payload.prWhySignificant
    || payload.achievementDescription
    || payload.postEventTaggingDetails
    || "No extra note was added in the form."
  );

  return `
    <section class="detail-section">
      <h4>Request Brief</h4>
      <div class="detail-brief-grid">
        ${briefItems.map(([label, value]) => `
          <div class="detail-brief-card">
            <strong>${sanitizeText(label)}</strong>
            <span>${sanitizeText(value)}</span>
          </div>
        `).join("")}
      </div>
      <div class="detail-note-card">
        <strong>Brief note</strong>
        <p>${sanitizeText(importantNote)}</p>
      </div>
    </section>
  `;
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
  renderPlanner();
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

function renderArchive() {
  const archive = getRecentArchiveGroups();
  archiveGroups.innerHTML = "";

  if (!archive.length) {
    archiveGroups.innerHTML = `
      <section class="planner-empty">
        <p class="eyebrow">No Archived Items Yet</p>
        <h3>Completed requests will appear here once the team marks them done.</h3>
        <p>The archive keeps a compact monthly record for the latest two months only.</p>
      </section>
    `;
    return;
  }

  archive.forEach(([monthLabel, tasks]) => {
    const group = document.createElement("section");
    group.className = "archive-group";
    group.innerHTML = `
      <div class="archive-group-header">
        <h3>${sanitizeText(monthLabel)}</h3>
        <span>${tasks.length} item${tasks.length === 1 ? "" : "s"}</span>
      </div>
      <div class="archive-list">
        ${tasks.map((task) => `
          <article class="archive-card">
            <strong>${sanitizeText(task.title)}</strong>
            <p>${sanitizeText(task.category)} · ${sanitizeText(task.requesterName)} · ${sanitizeText(task.department)}</p>
            <span>${sanitizeText(formatDate(task.completedAt))}</span>
          </article>
        `).join("")}
      </div>
    `;
    archiveGroups.appendChild(group);
  });
}

function renderPlannerDetail(task) {
  if (!task) {
    plannerDetail.innerHTML = `
      <section class="planner-empty">
        <p class="eyebrow">Select A Request</p>
        <h3>Open any request from the planner list.</h3>
        <p>The detail view will show the exact form information that was submitted, along with simple workflow controls.</p>
      </section>
    `;
    return;
  }

  const teamOptions = getTeams()
    .map((team) => `<option value="${sanitizeText(team)}"${task.team === team ? " selected" : ""}>${sanitizeText(team)}</option>`)
    .join("");

  plannerDetail.innerHTML = `
    <div class="planner-detail-hero">
      <p class="eyebrow">Selected Request</p>
      <h3>${sanitizeText(task.title)}</h3>
      <p class="planner-copy">${sanitizeText(task.summary)}</p>
      <div class="planner-detail-meta">
        <span>${sanitizeText(task.requesterName)}</span>
        <span>${sanitizeText(task.department)}</span>
        <span>${sanitizeText(task.socialType || task.category)}</span>
        <span>${sanitizeText(formatDate(task.createdAt))}</span>
      </div>
    </div>

    <section class="detail-section">
      <h4>Workflow Controls</h4>
      <p class="detail-helper">
        Active items can be updated while they are in <strong>Will Do</strong> or <strong>Ongoing</strong>.
        Once you set the status to <strong>Completed</strong>, the request is closed from the active planner and moved to the monthly repository below.
      </p>
      <div class="detail-control-grid">
        <label class="field">
          <span>Status</span>
          <select id="detailStatus">
            ${WORKFLOW_STATUSES.map((status) => `<option${task.status === status ? " selected" : ""}>${status}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>Assigned Team</span>
          <select id="detailTeam">
            ${teamOptions}
          </select>
        </label>
        <label class="field">
          <span>Assignee</span>
          <input type="text" id="detailAssignee" value="${sanitizeText(task.assignee)}" placeholder="Add a person name later">
        </label>
        <label class="field full-width">
          <span>Notes</span>
          <textarea id="detailNotes" rows="4" placeholder="Add production notes, follow-up details, or handoff context">${sanitizeText(task.notes || "")}</textarea>
        </label>
      </div>

      <div class="planner-actions">
        <button class="primary-button" type="button" id="saveTaskButton">Save Workflow Notes</button>
      </div>
    </section>

    ${buildCompactBrief(task)}
  `;

  document.querySelector("#saveTaskButton").addEventListener("click", () => {
    updateTask(task.id, {
      status: document.querySelector("#detailStatus").value,
      team: document.querySelector("#detailTeam").value,
      assignee: document.querySelector("#detailAssignee").value.trim() || "To be assigned",
      notes: document.querySelector("#detailNotes").value.trim()
    });
  });
}

function renderPlanner() {
  populateDepartmentFilter();
  renderTabs();
  renderMetrics();

  const visibleTasks = getVisibleTasks();
  const activeTask = ensureSelectedTask(visibleTasks);
  syncUrlState();

  renderPlannerList(visibleTasks);
  renderPlannerDetail(activeTask);
  renderArchive();
}

plannerTabs.forEach((button) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.plannerTab;
    selectedTaskId = "";
    renderPlanner();
  });
});

[filters.search, filters.department, filters.status].forEach((element) => {
  element.addEventListener("input", renderPlanner);
  element.addEventListener("change", renderPlanner);
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
    renderPlanner();
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

ensureSeedData();

if (hasSession()) {
  loginShell.classList.add("is-hidden");
  dashboardApp.classList.remove("is-hidden");
  logoutButton.classList.remove("is-hidden");
  renderPlanner();
}
