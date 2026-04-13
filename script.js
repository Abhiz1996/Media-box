const APP_CONFIG = {
  submissionEndpoint: "",
  companyName: "Your Company",
  timezone: "Asia/Kolkata"
};

const form = document.querySelector("#mediaRequestForm");
const statusMessage = document.querySelector("#formStatus");
const summarySection = document.querySelector("#summarySection");
const summaryCard = document.querySelector("#summaryCard");
const printSummaryButton = document.querySelector("#printSummaryButton");

const categoryInputs = Array.from(document.querySelectorAll('input[name="category"]'));
const socialTypeInputs = Array.from(document.querySelectorAll('input[name="socialType"]'));
const socialBranchSection = document.querySelector('[data-branch="social"]');
const prSection = document.querySelector('[data-branch="pr"]');
const achievementsSection = document.querySelector('[data-branch="achievements"]');
const socialTypeSections = Array.from(document.querySelectorAll("[data-social-branch]"));

function selectedValue(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#b2462a" : "#0a5d61";
}

function updateChoiceCards() {
  document.querySelectorAll(".choice-card").forEach((card) => {
    const input = card.querySelector("input");
    card.classList.toggle("is-selected", Boolean(input?.checked));
  });
}

function setRequiredByCategory(activeCategory) {
  form.querySelectorAll("[data-category-required]").forEach((field) => {
    field.required = field.dataset.categoryRequired === activeCategory;
  });
}

function setRequiredBySocialType(activeSocialType) {
  form.querySelectorAll("[data-conditional]").forEach((field) => {
    field.required = field.dataset.conditional === activeSocialType;
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

function toggleCategoryBranches() {
  const category = selectedValue("category");
  const isSocial = category === "Social Media";
  const isPr = category === "PR";
  const isAchievements = category === "Achievements";

  socialBranchSection.classList.toggle("hidden", !isSocial);
  prSection.classList.toggle("hidden", !isPr);
  achievementsSection.classList.toggle("hidden", !isAchievements);

  if (!isSocial) {
    socialTypeInputs.forEach((input) => {
      input.checked = false;
    });
    socialTypeSections.forEach((section) => {
      section.classList.add("hidden");
      clearHiddenSectionFields(section);
    });
  }

  if (!isPr) {
    clearHiddenSectionFields(prSection);
  }

  if (!isAchievements) {
    clearHiddenSectionFields(achievementsSection);
  }

  setRequiredByCategory(category);
  setRequiredBySocialType(selectedValue("socialType"));
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

  setRequiredBySocialType(socialType);
  updateChoiceCards();
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
        ["Name", payload.employeeName],
        ["Department", payload.department],
        ["Category", payload.category]
      ]
    }
  ];

  if (payload.category === "Social Media") {
    const socialTitle = payload.socialType || "Social Media Request";
    let rows = [["Social Media Type", payload.socialType]];

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
        ["LinkedIn Profile", payload.newCreativeLinkedinProfile || "Not provided"],
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
          <div class="summary-list">${rows}</div>
        </section>
      `;
    })
    .join("");

  return `
    <header class="summary-header">
      <div>
        <p class="eyebrow">Questionnaire Response</p>
        <h3>${sanitizeText(APP_CONFIG.companyName)} Media Box Submission</h3>
      </div>
      <div class="summary-meta">
        <p><strong>Submitted:</strong> ${sanitizeText(submittedAt)}</p>
        <p><strong>Department:</strong> ${sanitizeText(payload.department)}</p>
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

function validateBusinessRules(payload) {
  if (payload.category === "Social Media" && !payload.socialType) {
    return "Please choose the social media request type.";
  }

  if (payload.socialType === "New Creative" && payload.newCreativeEventDate) {
    const eventDate = new Date(payload.newCreativeEventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const differenceInDays = Math.ceil((eventDate.getTime() - today.getTime()) / 86400000);

    if (differenceInDays < 5) {
      return "New Creative requests should ideally be submitted at least 5 days before the event date.";
    }
  }

  return "";
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
  input.addEventListener("change", toggleCategoryBranches);
});

socialTypeInputs.forEach((input) => {
  input.addEventListener("change", toggleSocialTypeBranches);
});

printSummaryButton.addEventListener("click", () => {
  window.print();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  const payload = formDataToObject();
  const businessRuleError = validateBusinessRules(payload);

  if (!form.reportValidity()) {
    setStatus("Please complete the required fields before submitting.", true);
    return;
  }

  if (businessRuleError) {
    setStatus(businessRuleError, true);
    return;
  }

  summaryCard.innerHTML = buildSummaryMarkup(payload);
  summarySection.classList.remove("hidden");
  printSummaryButton.disabled = false;

  try {
    const result = await submitToEndpoint(payload);

    if (result?.mode === "preview-only") {
      setStatus("Summary generated. Connect a Google Apps Script URL in script.js to send responses to Sheets and PDF automation.");
    } else {
      setStatus("Submission sent successfully. The summary is ready and the backend can now store it in Sheets / PDF.");
    }
  } catch (error) {
    setStatus(`${error.message} The summary is still available below for printing or saving as PDF.`, true);
  }

  summarySection.scrollIntoView({ behavior: "smooth", block: "start" });
});

toggleCategoryBranches();
toggleSocialTypeBranches();
updateChoiceCards();
