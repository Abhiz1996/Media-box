const introScreen = document.querySelector("#introScreen");
const invitation = document.querySelector("#invitation");
const openInvite = document.querySelector("#openInvite");
const flowerRain = document.querySelector(".flower-rain");

const ceremonyStart = new Date("2026-05-25T11:56:00+05:30");
const ceremonyEnd = new Date("2026-05-25T12:46:00+05:30");
const receptionStart = new Date("2026-05-28T17:30:00+05:30");
const receptionEnd = new Date("2026-05-28T21:30:00+05:30");

const events = {
  ceremony: {
    title: "Wedding Ceremony - Ananthu & Anagha",
    description: "Join us for the wedding ceremony of Ananthu and Anagha. Muhurtham: 11:56 am - 12:46 pm",
    location: "Qatar Auditorium, Thirunavaya, Malappuram",
    start: ceremonyStart,
    end: ceremonyEnd,
    file: "wedding-ceremony.ics"
  },
  reception: {
    title: "Bride Groom Reception - Ananthu & Anagha",
    description: "Join us for the bride groom reception of Ananthu and Anagha.",
    location: "Comet Hall, Al-Saj, Kazhakkoottam, Thiruvananthapuram",
    start: receptionStart,
    end: receptionEnd,
    file: "wedding-reception.ics"
  }
};

function createFlowers() {
  for (let index = 0; index < 14; index += 1) {
    const flower = document.createElement("span");
    flower.className = index % 3 === 0 ? "falling-flower golden-flower" : "falling-flower jasmine-flower";
    flower.style.left = `${(index + 1) * 7}%`;
    flower.style.animationDuration = `${12 + index * 1.2}s`;
    flower.style.animationDelay = `${index * -1.4}s`;
    flower.style.setProperty("--flower-scale", `${0.78 + (index % 4) * 0.1}`);
    flowerRain.appendChild(flower);
  }
}

function revealInvitation() {
  introScreen.classList.add("is-open");
  invitation.classList.add("is-visible");
  invitation.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    introScreen.setAttribute("hidden", "");
  }, 650);
}

function formatDateForCalendar(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeCalendarText(text) {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function makeCalendar(eventData) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invitation//EN",
    "BEGIN:VEVENT",
    `DTSTART:${formatDateForCalendar(eventData.start)}`,
    `DTEND:${formatDateForCalendar(eventData.end)}`,
    `SUMMARY:${escapeCalendarText(eventData.title)}`,
    `DESCRIPTION:${escapeCalendarText(eventData.description)}`,
    `LOCATION:${escapeCalendarText(eventData.location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

function downloadCalendar(eventName) {
  const eventData = events[eventName];
  const calendar = makeCalendar(eventData);
  const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = eventData.file;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openLocation(query) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function updateCountdown() {
  const now = new Date();
  const remaining = Math.max(ceremonyStart.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  document.querySelector("#days").textContent = days;
  document.querySelector("#hours").textContent = hours;
  document.querySelector("#minutes").textContent = minutes;
  document.querySelector("#seconds").textContent = seconds;
}

openInvite.addEventListener("click", revealInvitation);

document.querySelectorAll("[data-calendar]").forEach((button) => {
  button.addEventListener("click", () => downloadCalendar(button.dataset.calendar));
});

document.querySelectorAll("[data-location]").forEach((button) => {
  button.addEventListener("click", () => openLocation(button.dataset.location));
});

createFlowers();
updateCountdown();
window.setInterval(updateCountdown, 1000);
