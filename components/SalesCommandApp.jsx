"use client";

import { useEffect, useMemo, useState } from "react";
import { bootcampDays, initialState, objectionBank } from "@/lib/demoData";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

const STORAGE_KEY = "coverable-sales-command-next-v1";
const REQUEST_TIMEOUT_MS = 6500;

function cloneInitialState() {
  return JSON.parse(JSON.stringify(initialState));
}

function loadDemoState() {
  if (typeof window === "undefined") return cloneInitialState();
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneInitialState();
  try {
    return { ...cloneInitialState(), ...JSON.parse(saved) };
  } catch {
    return cloneInitialState();
  }
}

function saveDemoState(nextState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export default function SalesCommandApp() {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState(cloneInitialState);
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(configured);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let slowTimer;
    if (configured) {
      slowTimer = window.setTimeout(() => {
        setLoadingSlow(true);
        setNotice("Still loading. If this does not clear, sign out and sign in again.");
      }, 8000);
    }

    if (!configured) {
      setState(loadDemoState());
      setMounted(true);
      setLoading(false);
      window.clearTimeout(slowTimer);
      return;
    }

    const supabase = createBrowserSupabaseClient();

    async function boot() {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          "Sign-in check took too long"
        );
        if (error) setNotice(error.message);
        setSession(data.session);
        setMounted(true);
        setLoading(false);
        setLoadingSlow(false);
        window.clearTimeout(slowTimer);

        if (data.session) {
          seedCurrentUser(data.session.user);
          loadLiveState(supabase, data.session.user.id);
        }
      } catch (error) {
        setNotice(error.message);
        setMounted(true);
        setLoading(false);
        window.clearTimeout(slowTimer);
      }
    }

    boot();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        seedCurrentUser(nextSession.user);
        loadLiveState(supabase, nextSession.user.id);
      }
    });

    return () => {
      window.clearTimeout(slowTimer);
      subscription.unsubscribe();
    };
  }, [configured]);

  async function loadLiveState(supabase, currentUserId) {
    setNotice("");
    setWorkspaceLoading(true);
    repairProfile(supabase);

    try {
      const [
        { data: profiles, error: profileError },
        { data: progress, error: progressError },
        { data: crm, error: crmError }
      ] = await withTimeout(
        Promise.all([
          supabase.from("profiles").select("id, full_name, email, start_date").order("created_at", { ascending: true }),
          supabase.from("onboarding_progress").select("user_id, module_id, percent_complete"),
          supabase
            .from("crm_activities")
            .select("id, user_id, firm_name, contact_name, contact_role, channel, outcome, objection, notes, next_follow_up, created_at")
            .order("created_at", { ascending: false })
        ]),
        "Workspace data took too long to load"
      );

      const firstError = profileError || progressError || crmError;
      if (firstError) {
        setNotice(firstError.message);
        return;
      }

      const reps = (profiles || []).map((profile) => ({
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        initials: initialsFor(profile.full_name || profile.email),
        startDate: profile.start_date
      }));

      if (!reps.some((rep) => rep.id === currentUserId)) {
        const { data: userData } = await withTimeout(supabase.auth.getUser(), "User profile took too long");
        const user = userData.user;
        if (user) {
          reps.push(profileFromUser(user));
        }
      }

      const progressByRep = {};
      reps.forEach((rep) => {
        progressByRep[rep.id] = Object.fromEntries(bootcampDays.map((day) => [day.id, 0]));
      });
      (progress || []).forEach((row) => {
        progressByRep[row.user_id] = progressByRep[row.user_id] || {};
        progressByRep[row.user_id][row.module_id] = row.percent_complete;
      });

      setState((current) => ({
        ...current,
        currentRepId: currentUserId,
        reps,
        progress: progressByRep,
        crm: (crm || []).map((row) => ({
          id: row.id,
          repId: row.user_id,
          firm: row.firm_name,
          contact: row.contact_name,
          contactRole: row.contact_role,
          outcome: row.outcome,
          channel: row.channel,
          objection: row.objection || "",
          notes: row.notes,
          nextFollowUp: row.next_follow_up || "",
          createdAt: row.created_at?.slice(0, 10) || ""
        }))
      }));
    } catch (error) {
      setNotice(`${error.message}. You can still sign out and try again.`);
    } finally {
      setWorkspaceLoading(false);
    }
  }

  function seedCurrentUser(user) {
    setState((current) => {
      if (current.reps.some((rep) => rep.id === user.id)) {
        return { ...current, currentRepId: user.id };
      }

      const nextRep = profileFromUser(user);
      return {
        ...current,
        currentRepId: user.id,
        reps: [nextRep],
        progress: {
          [user.id]: Object.fromEntries(bootcampDays.map((day) => [day.id, 0]))
        },
        crm: []
      };
    });
  }

  async function repairProfile(supabase) {
    try {
      const { data } = await withTimeout(supabase.auth.getUser(), "User profile took too long");
      const user = data.user;
      if (user) {
        await withTimeout(
          supabase.from("profiles").upsert(
            {
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "New Rep",
              email: user.email,
              role: "rep"
            },
            { onConflict: "id" }
          ),
          "Profile repair took too long"
        );
      }
    } catch {
      // Profile repair is best-effort. It must never block the app shell.
    }
  }

  function updateState(updater) {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (!configured) saveDemoState(next);
      return next;
    });
  }

  async function saveCrmEntry(entry, form) {
    if (!configured || !session) {
      updateState((draft) => ({ ...draft, crm: [entry, ...draft.crm] }));
      form.reset();
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("crm_activities").insert({
      user_id: session.user.id,
      firm_name: entry.firm,
      contact_name: entry.contact,
      contact_role: entry.contactRole,
      outcome: entry.outcome,
      channel: entry.channel,
      objection: entry.objection || null,
      next_follow_up: entry.nextFollowUp || null,
      notes: entry.notes
    });

    if (error) {
      setNotice(error.message);
      return;
    }

    form.reset();
    await loadLiveState(supabase, session.user.id);
  }

  async function saveProgress(moduleId, amount) {
    const repId = currentRep?.id;
    if (!repId) return;

    if (!configured || !session) {
      updateState((draft) => ({
        ...draft,
        progress: {
          ...draft.progress,
          [repId]: {
            ...draft.progress[repId],
            [moduleId]: amount
          }
        }
      }));
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("onboarding_progress").upsert(
      {
        user_id: session.user.id,
        module_id: moduleId,
        percent_complete: amount,
        completed_at: amount === 100 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,module_id" }
    );

    if (error) {
      setNotice(error.message);
      return;
    }

    await loadLiveState(supabase, session.user.id);
  }

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const liveMode = configured && Boolean(session);
  const currentRep =
    state.reps.find((rep) => rep.id === (liveMode ? session.user.id : state.currentRepId)) || state.reps[0];
  const rankedReps = useMemo(() => rankReps(state), [state]);
  const currentStats = currentRep ? getRepStats(state, currentRep.id) : getEmptyStats();

  if (!mounted || loading) return <LoadingShell slow={loadingSlow} notice={notice} />;

  if (configured && !session) return <LoginRequired />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="mark">C</div>
          <div>
            <h1>Coverable Command</h1>
            <span>Rep sales cockpit</span>
          </div>
        </div>

        {liveMode ? (
          <div className="sidebar-note compact-note">
            Signed in as <strong>{currentRep?.name || session.user.email}</strong>
          </div>
        ) : (
          <div className="account-switcher">
            <label htmlFor="rep">Demo rep</label>
            <select
              id="rep"
              value={currentRep.id}
              onChange={(event) =>
                updateState((draft) => ({ ...draft, currentRepId: event.target.value }))
              }
            >
              {state.reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="nav">
          {[
            ["team", "Team", "Pulse"],
            ["crm", "CRM", "Log"],
            ["course", "Course", "Learn"],
            ["coach", "Coach", "Drill"]
          ].map(([id, label, hint]) => (
            <button
              key={id}
              className={state.activeView === id ? "active" : ""}
              onClick={() => updateState((draft) => ({ ...draft, activeView: id }))}
            >
              {label}
              <span>{hint}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          {liveMode
            ? "Live Supabase mode: CRM activity and onboarding progress are stored online."
            : "Demo mode is active until Supabase env vars are added."}
        </div>
      </aside>

      <main className="main">
        <section className="topbar">
          <div>
            <div className="eyebrow">{liveMode ? "Live rep mode" : "Demo mode"} / {currentRep?.name}</div>
            <h2>{viewTitle(state.activeView)}</h2>
          </div>
          <div className="quick-actions">
            <button className="ghost" onClick={() => updateState((draft) => ({ ...draft, activeView: "crm" }))}>
              Log Activity
            </button>
            {liveMode ? (
              <button className="danger" onClick={signOut} type="button">
                Sign Out
              </button>
            ) : (
              <>
                <a className="ghost" href="/login">
                  Login
                </a>
                <button className="danger" onClick={() => updateState(cloneInitialState())} type="button">
                  Reset Demo
                </button>
              </>
            )}
          </div>
        </section>

        {notice ? <div className="notice">{notice}</div> : null}
        {workspaceLoading ? (
          <div className="inline-loading">
            <div className="loading-bar" />
            <span>Syncing sales floor...</span>
          </div>
        ) : null}

        {state.activeView === "team" ? (
          <TeamView
            state={state}
            rankedReps={rankedReps}
            currentStats={currentStats}
            setActiveView={(view) => updateState((draft) => ({ ...draft, activeView: view }))}
          />
        ) : null}
        {state.activeView === "crm" ? (
          <CrmView state={state} currentRep={currentRep} saveCrmEntry={saveCrmEntry} />
        ) : null}
        {state.activeView === "course" ? (
          <CourseView state={state} currentRep={currentRep} saveProgress={saveProgress} />
        ) : null}
        {state.activeView === "coach" ? <CoachView /> : null}
      </main>
    </div>
  );
}

function TeamView({ state, rankedReps, currentStats, setActiveView }) {
  const nextTask = nextCourseTask(state, currentStats);

  return (
    <>
      <div className="home-grid">
        <article className="card focus-card">
          <div>
            <span className="eyebrow">Next</span>
            <h3>{nextTask.title}</h3>
            <p>{nextTask.detail}</p>
          </div>
          <button className="button" type="button" onClick={() => setActiveView(nextTask.view)}>
            {nextTask.action}
          </button>
        </article>

        <article className="card score-card">
          <span className="eyebrow">My Score</span>
          <strong>{currentStats.score}</strong>
          <div className="small">
            {currentStats.onboarding}% course / {currentStats.demos} demos / {currentStats.closed} closed
          </div>
        </article>
      </div>

      <div className="section-title">
        <h3>Team</h3>
      </div>

      <article className="card">
        {rankedReps.length ? (
          rankedReps.map((rep, index) => (
            <div className="leader-row minimal" key={rep.id}>
              <div className="rank">{index + 1}</div>
              <div>
                <div className="rep-name">{rep.name}</div>
                <div className="progress-track" style={{ "--progress": `${rep.onboarding}%` }}>
                  <div className="progress-fill" />
                </div>
              </div>
              <div className="rep-stats">
                <strong>{rep.score}</strong>
                <span>{rep.onboarding}%</span>
                <span>{rep.demos} demos</span>
                <span>{rep.closed} closed</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">No reps yet. Create an account to start the board.</div>
        )}
      </article>

      <div className="section-title">
        <h3>Recent Activity</h3>
        <span className="pill">{state.crm.length} records</span>
      </div>
      <CrmTable state={state} entries={state.crm.slice(0, 6)} />
    </>
  );
}

function CrmView({ state, currentRep, saveCrmEntry }) {
  const entries = state.crm.filter((entry) => entry.repId === currentRep.id);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entry = {
      id: crypto.randomUUID(),
      repId: currentRep.id,
      firm: form.get("firm").trim(),
      contact: form.get("contact").trim(),
      contactRole: form.get("contactRole"),
      outcome: form.get("outcome"),
      channel: form.get("channel"),
      objection: form.get("objection").trim(),
      nextFollowUp: form.get("nextFollowUp"),
      notes: form.get("notes").trim(),
      createdAt: new Date().toISOString().slice(0, 10)
    };

    saveCrmEntry(entry, event.currentTarget);
  }

  return (
    <>
      <article className="card">
        <h4>Log Sales Activity</h4>
        <form className="crm-form" onSubmit={handleSubmit}>
          <Field label="Firm">
            <input name="firm" required placeholder="Immigration firm" />
          </Field>
          <Field label="Contact">
            <input name="contact" required placeholder="Attorney or gatekeeper" />
          </Field>
          <Field label="Contact role">
            <select name="contactRole">
              <option>Attorney</option>
              <option>Gatekeeper</option>
              <option>Office Manager</option>
              <option>Paralegal</option>
            </select>
          </Field>
          <Field label="Outcome">
            <select name="outcome">
              <option>Call Logged</option>
              <option>Attorney Reached</option>
              <option>Demo Booked</option>
              <option>Follow-up</option>
              <option>Closed</option>
              <option>No Answer</option>
              <option>Not Interested</option>
            </select>
          </Field>
          <Field label="Channel">
            <select name="channel">
              <option>Phone</option>
              <option>Email</option>
              <option>LinkedIn</option>
              <option>Text</option>
              <option>Demo</option>
            </select>
          </Field>
          <Field label="Objection">
            <input name="objection" placeholder="Busy, cost, AI concern..." />
          </Field>
          <Field label="Next follow-up">
            <input name="nextFollowUp" type="date" />
          </Field>
          <button className="button" type="submit">
            Log Activity
          </button>
          <Field label="Notes" wide>
            <textarea name="notes" required placeholder="Pain, next step, workflow details" />
          </Field>
        </form>
      </article>

      <div className="section-title">
        <h3>My CRM</h3>
        <span className="pill">{entries.length} records</span>
      </div>
      <CrmTable state={state} entries={entries} />
    </>
  );
}

function CourseView({ state, currentRep, saveProgress }) {
  const [activeDayId, setActiveDayId] = useState("day1");
  const [homework, setHomework] = useState({});
  const homeworkKey = `coverable-homework-${currentRep.id}-day1`;

  useEffect(() => {
    const saved = window.localStorage.getItem(homeworkKey);
    setHomework(saved ? JSON.parse(saved) : {});
  }, [homeworkKey]);

  function updateHomework(field, value) {
    const next = { ...homework, [field]: value };
    setHomework(next);
    window.localStorage.setItem(homeworkKey, JSON.stringify(next));
  }

  const activeDay = bootcampDays.find((day) => day.id === activeDayId) || bootcampDays[0];

  return (
    <div className="course-page">
      <div className="day-grid">
        {bootcampDays.map((day) => {
          const value = state.progress[currentRep.id]?.[day.id] || 0;
          const complete = value === 100;
          return (
            <button
              className={`day-box ${activeDayId === day.id ? "active" : ""}`}
              key={day.id}
              onClick={() => setActiveDayId(day.id)}
              type="button"
            >
              <span>{day.title.split(":")[0]}</span>
              <strong>{day.title.replace(`${day.title.split(":")[0]}: `, "")}</strong>
              <em>{complete ? "Done" : `${value}%`}</em>
            </button>
          );
        })}
      </div>

      {activeDay.id === "day1" ? (
        <DayOneLesson
          progress={state.progress[currentRep.id]?.day1 || 0}
          homework={homework}
          updateHomework={updateHomework}
          saveProgress={saveProgress}
        />
      ) : (
        <article className="card course-placeholder">
          <span className="eyebrow">{activeDay.title.split(":")[0]}</span>
          <h3>{activeDay.title.replace(`${activeDay.title.split(":")[0]}: `, "")}</h3>
          <p>{activeDay.focus}</p>
          <div className="script-box compact-script">{activeDay.script}</div>
          <button className="ghost" type="button">
            Coming next
          </button>
        </article>
      )}
    </div>
  );
}

function DayOneLesson({ progress, homework, updateHomework, saveProgress }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Start",
    "Standards",
    "Reality",
    "Explain",
    "Attorney",
    "Control",
    "Scripts",
    "Check",
    "Homework"
  ];
  const lastStep = steps.length - 1;

  function goNext() {
    const nextStep = Math.min(step + 1, lastStep);
    setStep(nextStep);
    saveProgress("day1", Math.max(progress, Math.round((nextStep / lastStep) * 75)));
  }

  function goBack() {
    setStep(Math.max(step - 1, 0));
  }

  return (
    <article className="card lesson-card">
      <div className="lesson-hero">
        <div>
          <span className="eyebrow">Day 1</span>
          <h3>Sales Foundation + Product Understanding</h3>
          <p>
            By the end of Day 1, the rep should understand what Coverable does, who it serves,
            what law firm problems it solves, and how to explain the product clearly without
            rambling.
          </p>
        </div>
        <span className={progress === 100 ? "status done" : "status"}>{progress === 100 ? "Done" : `${progress}%`}</span>
      </div>

      <div className="lesson-steps">
        {steps.map((label, index) => (
          <button
            className={index === step ? "active" : ""}
            key={label}
            onClick={() => setStep(index)}
            type="button"
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <LessonPanel eyebrow="Orientation" title="What today is really about">
          <p className="lesson-copy">
            Day 1 is not about memorizing a fancy AI pitch. It is about becoming useful on the
            phone. By the end, you should be able to explain Coverable simply, connect it to law
            firm pain, and avoid rambling when a busy attorney gives you 15 seconds.
          </p>
          <div className="agenda-list">
            {[
              ["30 min", "Bootcamp expectations", "Sales mindset, rules, standards"],
              ["45 min", "Product understanding", "What Coverable does and how to explain it"],
              ["45 min", "Law firm pain points", "Attorney/paralegal workflow training"],
              ["30 min", "Sales basics", "Control, confidence, questions, next steps"],
              ["30 min", "Script practice", "10-sec, 20-sec, and attorney-friendly explanations"],
              ["30 min", "Quiz + roleplay", "Product explanation test"],
              ["30-60 min", "Homework", "Written pitch + pain-point mapping"]
            ].map(([time, module, activity]) => (
              <div className="agenda-item" key={module}>
                <span>{time}</span>
                <strong>{module}</strong>
                <p>{activity}</p>
              </div>
            ))}
          </div>
        </LessonPanel>
      ) : null}

      {step === 1 ? (
        <LessonPanel eyebrow="Module 1" title="The rep standard">
          <p className="lesson-copy">
            Coverable reps should sound prepared, sharp, and calm. You are not asking permission to
            bother someone. You are opening a relevant business conversation.
          </p>
          <ChecklistInteraction
            items={[
              "Show up prepared.",
              "Know the scripts.",
              "Practice out loud.",
              "Take coaching without excuses.",
              "Track activity daily.",
              "Stay composed under rejection.",
              "Ask for the next step confidently."
            ]}
          />
        </LessonPanel>
      ) : null}

      {step === 2 ? (
        <LessonPanel eyebrow="Module 1" title="Sales reality">
          <p className="lesson-copy">
            Sales is not about being liked by everyone. Sales is about creating useful conversations
            with qualified prospects. The first objection is usually not the end of the call. It is
            where the call actually begins.
          </p>
          <QuoteList
            title="You will hear"
            items={[
              "Not interested.",
              "Send me information.",
              "We are too busy.",
              "We already have software.",
              "The attorney is unavailable.",
              "Call back later."
            ]}
          />
          <div className="compare-grid">
            <div className="compare-card bad">
              <strong>Weak rep</strong>
              <p>Hears one objection, apologizes, and exits the conversation.</p>
            </div>
            <div className="compare-card good">
              <strong>Strong rep</strong>
              <p>Stays calm, asks one better question, and moves toward a next step.</p>
            </div>
          </div>
        </LessonPanel>
      ) : null}

      {step === 3 ? (
        <LessonPanel eyebrow="Module 2" title="Explain Coverable without rambling">
          <InfoBlock
            title="Use this order"
            items={["Who it helps", "What problem it solves", "What it does", "Business result"]}
          />
          <div className="script-box compact-script">
            <strong>Formula</strong>
            <br />
            We help [type of firm] reduce [pain] by [solution], so they can [business result].
          </div>
          <div className="script-builder">
            <label>
              Type of firm
              <input
                value={homework.firmType || ""}
                onChange={(event) => updateHomework("firmType", event.target.value)}
                placeholder="immigration law firms"
              />
            </label>
            <label>
              Pain
              <input
                value={homework.pain || ""}
                onChange={(event) => updateHomework("pain", event.target.value)}
                placeholder="repetitive drafting and case prep"
              />
            </label>
            <label>
              Solution
              <input
                value={homework.solution || ""}
                onChange={(event) => updateHomework("solution", event.target.value)}
                placeholder="AI that generates and organizes case materials faster"
              />
            </label>
            <label>
              Business result
              <input
                value={homework.result || ""}
                onChange={(event) => updateHomework("result", event.target.value)}
                placeholder="save staff time and handle more cases"
              />
            </label>
          </div>
          <div className="script-box compact-script">
            <strong>Your sentence</strong>
            <br />
            We help {homework.firmType || "[type of firm]"} reduce {homework.pain || "[pain]"} by{" "}
            {homework.solution || "[solution]"}, so they can {homework.result || "[business result]"}.
          </div>
        </LessonPanel>
      ) : null}

      {step === 4 ? (
        <LessonPanel eyebrow="Module 3" title="How attorneys think">
          <p className="lesson-copy">
            Attorneys are busy, skeptical, and protective of their time. They are trained to
            question claims. Your job is to answer the concern underneath the words they say.
          </p>
          <MindsetDrill
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 5 ? (
        <LessonPanel eyebrow="Module 4" title="Sales control">
          <p className="lesson-copy">
            Control does not mean being aggressive. It means having a clear reason, asking focused
            questions, and moving the conversation toward a next step without overexplaining.
          </p>
          <div className="lesson-grid">
            <InfoBlock
              title="5 Rules"
              items={[
                "Lead with a clear reason for the call.",
                "Ask focused questions.",
                "Do not overexplain.",
                "Handle objections with confidence.",
                "Always move toward a next step."
              ]}
            />
            <InfoBlock
              title="Correct posture"
              items={[
                "I have something relevant that may help your firm.",
                "I only need a short conversation to see if it makes sense.",
                "I am not begging for time."
              ]}
            />
          </div>
          <RewriteDrill homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 6 ? (
        <LessonPanel eyebrow="Script practice" title="Build the muscle">
          <p className="lesson-copy">
            Read these out loud. Then write your own version. The goal is not to sound like a
            robot. The goal is to be short, clear, and business-focused.
          </p>
          <ScriptPractice homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 7 ? (
        <LessonPanel eyebrow="Practice" title="Good pitch vs bad pitch">
          <div className="compare-grid">
            <div className="compare-card bad">
              <strong>Bad</strong>
              <p>We are an AI platform that uses advanced technology to help lawyers automate things.</p>
              <ul>
                <li>Too vague</li>
                <li>Too tech-heavy</li>
                <li>Does not explain business pain</li>
                <li>Does not connect to attorney workflow</li>
              </ul>
            </div>
            <div className="compare-card good">
              <strong>Good</strong>
              <p>
                Coverable helps immigration firms cut down the hours spent on repetitive document
                prep and legal drafting, so paralegals and attorneys can move cases faster.
              </p>
              <ul>
                <li>Simple</li>
                <li>Direct</li>
                <li>Pain-based</li>
                <li>Business-focused</li>
              </ul>
            </div>
          </div>
          <HomeworkField
            label="Write your best 20-second explanation"
            field="practicePitch"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 8 ? (
        <LessonPanel eyebrow="Homework" title="Finish Day 1">
          <div className="homework-grid">
            <HomeworkField label="Coverable's value in one sentence" field="oneSentence" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Coverable's value in three sentences" field="threeSentences" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Five law firm pain points" field="painPoints" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="One ROI example using time saved per case" field="roiExample" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Link or note for recorded 20-second explanation" field="recording" homework={homework} updateHomework={updateHomework} />
          </div>
          <button className="button" type="button" onClick={() => saveProgress("day1", 100)}>
            Mark Day 1 Complete
          </button>
        </LessonPanel>
      ) : null}

      <div className="lesson-controls">
        <button className="ghost" type="button" onClick={goBack} disabled={step === 0}>
          Back
        </button>
        <button className="button" type="button" onClick={goNext} disabled={step === lastStep}>
          Next
        </button>
      </div>
    </article>
  );
}

function LessonPanel({ eyebrow, title, children }) {
  return (
    <section className="lesson-panel">
      <span className="eyebrow">{eyebrow}</span>
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function ChecklistInteraction({ items }) {
  const [checked, setChecked] = useState({});

  return (
    <div className="interactive-checklist">
      {items.map((item) => (
        <label key={item}>
          <input
            checked={Boolean(checked[item])}
            onChange={(event) => setChecked({ ...checked, [item]: event.target.checked })}
            type="checkbox"
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

function MindsetDrill({ homework, updateHomework }) {
  const prompts = [
    ["Is this worth my time?", "Lead with a specific workflow pain, not a vague AI claim."],
    ["Is this relevant to my practice?", "Say immigration case prep, drafting, briefs, motions, and packets."],
    ["Will this create risk?", "Clarify that attorneys still review and control the final work."],
    ["Will this save staff time?", "Tie the value to paralegal workload and hours saved per case."]
  ];

  return (
    <div className="drill-stack">
      {prompts.map(([thought, response]) => (
        <div className="drill-card" key={thought}>
          <span>Attorney is thinking</span>
          <strong>{thought}</strong>
          <p>{response}</p>
        </div>
      ))}
      <HomeworkField
        label="Pick one attorney concern and write how you would answer it"
        field="attorneyConcern"
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function RewriteDrill({ homework, updateHomework }) {
  return (
    <div className="drill-stack">
      <div className="compare-grid">
        <div className="compare-card bad">
          <strong>Weak</strong>
          <p>Sorry to bother you. I was just checking if maybe you had time to hear about our AI platform.</p>
        </div>
        <div className="compare-card good">
          <strong>Controlled</strong>
          <p>
            I will be brief. We help immigration firms reduce repetitive case prep and drafting
            workload. Is your team still preparing most packets manually?
          </p>
        </div>
      </div>
      <HomeworkField
        label="Rewrite this weak opener in your own words"
        field="controlledOpener"
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function ScriptPractice({ homework, updateHomework }) {
  const scripts = [
    ["10-second", "Coverable helps immigration law firms prepare documents and case materials faster using AI, so attorneys and paralegals spend less time on repetitive work."],
    ["20-second", "Coverable is legal AI software for law firms, especially immigration firms. It helps generate and organize documents, briefs, motions, and case materials faster, which saves paralegal time, reduces attorney workload, and helps the firm handle more cases with the same staff."],
    ["Pain-based", "Most immigration firms have staff spending hours on repeatable drafting, forms, briefs, and case packets. Coverable helps reduce that manual workload so the firm can move cases faster without immediately adding payroll."],
    ["ROI-based", "If your team saves even a few hours per case, that adds up quickly. Coverable is about reducing labor hours per case and increasing how many cases the firm can handle with the same team."]
  ];

  return (
    <div className="script-practice">
      {scripts.map(([label, text]) => (
        <div className="script-box compact-script" key={label}>
          <strong>{label}</strong>
          <br />
          {text}
        </div>
      ))}
      <div className="homework-grid">
        <HomeworkField label="Your 10-second version" field="tenSecond" homework={homework} updateHomework={updateHomework} />
        <HomeworkField label="Your pain-based version" field="painBased" homework={homework} updateHomework={updateHomework} />
      </div>
    </div>
  );
}

function LessonSection({ title, children }) {
  return (
    <section className="lesson-section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function InfoBlock({ title, items }) {
  return (
    <div className="info-block">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function QuoteList({ title, items }) {
  return (
    <div className="quote-list">
      <strong>{title}</strong>
      <div>
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function HomeworkField({ label, field, homework, updateHomework }) {
  return (
    <label className="homework-field">
      <span>{label}</span>
      <textarea value={homework[field] || ""} onChange={(event) => updateHomework(field, event.target.value)} />
    </label>
  );
}

function CoachView() {
  return (
    <div className="coach-grid">
      <article className="card">
        <h4>Objection Drill</h4>
        {objectionBank.map((item) => (
          <div className="script-box" key={item.objection}>
            <strong>{item.objection}</strong>
            <br />
            {item.response}
          </div>
        ))}
      </article>
      <article className="card">
        <h4>Certification Targets</h4>
        <ul className="compact-list">
          <li>Explain Coverable in under 20 seconds.</li>
          <li>Name five law firm pain points.</li>
          <li>Handle gatekeeper objections without folding.</li>
          <li>Ask at least six discovery questions on a closing call.</li>
          <li>Log every useful touch in the CRM.</li>
        </ul>
      </article>
    </div>
  );
}

function CrmTable({ state, entries }) {
  if (!entries.length) return <div className="empty">No CRM activity yet.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Rep</th>
            <th>Firm</th>
            <th>Contact</th>
            <th>Outcome</th>
            <th>Channel</th>
            <th>Next</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const rep = state.reps.find((item) => item.id === entry.repId);
            return (
              <tr key={entry.id}>
                <td>{entry.createdAt}</td>
                <td>{rep?.name || "Unknown"}</td>
                <td>{entry.firm}</td>
                <td>
                  {entry.contact}
                  <div className="small">{entry.contactRole}</div>
                </td>
                <td>
                  <span className="status">{entry.outcome}</span>
                </td>
                <td>{entry.channel}</td>
                <td>{entry.nextFollowUp || "None"}</td>
                <td>
                  {entry.notes}
                  {entry.objection ? <div className="small">Objection: {entry.objection}</div> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ label, value, detail }) {
  return (
    <article className="card metric">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      <span className="small">{detail}</span>
    </article>
  );
}

function Field({ label, children, wide }) {
  return (
    <div className={`field ${wide ? "wide" : ""}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function LoadingShell({ slow, notice }) {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand compact">
          <div className="mark">C</div>
          <div>
            <h1>Coverable Command</h1>
            <span>Loading sales floor</span>
          </div>
        </div>
        <div className="loading-block">
          <div className="loading-bar" />
          <div className="notice">
            {slow ? notice || "Still loading your workspace..." : "Loading your workspace..."}
          </div>
          {slow ? (
            <a className="ghost text-center" href="/login">
              Back to Login
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function LoginRequired() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand compact">
          <div className="mark">C</div>
          <div>
            <h1>Coverable Command</h1>
            <span>Rep sales cockpit</span>
          </div>
        </div>
        <div className="login-form">
          <div>
            <div className="eyebrow">Online mode</div>
            <h2>Sign in to continue</h2>
            <p>Sales activity, onboarding progress, and team competition now save to Supabase.</p>
          </div>
          <a className="button text-center" href="/login">
            Go to Login
          </a>
        </div>
      </section>
    </main>
  );
}

function getRepStats(state, repId) {
  const entries = state.crm.filter((entry) => entry.repId === repId);
  const progressValues = Object.values(state.progress[repId] || {});
  const onboarding = progressValues.length
    ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / bootcampDays.length)
    : 0;
  const calls = entries.length;
  const demos = entries.filter((entry) => entry.outcome === "Demo Booked").length;
  const closed = entries.filter((entry) => entry.outcome === "Closed").length;
  const followUps = entries.filter((entry) => entry.outcome === "Follow-up").length;
  const attorneyReached = entries.filter((entry) => entry.outcome === "Attorney Reached").length;
  const score = calls * 5 + attorneyReached * 12 + followUps * 8 + demos * 20 + closed * 70 + onboarding;
  return { calls, demos, closed, followUps, onboarding, score };
}

function getEmptyStats() {
  return { calls: 0, demos: 0, closed: 0, followUps: 0, onboarding: 0, score: 0 };
}

function rankReps(state) {
  return state.reps
    .map((rep) => ({ ...rep, ...getRepStats(state, rep.id) }))
    .sort((a, b) => b.score - a.score);
}

function initialsFor(value) {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function profileFromUser(user) {
  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "New Rep";
  return {
    id: user.id,
    name,
    email: user.email,
    initials: initialsFor(name || user.email || "New Rep"),
    startDate: new Date().toISOString().slice(0, 10)
  };
}

function withTimeout(promise, message, timeoutMs = REQUEST_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

function viewTitle(view) {
  return {
    team: "Team Progress",
    crm: "Sales CRM",
    course: "Onboarding Course",
    coach: "Practice Coach"
  }[view];
}

function viewSubtitle(view) {
  return {
    team: "See other reps, their course progress, and sales performance from CRM activity.",
    crm: "Log the calls, conversations, objections, follow-ups, demos, and closes that drive the scoreboard.",
    course: "Work through the Coverable bootcamp with interactive progress tracking.",
    coach: "Practice scripts and objections before live calls."
  }[view];
}

function nextCourseTask(state, currentStats) {
  if (currentStats.onboarding >= 100) {
    return {
      title: "Keep the board moving",
      detail: "Log today's calls, demos, and follow-ups.",
      action: "Open CRM",
      view: "crm"
    };
  }

  const currentRepId = state.currentRepId;
  const progress = state.progress[currentRepId] || {};
  const nextDay = bootcampDays.find((day) => (progress[day.id] || 0) < 100) || bootcampDays[0];
  return {
    title: nextDay.title,
    detail: nextDay.focus,
    action: "Continue",
    view: "course"
  };
}
