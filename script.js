const APP_CONFIG = {
  submissionEndpoint: "",
  companyName: "Media Box",
  timezone: "Asia/Kolkata"
};

const STORAGE_KEYS = {
  requests: "mediaBoxRequests",
  tasks: "mediaBoxWorkflowTasks",
  teams: "mediaBoxTeams"
};

const form = document.querySelector("#mediaRequestForm");
const summarySection = document.querySelector("#summarySection");
const summaryCard = document.querySelector("#summaryCard");
const printSummaryButtons = Array.from(document.querySelectorAll(".print-summary-button"));
const statusMessages = Array.from(document.querySelectorAll(".status-message"));

const categoryInputs = Array.from(document.querySelectorAll('input[name="category"]'));
const socialTypeInputs = Array.from(document.querySelectorAll('input[name="socialType"]'));
const socialTypeSections = Array.from(document.querySelectorAll("[data-social-branch]"));
const stepPanels = Array.from(document.querySelectorAll("[data-step-panel]"));
const progressSteps = Array.from(document.querySelectorAll("[data-progress-step]"));

let currentStep = "intro";

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

function ensureDefaultTeams() {
  const teams = readJsonStorage(STORAGE_KEYS.teams, []);

  if (teams.length) {
    return;
  }

  writeJsonStorage(STORAGE_KEYS.teams, [
    "Design Team",
    "Content Team",
    "PR Team",
    "Social Media Team",
    "Daily Digest Team"
  ]);
}

function selectedValue(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function setStatus(message, isError = false) {
  statusMessages.forEach((node) => {
    node.textContent = message;
    node.classList.toggle("is-error", isError);
  });
}

function updateChoiceCards() {
  document.querySelectorAll(".choice-card").forEach((card) => {
    const input = card.querySelector("input");
    card.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function clearHiddenSectionFields(section) {
  if (!section) {
    return;
  }

  section.querySelectorAll("input, textarea, select").forEach((field) => {
    if (field.type === "radio" || field.type === "checkbox") {
      field.checked = false;
      return;
    }

    field.value = "";
  });
}

function showStep(stepName) {
  currentStep = stepName;
  stepPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.stepPanel !== stepName);
  });
  updateProgress(stepName);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateProgress(stepName) {
  const order = ["intro", "social-type", "details", "summary"];
  const mappedStep = (
    stepName === "social-details"
    || stepName === "pr"
    || stepName === "achievements"
    || stepName === "details-empty"
  )
    ? "details"
    : stepName;

  const activeIndex = order.indexOf(mappedStep);

  progressSteps.forEach((node) => {
    const nodeIndex = order.indexOf(node.dataset.progressStep);
    node.classList.toggle("is-active", nodeIndex === activeIndex);
    node.classList.toggle("is-complete", nodeIndex < activeIndex);
  });
}

function toggleCategoryBranches() {
  const category = selectedValue("category");

  if (category !== "Social Media") {
    socialTypeInputs.forEach((input) => {
      input.checked = false;
    });
    socialTypeSections.forEach((section) => {
      section.classList.add("hidden");
      clearHiddenSectionFields(section);
    });
  }

  updateChoiceCards();
}

function toggleSocialTypeBranches() {
  const socialType = selectedValue("socialType");

  socialTypeSections.forEach((section) => {
    const isActive = section.dataset.socialBranch === socialType;
    section.classList.toggle("hidden", !isActive);

    if (!isActive) {
      clearHiddenSectionFields(section);
    }
  });

  updateChoiceCards();
}

function goForwardFromIntro() {
  const category = selectedValue("category");

  if (category === "Social Media") {
    showStep("social-type");
    return;
  }

  if (category === "PR") {
    showStep("pr");
    return;
  }

  if (category === "Achievements") {
    showStep("achievements");
    return;
  }

  showStep("details-empty");
}

function goForwardFromSocialType() {
  const socialType = selectedValue("socialType");

  if (!socialType) {
    showStep("details-empty");
    return;
  }

  showStep("social-details");
}

function formatDateValue(value) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    ...(value.includes("T") ? { timeStyle: "short", timeZone: APP_CONFIG.timezone } : {})
  }).format(date);
}

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(value);
}

function sanitizeText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSummarySections(payload) {
  const sections = [
    {
      title: "Requester Information",
      rows: [
        ["Name", payload.employeeName || "Not provided"],
        ["Department", payload.department || "Not provided"],
        ["Category", payload.category || "To be classified"],
        ["Social Media Type", payload.socialType || "Not provided"]
      ]
    }
  ];

  if (payload.category === "Social Media") {
    const socialTitle = payload.socialType || "Social Media Request";
    let rows = [["Social Media Type", payload.socialType || "Not provided"]];

    if (payload.socialType === "New Creative") {
      rows = rows.concat([
        ["Name of event", payload.newCreativeEventName],
        ["Date of event", formatDateValue(payload.newCreativeEventDate)],
        ["Time", payload.newCreativeEventTime || "Not provided"],
        ["Location", payload.newCreativeLocation],
        ["Registration Link", payload.newCreativeRegistrationLink],
        ["Brief description of the event", payload.newCreativeDescription],
        ["Speaker details", payload.newCreativeSpeakerDetails],
        ["Drive link to photographs", payload.newCreativePhotoDriveLink],
        ["LinkedIn Profile", payload.newCreativeLinkedinProfile],
        ["Partner institutions and logos", payload.newCreativePartnerInstitutions],
        ["Tagging links", payload.newCreativeTaggingLinks]
      ]);
    }

    if (payload.socialType === "Post Event") {
      rows = rows.concat([
        ["Title", payload.postEventTitle],
        ["Date", formatDateValue(payload.postEventDate)],
        ["Location", payload.postEventLocation],
        ["Drive link to photos", payload.postEventPhotoDriveLink],
        ["Tagging details", payload.postEventTaggingDetails]
      ]);
    }

    if (payload.socialType === "External or Partner Event") {
      rows = rows.concat([
        ["Name of event", payload.externalEventName],
        ["Partner organisation", payload.externalPartnerOrganisation],
        ["Registration Link", payload.externalRegistrationLink],
        ["Date", formatDateValue(payload.externalEventDate)],
        ["Location", payload.externalEventLocation],
        ["Creative to be published", payload.externalCreativeToBePublished],
        ["Tagging links", payload.externalTaggingLinks]
      ]);
    }

    sections.push({ title: socialTitle, rows });
  }

  if (payload.category === "Achievements") {
    sections.push({
      title: "Achievement Details",
      rows: [
        ["Startups / Startup mission", payload.achievementStartupName],
        ["Brief description", payload.achievementDescription],
        ["Photos if any", payload.achievementPhotos],
        ["Logos to be included", payload.achievementLogos],
        ["Tagging links", payload.achievementTaggingLinks],
        ["Contact details of startup", payload.achievementContactDetails]
      ]
    });
  }

  if (payload.category === "PR") {
    sections.push({
      title: "Press Release Details",
      rows: [
        ["What is the event or announcement?", payload.prEventAnnouncement],
        ["Who is involved?", payload.prWhoIsInvolved],
        ["When will / did the event take place?", formatDateValue(payload.prWhen)],
        ["Where is the event being held?", payload.prWhere],
        ["Why is this event or announcement significant?", payload.prWhySignificant],
        ["Key highlights or major announcements", payload.prKeyHighlights],
        ["Notable speakers or guests", payload.prNotableSpeakers],
        ["Background or context", payload.prBackgroundContext],
        ["Quotes from key individuals", payload.prQuotes],
        ["Testimonials or feedback from attendees", payload.prTestimonials],
        ["Follow-up events or next steps", payload.prFollowUpEvents],
        ["Where can readers find more information?", payload.prMoreInformation],
        ["Media uploads / links", payload.prMediaAssets],
        ["Captions for the visual content", payload.prCaptions],
        ["Contact for review and POC", payload.prContactPerson]
      ]
    });
  }

  if (payload.category === "Daily Digest") {
    sections.push({
      title: "Daily Digest Details",
      rows: [
        ["Request Type", "Daily Digest"],
        ["Status", "Will be grouped with live activity tracking in the workflow planner"]
      ]
    });
  }

  if (!payload.category) {
    sections.push({
      title: "Open Request Notes",
      rows: [
        ["Status", "Submitted without category"],
        ["Next step", "Team can classify this in the workflow desk"]
      ]
    });
  }

  return sections;
}

function buildSummaryMarkup(payload) {
  const sections = getSummarySections(payload);
  const submittedAt = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: APP_CONFIG.timezone
  }).format(new Date(payload.submittedAt));

  const blocks = sections
    .map((section) => {
      const rows = section.rows
        .filter(([, value]) => value && value !== "Not provided")
        .map(([label, value]) => {
          const safeLabel = sanitizeText(label);
          const displayValue = sanitizeText(value);
          const renderedValue = isLikelyUrl(value)
            ? `<a href="${displayValue}" target="_blank" rel="noopener noreferrer">${displayValue}</a>`
            : `<span>${displayValue.replaceAll("\n", "<br>")}</span>`;

          return `
            <div class="summary-row">
              <strong>${safeLabel}</strong>
              ${renderedValue}
            </div>
          `;
        })
        .join("");

      return `
        <section class="summary-block">
          <h4>${sanitizeText(section.title)}</h4>
          <div class="summary-list">${rows || '<p class="summary-note">No extra information added yet.</p>'}</div>
        </section>
      `;
    })
    .join("");

  return `
    <header class="summary-header">
      <div>
        <p class="eyebrow">Questionnaire Response</p>
        <h3>${sanitizeText(APP_CONFIG.companyName)} Submission</h3>
      </div>
      <div class="summary-meta">
        <p><strong>Submitted:</strong> ${sanitizeText(submittedAt)}</p>
        <p><strong>Department:</strong> ${sanitizeText(payload.department || "Not provided")}</p>
      </div>
    </header>
    <div class="summary-grid">${blocks}</div>
  `;
}

function formDataToObject() {
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.submittedAt = new Date().toISOString();
  return payload;
}

function createTaskTitle(payload) {
  if (payload.category === "PR") {
    return payload.prEventAnnouncement || "New PR request";
  }

  if (payload.category === "Achievements") {
    return payload.achievementStartupName || "New achievement request";
  }

  if (payload.category === "Social Media") {
    return (
      payload.newCreativeEventName
      || payload.postEventTitle
      || payload.externalEventName
      || payload.socialType
      || "New social media request"
    );
  }

  if (payload.category === "Daily Digest") {
    return payload.employeeName
      ? `Daily digest request from ${payload.employeeName}`
      : "New daily digest request";
  }

  return payload.employeeName
    ? `Open request from ${payload.employeeName}`
    : "Unclassified media request";
}

function createTaskSummary(payload) {
  return (
    payload.newCreativeDescription
    || payload.achievementDescription
    || payload.prWhySignificant
    || payload.prEventAnnouncement
    || payload.postEventTaggingDetails
    || (payload.category === "Daily Digest" ? "Track this under the daily digest flow." : "")
    || "Awaiting more details"
  );
}

function saveSubmissionLocally(payload) {
  const requests = readJsonStorage(STORAGE_KEYS.requests, []);
  const tasks = readJsonStorage(STORAGE_KEYS.tasks, []);
  const requestId = `REQ-${Date.now()}`;
  const request = { ...payload, id: requestId };

  requests.unshift(request);
  tasks.unshift({
    id: `TASK-${Date.now()}`,
    requestId,
    title: createTaskTitle(payload),
    category: payload.category || "Unclassified",
    socialType: payload.socialType || "",
    department: payload.department || "Unassigned",
    requesterName: payload.employeeName || "Unknown requester",
    status: "Will Do",
    team: payload.category === "PR"
      ? "PR Team"
      : payload.category === "Daily Digest"
        ? "Daily Digest Team"
        : payload.category === "Social Media"
          ? "Social Media Team"
          : "Content Team",
    assignee: "To be assigned",
    priority: payload.category === "PR" ? "High Touch" : "Standard",
    summary: createTaskSummary(payload),
    createdAt: payload.submittedAt,
    dueText: payload.newCreativeEventDate || payload.postEventDate || payload.externalEventDate || payload.prWhen || "",
    notes: "",
    payload: request
  });

  writeJsonStorage(STORAGE_KEYS.requests, requests);
  writeJsonStorage(STORAGE_KEYS.tasks, tasks);
}

async function submitToEndpoint(payload) {
  if (!APP_CONFIG.submissionEndpoint) {
    return { mode: "preview-only" };
  }

  const response = await fetch(APP_CONFIG.submissionEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Submission failed with status ${response.status}.`);
  }

  return response.json().catch(() => ({ mode: "connected" }));
}

categoryInputs.forEach((input) => {
  input.addEventListener("change", () => {
    toggleCategoryBranches();
    if (currentStep !== "intro") {
      showStep("intro");
    }
  });
});

socialTypeInputs.forEach((input) => {
  input.addEventListener("change", toggleSocialTypeBranches);
});

document.querySelector("#introNextButton").addEventListener("click", goForwardFromIntro);
document.querySelector("#socialTypeNextButton").addEventListener("click", goForwardFromSocialType);

document.querySelectorAll("[data-go-step]").forEach((button) => {
  button.addEventListener("click", () => {
    showStep(button.dataset.goStep);
  });
});

printSummaryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.print();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  const payload = formDataToObject();
  saveSubmissionLocally(payload);

  summaryCard.innerHTML = buildSummaryMarkup(payload);
  summarySection.classList.remove("hidden");
  updateProgress("summary");
  printSummaryButtons.forEach((button) => {
    button.disabled = false;
  });

  try {
    const result = await submitToEndpoint(payload);

    if (result?.mode === "preview-only") {
      setStatus("Summary generated and request saved locally to the workflow desk.");
    } else {
      setStatus("Submission sent successfully and mirrored in the workflow desk.");
    }
  } catch (error) {
    setStatus(`${error.message} The summary is still available below and the local workflow card has been created.`, true);
  }

  summarySection.scrollIntoView({ behavior: "smooth", block: "start" });
});

ensureDefaultTeams();
toggleCategoryBranches();
toggleSocialTypeBranches();
updateChoiceCards();
showStep("intro");
