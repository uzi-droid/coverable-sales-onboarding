const STORAGE_KEY = "coverable-sales-command-v1";

const bootcampDays = [
  {
    id: "day1",
    title: "Day 1: Product and Sales Foundation",
    focus: "Explain Coverable simply, map law firm pain, and speak with control.",
    activities: [
      "10-second, 20-second, and attorney-friendly product explanation",
      "Pain-point mapping for immigration firms",
      "Sales control, confidence, questions, and next steps",
      "Product quiz and roleplay"
    ],
    script:
      "Coverable helps immigration firms prepare legal documents and case materials faster with AI, so attorneys and paralegals spend less time on repetitive work.",
    checkpoints: ["Product explanation", "Five pain points", "ROI in labor hours", "Attorney review framing"]
  },
  {
    id: "day2",
    title: "Day 2: Gatekeeper and Appointment Setting",
    focus: "Get through the front desk, create curiosity, and book demos.",
    activities: [
      "Gatekeeper psychology",
      "Transfer scripts and rebuttal drills",
      "Attorney cold-call opener",
      "Demo booking and confirmation email"
    ],
    script:
      "Hi, this is [Name] with Coverable. I am reaching out regarding legal document preparation and immigration case workflow for the firm. Who would be the best attorney to speak with about that?",
    checkpoints: ["Gatekeeper opener", "What is this regarding", "Send information", "Calendar confirmation"]
  },
  {
    id: "day3",
    title: "Day 3: Discovery, ROI, and Closing",
    focus: "Run a sales call, uncover pain, handle objections, and ask for next step.",
    activities: [
      "Full closing call framework",
      "Discovery and pain questions",
      "ROI framing with labor savings",
      "Trial closes, direct closes, pilot closes"
    ],
    script:
      "The ROI is simple. If your paralegal spends 8 hours preparing a case packet and Coverable saves even 3 hours across 20 cases per month, that is 60 staff hours saved monthly.",
    checkpoints: ["Agenda", "Six discovery questions", "Two objections", "Final ask"]
  },
  {
    id: "day4",
    title: "Day 4: Live Calling and Objection Gauntlet",
    focus: "Practice under pressure, review calls, and tighten weak spots.",
    activities: [
      "Live dialing blocks",
      "Gatekeeper and attorney scenarios",
      "Objection gauntlet",
      "Call review with manager notes"
    ],
    script:
      "Busy firms are usually where this makes the most sense. Would tomorrow morning or afternoon be better for a short walkthrough?",
    checkpoints: ["First 5 seconds", "Objection handling", "Next step ask", "CRM notes"]
  },
  {
    id: "day5",
    title: "Day 5: Certification and Clearance",
    focus: "Prove readiness for independent live prospecting.",
    activities: [
      "Live calling expectations",
      "Gatekeeper certification",
      "Appointment-setting certification",
      "Closing-call certification and improvement plan"
    ],
    script:
      "Do you want to move forward and test this with your team?",
    checkpoints: ["80% quizzes", "Three roleplays", "Scorecards passed", "Confidence and control"]
  }
];

const objectionBank = [
  {
    objection: "Send me information.",
    response:
      "I can, but most of the value depends on your workflow. A generic PDF will not show whether this saves your team time. Let's do a quick 10-15 minute walkthrough, then I will send details that match your firm."
  },
  {
    objection: "We already have software.",
    response:
      "Most firms already have case management software. Coverable is different because it focuses on reducing repetitive drafting, document preparation, briefs, motions, and case materials."
  },
  {
    objection: "I do not trust AI for legal work.",
    response:
      "That is fair. Coverable is not meant to replace attorney judgment. The attorney still reviews and controls the final work. The value is reducing repetitive preparation before final review."
  },
  {
    objection: "We have paralegals for that.",
    response:
      "Exactly. Coverable is designed to make those paralegals more productive, so they can get through repetitive prep faster and focus on higher-value work."
  }
];

const initialState = {
  activeUserId: "admin",
  activeView: "dashboard",
  activeDay: "day1",
  users: [
    { id: "admin", name: "Admin", role: "admin", initials: "AD", certified: true },
    { id: "maya", name: "Maya Rivera", role: "rep", initials: "MR", certified: false },
    { id: "eli", name: "Eli Cohen", role: "rep", initials: "EC", certified: false },
    { id: "sofia", name: "Sofia Patel", role: "rep", initials: "SP", certified: true }
  ],
  progress: {
    maya: { day1: 100, day2: 72, day3: 35, day4: 0, day5: 0 },
    eli: { day1: 100, day2: 100, day3: 82, day4: 45, day5: 0 },
    sofia: { day1: 100, day2: 100, day3: 100, day4: 90, day5: 85 }
  },
  crm: [
    {
      id: "c1",
      repId: "sofia",
      firm: "Bright Path Immigration",
      contact: "Atty. Kim",
      outcome: "Closed",
      channel: "Phone",
      notes: "Pilot approved after ROI discussion. Wants team setup next week.",
      createdAt: "2026-05-20"
    },
    {
      id: "c2",
      repId: "eli",
      firm: "North Star Law",
      contact: "Office Manager",
      outcome: "Demo Booked",
      channel: "Phone",
      notes: "Gatekeeper transferred after workflow question. Demo Friday.",
      createdAt: "2026-05-21"
    },
    {
      id: "c3",
      repId: "maya",
      firm: "Apex Immigration Group",
      contact: "Atty. Santos",
      outcome: "Follow-up",
      channel: "LinkedIn",
      notes: "Interested in motion drafting. Asked for next month follow-up.",
      createdAt: "2026-05-21"
    }
  ],
  practice: {
    maya: {
      product: true,
      pains: true,
      roi: false,
      gatekeeper: false,
      appointment: false,
      closing: false,
      followup: false,
      metrics: true
    },
    eli: {
      product: true,
      pains: true,
      roi: true,
      gatekeeper: true,
      appointment: true,
      closing: false,
      followup: true,
      metrics: true
    },
    sofia: {
      product: true,
      pains: true,
      roi: true,
      gatekeeper: true,
      appointment: true,
      closing: true,
      followup: true,
      metrics: true
    }
  }
};

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(initialState);
  try {
    return { ...structuredClone(initialState), ...JSON.parse(saved) };
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentUser() {
  return state.users.find((user) => user.id === state.activeUserId) || state.users[0];
}

function reps() {
  return state.users.filter((user) => user.role === "rep");
}

function crmForRep(repId) {
  return state.crm.filter((entry) => entry.repId === repId);
}

function repStats(repId) {
  const entries = crmForRep(repId);
  const progressValues = Object.values(state.progress[repId] || {});
  const onboarding = Math.round(progressValues.reduce((sum, value) => sum + value, 0) / bootcampDays.length);
  const calls = entries.length;
  const demos = entries.filter((entry) => entry.outcome === "Demo Booked").length;
  const closed = entries.filter((entry) => entry.outcome === "Closed").length;
  const followUps = entries.filter((entry) => entry.outcome === "Follow-up").length;
  const score = calls * 5 + demos * 20 + closed * 70 + followUps * 8 + onboarding;
  return { calls, demos, closed, followUps, onboarding, score };
}

function allStats() {
  return reps()
    .map((rep) => ({ ...rep, ...repStats(rep.id) }))
    .sort((a, b) => b.score - a.score);
}

function setView(view) {
  state.activeView = view;
  saveState();
  render();
}

function setUser(userId) {
  state.activeUserId = userId;
  if (currentUser().role !== "admin" && state.activeView === "admin") {
    state.activeView = "dashboard";
  }
  saveState();
  render();
}

function updateProgress(dayId, value) {
  const user = currentUser();
  if (user.role === "admin") return toast("Switch into a rep account to mark training progress.");
  state.progress[user.id][dayId] = Number(value);
  saveState();
  render();
}

function togglePractice(key) {
  const user = currentUser();
  if (user.role === "admin") return toast("Admins monitor readiness. Reps complete certification items.");
  state.practice[user.id][key] = !state.practice[user.id][key];
  saveState();
  render();
}

function addCrmEntry(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const user = currentUser();
  const repId = user.role === "admin" ? form.get("repId") : user.id;
  state.crm.unshift({
    id: crypto.randomUUID(),
    repId,
    firm: form.get("firm").trim(),
    contact: form.get("contact").trim(),
    outcome: form.get("outcome"),
    channel: form.get("channel"),
    notes: form.get("notes").trim(),
    createdAt: new Date().toISOString().slice(0, 10)
  });
  saveState();
  event.currentTarget.reset();
  toast("CRM activity logged.");
  render();
}

function resetDemoData() {
  state = structuredClone(initialState);
  saveState();
  render();
  toast("Demo data reset.");
}

function render() {
  document.getElementById("app").innerHTML = `
    <div class="shell">
      ${renderSidebar()}
      <main class="main">
        ${renderMain()}
      </main>
    </div>
  `;
  bindEvents();
}

function renderSidebar() {
  const user = currentUser();
  const navItems = [
    ["dashboard", "Dashboard"],
    ["training", "Bootcamp"],
    ["crm", "CRM"],
    ["competition", "Competition"],
    ["coach", "Coach"],
    ...(user.role === "admin" ? [["admin", "Admin"]] : [])
  ];
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="mark">C</div>
        <div>
          <h1>Coverable Command</h1>
          <span>Sales onboarding cockpit</span>
        </div>
      </div>
      <div class="account-switcher">
        <label for="account">Account</label>
        <select id="account">
          ${state.users
            .map((item) => `<option value="${item.id}" ${item.id === user.id ? "selected" : ""}>${item.name} (${item.role})</option>`)
            .join("")}
        </select>
      </div>
      <nav class="nav">
        ${navItems
          .map(([id, label]) => `<button data-view="${id}" class="${state.activeView === id ? "active" : ""}">${label}<span>${navHint(id)}</span></button>`)
          .join("")}
      </nav>
      <div class="sidebar-note">
        Core motion: get through the gatekeeper, book the appointment, close the sale, and log every useful signal.
      </div>
    </aside>
  `;
}

function navHint(id) {
  const hints = {
    dashboard: "Today",
    training: "5 days",
    crm: "Pipeline",
    competition: "Rank",
    coach: "Practice",
    admin: "Team"
  };
  return hints[id];
}

function renderMain() {
  const user = currentUser();
  const titles = {
    dashboard: ["Command Center", user.role === "admin" ? "Team pulse across onboarding, CRM activity, and sales outcomes." : "Your day-by-day sales ramp, live activity, and readiness status."],
    training: ["Bootcamp", "Interactive five-day training path built from the Coverable sales packet."],
    crm: ["CRM", "Log calls, demos, objections, follow-ups, and closed clients without leaving onboarding."],
    competition: ["Competition", "Rep rankings based on activity, demo creation, closed deals, and onboarding progress."],
    coach: ["Coach", "Scripts, objection drills, scorecards, and certification readiness."],
    admin: ["Admin", "See every rep's onboarding progress, CRM discipline, and sales motion."]
  };
  const [title, subtitle] = titles[state.activeView] || titles.dashboard;
  return `
    <section class="topbar">
      <div>
        <div class="eyebrow">${user.role === "admin" ? "Admin mode" : "Rep mode"} / ${user.name}</div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      <div class="quick-actions">
        <button class="ghost" data-view="crm">Log Activity</button>
        <button class="ghost" data-view="coach">Practice</button>
        <button class="danger" id="reset-data">Reset Demo</button>
      </div>
    </section>
    ${viewRenderer()}
  `;
}

function viewRenderer() {
  const views = {
    dashboard: renderDashboard,
    training: renderTraining,
    crm: renderCrm,
    competition: renderCompetition,
    coach: renderCoach,
    admin: renderAdmin
  };
  return (views[state.activeView] || renderDashboard)();
}

function renderDashboard() {
  const user = currentUser();
  const data = user.role === "admin" ? aggregateStats() : repStats(user.id);
  return `
    <div class="grid four">
      <article class="card metric"><span class="label">Onboarding progress</span><span class="value">${data.onboarding}%</span><span class="small">Bootcamp completion</span></article>
      <article class="card metric"><span class="label">Calls logged</span><span class="value">${data.calls}</span><span class="small">CRM discipline</span></article>
      <article class="card metric"><span class="label">Demos booked</span><span class="value">${data.demos}</span><span class="small">Qualified opportunities</span></article>
      <article class="card metric"><span class="label">Closed clients</span><span class="value">${data.closed}</span><span class="small">Deals and pilots</span></article>
    </div>
    <div class="section-title"><h3>Today's Operating Rhythm</h3><span class="pill">3-4 hour workload</span></div>
    <div class="grid two">
      <article class="card">
        <h4>Rep Focus</h4>
        <ul class="compact-list">
          <li>Practice one script out loud before every call block.</li>
          <li>Ask better questions than the prospect expects.</li>
          <li>Book the appointment before overexplaining the platform.</li>
          <li>Log notes, objections, and follow-up date after every useful touch.</li>
        </ul>
      </article>
      <article class="card">
        <h4>Manager Focus</h4>
        <ul class="compact-list">
          <li>Review first 5 seconds of calls for confidence and clarity.</li>
          <li>Grade gatekeeper control, discovery depth, and final ask.</li>
          <li>Coach patterns from objections heard and objections overcome.</li>
          <li>Certify reps only when scripts become natural, not read aloud.</li>
        </ul>
      </article>
    </div>
    ${renderRecentActivity()}
  `;
}

function aggregateStats() {
  const ranked = allStats();
  return {
    onboarding: Math.round(ranked.reduce((sum, rep) => sum + rep.onboarding, 0) / ranked.length),
    calls: state.crm.length,
    demos: state.crm.filter((entry) => entry.outcome === "Demo Booked").length,
    closed: state.crm.filter((entry) => entry.outcome === "Closed").length
  };
}

function renderTraining() {
  return `
    <div class="tabs">
      ${bootcampDays
        .map((day) => `<button data-day="${day.id}" class="${state.activeDay === day.id ? "active" : ""}">${day.title.split(":")[0]}</button>`)
        .join("")}
    </div>
    <div class="grid two">
      ${bootcampDays.map(renderTrainingCard).join("")}
    </div>
  `;
}

function renderTrainingCard(day) {
  const user = currentUser();
  const value = user.role === "admin" ? averageDayProgress(day.id) : state.progress[user.id][day.id] || 0;
  return `
    <article class="card training-card">
      <div>
        <span class="pill">${value}% complete</span>
        <h4>${day.title}</h4>
        <p class="small">${day.focus}</p>
      </div>
      <ul>
        ${day.activities.map((activity) => `<li>${activity}</li>`).join("")}
      </ul>
      <div class="script-box">${day.script}</div>
      <div class="progress-track" style="--progress:${value}%"><div class="progress-fill"></div></div>
      <div class="module-actions">
        ${[0, 25, 50, 75, 100]
          .map((amount) => `<button class="ghost progress-btn" data-progress-day="${day.id}" data-progress-value="${amount}">${amount}%</button>`)
          .join("")}
      </div>
    </article>
  `;
}

function averageDayProgress(dayId) {
  const values = reps().map((rep) => state.progress[rep.id]?.[dayId] || 0);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function renderCrm() {
  const user = currentUser();
  const entries = user.role === "admin" ? state.crm : crmForRep(user.id);
  return `
    <article class="card">
      <h4>Log Sales Activity</h4>
      <form class="crm-form" id="crm-form">
        ${user.role === "admin" ? `<div class="field"><label>Rep</label><select name="repId">${reps().map((rep) => `<option value="${rep.id}">${rep.name}</option>`).join("")}</select></div>` : ""}
        <div class="field"><label>Firm</label><input name="firm" required placeholder="Immigration firm" /></div>
        <div class="field"><label>Contact</label><input name="contact" required placeholder="Attorney or gatekeeper" /></div>
        <div class="field"><label>Outcome</label><select name="outcome"><option>Call Logged</option><option>Demo Booked</option><option>Follow-up</option><option>Closed</option><option>No Answer</option></select></div>
        <div class="field"><label>Channel</label><select name="channel"><option>Phone</option><option>Email</option><option>LinkedIn</option><option>Text</option><option>Demo</option></select></div>
        <div class="field wide"><label>Notes</label><textarea name="notes" required placeholder="Pain, objection, next step, follow-up date"></textarea></div>
        <button class="button" type="submit">Log Activity</button>
      </form>
    </article>
    <div class="section-title"><h3>Activity Feed</h3><span class="pill">${entries.length} records</span></div>
    ${renderCrmTable(entries)}
  `;
}

function renderCrmTable(entries) {
  if (!entries.length) return `<div class="empty">No CRM activity yet.</div>`;
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Date</th><th>Rep</th><th>Firm</th><th>Contact</th><th>Outcome</th><th>Channel</th><th>Notes</th></tr>
        </thead>
        <tbody>
          ${entries
            .map((entry) => {
              const rep = state.users.find((user) => user.id === entry.repId);
              return `<tr><td>${entry.createdAt}</td><td>${rep?.name || "Unknown"}</td><td>${entry.firm}</td><td>${entry.contact}</td><td><span class="status">${entry.outcome}</span></td><td>${entry.channel}</td><td>${entry.notes}</td></tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCompetition() {
  const ranked = allStats();
  return `
    <div class="grid two">
      <article class="card">
        <h4>Leaderboard</h4>
        ${ranked
          .map(
            (rep, index) => `
              <div class="leader-row">
                <div class="rank">${index + 1}</div>
                <div>
                  <div class="rep-name">${rep.name}</div>
                  <div class="small">${rep.closed} closed, ${rep.demos} demos, ${rep.onboarding}% onboarding</div>
                </div>
                <div class="score">${rep.score}</div>
              </div>
            `
          )
          .join("")}
      </article>
      <article class="card">
        <h4>Scoring Rules</h4>
        <ul class="compact-list">
          <li>Call or CRM activity: 5 points</li>
          <li>Follow-up scheduled: 8 points</li>
          <li>Demo booked: 20 points</li>
          <li>Closed client or pilot: 70 points</li>
          <li>Onboarding completion: up to 100 points</li>
        </ul>
        <div class="script-box">The board rewards outcomes, but also rewards discipline. A rep who logs clean notes and books real next steps stays visible.</div>
      </article>
    </div>
  `;
}

function renderCoach() {
  const user = currentUser();
  const activePractice = user.role === "admin" ? state.practice[allStats()[0].id] : state.practice[user.id];
  const checks = [
    ["product", "Explain Coverable in under 20 seconds"],
    ["pains", "Name five law firm pain points"],
    ["roi", "Explain ROI using labor hours saved"],
    ["gatekeeper", "Handle gatekeeper objections"],
    ["appointment", "Book and confirm a demo"],
    ["closing", "Handle two objections and ask for next step"],
    ["followup", "Send follow-up through phone, email, LinkedIn, or text"],
    ["metrics", "Track calls, objections, follow-ups, and notes"]
  ];
  return `
    <div class="coach-grid">
      <article class="card">
        <h4>Certification Checklist</h4>
        <div class="checklist">
          ${checks
            .map(
              ([key, label]) => `
                <label class="check-item">
                  <input type="checkbox" data-check="${key}" ${activePractice?.[key] ? "checked" : ""} />
                  <span>${label}</span>
                </label>
              `
            )
            .join("")}
        </div>
      </article>
      <article class="card">
        <h4>Objection Drill</h4>
        ${objectionBank
          .map((item) => `<div class="script-box"><strong>${item.objection}</strong><br />${item.response}</div>`)
          .join("")}
      </article>
    </div>
    <div class="section-title"><h3>Scorecards</h3><span class="pill">Passing standards</span></div>
    <div class="grid three">
      <article class="card tight"><h4>Gatekeeper</h4><p class="small">Confidence, reason for call, professionalism, transfer ask, objection handling, brevity, outcome control.</p><strong>Pass: 26 / 35</strong></article>
      <article class="card tight"><h4>Appointment Setting</h4><p class="small">Opener, product explanation, qualification, curiosity, objection handling, demo ask, confirmation.</p><strong>Pass: 27 / 35</strong></article>
      <article class="card tight"><h4>Closing Call</h4><p class="small">Agenda, discovery, pain, ROI, demo relevance, objections, trial closes, final ask, next step.</p><strong>Pass: 35 / 45</strong></article>
    </div>
  `;
}

function renderAdmin() {
  if (currentUser().role !== "admin") return renderDashboard();
  return `
    <div class="admin-grid">
      ${allStats()
        .map(
          (rep) => `
            <article class="card rep-card">
              <header>
                <div>
                  <div class="avatar">${rep.initials}</div>
                </div>
                <span class="pill">${rep.certified ? "Certified" : "In training"}</span>
              </header>
              <h4>${rep.name}</h4>
              <div class="progress-track" style="--progress:${rep.onboarding}%"><div class="progress-fill"></div></div>
              <div class="small">${rep.onboarding}% onboarding complete</div>
              <div class="grid two">
                <div><strong>${rep.calls}</strong><div class="small">CRM records</div></div>
                <div><strong>${rep.closed}</strong><div class="small">Closed</div></div>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
    ${renderCrmTable(state.crm)}
  `;
}

function renderRecentActivity() {
  return `
    <div class="section-title"><h3>Recent Activity</h3><span class="pill">Live CRM</span></div>
    ${renderCrmTable(state.crm.slice(0, 5))}
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.getElementById("account")?.addEventListener("change", (event) => setUser(event.target.value));
  document.getElementById("reset-data")?.addEventListener("click", resetDemoData);
  document.querySelectorAll("[data-day]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDay = button.dataset.day;
      saveState();
      render();
    });
  });
  document.querySelectorAll(".progress-btn").forEach((button) => {
    button.addEventListener("click", () => updateProgress(button.dataset.progressDay, button.dataset.progressValue));
  });
  document.getElementById("crm-form")?.addEventListener("submit", addCrmEntry);
  document.querySelectorAll("[data-check]").forEach((input) => {
    input.addEventListener("change", () => togglePractice(input.dataset.check));
  });
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2400);
}

render();
