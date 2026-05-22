"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
  const homeworkKey = `coverable-homework-${currentRep.id}-${activeDayId}`;

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
      ) : activeDay.id === "day2" ? (
        <DayTwoLesson
          progress={state.progress[currentRep.id]?.day2 || 0}
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

function DayTwoLesson({ progress, homework, updateHomework, saveProgress }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Start",
    "Gatekeeper",
    "Language",
    "Scripts",
    "Rebuttals",
    "Attorney",
    "Qualify",
    "Book",
    "Confirm",
    "Drills",
    "Homework"
  ];
  const lastStep = steps.length - 1;

  function goNext() {
    const nextStep = Math.min(step + 1, lastStep);
    setStep(nextStep);
    saveProgress("day2", Math.max(progress, Math.round((nextStep / lastStep) * 75)));
  }

  function goBack() {
    setStep(Math.max(step - 1, 0));
  }

  return (
    <article className="card lesson-card">
      <div className="lesson-hero">
        <div>
          <span className="eyebrow">Day 2</span>
          <h3>Gatekeeper + Appointment Setting Training</h3>
          <p>
            By the end of Day 2, the rep should be able to get through gatekeepers, reach the
            attorney or decision maker, create curiosity, qualify lightly, and book an appointment
            without overexplaining.
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
        <LessonPanel eyebrow="Orientation" title="The point of Day 2">
          <p className="lesson-copy">
            Day 2 is where the rep learns to earn access. The front desk is not a wall to smash
            through. It is a filter. Your job is to sound relevant enough that the gatekeeper
            understands why the attorney, office manager, or operations lead should hear the call.
          </p>
          <div className="agenda-list">
            {[
              ["30 min", "Gatekeeper psychology", "How assistants and intake staff think"],
              ["45 min", "Gatekeeper scripts", "Transfer, callback, and office manager routes"],
              ["45 min", "Gatekeeper rebuttal drills", "Busy, send info, and what is this regarding"],
              ["45 min", "Appointment setting", "Attorney opener, qualification, and booking"],
              ["30 min", "Calendar confirmation", "Confirming demos and avoiding no-shows"],
              ["30 min", "Roleplay", "Gatekeeper and attorney booking simulations"],
              ["30-60 min", "Homework", "Script memorization and written responses"]
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
        <LessonPanel eyebrow="Module 1" title="Gatekeeper psychology">
          <p className="lesson-copy">
            Gatekeepers are not the enemy. They are protecting the attorney's time. They may be a
            receptionist, secretary, intake coordinator, legal assistant, paralegal, office manager,
            or executive assistant. Their main question is simple: is this worth interrupting the
            attorney for?
          </p>
          <div className="lesson-grid">
            <InfoBlock
              title="They are listening for"
              items={[
                "A specific reason for the call.",
                "A professional tone.",
                "A clear connection to the firm's work.",
                "Whether this belongs with an attorney, office manager, or operations person."
              ]}
            />
            <InfoBlock
              title="Your job"
              items={[
                "Sound relevant before asking for access.",
                "Use legal workflow language, not hype.",
                "Ask who owns the issue when you do not know.",
                "Stay calm when they test you."
              ]}
            />
          </div>
          <HomeworkField
            label="In one sentence, explain why the gatekeeper is not the enemy"
            field="gatekeeperMindset"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 2 ? (
        <LessonPanel eyebrow="Module 1" title="Language that gets blocked vs passed through">
          <p className="lesson-copy">
            Gatekeepers block vague sales energy. They pass along calls that sound specific,
            business-relevant, and tied to a real workflow. Do not lead with AI. Lead with document
            preparation, immigration case workflow, staff time, and the right decision maker.
          </p>
          <div className="compare-grid">
            <InfoBlock
              title="Avoid saying"
              items={[
                "I am trying to sell them software.",
                "Can I speak to the owner?",
                "Is the attorney available?",
                "I just wanted to see if they would be interested.",
                "Can you tell them it is about AI?",
                "Sorry to bother you."
              ]}
            />
            <InfoBlock
              title="Say instead"
              items={[
                "I am reaching out regarding legal document preparation and case workflow for the firm.",
                "It is regarding reducing repetitive drafting and case prep time for immigration matters.",
                "I wanted to speak with the attorney who oversees immigration case operations.",
                "Who would be the best person to speak with about improving document preparation workflow?"
              ]}
            />
          </div>
          <RewriteDrillDayTwo homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 3 ? (
        <LessonPanel eyebrow="Module 2" title="Gatekeeper scripts">
          <p className="lesson-copy">
            The script should do three things quickly: identify you, anchor the topic in a serious
            law firm workflow, and ask for the correct route. If you sound like you are fishing,
            you will get pushed to email.
          </p>
          <ScriptLibrary
            scripts={[
              ["Main script", "Hi, this is [Name] with Coverable. I am reaching out regarding legal document preparation and immigration case workflow for the firm. Who would be the best attorney to speak with about that?"],
              ["If they ask what Coverable is", "We help immigration law firms reduce repetitive drafting and case preparation work using legal AI. I just need to point this to the right attorney for a quick conversation."],
              ["If they ask if this is sales", "It is a business call, but it is specifically about reducing attorney and paralegal time on case preparation. Who handles workflow or technology decisions for the firm?"],
              ["Transfer route", "Could you connect me with the attorney who oversees immigration case workflow or firm operations?"],
              ["If they ask for a name", "I may have the wrong contact listed. Is [Attorney Name] the attorney who handles immigration matters? If yes: Perfect, could you transfer me to them? If no: Got it. Who would be the correct attorney for immigration case operations?"],
              ["When you know the attorney's name", "Hi, this is [Name] with Coverable. I am calling for [Attorney Name] regarding immigration case preparation and legal drafting workflow. Could you connect me?"],
              ["If they ask if the attorney knows you", "Not yet. I am reaching out because we help immigration firms reduce repetitive case prep and drafting time. It should be a short conversation if it is relevant."]
            ]}
          />
          <HomeworkField
            label="Write the main gatekeeper script from memory"
            field="mainGatekeeperFromMemory"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 4 ? (
        <LessonPanel eyebrow="Module 2" title="Gatekeeper rebuttal drills">
          <p className="lesson-copy">
            A gatekeeper objection is usually a routing test. Do not collapse into "okay, what is
            your email?" Ask one useful question, keep the topic specific, and move toward the
            right person, callback time, or short note.
          </p>
          <GatekeeperRebuttalDrill homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 5 ? (
        <LessonPanel eyebrow="Module 3" title="Appointment setting with the attorney">
          <p className="lesson-copy">
            Once the attorney or decision maker is reached, move quickly. The goal is not to explain
            every feature. The goal is to state the reason, create relevance, ask one to three
            qualifying questions, create curiosity, and book the appointment.
          </p>
          <div className="script-box compact-script">
            <strong>Attorney cold call script</strong>
            <br />
            Hi [Attorney Name], this is [Name] with Coverable. I will be brief. We help immigration
            law firms reduce the time their attorneys and paralegals spend on repetitive document
            prep, briefs, motions, and case materials using legal AI. I wanted to see if it would be
            worth showing you how it works for your firm.
          </div>
          <InfoBlock
            title="Then pause. If they are neutral or positive, ask"
            items={[
              "Is your team currently doing most of the drafting and case prep manually, or do you already have software helping with that?",
              "If manual: That is exactly where this tends to be useful. Would it be worth a quick 10-15 minute demo?",
              "If they use software: A lot of firms already have case management software, but still do drafting, briefs, motions, and supporting materials manually. Is that still happening on your end?",
              "Then book: I do not want to overexplain it on a random call. Are you better tomorrow morning or tomorrow afternoon?"
            ]}
          />
          <HomeworkField
            label="Write the attorney opener in your own words without making it longer"
            field="attorneyOpener"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 6 ? (
        <LessonPanel eyebrow="Module 3" title="Light qualification + curiosity">
          <p className="lesson-copy">
            Qualify lightly. Two to four questions is enough on the first call. If you interrogate
            the attorney, they will feel trapped. If you ask nothing, the pitch feels generic.
          </p>
          <div className="lesson-grid">
            <InfoBlock
              title="Best initial questions"
              items={[
                "Does your firm handle a steady volume of immigration cases?",
                "Are your paralegals doing most of the document prep manually right now?",
                "What types of immigration matters do you handle most often?",
                "Do briefs, motions, case packets, or supporting documents take up a lot of staff time?",
                "Are you trying to increase case volume without adding more staff?",
                "Do you already use any legal AI tools for drafting or case prep?",
                "Who besides you would be involved in reviewing something like this?"
              ]}
            />
            <InfoBlock
              title="Curiosity lines"
              items={[
                "Firms are usually losing hours per case on work that can now be systemized.",
                "Most firms do not realize how much profit they lose from manual prep time until they break it down per case.",
                "If your staff is spending hours on repeatable documents, this can create immediate leverage.",
                "This is not about replacing your team. It is about helping your team get through the repetitive work faster."
              ]}
            />
          </div>
          <HomeworkField
            label="Pick two qualification questions and one curiosity line you would actually use"
            field="qualificationPlan"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 7 ? (
        <LessonPanel eyebrow="Module 3" title="Book the demo">
          <p className="lesson-copy">
            Do not try to win the whole sale during the cold call. The appointment is the win. The
            booking ask should be direct, short, and framed around seeing the workflow instead of
            listening to a long explanation.
          </p>
          <ScriptLibrary
            scripts={[
              ["20-second appointment pitch", "Coverable helps immigration firms cut down the hours spent on repetitive drafting and case preparation. If your paralegals are spending 5-10 hours building packets, briefs, motions, or supporting documents, we help reduce that workload so your team can move cases faster. I wanted to see if a short walkthrough would make sense."],
              ["Direct booking", "The easiest next step is a quick walkthrough. It should only take 10-15 minutes, and you will know pretty quickly if it applies to your workflow. Are you better [Day/Time] or [Day/Time]?"],
              ["Alternative booking", "Rather than explain the whole platform over the phone, let me show you what it does with immigration case prep. Do you have 15 minutes tomorrow or the next day?"],
              ["Stronger booking", "If you are still preparing a lot of this manually, it is worth seeing. Let us put 15 minutes on the calendar and you can decide if it is relevant after seeing it."]
            ]}
          />
          <HomeworkField
            label="Write your preferred booking ask"
            field="bookingAsk"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 8 ? (
        <LessonPanel eyebrow="Module 3" title="Confirm the appointment and protect the show rate">
          <p className="lesson-copy">
            Booking is not finished until the invite is sent, the email is confirmed, and the
            prospect knows what the walkthrough will cover. Clear confirmation reduces no-shows.
          </p>
          <div className="script-box compact-script">
            <strong>After booking</strong>
            <br />
            Perfect. I have you down for [Day] at [Time]. I will send a calendar invite now. The
            walkthrough will be focused on how Coverable helps reduce document prep, drafting, and
            case material workload for immigration firms. Is [email] the best email?
            <br />
            <br />
            Great. Please accept the invite when it comes through so I know it landed.
          </div>
          <ScriptLibrary
            scripts={[
              ["Confirmation email", "Subject: Coverable walkthrough confirmed for [Day]\n\nHi [Attorney Name],\n\nConfirmed for [Day] at [Time].\n\nOn the walkthrough, I will show how Coverable helps immigration law firms reduce repetitive document preparation, legal drafting, briefs, motions, and case material workload so attorneys and paralegals can move cases faster.\n\nLooking forward to speaking.\n\nBest,\n[Name]"],
              ["No-show email", "Subject: Rescheduling Coverable walkthrough\n\nHi [Attorney Name],\n\nLooks like we missed each other for the Coverable walkthrough.\n\nNo problem - I know your schedule is busy. The reason I still think it is worth reconnecting is that Coverable may help reduce the time your team spends on repetitive immigration case prep, drafting, and supporting documents.\n\nAre you better later today or tomorrow to take a quick look?\n\nBest,\n[Name]"],
              ["No-show text", "Hi [Attorney Name], this is [Name] with Coverable. Looks like we missed each other for the walkthrough. Are you better later today or tomorrow to take a quick look?"]
            ]}
          />
        </LessonPanel>
      ) : null}

      {step === 9 ? (
        <LessonPanel eyebrow="Practice" title="Roleplay drills + quiz">
          <p className="lesson-copy">
            Practice should feel slightly uncomfortable. The rep needs to hold control when the
            gatekeeper blocks access and when the attorney gives a quick objection.
          </p>
          <div className="lesson-grid">
            <InfoBlock
              title="Gatekeeper transfer scenarios"
              items={[
                "Friendly receptionist.",
                "Skeptical assistant.",
                "Office manager blocker.",
                "Send info gatekeeper.",
                "Attorney is busy gatekeeper."
              ]}
            />
            <InfoBlock
              title="Attorney booking objections"
              items={[
                "I am busy.",
                "Send me information.",
                "We already have software.",
                "Not interested.",
                "I do not use AI."
              ]}
            />
          </div>
          <DayTwoQuiz homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 10 ? (
        <LessonPanel eyebrow="Homework" title="Finish Day 2">
          <p className="lesson-copy">
            Passing standard: the rep should score 80% or higher on the quiz, memorize the main
            gatekeeper script, memorize the attorney appointment-setting script, and prepare for
            live objection drills on Day 3.
          </p>
          <div className="homework-grid">
            <HomeworkField label="Rebuttal for: Send information" field="rebuttalSendInfo" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Rebuttal for: They're busy" field="rebuttalBusy" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Rebuttal for: Not interested" field="rebuttalNotInterested" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Rebuttal for: We already have software" field="rebuttalSoftware" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Link or note for recorded gatekeeper roleplay" field="gatekeeperRecording" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Link or note for recorded attorney booking roleplay" field="attorneyRecording" homework={homework} updateHomework={updateHomework} />
          </div>
          <button className="button" type="button" onClick={() => saveProgress("day2", 100)}>
            Mark Day 2 Complete
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

function ScriptLibrary({ scripts }) {
  return (
    <div className="script-practice">
      {scripts.map(([label, text]) => (
        <div className="script-box compact-script" key={label}>
          <strong>{label}</strong>
          <br />
          {text.split("\n").map((line, index) => (
            <Fragment key={`${label}-${index}`}>
              {line}
              {index < text.split("\n").length - 1 ? <br /> : null}
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}

function RewriteDrillDayTwo({ homework, updateHomework }) {
  return (
    <div className="drill-stack">
      <div className="compare-grid">
        <div className="compare-card bad">
          <strong>Blocked</strong>
          <p>Can I speak to the owner? I wanted to tell them about our AI software.</p>
        </div>
        <div className="compare-card good">
          <strong>Passed through</strong>
          <p>
            I am reaching out regarding legal document preparation and immigration case workflow.
            Who would be the best attorney to speak with about that?
          </p>
        </div>
      </div>
      <HomeworkField
        label="Rewrite the blocked version so it sounds professional and specific"
        field="gatekeeperRewrite"
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function GatekeeperRebuttalDrill({ homework, updateHomework }) {
  const [active, setActive] = useState("sendInfo");
  const rebuttals = {
    regarding: {
      label: "What is this regarding?",
      strong:
        "It is regarding how the firm is handling repetitive immigration document preparation, briefs, motions, and supporting case materials. Coverable helps reduce the staff time that goes into that work. Would [Attorney Name] be the right person for that?",
      field: "drillRegarding"
    },
    sendInfo: {
      label: "Send me information",
      strong:
        "I can send something over, but I do not want to send generic information to the wrong person. Is [Attorney Name] the one who reviews tools that affect paralegal workload and case preparation? Great. I will send a short overview, but it will make more sense with a 10-minute walkthrough. What does their calendar usually look like later this week?",
      field: "drillSendInfo"
    },
    busy: {
      label: "They're busy",
      strong:
        "I figured they would be. I do not need them right this second. Is there a better time today to catch them for a quick conversation about reducing case prep workload? If not, what is the best way to get a short note in front of them - direct email, office email, or callback time?",
      field: "drillBusy"
    },
    officeManager: {
      label: "Talk to the office manager",
      strong:
        "That works. Is the office manager involved in decisions around legal software and paralegal workflow, or do they usually bring the attorney in for that? I can start with the office manager, but I will likely need the attorney involved if it affects legal drafting and case prep.",
      field: "drillOfficeManager"
    },
    refuse: {
      label: "Refuses transfer",
      strong:
        "Understood. Before I send anything over, can I ask one quick question so I point this correctly - does the firm handle a high volume of immigration matters, or is immigration only a small part of the practice? This is most relevant when the team is spending real time on repetitive case packets, briefs, motions, and supporting documents.",
      field: "drillRefuse"
    },
    callback: {
      label: "Callback message",
      strong:
        "Please let [Attorney Name] know [Your Name] from Coverable called regarding reducing repetitive immigration case prep and legal drafting workload. I will also send a short note over. Best callback is [Phone Number]. Curiosity version: I called because we are helping immigration firms cut down the time spent preparing case documents, briefs, and supporting materials. It is easier to explain in 5-10 minutes.",
      field: "drillCallback"
    }
  };
  const current = rebuttals[active];

  return (
    <div className="drill-stack">
      <div className="segmented-buttons">
        {Object.entries(rebuttals).map(([key, item]) => (
          <button
            className={active === key ? "active" : ""}
            key={key}
            onClick={() => setActive(key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="script-box compact-script">
        <strong>Strong response</strong>
        <br />
        {current.strong}
      </div>
      <HomeworkField
        label={`Write your response to: ${current.label}`}
        field={current.field}
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function DayTwoQuiz({ homework, updateHomework }) {
  const questions = [
    "What is the goal of a gatekeeper call?",
    "Why should reps avoid saying \"I am selling software\"?",
    "What should the rep say when asked \"What is this regarding?\"",
    "How should the rep handle \"send me information\"?",
    "What is the goal of the attorney cold call?",
    "Name three qualification questions.",
    "Why should reps avoid overexplaining before the demo?",
    "Give one strong curiosity line.",
    "What should the rep do after booking an appointment?",
    "What should the rep say after a no-show?"
  ];

  return (
    <div className="quiz-stack">
      <span className="eyebrow">Quiz - passing score 80%</span>
      {questions.map((question, index) => (
        <HomeworkField
          field={`day2Quiz${index}`}
          homework={homework}
          key={question}
          label={question}
          updateHomework={updateHomework}
        />
      ))}
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
