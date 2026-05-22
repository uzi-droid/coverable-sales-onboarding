"use client";

import { useEffect, useMemo, useState } from "react";
import { bootcampDays, initialState, objectionBank } from "@/lib/demoData";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

const STORAGE_KEY = "coverable-sales-command-next-v1";

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
      const { data, error } = await supabase.auth.getSession();
      if (error) setNotice(error.message);
      setSession(data.session);
      if (data.session) await loadLiveState(supabase, data.session.user.id);
      setMounted(true);
      setLoading(false);
      setLoadingSlow(false);
      window.clearTimeout(slowTimer);
    }

    boot();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) await loadLiveState(supabase, nextSession.user.id);
    });

    return () => {
      window.clearTimeout(slowTimer);
      subscription.unsubscribe();
    };
  }, [configured]);

  async function loadLiveState(supabase, currentUserId) {
    setNotice("");

    await ensureProfile(supabase);

    const [{ data: profiles, error: profileError }, { data: progress, error: progressError }, { data: crm, error: crmError }] =
      await Promise.all([
        supabase.from("profiles").select("id, full_name, email, start_date").order("created_at", { ascending: true }),
        supabase.from("onboarding_progress").select("user_id, module_id, percent_complete"),
        supabase
          .from("crm_activities")
          .select("id, user_id, firm_name, contact_name, contact_role, channel, outcome, objection, notes, next_follow_up, created_at")
          .order("created_at", { ascending: false })
      ]);

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
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (user) {
        reps.push({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "New Rep",
          email: user.email,
          initials: initialsFor(user.user_metadata?.full_name || user.email || "New Rep"),
          startDate: new Date().toISOString().slice(0, 10)
        });
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
  return (
    <div className="course-list">
      {bootcampDays.map((day) => {
        const value = state.progress[currentRep.id]?.[day.id] || 0;
        const complete = value === 100;
        const nextValue = value >= 75 ? 100 : value + 25;
        return (
          <article className="card training-card" key={day.id}>
            <div className="course-row">
              <div className="course-day">{day.title.split(":")[0]}</div>
              <div>
                <h4>{day.title.replace(`${day.title.split(":")[0]}: `, "")}</h4>
                <p className="small">{day.focus}</p>
              </div>
              <span className={complete ? "status done" : "status"}>{complete ? "Done" : `${value}%`}</span>
            </div>
            <div className="script-box compact-script">{day.script}</div>
            <div className="progress-track" style={{ "--progress": `${value}%` }}>
              <div className="progress-fill" />
            </div>
            <div className="module-actions">
              <button className={complete ? "ghost" : "button"} type="button" onClick={() => saveProgress(day.id, complete ? 75 : nextValue)}>
                {complete ? "Reopen" : nextValue === 100 ? "Finish" : "Continue"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
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

async function ensureProfile(supabase) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "New Rep",
      email: user.email,
      role: "rep"
    },
    { onConflict: "id" }
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
