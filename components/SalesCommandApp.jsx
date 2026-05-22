"use client";

import { useEffect, useMemo, useState } from "react";
import { bootcampDays, initialState, objectionBank } from "@/lib/demoData";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const STORAGE_KEY = "coverable-sales-command-next-v1";

function cloneInitialState() {
  return JSON.parse(JSON.stringify(initialState));
}

function loadState() {
  if (typeof window === "undefined") return cloneInitialState();
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return cloneInitialState();
  try {
    return { ...cloneInitialState(), ...JSON.parse(saved) };
  } catch {
    return cloneInitialState();
  }
}

function saveState(nextState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export default function SalesCommandApp() {
  const [state, setState] = useState(cloneInitialState);
  const [mounted, setMounted] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  function updateState(updater) {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      saveState(next);
      return next;
    });
  }

  const currentRep = state.reps.find((rep) => rep.id === state.currentRepId) || state.reps[0];
  const rankedReps = useMemo(() => rankReps(state), [state]);
  const currentStats = getRepStats(state, currentRep.id);

  if (!mounted) return null;

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
          {configured
            ? "Supabase is configured. Next step is wiring live reads and writes."
            : "Demo mode is active until the free Supabase project keys are added."}
        </div>
      </aside>

      <main className="main">
        <section className="topbar">
          <div>
            <div className="eyebrow">Rep mode / {currentRep.name}</div>
            <h2>{viewTitle(state.activeView)}</h2>
            <p>{viewSubtitle(state.activeView)}</p>
          </div>
          <div className="quick-actions">
            <a className="ghost" href="/login">
              Login
            </a>
            <button className="ghost" onClick={() => updateState((draft) => ({ ...draft, activeView: "crm" }))}>
              Log Activity
            </button>
            <button
              className="danger"
              onClick={() => updateState(cloneInitialState())}
              type="button"
            >
              Reset Demo
            </button>
          </div>
        </section>

        {state.activeView === "team" ? (
          <TeamView state={state} rankedReps={rankedReps} currentStats={currentStats} />
        ) : null}
        {state.activeView === "crm" ? (
          <CrmView state={state} currentRep={currentRep} updateState={updateState} />
        ) : null}
        {state.activeView === "course" ? (
          <CourseView state={state} currentRep={currentRep} updateState={updateState} />
        ) : null}
        {state.activeView === "coach" ? <CoachView /> : null}
      </main>
    </div>
  );
}

function TeamView({ state, rankedReps, currentStats }) {
  return (
    <>
      <div className="grid four">
        <Metric label="My onboarding" value={`${currentStats.onboarding}%`} detail="Course completion" />
        <Metric label="My CRM records" value={currentStats.calls} detail="Sales touches logged" />
        <Metric label="My demos booked" value={currentStats.demos} detail="Qualified opportunities" />
        <Metric label="My closed clients" value={currentStats.closed} detail="Deals and pilots" />
      </div>

      <div className="section-title">
        <h3>Sales Floor</h3>
        <span className="pill">Everyone can see the race</span>
      </div>

      <div className="grid two">
        <article className="card">
          <h4>Rep Progress</h4>
          {rankedReps.map((rep, index) => (
            <div className="leader-row" key={rep.id}>
              <div className="rank">{index + 1}</div>
              <div>
                <div className="rep-name">{rep.name}</div>
                <div className="small">
                  {rep.onboarding}% course, {rep.calls} CRM records, {rep.demos} demos
                </div>
                <div className="progress-track" style={{ "--progress": `${rep.onboarding}%` }}>
                  <div className="progress-fill" />
                </div>
              </div>
              <div className="score">{rep.score}</div>
            </div>
          ))}
        </article>

        <article className="card">
          <h4>What Feeds This Page</h4>
          <ul className="compact-list">
            <li>Course progress comes from completed onboarding modules.</li>
            <li>Sales stats come from CRM activity logged by each rep.</li>
            <li>Demos, follow-ups, and closed clients earn more points than raw calls.</li>
            <li>Later, admin can review the same data with coaching notes.</li>
          </ul>
          <div className="script-box">
            First milestone: reps can log in, log activity, and see where they stand against the
            team from real database data.
          </div>
        </article>
      </div>

      <div className="section-title">
        <h3>Latest Sales Activity</h3>
        <span className="pill">{state.crm.length} records</span>
      </div>
      <CrmTable state={state} entries={state.crm.slice(0, 6)} />
    </>
  );
}

function CrmView({ state, currentRep, updateState }) {
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

    updateState((draft) => ({ ...draft, crm: [entry, ...draft.crm] }));
    event.currentTarget.reset();
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

function CourseView({ state, currentRep, updateState }) {
  return (
    <div className="grid two">
      {bootcampDays.map((day) => {
        const value = state.progress[currentRep.id]?.[day.id] || 0;
        return (
          <article className="card training-card" key={day.id}>
            <div>
              <span className="pill">{value}% complete</span>
              <h4>{day.title}</h4>
              <p className="small">{day.focus}</p>
            </div>
            <ul>{day.activities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
            <div className="script-box">{day.script}</div>
            <div className="progress-track" style={{ "--progress": `${value}%` }}>
              <div className="progress-fill" />
            </div>
            <div className="module-actions">
              {[0, 25, 50, 75, 100].map((amount) => (
                <button
                  className="ghost"
                  key={amount}
                  type="button"
                  onClick={() =>
                    updateState((draft) => ({
                      ...draft,
                      progress: {
                        ...draft.progress,
                        [currentRep.id]: {
                          ...draft.progress[currentRep.id],
                          [day.id]: amount
                        }
                      }
                    }))
                  }
                >
                  {amount}%
                </button>
              ))}
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

function getRepStats(state, repId) {
  const entries = state.crm.filter((entry) => entry.repId === repId);
  const progressValues = Object.values(state.progress[repId] || {});
  const onboarding = Math.round(progressValues.reduce((sum, value) => sum + value, 0) / bootcampDays.length);
  const calls = entries.length;
  const demos = entries.filter((entry) => entry.outcome === "Demo Booked").length;
  const closed = entries.filter((entry) => entry.outcome === "Closed").length;
  const followUps = entries.filter((entry) => entry.outcome === "Follow-up").length;
  const attorneyReached = entries.filter((entry) => entry.outcome === "Attorney Reached").length;
  const score = calls * 5 + attorneyReached * 12 + followUps * 8 + demos * 20 + closed * 70 + onboarding;
  return { calls, demos, closed, followUps, onboarding, score };
}

function rankReps(state) {
  return state.reps
    .map((rep) => ({ ...rep, ...getRepStats(state, rep.id) }))
    .sort((a, b) => b.score - a.score);
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
