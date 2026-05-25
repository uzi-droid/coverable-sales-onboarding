"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { bootcampDays, initialState } from "@/lib/demoData";
import { immigrationScriptStates, SCRIPT_START_STATE_ID } from "@/lib/immigrationScriptFlow";
import {
  criminalDefenseScriptStates,
  CRIMINAL_DEFENSE_SCRIPT_START_STATE_ID
} from "@/lib/criminalDefenseScriptFlow";
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
        { data: crm, error: crmError },
        { data: scriptCalls, error: scriptCallsError, legacy: legacyScriptMetrics }
      ] = await withTimeout(
        Promise.all([
          supabase.from("profiles").select("id, full_name, email, role, start_date").order("created_at", { ascending: true }),
          supabase.from("onboarding_progress").select("user_id, module_id, percent_complete"),
          supabase
            .from("crm_activities")
            .select("*")
            .order("created_at", { ascending: false }),
          loadScriptCallMetrics(supabase)
        ]),
        "Workspace data took too long to load"
      );

      const scriptTableMissing = isMissingScriptCallTable(scriptCallsError);
      const firstError = profileError || progressError || crmError || (scriptTableMissing ? null : scriptCallsError);
      if (firstError) {
        setNotice(firstError.message);
        return;
      }
      if (scriptTableMissing) {
        setNotice("Script call tracking needs its Supabase setup script before calls can be counted.");
      } else if (legacyScriptMetrics) {
        setNotice("Run the updated Script metrics SQL in Supabase to begin response analytics.");
      }

      const reps = (profiles || []).map((profile) => ({
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role || "rep",
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
        scriptCalls: (scriptCalls || []).map((row) => ({
          id: row.id,
          repId: row.user_id,
          buttonClicks: Number(row.button_clicks || 0),
          responses: Array.isArray(row.response_path) ? row.response_path : [],
          practiceArea: row.practice_area || "immigration",
          createdAt: row.created_at?.slice(0, 10) || ""
        })),
        crm: (crm || []).map((row) => ({
          id: row.id,
          repId: row.user_id,
          firm: row.firm_name,
          contact: row.contact_name,
          contactRole: row.contact_role,
          outcome: row.outcome,
          channel: row.channel,
          objection: row.objection || "",
          saleAmount: Number(row.sale_amount || 0),
          contractTerm: row.contract_term || "",
          closeDate: row.close_date || "",
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
        scriptCalls: [],
        crm: []
      };
    });
  }

  async function repairProfile(supabase) {
    try {
      const { data } = await withTimeout(supabase.auth.getUser(), "User profile took too long");
      const user = data.user;
      if (user) {
        const { data: existing } = await withTimeout(
          supabase.from("profiles").select("id").eq("id", user.id).maybeSingle(),
          "Profile repair took too long"
        );
        if (!existing) {
          await withTimeout(
            supabase.from("profiles").insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "New Rep",
              email: user.email
            }),
            "Profile repair took too long"
          );
        }
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
      return true;
    }

    const supabase = createBrowserSupabaseClient();
    const payload = {
      user_id: session.user.id,
      firm_name: entry.firm,
      contact_name: entry.contact,
      contact_role: entry.contactRole,
      outcome: entry.outcome,
      channel: entry.channel,
      objection: entry.objection || null,
      sale_amount: entry.saleAmount || 0,
      contract_term: entry.contractTerm || null,
      close_date: entry.closeDate || null,
      next_follow_up: entry.nextFollowUp || null,
      notes: entry.notes
    };

    let { error } = await supabase.from("crm_activities").insert(payload);

    if (error && isMissingCrmSalesFields(error)) {
      const { sale_amount, contract_term, close_date, ...fallbackPayload } = payload;
      const fallback = await supabase.from("crm_activities").insert(fallbackPayload);
      error = fallback.error;
      if (!error) {
        setNotice("CRM saved. Run the sales-fields SQL in Supabase so sale prices sync to the leaderboard.");
      }
    }

    if (error) {
      setNotice(error.message);
      return false;
    }

    form.reset();
    await loadLiveState(supabase, session.user.id);
    return true;
  }

  async function recordScriptCall(buttonClicks, responses, practiceArea = "immigration") {
    const repId = currentRep?.id;
    if (!repId) return false;

    const entry = {
      id: crypto.randomUUID(),
      repId,
      buttonClicks,
      responses,
      practiceArea,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    if (!configured || !session) {
      updateState((draft) => ({ ...draft, scriptCalls: [entry, ...(draft.scriptCalls || [])] }));
      return true;
    }

    const supabase = createBrowserSupabaseClient();
    let { error } = await supabase.from("script_call_metrics").insert({
      user_id: session.user.id,
      button_clicks: buttonClicks,
      response_path: responses,
      practice_area: entry.practiceArea
    });

    if (isMissingScriptPathFields(error)) {
      const fallback = await supabase.from("script_call_metrics").insert({
        user_id: session.user.id,
        button_clicks: buttonClicks
      });
      error = fallback.error;
      if (!error) {
        setNotice("Call counted. Run the updated Script metrics SQL in Supabase to capture response analytics.");
      }
    }

    if (error) {
      setNotice(
        isMissingScriptCallTable(error)
          ? "Call tracking is not enabled yet. Run supabase/script-call-metrics.sql in Supabase."
          : `Call was not counted: ${error.message}`
      );
      return false;
    }

    await loadLiveState(supabase, session.user.id);
    return true;
  }

  async function recordFirmCall(firmId) {
    const repId = currentRep?.id;
    if (!repId) return false;

    if (!configured || !session) {
      const calledAt = new Date().toISOString();
      updateState((draft) => ({
        ...draft,
        firms: (draft.firms || []).map((firm) =>
          firm.id === firmId
            ? {
                ...firm,
                calledBy: repId,
                calledAt,
                callCount: Number(firm.callCount || 0) + 1
              }
            : firm
        )
      }));
      return true;
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.rpc("mark_firm_called", { p_firm_id: firmId });
    if (error) {
      setNotice(
        isMissingFirmsSetup(error)
          ? "Firms calling is not enabled yet. Run supabase/firms.sql in Supabase and import the supplied CSV."
          : `Call was not marked: ${error.message}`
      );
      return false;
    }

    return true;
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
  const activeView =
    state.activeView === "coach" || (state.activeView === "admin" && currentRep?.role !== "admin")
      ? "team"
      : state.activeView;

  if (!mounted || loading) return <LoadingShell slow={loadingSlow} notice={notice} />;

  if (configured && !session) return <LoginRequired />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="mark">C</div>
          <h1>Coverable</h1>
        </div>

        {!liveMode ? (
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
        ) : null}

        <nav className="nav">
          {[
            ["team", "Team"],
            ["firms", "Firms"],
            ["crm", "CRM"],
            ["script", "Script"],
            ["course", "Course"],
            ...(currentRep?.role === "admin" ? [["admin", "Admin"]] : [])
          ].map(([id, label]) => (
            <button
              key={id}
              className={activeView === id ? "active" : ""}
              onClick={() => updateState((draft) => ({ ...draft, activeView: id }))}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          {liveMode ? (
            <button className="ghost" onClick={signOut} type="button">
              Sign out
            </button>
          ) : (
            <>
              <a className="ghost" href="/login">
                Login
              </a>
              <button className="ghost" onClick={() => updateState(cloneInitialState())} type="button">
                Reset
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="main">
        {notice ? <div className="notice">{notice}</div> : null}
        {workspaceLoading ? (
          <div className="inline-loading">
            <div className="loading-bar" />
            <span>Syncing sales floor...</span>
          </div>
        ) : null}

        {activeView === "team" ? (
          <TeamView
            state={state}
            rankedReps={rankedReps}
            currentStats={currentStats}
            setActiveView={(view) => updateState((draft) => ({ ...draft, activeView: view }))}
          />
        ) : null}
        {activeView === "crm" ? (
          <CrmView state={state} currentRep={currentRep} saveCrmEntry={saveCrmEntry} />
        ) : null}
        {activeView === "firms" ? (
          <FirmsView
            configured={configured}
            currentRep={currentRep}
            recordFirmCall={recordFirmCall}
            session={session}
            setNotice={setNotice}
            state={state}
          />
        ) : null}
        {activeView === "script" ? (
          <ScriptView currentRep={currentRep} recordScriptCall={recordScriptCall} />
        ) : null}
        {activeView === "course" ? (
          <CourseView
            configured={configured}
            currentRep={currentRep}
            saveProgress={saveProgress}
            session={session}
            setNotice={setNotice}
            state={state}
          />
        ) : null}
        {activeView === "admin" && currentRep?.role === "admin" ? (
          <AdminView
            refresh={() => loadLiveState(createBrowserSupabaseClient(), session.user.id)}
            session={session}
            state={state}
          />
        ) : null}
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
            <h3>{nextTask.title}</h3>
          </div>
          <button className="button" type="button" onClick={() => setActiveView(nextTask.view)}>
            {nextTask.action}
          </button>
        </article>

        <article className="card score-card">
          <strong>{currentStats.calls}</strong>
          <div className="small">
            calls / {formatAverageClicks(currentStats.averageClicks)} avg clicks
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
                <span>{rep.onboarding}%</span>
                <span>{rep.calls} calls</span>
                <span>{formatAverageClicks(rep.averageClicks)} avg clicks</span>
                <span>{rep.demos} demos</span>
                <span>{rep.closed} closed</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">No reps</div>
        )}
      </article>

      <TeamResults state={state} entries={state.crm} />
    </>
  );
}

function FirmsView({ configured, currentRep, recordFirmCall, session, setNotice, state }) {
  const pageSize = 50;
  const [firms, setFirms] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [practiceArea, setPracticeArea] = useState("All");
  const [status, setStatus] = useState("Available");
  const [selectedId, setSelectedId] = useState("");
  const [loadingFirms, setLoadingFirms] = useState(false);
  const [callingId, setCallingId] = useState("");
  const liveMode = configured && Boolean(session);
  const selectedFirm = firms.find((firm) => firm.id === selectedId);

  async function loadFirms() {
    setLoadingFirms(true);
    if (!liveMode) {
      const query = search.toLowerCase();
      const filtered = (state.firms || []).filter((firm) => {
        const matchesPractice = practiceArea === "All" || firm.practiceArea === practiceArea;
        const matchesStatus =
          status === "All" ||
          (status === "Available" && !firm.calledAt) ||
          (status === "Called" && Boolean(firm.calledAt)) ||
          (status === "Mine" && firm.calledBy === currentRep.id);
        const matchesSearch =
          !query ||
          [firm.firmName, firm.attorney, firm.phone, firm.email, firm.city, firm.state]
            .join(" ")
            .toLowerCase()
            .includes(query);
        return matchesPractice && matchesStatus && matchesSearch;
      });
      setTotal(filtered.length);
      setFirms(filtered.slice(page * pageSize, page * pageSize + pageSize));
      setLoadingFirms(false);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    let request = supabase
      .from("firms")
      .select(
        "id, lead_attorney_full_name, first_name, last_name, firm_name, practice_area, website, firm_phone, attorney_email, linkedin_url, title, address, city, state, zip, source_url, confidence_score, notes, data_sources, outreach_tier, email_domain, free_email, lane_target, email_is_valid, called_by, called_at, call_count",
        { count: "exact" }
      )
      .order("firm_name", { ascending: true });

    if (practiceArea !== "All") request = request.eq("practice_area", practiceArea);
    if (status === "Available") request = request.is("called_at", null);
    if (status === "Called") request = request.not("called_at", "is", null);
    if (status === "Mine") request = request.eq("called_by", currentRep.id);
    if (search) {
      const term = search.replace(/[,%()]/g, " ").trim();
      if (term) {
        request = request.or(
          `firm_name.ilike.%${term}%,lead_attorney_full_name.ilike.%${term}%,attorney_email.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`
        );
      }
    }

    const { data, error, count } = await request.range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) {
      setFirms([]);
      setTotal(0);
      setNotice(
        isMissingFirmsSetup(error)
          ? "Firms is ready in the app. Run supabase/firms.sql and import the cleaned CSV to load your lead list."
          : error.message
      );
    } else {
      setFirms((data || []).map(mapFirmRow));
      setTotal(count || 0);
    }
    setLoadingFirms(false);
  }

  useEffect(() => {
    loadFirms();
    // The loaded page intentionally refreshes whenever filters or demo call markings change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode, page, practiceArea, search, status, state.firms]);

  function submitSearch(event) {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  }

  function chooseFilter(setter, value) {
    setPage(0);
    setter(value);
  }

  async function callFirm(firm) {
    setCallingId(firm.id);
    const saved = await recordFirmCall(firm.id);
    if (saved) {
      setNotice(`${firm.firmName || "Firm"} marked called by ${currentRep.name}.`);
      await loadFirms();
      setSelectedId(firm.id);
      if (liveMode && firm.phone) window.location.href = `tel:${firm.phone}`;
    }
    setCallingId("");
  }

  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="firms-page">
      <div className="firms-head">
        <div>
          <h2>Firms</h2>
          <span className="small">
            {total.toLocaleString()} {total === 1 ? "lead" : "leads"}
          </span>
        </div>
        <div className="firms-paging">
          <button className="ghost" disabled={page === 0} onClick={() => setPage((value) => value - 1)} type="button">
            Previous
          </button>
          <span>
            {page + 1} / {lastPage}
          </span>
          <button
            className="ghost"
            disabled={page + 1 >= lastPage}
            onClick={() => setPage((value) => value + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      <form className="firms-toolbar" onSubmit={submitSearch}>
        <input
          aria-label="Search firms"
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search firm, attorney, city"
          value={searchInput}
        />
        <select
          aria-label="Filter practice area"
          onChange={(event) => chooseFilter(setPracticeArea, event.target.value)}
          value={practiceArea}
        >
          <option value="All">All practices</option>
          <option value="criminal_defense">Criminal defense</option>
          <option value="immigration">Immigration</option>
          <option value="personal_injury">Personal injury</option>
          <option value="estate_planning">Estate planning</option>
          <option value="family_law">Family law</option>
          <option value="insurance_defense">Insurance defense</option>
          <option value="business_law">Business law</option>
          <option value="other">Other</option>
        </select>
        <select aria-label="Filter call status" onChange={(event) => chooseFilter(setStatus, event.target.value)} value={status}>
          <option>Available</option>
          <option>Mine</option>
          <option>Called</option>
          <option>All</option>
        </select>
        <button className="button" type="submit">
          Search
        </button>
      </form>

      <section className="firms-ledger">
        {loadingFirms ? (
          <div className="inline-loading">
            <div className="loading-bar" />
            <span>Loading firms...</span>
          </div>
        ) : firms.length ? (
          <div className="table-wrap firms-table-wrap">
            <table className="firms-table">
              <thead>
                <tr>
                  <th>Firm</th>
                  <th>Practice</th>
                  <th>Location</th>
                  <th>Phone</th>
                  <th>Last called by</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {firms.map((firm) => {
                  const caller = state.reps.find((rep) => rep.id === firm.calledBy);
                  return (
                    <tr className={selectedId === firm.id ? "selected" : ""} key={firm.id}>
                      <td>
                        <strong>{firm.firmName || "-"}</strong>
                        <div className="small">{firm.attorney || "-"}</div>
                      </td>
                      <td>{formatPracticeArea(firm.practiceArea)}</td>
                      <td>{[firm.city, firm.state].filter(Boolean).join(", ") || "-"}</td>
                      <td>
                        {firm.phone ? (
                          <button
                            className="firm-phone"
                            disabled={callingId === firm.id}
                            onClick={() => callFirm(firm)}
                            type="button"
                          >
                            {callingId === firm.id ? "Marking..." : formatPhone(firm.phone)}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {firm.calledAt ? (
                          <>
                            <strong>{caller?.name || "Rep"}</strong>
                            <div className="small">{formatDateTime(firm.calledAt)}</div>
                          </>
                        ) : (
                          <span className="small">Available</span>
                        )}
                      </td>
                      <td>
                        <button className="row-action" onClick={() => setSelectedId(firm.id)} type="button">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No matching firms</div>
        )}
      </section>

      {selectedFirm ? (
        <aside className="firm-detail card">
          <div className="crm-detail-head">
            <div>
              <h3>{selectedFirm.firmName}</h3>
              <span className="small">{selectedFirm.attorney || "No contact listed"}</span>
            </div>
            <button aria-label="Close firm detail" className="row-action" onClick={() => setSelectedId("")} type="button">
              Close
            </button>
          </div>
          <div className="firm-detail-grid">
            <DetailItem label="Practice" value={formatPracticeArea(selectedFirm.practiceArea)} />
            <DetailItem label="Role" value={selectedFirm.title || "-"} />
            <DetailItem label="Phone" value={formatPhone(selectedFirm.phone)} />
            <DetailItem label="Email" value={selectedFirm.email || "-"} />
            <DetailItem
              label="Address"
              value={[selectedFirm.address, selectedFirm.city, selectedFirm.state, selectedFirm.zip].filter(Boolean).join(", ") || "-"}
            />
            <DetailItem label="Tier" value={selectedFirm.outreachTier || "-"} />
            <DetailItem label="Lane" value={selectedFirm.laneTarget || "-"} />
            <DetailItem label="Confidence" value={selectedFirm.confidenceScore ? `${selectedFirm.confidenceScore}` : "-"} />
            <DetailItem label="Email valid" value={selectedFirm.emailValid ? "Yes" : "No"} />
            <DetailItem label="Free email" value={selectedFirm.freeEmail ? "Yes" : "No"} />
            <DetailItem label="Email domain" value={selectedFirm.emailDomain || "-"} />
            <DetailItem label="Calls" value={`${selectedFirm.callCount || 0}`} />
          </div>
          <div className="firm-links">
            {selectedFirm.website ? (
              <a className="row-action" href={selectedFirm.website} rel="noreferrer" target="_blank">
                Website
              </a>
            ) : null}
            {selectedFirm.linkedinUrl ? (
              <a className="row-action" href={selectedFirm.linkedinUrl} rel="noreferrer" target="_blank">
                LinkedIn
              </a>
            ) : null}
            {selectedFirm.sourceUrl ? (
              <a className="row-action" href={selectedFirm.sourceUrl} rel="noreferrer" target="_blank">
                Source
              </a>
            ) : null}
          </div>
          {selectedFirm.notes ? (
            <div className="crm-detail-note">
              <span>Source notes</span>
              <p>{selectedFirm.notes}</p>
            </div>
          ) : null}
          {selectedFirm.dataSources ? (
            <div className="crm-detail-note">
              <span>Data sources</span>
              <p>{selectedFirm.dataSources}</p>
            </div>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

function CrmView({ state, currentRep, saveCrmEntry }) {
  const [showEntry, setShowEntry] = useState(false);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All");
  const [channel, setChannel] = useState("All");
  const [selectedId, setSelectedId] = useState("");
  const entries = state.crm.filter((entry) => entry.repId === currentRep.id);
  const stats = getRepStats(state, currentRep.id);
  const stages = ["All", "Call Logged", "Attorney Reached", "Demo Booked", "Follow-up", "Closed", "No Answer", "Not Interested"];
  const channels = ["All", "Phone", "Email", "LinkedIn", "Text", "Demo"];
  const query = search.trim().toLowerCase();
  const filteredEntries = entries.filter((entry) => {
    const matchesStage = stage === "All" || entry.outcome === stage;
    const matchesChannel = channel === "All" || entry.channel === channel;
    const matchesSearch =
      !query ||
      [entry.firm, entry.contact, entry.outcome, entry.channel, entry.notes, entry.objection]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return matchesStage && matchesChannel && matchesSearch;
  });
  const followUps = entries
    .filter((entry) => entry.nextFollowUp && entry.outcome !== "Closed")
    .sort((first, second) => first.nextFollowUp.localeCompare(second.nextFollowUp))
    .slice(0, 3);
  const selectedEntry = entries.find((entry) => entry.id === selectedId);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const saleAmount = Number(form.get("saleAmount") || 0);
    const entry = {
      id: crypto.randomUUID(),
      repId: currentRep.id,
      firm: form.get("firm").trim(),
      contact: form.get("contact").trim(),
      contactRole: form.get("contactRole"),
      outcome: form.get("outcome"),
      channel: form.get("channel"),
      objection: form.get("objection").trim(),
      saleAmount: Number.isFinite(saleAmount) ? saleAmount : 0,
      contractTerm: form.get("contractTerm").trim(),
      closeDate: form.get("closeDate"),
      nextFollowUp: form.get("nextFollowUp"),
      notes: form.get("notes").trim(),
      createdAt: new Date().toISOString().slice(0, 10)
    };

    const saved = await saveCrmEntry(entry, event.currentTarget);
    if (saved) setShowEntry(false);
  }

  return (
    <div className="crm-page">
      <div className="crm-head">
        <div className="crm-summary-grid">
          <Metric label="Activity" value={stats.activity} />
          <Metric label="Demos" value={stats.demos} />
          <Metric label="Closed" value={stats.closed} />
          <Metric label="Revenue" value={formatMoney(stats.revenue)} />
        </div>
        <button className="button crm-new" onClick={() => setShowEntry((open) => !open)} type="button">
          {showEntry ? "Close" : "New activity"}
        </button>
      </div>

      {followUps.length ? (
        <section className="crm-followups">
          <h3>Next</h3>
          {followUps.map((entry) => (
            <button className="followup-item" key={entry.id} onClick={() => setSelectedId(entry.id)} type="button">
              <span>{formatShortDate(entry.nextFollowUp)}</span>
              <strong>{entry.firm}</strong>
              <em>{entry.outcome}</em>
            </button>
          ))}
        </section>
      ) : null}

      {showEntry ? (
        <article className="card crm-entry-card">
          <form className="crm-form" onSubmit={handleSubmit}>
          <Field label="Firm">
            <input name="firm" required />
          </Field>
          <Field label="Contact">
            <input name="contact" required />
          </Field>
          <Field label="Role">
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
            <input name="objection" />
          </Field>
          <Field label="Sale amount">
            <input name="saleAmount" min="0" step="0.01" type="number" />
          </Field>
          <Field label="Term">
            <select name="contractTerm">
              <option value="">None</option>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annual</option>
              <option>Pilot</option>
            </select>
          </Field>
          <Field label="Close">
            <input name="closeDate" type="date" />
          </Field>
          <Field label="Follow-up">
            <input name="nextFollowUp" type="date" />
          </Field>
          <Field label="Notes" wide>
            <textarea name="notes" required />
          </Field>
          <button className="button crm-submit" type="submit">
            Add
          </button>
          </form>
        </article>
      ) : null}

      <section className="crm-ledger">
        <div className="crm-toolbar">
          <input
            aria-label="Search activity"
            className="crm-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            value={search}
          />
          <select aria-label="Filter stage" onChange={(event) => setStage(event.target.value)} value={stage}>
            {stages.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select aria-label="Filter channel" onChange={(event) => setChannel(event.target.value)} value={channel}>
            {channels.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <CrmTable entries={filteredEntries} onSelect={setSelectedId} selectedId={selectedId} />
      </section>

      {selectedEntry ? <CrmDetail entry={selectedEntry} onClose={() => setSelectedId("")} /> : null}
    </div>
  );
}

function ScriptView({ currentRep, recordScriptCall }) {
  const [practiceArea, setPracticeArea] = useState("immigration");
  const scriptDefinition =
    practiceArea === "criminal-defense"
      ? {
          states: criminalDefenseScriptStates,
          startStateId: CRIMINAL_DEFENSE_SCRIPT_START_STATE_ID
        }
      : {
          states: immigrationScriptStates,
          startStateId: SCRIPT_START_STATE_ID
        };
  const [stateId, setStateId] = useState(SCRIPT_START_STATE_ID);
  const [history, setHistory] = useState([]);
  const [repName, setRepName] = useState(currentRep?.name || "");
  const [callbackNumber, setCallbackNumber] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [loggingCall, setLoggingCall] = useState(false);
  const [buttonClicks, setButtonClicks] = useState(0);
  const [responsePath, setResponsePath] = useState([]);
  const topRef = useRef(null);
  const scriptTextRef = useRef(null);
  const state = scriptDefinition.states[stateId] || scriptDefinition.states[scriptDefinition.startStateId];
  const script = state.script
    .split("[REP NAME]")
    .join(repName.trim() || "[REP NAME]")
    .split("[NUMBER]")
    .join(callbackNumber.trim() || "[NUMBER]");

  useEffect(() => {
    setRepName(currentRep?.name || "");
  }, [currentRep?.id, currentRep?.name]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" });
  }, [stateId]);

  function clearCopyState() {
    setCopyStatus("");
    window.getSelection()?.removeAllRanges();
  }

  function selectPracticeArea(nextPracticeArea) {
    if (nextPracticeArea === practiceArea) return;
    const nextStartStateId =
      nextPracticeArea === "criminal-defense" ? CRIMINAL_DEFENSE_SCRIPT_START_STATE_ID : SCRIPT_START_STATE_ID;
    setPracticeArea(nextPracticeArea);
    setStateId(nextStartStateId);
    setHistory([]);
    setButtonClicks(0);
    setResponsePath([]);
    clearCopyState();
  }

  function moveTo(button) {
    setHistory((path) => [...path, state.id]);
    setButtonClicks((count) => count + 1);
    setResponsePath((path) => [
      ...path,
      { stateId: state.id, state: state.title, audience: state.audience, response: button.label }
    ]);
    setStateId(button.nextStateId);
    clearCopyState();
  }

  function goBack() {
    setHistory((path) => {
      if (!path.length) return path;
      setStateId(path[path.length - 1]);
      setButtonClicks((count) => Math.max(0, count - 1));
      setResponsePath((responses) => responses.slice(0, -1));
      return path.slice(0, -1);
    });
    clearCopyState();
  }

  async function restart() {
    if (loggingCall) return;
    setLoggingCall(true);
    await recordScriptCall(buttonClicks, responsePath, practiceArea);
    setStateId(scriptDefinition.startStateId);
    setHistory([]);
    setButtonClicks(0);
    setResponsePath([]);
    clearCopyState();
    setLoggingCall(false);
  }

  async function copyScript() {
    let copied = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(script);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      const helper = document.createElement("textarea");
      helper.value = script;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      copied = typeof document.execCommand === "function" && document.execCommand("copy");
      document.body.removeChild(helper);
    }

    if (!copied && scriptTextRef.current) {
      const range = document.createRange();
      range.selectNodeContents(scriptTextRef.current);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    setCopyStatus(copied ? "Copied" : "Press Cmd+C");
    window.setTimeout(() => setCopyStatus(""), 1600);
  }

  return (
    <div className="script-page" ref={topRef}>
      <div className="script-practice-switch" aria-label="Practice area">
        {[
          ["immigration", "Immigration"],
          ["criminal-defense", "Criminal Defense"]
        ].map(([id, label]) => (
          <button
            aria-pressed={practiceArea === id}
            className={practiceArea === id ? "active" : ""}
            key={id}
            onClick={() => selectPracticeArea(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <header className="script-header">
        <div>
          <span className="script-state-label">Current state</span>
          <h2>{state.title}</h2>
          <span className="script-audience">{state.audience}</span>
        </div>
        <div className="script-fields">
          <Field label="Rep name">
            <input onChange={(event) => setRepName(event.target.value)} value={repName} />
          </Field>
          <Field label="Callback number">
            <input onChange={(event) => setCallbackNumber(event.target.value)} placeholder="(555) 555-5555" value={callbackNumber} />
          </Field>
        </div>
      </header>

      <section className="script-workspace">
        <article className="script-reading card">
          <div className="script-goal">
            <span>Goal</span>
            <strong>{state.goal}</strong>
          </div>
          <div className="script-card-text">
            <span>{state.mode === "prompt" ? "Prompt" : "Read"}</span>
            <p ref={scriptTextRef}>{script}</p>
          </div>
          {state.notes ? (
            <div className="script-note">
              <span>Strategy</span>
              <p>{state.notes}</p>
            </div>
          ) : null}
          <div className="script-controls">
            <button className="ghost" disabled={!history.length} onClick={goBack} type="button">
              Back
            </button>
            <button className="ghost" disabled={loggingCall} onClick={restart} type="button">
              {loggingCall ? "Saving..." : "Restart"}
            </button>
            <button className="button" onClick={copyScript} type="button">
              {copyStatus || "Copy script"}
            </button>
          </div>
        </article>

        <section className="script-responses">
          <span>They say</span>
          <div className={`script-buttons ${state.buttons.length > 7 ? "dense" : ""}`}>
            {state.buttons.map((button) => (
              <button
                className="response-button"
                disabled={loggingCall}
                key={button.label}
                onClick={() =>
                  button.nextStateId === scriptDefinition.startStateId &&
                  (/^Start (next|new)/i.test(button.label) || /^Restart/i.test(button.label))
                    ? restart()
                    : moveTo(button)
                }
                type="button"
              >
                {button.label}
              </button>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function AdminView({ refresh, session, state }) {
  const [formState, setFormState] = useState({ fullName: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [analyticsRepId, setAnalyticsRepId] = useState("all");
  const rankedReps = rankReps(state);
  const analytics = buildAdminAnalytics(state, analyticsRepId);

  async function createAccount(event) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formState)
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "Account could not be created.");
        return;
      }

      setMessage(`${payload.user.fullName} has been created as a rep and can sign in immediately.`);
      setFormState({ fullName: "", email: "", password: "" });
      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="admin-page">
      <section className="analytics">
        <div className="analytics-header">
          <h3>Analytics</h3>
          <select
            aria-label="Analyze team member"
            onChange={(event) => setAnalyticsRepId(event.target.value)}
            value={analyticsRepId}
          >
            <option value="all">Full team</option>
            {state.reps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </select>
        </div>

        <div className="analytics-metrics">
          <Metric label="Script calls" value={analytics.calls} />
          <Metric label="Avg clicks" value={formatAverageClicks(analytics.averageClicks)} />
          <Metric label="Demos" value={analytics.demos} />
          <Metric label="Closed" value={analytics.closed} />
          <Metric label="Revenue" value={formatMoney(analytics.revenue)} />
          <Metric label="Demo / call" value={formatPercent(analytics.demoRate)} />
        </div>

        <div className="analytics-panels">
          <article className="analytics-panel">
            <div className="analytics-panel-head">
              <h4>Common responses</h4>
              <span>{analytics.responseCount ? `${analytics.responseCount} captured` : "New calls only"}</span>
            </div>
            {analytics.commonResponses.length ? (
              <div className="response-ranking">
                {analytics.commonResponses.map((response) => (
                  <div className="response-rank-row" key={response.label}>
                    <span>{response.label}</span>
                    <div className="analytics-bar">
                      <div style={{ width: `${response.share}%` }} />
                    </div>
                    <strong>{response.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analytics-empty">Response trends appear after reps complete tracked Script calls.</div>
            )}
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-head">
              <h4>Call shape</h4>
              <span>Script behavior</span>
            </div>
            <div className="call-shape">
              <AnalyticsValue label="Short calls (0-2 clicks)" value={analytics.shortCalls} />
              <AnalyticsValue label="Developed calls (6+ clicks)" value={analytics.deepCalls} />
              <AnalyticsValue label="Longest call" value={`${analytics.longestCall} clicks`} />
              <AnalyticsValue label="Response coverage" value={formatPercent(analytics.responseCoverage)} />
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-head">
              <h4>Strategy signals</h4>
              <span>{analytics.label}</span>
            </div>
            <div className="analytics-signals">
              {analytics.signals.map((signal) => (
                <p key={signal}>{signal}</p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <div className="admin-grid">
        <article className="card admin-create">
          <h3>New Rep</h3>
          <form className="admin-form" onSubmit={createAccount}>
            <Field label="Full name">
              <input
                required
                value={formState.fullName}
                onChange={(event) => setFormState({ ...formState, fullName: event.target.value })}
                placeholder="Jacob Ryan"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={formState.email}
                onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                placeholder="rep@email.com"
              />
            </Field>
            <Field label="Temporary password">
              <input
                required
                minLength={8}
                type="password"
                value={formState.password}
                onChange={(event) => setFormState({ ...formState, password: event.target.value })}
                placeholder="Minimum 8 characters"
              />
            </Field>
            {message ? <div className="notice">{message}</div> : null}
            <button className="button" disabled={creating} type="submit">
              {creating ? "Creating..." : "Create"}
            </button>
          </form>
        </article>
      </div>

      <div className="section-title">
        <h3>Users</h3>
      </div>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Rep</th>
              <th>Access</th>
              <th>Course</th>
              <th>Calls</th>
              <th>Avg clicks</th>
              <th>Demos</th>
              <th>Closed</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rankedReps.map((rep) => (
              <tr key={rep.id}>
                <td>
                  <strong>{rep.name}</strong>
                  <div className="small">{rep.email}</div>
                </td>
                <td>
                  <span className={`status ${rep.role === "admin" ? "done" : ""}`}>
                    {rep.role === "admin" ? "Admin" : "Rep"}
                  </span>
                </td>
                <td>{rep.onboarding}%</td>
                <td>{rep.calls}</td>
                <td>{formatAverageClicks(rep.averageClicks)}</td>
                <td>{rep.demos}</td>
                <td>{rep.closed}</td>
                <td className="money-cell">{formatMoney(rep.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CourseView({ configured, state, currentRep, saveProgress, session, setNotice }) {
  const [activeDayId, setActiveDayId] = useState("day1");
  const [homework, setHomework] = useState({});
  const [answerSaveStatus, setAnswerSaveStatus] = useState("");
  const saveTimer = useRef(null);
  const homeworkKey = `coverable-homework-${currentRep.id}-${activeDayId}`;

  useEffect(() => {
    let active = true;
    const saved = window.localStorage.getItem(homeworkKey);
    const localAnswers = safeParseJson(saved);
    setHomework(localAnswers);
    setAnswerSaveStatus(saved ? "Saved on this device" : "");

    async function loadSavedAnswers() {
      if (!configured || !session) return;
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("course_answers")
        .select("answers")
        .eq("user_id", session.user.id)
        .eq("module_id", activeDayId)
        .maybeSingle();

      if (!active) return;
      if (error) {
        if (isMissingCourseAnswersTable(error)) {
          setAnswerSaveStatus("Answers are saving on this device until the Supabase answers table is added.");
          return;
        }
        setNotice(error.message);
        return;
      }

      if (data?.answers) {
        setHomework(data.answers);
        window.localStorage.setItem(homeworkKey, JSON.stringify(data.answers));
        setAnswerSaveStatus("Saved to account");
      }
    }

    loadSavedAnswers();

    return () => {
      active = false;
      window.clearTimeout(saveTimer.current);
    };
  }, [activeDayId, configured, homeworkKey, session, setNotice]);

  function updateHomework(field, value) {
    const next = { ...homework, [field]: value };
    setHomework(next);
    window.localStorage.setItem(homeworkKey, JSON.stringify(next));
    setAnswerSaveStatus(configured && session ? "Saving..." : "Saved on this device");

    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveCourseAnswers(activeDayId, next);
    }, 550);
  }

  async function saveCourseAnswers(moduleId, answers) {
    if (!configured || !session) return;

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("course_answers").upsert(
      {
        user_id: session.user.id,
        module_id: moduleId,
        answers,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,module_id" }
    );

    if (error) {
      if (isMissingCourseAnswersTable(error)) {
        setAnswerSaveStatus("Saved on this device. Add the Supabase answers table to sync across devices.");
        return;
      }
      setAnswerSaveStatus("Could not sync. Saved on this device.");
      setNotice(error.message);
      return;
    }

    setAnswerSaveStatus("Saved to account");
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
      ) : activeDay.id === "day3" ? (
        <DayThreeLesson
          progress={state.progress[currentRep.id]?.day3 || 0}
          homework={homework}
          updateHomework={updateHomework}
          saveProgress={saveProgress}
        />
      ) : activeDay.id === "day4" ? (
        <DayFourLesson
          progress={state.progress[currentRep.id]?.day4 || 0}
          homework={homework}
          updateHomework={updateHomework}
          saveProgress={saveProgress}
        />
      ) : activeDay.id === "day5" ? (
        <DayFiveLesson
          progress={state.progress[currentRep.id]?.day5 || 0}
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

      {answerSaveStatus ? <span className="save-status">{answerSaveStatus}</span> : null}
    </div>
  );
}

function DayFiveLesson({ progress, homework, updateHomework, saveProgress }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Start",
    "Metrics",
    "Certify",
    "Scripts",
    "Follow-up",
    "Qualify",
    "Confidence",
    "Scorecards",
    "Decision"
  ];
  const lastStep = steps.length - 1;

  function goNext() {
    const nextStep = Math.min(step + 1, lastStep);
    setStep(nextStep);
    saveProgress("day5", Math.max(progress, Math.round((nextStep / lastStep) * 75)));
  }

  function goBack() {
    setStep(Math.max(step - 1, 0));
  }

  return (
    <article className="card lesson-card">
      <div className="lesson-hero">
        <div>
          <span className="eyebrow">Day 5</span>
          <h3>Live Calling / Performance Review / Improvement Plan</h3>
          <p>
            By the end of Day 5, reps should complete live call practice, review performance, fix
            weak spots, and pass or fail final certification before being cleared to call prospects
            independently.
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
        <LessonPanel eyebrow="Orientation" title="Final certification day">
          <p className="lesson-copy">
            Day 5 decides whether the rep is ready to call prospects independently. The rep should
            prove activity discipline, script control, objection handling, follow-up skill, and the
            ability to ask for a clear next step. A good attitude matters, but clearance is based on
            performance.
          </p>
          <div className="agenda-list">
            {[
              ["30 min", "Morning certification prep", "Review standards and scripts"],
              ["60-90 min", "Live calls or simulated calling", "Manager observes and scores"],
              ["45 min", "Call review", "Listen to recordings and grade"],
              ["45 min", "Final roleplay certification", "Gatekeeper, appointment, closing call"],
              ["30 min", "Performance review", "Scorecard and improvement plan"],
              ["30 min", "Final certification decision", "Cleared, conditional, or not cleared"]
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
        <LessonPanel eyebrow="Live calling expectations" title="Track the work like a professional">
          <p className="lesson-copy">
            Each rep should complete 30-50 outbound dials, or 10-15 high-quality simulated calls if
            live calling is not available. Every attempt must be logged so coaching is based on
            reality, not memory.
          </p>
          <DailyMetricsTracker homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 2 ? (
        <LessonPanel eyebrow="Final certification roleplay" title="Pass all three rooms">
          <p className="lesson-copy">
            The rep must pass three roleplays: gatekeeper access, appointment setting, and closing
            call. This tests the full bootcamp: reason for call, qualification, curiosity, ROI,
            objections, and next-step control.
          </p>
          <CertificationRoleplays homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 3 ? (
        <LessonPanel eyebrow="Outreach script library" title="Phone, LinkedIn, email, and text scripts">
          <p className="lesson-copy">
            Reps should not freestyle when pressure rises. This library gives them clean language
            for calls, voicemails, LinkedIn, email, text, confirmations, no-shows, and soft
            rejections.
          </p>
          <OutreachScriptLibrary />
        </LessonPanel>
      ) : null}

      {step === 4 ? (
        <LessonPanel eyebrow="Follow-up sequences" title="Do not leave follow-up vague">
          <p className="lesson-copy">
            Follow-up should be multi-channel, specific, and tied to the same pain: reducing manual
            immigration case prep and drafting workload. Reps should know what to do after no
            answer, booked appointments, no-shows, and soft rejections.
          </p>
          <FollowUpSequences />
        </LessonPanel>
      ) : null}

      {step === 5 ? (
        <LessonPanel eyebrow="Qualification guide" title="Know who is worth pursuing">
          <p className="lesson-copy">
            Good sales discipline includes knowing who is a fit. A strong rep does not treat every
            firm equally. They look for volume, manual workflow, staff bottlenecks, decision makers,
            and a reason to act.
          </p>
          <ProspectQualificationGuide homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 6 ? (
        <LessonPanel eyebrow="Tone standard" title="Confident without pushy">
          <p className="lesson-copy">
            Certification is not just what the rep says. It is how they sound. Professional reps are
            firm with direction, but they still acknowledge what the prospect says.
          </p>
          <ConfidenceLanguageDrill homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 7 ? (
        <LessonPanel eyebrow="Scorecards" title="Grade the final performance">
          <p className="lesson-copy">
            The manager should use separate scorecards for gatekeeper, appointment-setting, and
            closing call skill. Passing requires minimum scores, not vibes.
          </p>
          <FinalScorecards homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 8 ? (
        <LessonPanel eyebrow="Certification decision" title="Cleared, conditional, or not cleared">
          <p className="lesson-copy">
            A rep is certified only if they can explain Coverable, handle gatekeepers, book
            appointments, run a closing conversation, follow up correctly, and track activity
            clearly.
          </p>
          <FinalCertificationDecision homework={homework} updateHomework={updateHomework} />
          <button className="button" type="button" onClick={() => saveProgress("day5", 100)}>
            Mark Day 5 Complete
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

function DayFourLesson({ progress, homework, updateHomework, saveProgress }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Start",
    "Review",
    "Shadow",
    "Roleplay",
    "Gauntlet",
    "Calls",
    "Score",
    "Homework"
  ];
  const lastStep = steps.length - 1;

  function goNext() {
    const nextStep = Math.min(step + 1, lastStep);
    setStep(nextStep);
    saveProgress("day4", Math.max(progress, Math.round((nextStep / lastStep) * 75)));
  }

  function goBack() {
    setStep(Math.max(step - 1, 0));
  }

  return (
    <article className="card lesson-card">
      <div className="lesson-hero">
        <div>
          <span className="eyebrow">Day 4</span>
          <h3>Live Calling / Roleplay / Shadowing / Objection Handling</h3>
          <p>
            By the end of Day 4, reps should have completed heavy practice, live call simulations,
            shadowing, objection drills, and manager coaching. This is where reps begin proving
            whether they can handle real prospect conversations.
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
        <LessonPanel eyebrow="Orientation" title="Day 4 is the pressure day">
          <p className="lesson-copy">
            Day 4 is not about passively learning new scripts. It is about reps showing they can
            stay composed under pressure, use the scripts from Days 1-3, handle resistance, and log
            what happened. Practice should feel close enough to live calling that weak spots become
            obvious.
          </p>
          <div className="agenda-list">
            {[
              ["30 min", "Morning review", "Scripts, objections, standards"],
              ["45 min", "Shadowing", "Listen to manager or top rep calls"],
              ["45 min", "Live roleplay block", "Gatekeeper + attorney scenarios"],
              ["45 min", "Objection gauntlet", "Rapid-fire rebuttal drills"],
              ["45 min", "Practice calls or simulated dials", "Manager observes and scores"],
              ["30 min", "Call review", "Feedback and coaching"],
              ["30-60 min", "Homework", "Fix weak spots and prepare certification"]
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
        <LessonPanel eyebrow="Morning review" title="Reload the core material before calls">
          <p className="lesson-copy">
            Before reps roleplay or dial, they should review the pieces they must be able to recall
            quickly. The manager reminder for the day: Today is not about being perfect. It is about
            proving you can stay composed, stay sharp, and keep moving the conversation forward.
          </p>
          <ChecklistInteraction
            items={[
              "Coverable 20-second pitch",
              "Gatekeeper script",
              "Attorney opener",
              "Appointment-setting close",
              "ROI examples",
              "Top 10 objections",
              "Tone standards"
            ]}
          />
          <HomeworkField
            label="Which script or skill feels weakest before practice starts?"
            field="morningWeakSpot"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 2 ? (
        <LessonPanel eyebrow="Shadowing" title="Listen like a rep, not like an audience member">
          <p className="lesson-copy">
            Reps should listen to 3-5 example calls. The point is not just whether the call went
            well. The rep should notice control, pain, objections, next steps, and what they would
            improve.
          </p>
          <ShadowingNotes homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 3 ? (
        <LessonPanel eyebrow="Live roleplay" title="Five required scenarios">
          <p className="lesson-copy">
            Each rep completes five roleplays. The goal is not acting. The goal is automatic recall:
            respond, ask for the next step, and keep the conversation moving.
          </p>
          <RoleplayCards homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 4 ? (
        <LessonPanel eyebrow="Objection gauntlet" title="Respond fast without rambling">
          <p className="lesson-copy">
            The manager gives one objection every 30 seconds. The rep must respond immediately.
            Passing means staying calm, acknowledging the objection, reframing value, and asking a
            question or moving to a next step.
          </p>
          <ObjectionGauntlet homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 5 ? (
        <LessonPanel eyebrow="Practice calls" title="Rules for simulated dials or live practice">
          <p className="lesson-copy">
            Whether the rep is doing simulated dials or real practice calls, the standard is the
            same. Use the approved opener, keep the call clean, log what happened, and do not turn
            resistance into an argument.
          </p>
          <div className="lesson-grid">
            <InfoBlock
              title="During practice calls, reps must"
              items={[
                "Use the approved opener.",
                "Track every call disposition.",
                "Never argue with gatekeepers.",
                "Never overexplain.",
                "Ask for transfer or appointment clearly.",
                "Leave strong voicemails.",
                "Log notes immediately."
              ]}
            />
            <InfoBlock
              title="Manager is watching for"
              items={[
                "Opening confidence.",
                "Clear reason for the call.",
                "Composure under pushback.",
                "Brevity.",
                "Next-step ask.",
                "CRM quality."
              ]}
            />
          </div>
          <HomeworkField
            label="Write the voicemail or callback note you would leave after a no-answer"
            field="day4Voicemail"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 6 ? (
        <LessonPanel eyebrow="Call review" title="Score the call like a manager">
          <p className="lesson-copy">
            Every reviewed call should produce clear coaching. Scores are not punishment. They show
            what the rep needs to fix before certification.
          </p>
          <CallReviewScorecard homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 7 ? (
        <LessonPanel eyebrow="Homework" title="Fix weak spots before certification">
          <p className="lesson-copy">
            Day 4 homework should be based on actual performance. The rep should review manager
            feedback, rewrite the weakest script section, record improved objection responses, and
            prepare for final certification.
          </p>
          <div className="homework-grid">
            <HomeworkField label="Manager feedback summary" field="managerFeedbackSummary" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Rewrite your weakest script section" field="weakestScriptRewrite" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Link or notes for 5 improved objection responses" field="fiveImprovedObjections" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Final checklist memorization notes" field="finalChecklistNotes" homework={homework} updateHomework={updateHomework} />
          </div>
          <button className="button" type="button" onClick={() => saveProgress("day4", 100)}>
            Mark Day 4 Complete
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

function DayThreeLesson({ progress, homework, updateHomework, saveProgress }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Start",
    "Framework",
    "Agenda",
    "Discovery",
    "Pain",
    "Workflow",
    "ROI",
    "Demo",
    "Close",
    "Objections",
    "Roleplay",
    "Homework"
  ];
  const lastStep = steps.length - 1;

  function goNext() {
    const nextStep = Math.min(step + 1, lastStep);
    setStep(nextStep);
    saveProgress("day3", Math.max(progress, Math.round((nextStep / lastStep) * 75)));
  }

  function goBack() {
    setStep(Math.max(step - 1, 0));
  }

  return (
    <article className="card lesson-card">
      <div className="lesson-hero">
        <div>
          <span className="eyebrow">Day 3</span>
          <h3>Full Sales Process + Closing Training</h3>
          <p>
            By the end of Day 3, the rep should know how to run a basic sales call, ask discovery
            questions, uncover pain, show ROI, handle objections, create urgency, and confidently
            ask for the next step or sale.
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
        <LessonPanel eyebrow="Orientation" title="What Day 3 is really teaching">
          <p className="lesson-copy">
            Day 3 turns the rep from appointment setter into someone who can run a real sales
            conversation. The rep should not dump features, ramble through AI claims, or hope the
            attorney connects the dots. The rep must control the call, diagnose the workflow, tie
            Coverable to labor savings, and ask for a clear next step.
          </p>
          <div className="agenda-list">
            {[
              ["30 min", "Sales call structure", "Full call framework"],
              ["45 min", "Discovery", "Qualifying and pain questions"],
              ["45 min", "ROI training", "Labor savings and capacity examples"],
              ["45 min", "Demo flow", "Present Coverable without feature dumping"],
              ["45 min", "Closing + objections", "Trial closes, ask, rebuttals"],
              ["30 min", "Roleplay", "Full sales call simulation"],
              ["30-60 min", "Homework", "Written call plan + objection responses"]
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
        <LessonPanel eyebrow="Framework" title="The full Coverable sales call">
          <p className="lesson-copy">
            A strong call has a path. The rep knows where the conversation is going, but the
            attorney still feels heard. This structure keeps the rep from presenting too early and
            keeps the attorney from drifting into vague objections.
          </p>
          <ProcessList
            items={[
              "Opener and agenda",
              "Discovery",
              "Pain development",
              "Current workflow review",
              "ROI framing",
              "Demo or product explanation",
              "Fit check",
              "Objection handling",
              "Close or next step",
              "Follow-up confirmation"
            ]}
          />
          <HomeworkField
            label="In your own words, why does a sales call need a structure?"
            field="callStructureWhy"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 2 ? (
        <LessonPanel eyebrow="Step 1" title="Open with agenda and control">
          <p className="lesson-copy">
            The opener should lower pressure and raise confidence. You are telling the attorney:
            this will be organized, relevant, and respectful of their time.
          </p>
          <div className="script-box compact-script">
            <strong>Opener and agenda script</strong>
            <br />
            Thanks for taking the time, [Attorney Name]. The goal today is simple. I want to
            understand how your firm currently handles immigration case prep, drafting, documents,
            briefs, motions, and supporting materials. Then I will show where Coverable may reduce
            manual workload. If it looks relevant, we can talk about the best next step. Sound fair?
          </div>
          <div className="lesson-grid">
            <InfoBlock title="Why it works" items={["Sets control.", "Shows respect for time.", "Creates structure.", "Reduces pressure.", "Opens discovery."]} />
            <InfoBlock title="Rep standard" items={["Do not start with features.", "Do not apologize.", "Do not ask if they still have time.", "Do get agreement on the agenda."]} />
          </div>
          <HomeworkField
            label="Write your agenda opener from memory"
            field="agendaOpener"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 3 ? (
        <LessonPanel eyebrow="Step 2" title="Discovery before presenting">
          <p className="lesson-copy">
            Discovery earns the right to present. If the rep presents first, the attorney hears a
            generic pitch. If the rep discovers first, the demo becomes a response to the attorney's
            actual workflow.
          </p>
          <QuestionBank
            title="Firm qualification questions"
            questions={[
              "What types of immigration cases does your firm handle most often?",
              "Roughly how many active immigration matters does the firm manage per month?",
              "How many attorneys and paralegals are currently involved in immigration work?",
              "Who handles most of the document preparation right now?",
              "What parts of case preparation take the most time?",
              "Are briefs, motions, declarations, evidence packets, or supporting documents created mostly manually?",
              "Do you feel your team is at capacity right now?",
              "Are you trying to grow case volume this year?",
              "If case volume increased, would you need to hire more staff?",
              "Who would be involved in approving a tool like this?"
            ]}
          />
          <HomeworkField
            label="Choose your six discovery questions for a first sales call"
            field="sixDiscoveryQuestions"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 4 ? (
        <LessonPanel eyebrow="Step 3" title="Pain questions that make the attorney care">
          <p className="lesson-copy">
            Pain questions turn workflow facts into business reasons to act. The rep is listening
            for wasted hours, bottlenecks, staff overload, delayed cases, hiring pressure, and lost
            capacity.
          </p>
          <QuestionBank
            title="Pain questions"
            questions={[
              "Where does your team lose the most time in case preparation?",
              "What work do your paralegals complain about most?",
              "What work do you feel is too repetitive for your attorneys or senior staff?",
              "How long does it usually take to prepare a full case packet?",
              "How often do cases get delayed because documents or supporting materials are not ready?",
              "What happens when paralegals are overloaded?",
              "Do you ever turn away or delay cases because your team is at capacity?",
              "What would it mean financially if the firm could handle more cases with the same staff?",
              "How expensive would it be to solve this by hiring another paralegal?",
              "If your team saved even a few hours per case, where would that time go?"
            ]}
          />
          <PainSignalDrill homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 5 ? (
        <LessonPanel eyebrow="Step 4" title="Current workflow review">
          <p className="lesson-copy">
            The workflow review helps the rep position Coverable correctly. The point is not
            replacing legal judgment. The point is reducing repetitive preparation around the work
            that still requires attorney judgment.
          </p>
          <div className="script-box compact-script">
            <strong>Workflow review script</strong>
            <br />
            Walk me through what happens after a client signs. From intake to document prep to final
            case materials, what does your team manually prepare?
          </div>
          <div className="lesson-grid">
            <InfoBlock title="Then ask" items={["Which parts are repeatable?", "Which parts require attorney judgment?", "Which parts are just time-consuming preparation?"]} />
            <InfoBlock title="Positioning line" items={["It sounds like the opportunity is not replacing legal judgment.", "It is reducing the repetitive preparation work around the judgment."]} />
          </div>
          <HomeworkField
            label="Map the manual workflow you expect at a small immigration firm"
            field="workflowMap"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 6 ? (
        <LessonPanel eyebrow="Step 5" title="ROI training">
          <p className="lesson-copy">
            ROI should sound simple and concrete. Coverable is not sold as shiny software. It is
            sold as labor reduction, attorney time saved, increased case capacity, and better margin
            per matter.
          </p>
          <ScriptLibrary
            scripts={[
              ["Simple ROI message", "The ROI is not complicated. If your paralegal spends 5-10 hours preparing a case packet, and Coverable reduces that workload significantly, the firm saves labor cost on every case."],
              ["Capacity message", "If the firm can handle more cases with the same staff, Coverable increases capacity without increasing payroll."],
              ["Business message", "The sale is not about buying software. It is about reducing labor, saving attorney time, and increasing case volume."],
              ["Labor hours saved", "Let us say your paralegal spends 8 hours preparing a case packet. If Coverable saves even 3 hours, and you do that across 20 cases per month, that is 60 staff hours saved monthly."],
              ["Avoiding a new hire", "If your team is close to capacity, the normal solution is hiring another paralegal. Coverable may help delay or reduce the need for another hire by increasing output from the team you already have."],
              ["More cases with same staff", "If your team can move cases faster, the firm may be able to take on more volume without adding payroll. That is where the margin improvement comes from."],
              ["Attorney time saved", "Even if the attorney only saves a few hours per week, that time can go back into client strategy, consultations, reviews, or revenue-producing work."],
              ["Profit per case", "Every hour of staff time attached to a case affects profit. If Coverable reduces the hours required per matter, the firm keeps more margin per case."]
            ]}
          />
          <RoiBuilder homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 7 ? (
        <LessonPanel eyebrow="Step 6" title="Demo flow without feature dumping">
          <p className="lesson-copy">
            A rep should not demo every feature. The demo should be tied to the attorney's pain.
            Every screen shown should answer a problem the attorney already admitted.
          </p>
          <ProcessList
            items={[
              "Restate pain",
              "Show relevant workflow",
              "Connect feature to time savings",
              "Ask for reaction",
              "Move to ROI or next step"
            ]}
          />
          <div className="script-box compact-script">
            <strong>Demo opening script</strong>
            <br />
            Based on what you told me, the biggest issue is the time your team spends preparing
            documents and supporting materials. I will focus the demo there instead of showing you
            every feature.
          </div>
          <div className="lesson-grid">
            <InfoBlock
              title="During demo"
              items={[
                "This is where your paralegal would normally spend time gathering and preparing materials.",
                "This is the type of repetitive drafting Coverable is designed to reduce.",
                "The attorney still reviews and controls the final work product.",
                "This is where firms usually see the time savings."
              ]}
            />
            <InfoBlock
              title="After demo ask"
              items={[
                "Where would this save your team the most time?",
                "Does this fit any of the work your staff is currently doing manually?",
                "If this saved your team a few hours per case, would that be meaningful?"
              ]}
            />
          </div>
        </LessonPanel>
      ) : null}

      {step === 8 ? (
        <LessonPanel eyebrow="Steps 7-8" title="Trial closes and closing scripts">
          <p className="lesson-copy">
            Trial closes test interest before the final ask. Closing is not a magic line. It is the
            natural next step after the rep has created pain, shown value, handled concerns, and
            confirmed fit.
          </p>
          <QuestionBank
            title="Trial close questions"
            questions={[
              "Does this look relevant to your workflow?",
              "Could you see your paralegals using this?",
              "Would reducing that prep time be valuable for the firm?",
              "Is this something you would want to test on a real case?",
              "Assuming the platform works the way I showed you, what would stop you from moving forward?"
            ]}
          />
          <ScriptLibrary
            scripts={[
              ["Soft close", "Based on what you shared, this seems like it could reduce a meaningful amount of manual prep time. The best next step is to test it on one real matter and see how much time it saves your team."],
              ["Direct close", "This looks like a fit. Let us get you set up so your team can test it on an active case."],
              ["Pilot close", "Rather than debating it in theory, let us run a short pilot. Use Coverable on a real case, measure the time saved, and then decide if it should become part of your workflow."],
              ["Decision close", "What would you need to see to feel comfortable moving forward?"],
              ["Calendar close", "Let us schedule the implementation/trial setup now while we are both here. Are you better [Day/Time] or [Day/Time]?"],
              ["Final ask", "Do you want to move forward and test this with your team?"]
            ]}
          />
          <HomeworkField
            label="Write the close you would use after a strong demo"
            field="preferredClose"
            homework={homework}
            updateHomework={updateHomework}
          />
        </LessonPanel>
      ) : null}

      {step === 9 ? (
        <LessonPanel eyebrow="Objections" title="Common attorney objections and rebuttals">
          <p className="lesson-copy">
            Objections are not personal. They usually mean the attorney has not connected the value
            to their workflow, risk concern, timing, or cost. The rep should acknowledge, reframe,
            ask a question, and move back toward the next step.
          </p>
          <AttorneyObjectionDrill homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 10 ? (
        <LessonPanel eyebrow="Roleplay" title="20-minute full sales call simulation">
          <p className="lesson-copy">
            Scenario: the attorney owns a small immigration firm with 2 attorneys, 3 paralegals, a
            high caseload, manual document prep, some skepticism about AI, and concern about cost.
          </p>
          <div className="lesson-grid">
            <InfoBlock
              title="Rep must accomplish"
              items={[
                "Open with agenda.",
                "Ask at least 6 discovery questions.",
                "Identify pain.",
                "Explain ROI.",
                "Present Coverable clearly.",
                "Handle at least 2 objections.",
                "Ask for next step."
              ]}
            />
            <InfoBlock
              title="Manager grading"
              items={[
                "Did the rep ask before presenting?",
                "Did the rep uncover real workflow pain?",
                "Did ROI sound concrete?",
                "Did the rep avoid feature dumping?",
                "Did the rep ask directly for a next step?"
              ]}
            />
          </div>
          <DayThreeQuiz homework={homework} updateHomework={updateHomework} />
        </LessonPanel>
      ) : null}

      {step === 11 ? (
        <LessonPanel eyebrow="Homework" title="Finish Day 3">
          <p className="lesson-copy">
            Passing standard: the rep should score 80% or higher on the quiz, write a full
            discovery call plan, prepare 10 objection responses, and record a 5-minute ROI
            explanation before Day 4 live call simulations.
          </p>
          <div className="homework-grid">
            <HomeworkField label="Full discovery call script" field="fullDiscoveryScript" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="10 objection rebuttals" field="tenObjectionRebuttals" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Link or note for recorded 5-minute ROI explanation" field="roiRecording" homework={homework} updateHomework={updateHomework} />
            <HomeworkField label="Day 4 prep: phone, LinkedIn, email, and text scripts reviewed" field="day4Prep" homework={homework} updateHomework={updateHomework} />
          </div>
          <button className="button" type="button" onClick={() => saveProgress("day3", 100)}>
            Mark Day 3 Complete
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

function ProcessList({ items }) {
  return (
    <div className="process-list">
      {items.map((item, index) => (
        <div className="process-step" key={item}>
          <span>{index + 1}</span>
          <strong>{item}</strong>
        </div>
      ))}
    </div>
  );
}

function QuestionBank({ title, questions }) {
  return (
    <div className="question-bank">
      <strong>{title}</strong>
      <div>
        {questions.map((question) => (
          <span key={question}>{question}</span>
        ))}
      </div>
    </div>
  );
}

function PainSignalDrill({ homework, updateHomework }) {
  const signals = [
    ["Paralegals are overloaded", "Ask what gets delayed and what hiring would cost."],
    ["Packets take too long", "Ask how many hours per case and how many cases per month."],
    ["Attorney reviews are backed up", "Ask what lower-value prep is stealing attorney time."],
    ["Firm wants more volume", "Ask whether current staff can support growth without bottlenecks."]
  ];

  return (
    <div className="drill-stack">
      {signals.map(([signal, response]) => (
        <div className="drill-card" key={signal}>
          <span>Pain signal</span>
          <strong>{signal}</strong>
          <p>{response}</p>
        </div>
      ))}
      <HomeworkField
        label="Pick one pain signal and write the follow-up question you would ask"
        field="painSignalFollowup"
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function RoiBuilder({ homework, updateHomework }) {
  const hours = Number(homework.roiHoursSaved || 3);
  const cases = Number(homework.roiCases || 20);
  const monthly = Number.isFinite(hours * cases) ? hours * cases : 0;

  return (
    <div className="roi-builder">
      <div className="script-builder">
        <label>
          Hours saved per case
          <input
            min="0"
            type="number"
            value={homework.roiHoursSaved || ""}
            onChange={(event) => updateHomework("roiHoursSaved", event.target.value)}
            placeholder="3"
          />
        </label>
        <label>
          Cases per month
          <input
            min="0"
            type="number"
            value={homework.roiCases || ""}
            onChange={(event) => updateHomework("roiCases", event.target.value)}
            placeholder="20"
          />
        </label>
      </div>
      <div className="script-box compact-script">
        <strong>Your ROI math</strong>
        <br />
        If Coverable saves {hours || "[hours]"} hours per case across {cases || "[cases]"} cases per
        month, that is {monthly || "[total]"} staff hours saved monthly.
      </div>
      <HomeworkField
        label="Write a plain-English ROI explanation using this math"
        field="roiExplanation"
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function AttorneyObjectionDrill({ homework, updateHomework }) {
  const [active, setActive] = useState("sendInfo");
  const objections = {
    sendInfo: {
      label: "Send me information",
      response:
        "I can send information, but most of the value depends on your workflow. A generic PDF will not show whether this saves your team time. Let us do a quick 10-15 minute walkthrough, and then I will send details that actually match your firm. Short version: I can, but it will make more sense after a quick walkthrough. Are you open tomorrow for 15 minutes?",
      field: "day3ObjSendInfo"
    },
    software: {
      label: "We already have software",
      response:
        "That makes sense. Most firms already have case management software. Coverable is different because it focuses on reducing repetitive drafting, document preparation, briefs, motions, and case materials. Are those still being prepared manually by your team?",
      field: "day3ObjSoftware"
    },
    busy: {
      label: "I'm too busy",
      response:
        "I figured you would be. That is actually why this may be relevant. If your team is buried in manual case prep, this is designed to reduce that workload. I am only asking for 10-15 minutes to see if it applies. Stronger version: Busy firms are usually the ones where this makes the most sense. Would tomorrow morning or afternoon be better for a short walkthrough?",
      field: "day3ObjBusy"
    },
    notInterested: {
      label: "Not interested",
      response:
        "Understood. Before I let you go, is that because you already have AI handling document prep, or because this just is not a priority right now? If not a priority: Fair. When paralegal workload or case volume becomes more of a bottleneck, this may be worth revisiting. Would it be unreasonable to send a short overview and follow up next month?",
      field: "day3ObjNotInterested"
    },
    aiTrust: {
      label: "I do not trust AI",
      response:
        "That is a fair concern. Coverable is not meant to replace attorney judgment. The attorney still reviews and controls the final work. The value is reducing the repetitive preparation and drafting burden before final review. If your team still had full review control, would saving time on the first draft and preparation side be useful?",
      field: "day3ObjAiTrust"
    },
    officeManager: {
      label: "Talk to my office manager",
      response:
        "Absolutely. I am happy to speak with them. Since this affects legal drafting and case preparation, usually the attorney needs to be involved at least briefly. Should I include both of you on the walkthrough?",
      field: "day3ObjOfficeManager"
    },
    paralegals: {
      label: "We have paralegals for that",
      response:
        "Exactly. Coverable is designed to make those paralegals more productive. This is not about replacing them. It is about helping them get through repetitive preparation work faster so they can handle more cases and higher-value tasks.",
      field: "day3ObjParalegals"
    },
    cost: {
      label: "How much does it cost?",
      response:
        "The pricing depends on the firm's usage and workflow. The better way to look at it is cost versus hours saved. If your team saves even a few hours per case, the software can pay for itself quickly. Let me ask - about how many cases per month would this apply to?",
      field: "day3ObjCost"
    },
    expensive: {
      label: "It sounds expensive",
      response:
        "Compared to doing nothing, maybe. Compared to hiring another paralegal or losing hours on every case, it is usually very reasonable. The real question is whether the time savings justify it for your firm.",
      field: "day3ObjExpensive"
    },
    smallFirm: {
      label: "We are a small firm",
      response:
        "That may actually make it more relevant. Smaller firms usually feel staff bottlenecks faster because every hour matters. If Coverable helps your current team handle more without hiring, that can be a big advantage.",
      field: "day3ObjSmallFirm"
    },
    think: {
      label: "We need to think about it",
      response:
        "Of course. What specifically would you want to think through - cost, workflow fit, accuracy, team adoption, or something else? If we solve that concern, would you be comfortable moving forward with a pilot?",
      field: "day3ObjThink"
    },
    later: {
      label: "Follow up later",
      response:
        "I can do that. To make the follow-up useful, what would need to change between now and then - more case volume, staff capacity, budget timing, or internal review? Let us put a real follow-up date on the calendar instead of leaving it vague.",
      field: "day3ObjLater"
    }
  };
  const current = objections[active];

  return (
    <div className="drill-stack">
      <div className="segmented-buttons">
        {Object.entries(objections).map(([key, item]) => (
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
        <strong>Rebuttal</strong>
        <br />
        {current.response}
      </div>
      <HomeworkField
        label={`Write your version: ${current.label}`}
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

function ShadowingNotes({ homework, updateHomework }) {
  const prompts = [
    "What was the opener?",
    "What pain point was mentioned?",
    "Did the rep control the call?",
    "What objection came up?",
    "How did the rep handle it?",
    "Was a next step created?",
    "What would you improve?"
  ];

  return (
    <div className="drill-stack">
      {[1, 2, 3].map((callNumber) => (
        <div className="shadow-card" key={callNumber}>
          <strong>Shadow call {callNumber}</strong>
          <div className="shadow-prompts">
            {prompts.map((prompt, index) => (
              <HomeworkField
                field={`shadow${callNumber}-${index}`}
                homework={homework}
                key={prompt}
                label={prompt}
                updateHomework={updateHomework}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleplayCards({ homework, updateHomework }) {
  const scenarios = [
    {
      title: "Roleplay 1: Gatekeeper - Friendly",
      goal: "Get transferred.",
      line: "Sure, what is this regarding?",
      field: "roleplayFriendly"
    },
    {
      title: "Roleplay 2: Gatekeeper - Defensive",
      goal: "Avoid folding and identify the right decision maker.",
      line: "We are not interested. Send an email.",
      field: "roleplayDefensive"
    },
    {
      title: "Roleplay 3: Attorney - Busy",
      goal: "Deliver a sharp opener and book a demo.",
      line: "I only have 30 seconds.",
      field: "roleplayBusy"
    },
    {
      title: "Roleplay 4: Attorney - Already Has Software",
      goal: "Differentiate Coverable from case management software.",
      line: "We already use software for cases.",
      field: "roleplaySoftware"
    },
    {
      title: "Roleplay 5: Closing Call - Price Pushback",
      goal: "Explain ROI and ask for the next step.",
      line: "This seems expensive.",
      field: "roleplayPrice"
    }
  ];

  return (
    <div className="roleplay-grid">
      {scenarios.map((scenario) => (
        <div className="roleplay-card" key={scenario.title}>
          <span>{scenario.title}</span>
          <strong>{scenario.line}</strong>
          <p>{scenario.goal}</p>
          <HomeworkField
            label="Write your response"
            field={scenario.field}
            homework={homework}
            updateHomework={updateHomework}
          />
        </div>
      ))}
    </div>
  );
}

function ObjectionGauntlet({ homework, updateHomework }) {
  const [active, setActive] = useState("Send me information.");
  const objections = [
    "Send me information.",
    "We are too busy.",
    "Not interested.",
    "We already have software.",
    "I do not trust AI.",
    "Talk to my office manager.",
    "We have paralegals for that.",
    "How much does it cost?",
    "This sounds expensive.",
    "Call me next month.",
    "I need to think about it.",
    "I do not have time for a demo.",
    "We are a small firm.",
    "I do not make software decisions.",
    "Email me and I'll look at it."
  ];

  return (
    <div className="drill-stack">
      <div className="segmented-buttons">
        {objections.map((objection) => (
          <button
            className={active === objection ? "active" : ""}
            key={objection}
            onClick={() => setActive(objection)}
            type="button"
          >
            {objection}
          </button>
        ))}
      </div>
      <div className="script-box compact-script gauntlet-card">
        <strong>Current objection</strong>
        <br />
        {active}
      </div>
      <div className="lesson-grid">
        <InfoBlock
          title="Passing standard"
          items={[
            "Stay calm.",
            "Do not ramble.",
            "Acknowledge the objection.",
            "Reframe value.",
            "Ask a question or move to next step."
          ]}
        />
        <HomeworkField
          label="Write the response you would give in 30 seconds"
          field={`gauntlet-${active}`}
          homework={homework}
          updateHomework={updateHomework}
        />
      </div>
    </div>
  );
}

function CallReviewScorecard({ homework, updateHomework }) {
  const categories = [
    "Opening confidence",
    "Clarity of reason for call",
    "Gatekeeper control",
    "Attorney relevance",
    "Question quality",
    "Objection handling",
    "Brevity",
    "Tone",
    "Next-step ask",
    "CRM/call notes"
  ];

  return (
    <div className="scorecard">
      {categories.map((category) => (
        <div className="score-row" key={category}>
          <strong>{category}</strong>
          <label>
            Score 1-5
            <input
              max="5"
              min="1"
              type="number"
              value={homework[`score-${category}`] || ""}
              onChange={(event) => updateHomework(`score-${category}`, event.target.value)}
            />
          </label>
          <label>
            Notes
            <textarea
              value={homework[`score-notes-${category}`] || ""}
              onChange={(event) => updateHomework(`score-notes-${category}`, event.target.value)}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

function DailyMetricsTracker({ homework, updateHomework }) {
  const metrics = [
    ["Total calls", "30-50 dials or 10-15 high-quality simulated calls"],
    ["Conversations", "Track real connects"],
    ["Gatekeeper conversations", "Measures contact quality"],
    ["Attorney conversations", "Measures decision-maker reach"],
    ["Transfers", "Measures gatekeeper success"],
    ["Appointments booked", "Primary top-of-funnel outcome"],
    ["Voicemails left", "Track no-answer discipline"],
    ["Emails sent", "Track multi-channel activity"],
    ["LinkedIn messages sent", "Track outbound reach"],
    ["Texts sent", "Track direct follow-up"],
    ["Objections heard", "Helps coach patterns"],
    ["Follow-ups scheduled", "Measures pipeline discipline"]
  ];

  return (
    <div className="metrics-grid">
      {metrics.map(([metric, note]) => (
        <label className="metric-input" key={metric}>
          <span>{metric}</span>
          <input
            min="0"
            type="number"
            value={homework[`metric-${metric}`] || ""}
            onChange={(event) => updateHomework(`metric-${metric}`, event.target.value)}
          />
          <em>{note}</em>
        </label>
      ))}
      <HomeworkField
        label="Objections heard and patterns noticed"
        field="day5ObjectionPatterns"
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function CertificationRoleplays({ homework, updateHomework }) {
  const roleplays = [
    {
      title: "Part 1: Gatekeeper",
      scenario: "Gatekeeper is skeptical and says: What is this about? The attorney is busy. You can send information.",
      must: [
        "Explain reason for call.",
        "Avoid sounding like a random salesperson.",
        "Handle busy.",
        "Handle send info.",
        "Identify decision maker or get callback path."
      ],
      field: "certGatekeeper"
    },
    {
      title: "Part 2: Appointment Setting",
      scenario: "Attorney answers but is short on time.",
      must: [
        "Deliver sharp opener.",
        "Ask at least 2 qualification questions.",
        "Create curiosity.",
        "Avoid overexplaining.",
        "Ask for demo.",
        "Confirm appointment."
      ],
      field: "certAppointment"
    },
    {
      title: "Part 3: Closing Call",
      scenario: "Attorney has manual workflows but is skeptical of AI and price.",
      must: [
        "Set agenda.",
        "Ask discovery questions.",
        "Identify pain.",
        "Explain ROI.",
        "Handle AI concern.",
        "Handle price concern.",
        "Ask for next step or sale."
      ],
      field: "certClosing"
    }
  ];

  return (
    <div className="roleplay-grid">
      {roleplays.map((roleplay) => (
        <div className="roleplay-card" key={roleplay.title}>
          <span>{roleplay.title}</span>
          <strong>{roleplay.scenario}</strong>
          <ul className="compact-list">
            {roleplay.must.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <HomeworkField
            label="Manager notes / rep plan"
            field={roleplay.field}
            homework={homework}
            updateHomework={updateHomework}
          />
        </div>
      ))}
    </div>
  );
}

function OutreachScriptLibrary() {
  const [active, setActive] = useState("phone");
  const libraries = {
    phone: [
      ["Cold call opener: Gatekeeper", "Hi, this is [Name] with Coverable. I am reaching out regarding legal document preparation and immigration case workflow for the firm. Who would be the best attorney to speak with about that?"],
      ["Cold call opener: Attorney", "Hi [Attorney Name], this is [Name] with Coverable. I will be brief. We help immigration law firms reduce the time attorneys and paralegals spend on repetitive document prep, briefs, motions, and case materials using legal AI. I wanted to see if it would be worth showing you how it works for your firm."],
      ["Appointment-setting script", "Quick question - is your team currently preparing most case documents, briefs, motions, and supporting materials manually, or do you already have software helping with that? If manual: That is exactly where this tends to help. The easiest next step is a quick 10-15 minute walkthrough so you can see whether it fits your workflow. Are you better tomorrow morning or afternoon?"],
      ["Voicemail", "Hi [Attorney Name], this is [Name] with Coverable. I am reaching out because we help immigration firms reduce repetitive document prep, legal drafting, briefs, motions, and case material workload. I will send a short note as well. You can reach me at [phone number]. Again, [phone number]."],
      ["Follow-up call", "Hi [Attorney Name], this is [Name] with Coverable. I left a note about reducing repetitive immigration case prep and drafting workload. I wanted to see if it is worth putting 10-15 minutes on the calendar to show how it works."]
    ],
    linkedin: [
      ["Connection request 1", "Hi [Name], I saw your firm handles immigration matters. I work with Coverable - we help firms reduce repetitive drafting and case prep time. Wanted to connect."],
      ["Connection request 2", "Hi [Name], I work with immigration firms on cutting down manual document prep and case material workload. Thought it made sense to connect."],
      ["First message", "Thanks for connecting, [Name]. Quick question - is your team still preparing most immigration case documents, briefs, motions, and supporting materials manually?"],
      ["First message alternative", "Appreciate the connection. Coverable helps immigration firms reduce repetitive case prep and drafting work with legal AI. Would it be worth showing you a quick example?"],
      ["No-reply follow-up 1", "Worth a quick look if your paralegals are spending hours on repetitive case prep. This is built to reduce that workload, not add more software headaches."],
      ["No-reply follow-up 2", "Should I send over a quick example of how immigration firms use this for documents, briefs, motions, and case materials?"],
      ["Already have software", "Makes sense. Most firms do. Coverable is more focused on reducing drafting and case prep workload, not just managing cases. Are briefs, motions, or packets still being prepared manually?"],
      ["Appointment ask", "The easiest way to see if it is relevant is a 10-15 minute walkthrough. Are you open tomorrow or later this week?"]
    ],
    email: [
      ["Cold email 1", "Subject: Reducing immigration case prep time\n\nHi [Attorney Name],\n\nI am reaching out because Coverable helps immigration law firms reduce the time spent on repetitive document preparation, legal drafting, briefs, motions, and supporting case materials.\n\nIf your paralegals or attorneys are spending hours preparing case materials manually, Coverable may help reduce that workload so your team can move cases faster without immediately adding staff.\n\nWould it be worth a quick 10-15 minute walkthrough this week?\n\nBest,\n[Name]"],
      ["Cold email 2", "Subject: Quick question about your immigration workflow\n\nHi [Attorney Name],\n\nQuick question - is your team still preparing most immigration case documents, briefs, motions, and supporting materials manually?\n\nCoverable helps firms reduce that repetitive workload using legal AI, while keeping attorney review and control in place.\n\nOpen to a short walkthrough to see if it fits your workflow?\n\nBest,\n[Name]"],
      ["Follow-up email 1", "Subject: Re: immigration case prep\n\nHi [Attorney Name],\n\nFollowing up here.\n\nThe reason I reached out is simple: if your team is spending hours per case on repetitive preparation work, there may be a real opportunity to save staff time and increase capacity without hiring more people.\n\nWorth taking a quick look?\n\nBest,\n[Name]"],
      ["Follow-up email 2", "Subject: Worth a quick look?\n\nHi [Attorney Name],\n\nI do not want to flood your inbox.\n\nIf reducing repetitive document prep, briefs, motions, and case material workload is relevant for your firm, Coverable is worth a quick look.\n\nIf not, no problem. Should I send over a short example?\n\nBest,\n[Name]"],
      ["Booked appointment confirmation", "Subject: Coverable walkthrough confirmed\n\nHi [Attorney Name],\n\nConfirmed for [Day] at [Time].\n\nI will show how Coverable helps immigration firms reduce repetitive legal drafting, document preparation, briefs, motions, and supporting case material workload.\n\nThe goal is to see whether this can save your team meaningful time on active matters.\n\nBest,\n[Name]"],
      ["Post-call email", "Subject: Next steps with Coverable\n\nHi [Attorney Name],\n\nGood speaking with you today.\n\nBased on what you shared, the main opportunity is reducing the time your team spends on [specific pain: document prep / briefs / motions / case packets / supporting materials].\n\nThe next step we discussed is [next step].\n\nI will follow up with [materials / invite / trial access / next meeting details].\n\nBest,\n[Name]"],
      ["No-show email", "Subject: Rescheduling Coverable walkthrough\n\nHi [Attorney Name],\n\nLooks like we missed each other for the Coverable walkthrough.\n\nNo problem - I know your schedule is busy. Since this may help reduce repetitive case prep and drafting workload for your team, I still think it is worth reconnecting.\n\nAre you better later today or tomorrow?\n\nBest,\n[Name]"],
      ["Soft rejection follow-up", "Subject: Keeping this on your radar\n\nHi [Attorney Name],\n\nUnderstood that now may not be the right time.\n\nI will keep this brief: if paralegal workload, manual drafting, or case prep capacity becomes a bottleneck, Coverable may be worth revisiting.\n\nWould it be reasonable for me to check back in [timeframe]?\n\nBest,\n[Name]"]
    ],
    text: [
      ["Text 1", "Hi [Attorney Name], this is [Name] with Coverable. We help immigration firms reduce repetitive document prep and case drafting time. Worth a quick look?"],
      ["Text 2", "Quick question - is your team still preparing most immigration case packets, briefs, and supporting docs manually?"],
      ["Text 3", "Coverable helps immigration firms save staff time on repetitive case prep. I think it may be relevant for your firm. Open to a 10-min walkthrough?"],
      ["Text 4", "If your paralegals are overloaded with case prep and drafting, Coverable may help reduce that workload. Should I send a quick example?"],
      ["Text 5", "Not sure if this is relevant, but we help immigration firms handle more case prep without immediately hiring more staff. Worth showing you?"],
      ["After no answer", "Just following up - should I send over a quick example of how Coverable helps with immigration case prep?"],
      ["After booked appointment", "Confirmed for [Day] at [Time]. I will show how Coverable helps reduce repetitive immigration case prep and drafting workload."],
      ["After no-show", "Looks like we missed each other. No problem. Are you better later today or tomorrow for the Coverable walkthrough?"]
    ]
  };

  return (
    <div className="drill-stack">
      <div className="segmented-buttons">
        {Object.keys(libraries).map((key) => (
          <button className={active === key ? "active" : ""} key={key} onClick={() => setActive(key)} type="button">
            {key}
          </button>
        ))}
      </div>
      <ScriptLibrary scripts={libraries[active]} />
    </div>
  );
}

function FollowUpSequences() {
  return (
    <div className="lesson-grid">
      <InfoBlock
        title="No answer sequence"
        items={[
          "Day 1: Call + voicemail + email.",
          "Voicemail: reaching out about reducing repetitive immigration case prep and drafting workload.",
          "Email: ask if the team still prepares immigration documents, briefs, motions, and supporting materials manually.",
          "Day 2: LinkedIn message.",
          "Day 4: Follow-up call.",
          "Day 7: Breakup email asking whether to close this out."
        ]}
      />
      <InfoBlock
        title="Booked appointment sequence"
        items={[
          "Immediately after booking: send calendar invite and confirmation email.",
          "24 hours before: confirm walkthrough and keep focus on reducing repetitive case prep and drafting workload.",
          "1 hour before: send quick reminder for the walkthrough."
        ]}
      />
      <InfoBlock
        title="No-show sequence"
        items={[
          "Same day: Looks like we missed each other. Are you better later today or tomorrow?",
          "Next day: reschedule and remind them why manual case prep makes this worth seeing.",
          "3 days later: ask whether to keep trying or whether now is not the right time."
        ]}
      />
      <InfoBlock
        title="Soft rejection sequence"
        items={[
          "Ask whether timing is blocked by budget, workflow, or case volume.",
          "Later follow-up: ask whether anything changed around paralegal workload, case volume, or manual drafting."
        ]}
      />
    </div>
  );
}

function ProspectQualificationGuide({ homework, updateHomework }) {
  return (
    <div className="drill-stack">
      <div className="lesson-grid">
        <InfoBlock
          title="Good prospect signs"
          items={[
            "Immigration case volume.",
            "Multiple paralegals or overloaded staff.",
            "Manual document preparation.",
            "Frequent briefs, motions, declarations, packets, or supporting documents.",
            "Desire to grow case volume.",
            "Staff capacity issues.",
            "Interest in efficiency.",
            "Decision maker willing to review software."
          ]}
        />
        <InfoBlock
          title="Weak prospect signs"
          items={[
            "Very low case volume.",
            "No repeatable workflows.",
            "No staff bottleneck.",
            "No interest in technology.",
            "No budget or authority.",
            "No urgency.",
            "Practice area mismatch."
          ]}
        />
        <InfoBlock
          title="Possible decision makers"
          items={[
            "Firm owner.",
            "Managing attorney.",
            "Partner.",
            "Operations manager.",
            "Practice manager.",
            "Office manager.",
            "Head paralegal.",
            "Legal operations director."
          ]}
        />
        <div className="script-box compact-script">
          <strong>Decision maker question</strong>
          <br />
          Who besides you would be involved in deciding whether a tool like this fits the firm?
        </div>
      </div>
      <HomeworkField
        label="Describe the strongest Coverable prospect in your own words"
        field="idealProspectDescription"
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function ConfidenceLanguageDrill({ homework, updateHomework }) {
  return (
    <div className="drill-stack">
      <div className="compare-grid">
        <InfoBlock
          title="Use confident language"
          items={[
            "The reason I am calling is...",
            "The easiest next step is...",
            "This is most relevant if...",
            "Based on what you said...",
            "Let us do this...",
            "Would it be worth taking a quick look?"
          ]}
        />
        <InfoBlock
          title="Avoid weak language"
          items={[
            "I was just calling...",
            "I am sorry to bother you...",
            "Maybe you might be interested...",
            "I do not know if this applies...",
            "Whenever you have time...",
            "Can I maybe send you something?"
          ]}
        />
      </div>
      <div className="compare-grid">
        <InfoBlock title="Pushy" items={["Ignoring what prospect says.", "Talking over them.", "Forcing a close with no fit.", "Being aggressive with tone.", "Arguing."]} />
        <InfoBlock title="Professional" items={["Acknowledging and redirecting.", "Asking controlled questions.", "Creating a logical next step.", "Being firm with direction.", "Reframing."]} />
      </div>
      <HomeworkField
        label="Rewrite a weak line into confident professional language"
        field="confidenceRewrite"
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function FinalScorecards({ homework, updateHomework }) {
  const cards = [
    {
      title: "Gatekeeper scorecard",
      passing: "Passing score: 26/35",
      categories: ["Confidence", "Reason for call", "Professionalism", "Transfer ask", "Objection handling", "Brevity", "Outcome control"]
    },
    {
      title: "Appointment-setting scorecard",
      passing: "Passing score: 27/35",
      categories: ["Opener", "Product explanation", "Qualification", "Curiosity", "Objection handling", "Demo ask", "Confirmation"]
    },
    {
      title: "Closing call scorecard",
      passing: "Passing score: 35/45",
      categories: ["Agenda setting", "Discovery", "Pain development", "ROI explanation", "Demo relevance", "Objection handling", "Trial closes", "Final ask", "Next step"]
    }
  ];

  return (
    <div className="drill-stack">
      {cards.map((card) => (
        <div className="scorecard-block" key={card.title}>
          <strong>{card.title}</strong>
          <span className="pill">{card.passing}</span>
          <FinalScoreRows
            categories={card.categories}
            homework={homework}
            prefix={card.title}
            updateHomework={updateHomework}
          />
        </div>
      ))}
      <QuestionBank
        title="Call review checklist"
        questions={[
          "Did the rep sound confident in the first 5 seconds?",
          "Did the rep clearly explain why they were calling?",
          "Did the rep avoid sounding like a generic salesperson?",
          "Did the rep ask a strong question early?",
          "Did the rep talk too much?",
          "Did the rep connect Coverable to law firm pain?",
          "Did the rep handle objections or fold?",
          "Did the rep ask for a next step?",
          "Did the rep confirm the next step clearly?",
          "Did the rep log notes correctly?"
        ]}
      />
    </div>
  );
}

function FinalScoreRows({ categories, homework, prefix, updateHomework }) {
  return (
    <div className="scorecard compact-scorecard">
      {categories.map((category) => (
        <div className="score-row" key={category}>
          <strong>{category}</strong>
          <label>
            Score
            <input
              max="5"
              min="1"
              type="number"
              value={homework[`${prefix}-${category}`] || ""}
              onChange={(event) => updateHomework(`${prefix}-${category}`, event.target.value)}
            />
          </label>
          <label>
            Notes
            <textarea
              value={homework[`${prefix}-notes-${category}`] || ""}
              onChange={(event) => updateHomework(`${prefix}-notes-${category}`, event.target.value)}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

function FinalCertificationDecision({ homework, updateHomework }) {
  return (
    <div className="drill-stack">
      <div className="lesson-grid">
        <InfoBlock
          title="Certified reps can"
          items={[
            "Explain Coverable in under 20 seconds.",
            "Name at least five law firm pain points.",
            "Explain ROI using labor hours saved.",
            "Explain attorney review is supported, not replaced.",
            "Use gatekeeper opener confidently.",
            "Handle what is this regarding, send information, busy, and office manager.",
            "Ask qualification questions and book a demo.",
            "Handle at least two objections and ask for next step.",
            "Use phone, email, LinkedIn, and text appropriately.",
            "Track calls, conversations, appointments, objections, follow-ups, and notes."
          ]}
        />
        <InfoBlock
          title="Decision definitions"
          items={[
            "Cleared: may call live prospects independently.",
            "Conditional clearance: may call live prospects with manager review.",
            "Not cleared: cannot call live prospects independently."
          ]}
        />
      </div>
      <div className="decision-grid">
        {["Cleared", "Conditional Clearance", "Not Cleared"].map((decision) => (
          <label className="decision-option" key={decision}>
            <input
              checked={homework.certificationDecision === decision}
              name="certificationDecision"
              onChange={() => updateHomework("certificationDecision", decision)}
              type="radio"
            />
            <span>{decision}</span>
          </label>
        ))}
      </div>
      <HomeworkField
        label="Improvement plan / final manager notes"
        field="finalImprovementPlan"
        homework={homework}
        updateHomework={updateHomework}
      />
    </div>
  );
}

function DayThreeQuiz({ homework, updateHomework }) {
  const questions = [
    "What are the steps of a Coverable sales call?",
    "Why should reps ask discovery questions before presenting?",
    "Name five pain questions.",
    "Give one ROI example.",
    "How should reps respond to \"We already have software\"?",
    "How should reps respond to \"I do not trust AI\"?",
    "What is a trial close?",
    "Give two trial close questions.",
    "What is the difference between a soft close and direct close?",
    "What should the rep do after the call?"
  ];

  return (
    <div className="quiz-stack">
      <span className="eyebrow">Quiz - passing score 80%</span>
      {questions.map((question, index) => (
        <HomeworkField
          field={`day3Quiz${index}`}
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

function TeamResults({ state, entries }) {
  const results = entries
    .filter((entry) => entry.outcome === "Closed" || entry.outcome === "Demo Booked")
    .slice(0, 4);

  if (!results.length) return null;

  return (
    <section className="team-results">
      {results.map((entry) => {
        const rep = state.reps.find((item) => item.id === entry.repId);
        return (
          <div className="result-row" key={entry.id}>
            <div>
              <strong>{entry.firm}</strong>
              <span>{rep?.name || "Rep"}</span>
            </div>
            <span className="status">{entry.outcome === "Demo Booked" ? "Demo" : "Closed"}</span>
            {entry.outcome === "Closed" && entry.saleAmount ? (
              <strong className="result-value">{formatMoney(entry.saleAmount)}</strong>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function CrmTable({ entries, onSelect, selectedId }) {
  if (!entries.length) return <div className="empty">No activity</div>;
  return (
    <div className="table-wrap crm-table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th>Firm</th>
            <th>Stage</th>
            <th>Channel</th>
            <th>Value</th>
            <th>Follow-up</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr className={selectedId === entry.id ? "selected" : ""} key={entry.id}>
              <td>
                <strong>{entry.firm}</strong>
                <div className="small">{entry.contact}</div>
              </td>
              <td>
                <span className="status">{entry.outcome}</span>
              </td>
              <td>{entry.channel}</td>
              <td className="money-cell">{entry.saleAmount ? formatMoney(entry.saleAmount) : "-"}</td>
              <td>{entry.nextFollowUp ? formatShortDate(entry.nextFollowUp) : "-"}</td>
              <td>{formatShortDate(entry.createdAt)}</td>
              <td>
                <button className="row-action" onClick={() => onSelect(entry.id)} type="button">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CrmDetail({ entry, onClose }) {
  return (
    <aside className="crm-detail card">
      <div className="crm-detail-head">
        <div>
          <h3>{entry.firm}</h3>
          <span className="small">
            {entry.contact} / {entry.contactRole}
          </span>
        </div>
        <button aria-label="Close detail" className="row-action" onClick={onClose} type="button">
          Close
        </button>
      </div>
      <div className="crm-detail-grid">
        <DetailItem label="Stage" value={entry.outcome} />
        <DetailItem label="Channel" value={entry.channel} />
        <DetailItem label="Value" value={entry.saleAmount ? formatMoney(entry.saleAmount) : "-"} />
        <DetailItem label="Term" value={entry.contractTerm || "-"} />
        <DetailItem label="Closed" value={entry.closeDate ? formatShortDate(entry.closeDate) : "-"} />
        <DetailItem label="Follow-up" value={entry.nextFollowUp ? formatShortDate(entry.nextFollowUp) : "-"} />
      </div>
      {entry.objection ? (
        <div className="crm-detail-note">
          <span>Objection</span>
          <p>{entry.objection}</p>
        </div>
      ) : null}
      {entry.notes ? (
        <div className="crm-detail-note">
          <span>Notes</span>
          <p>{entry.notes}</p>
        </div>
      ) : null}
    </aside>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AnalyticsValue({ label, value }) {
  return (
    <div className="analytics-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <article className="card metric">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
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
          <h1>Coverable</h1>
        </div>
        <div className="loading-block">
          <div className="loading-bar" />
          <div className="notice">
            {slow ? notice || "Still loading..." : "Loading..."}
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
          <h1>Coverable</h1>
        </div>
        <div className="login-form">
          <div>
            <h2>Sign in</h2>
          </div>
          <a className="button text-center" href="/login">
            Continue
          </a>
        </div>
      </section>
    </main>
  );
}

function getRepStats(state, repId) {
  const entries = state.crm.filter((entry) => entry.repId === repId);
  const scriptCalls = (state.scriptCalls || []).filter((entry) => entry.repId === repId);
  const progressValues = Object.values(state.progress[repId] || {});
  const onboarding = progressValues.length
    ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / bootcampDays.length)
    : 0;
  const activity = entries.length;
  const calls = scriptCalls.length;
  const averageClicks = calls
    ? scriptCalls.reduce((sum, entry) => sum + entry.buttonClicks, 0) / calls
    : 0;
  const demos = entries.filter((entry) => entry.outcome === "Demo Booked").length;
  const closed = entries.filter((entry) => entry.outcome === "Closed").length;
  const followUps = entries.filter((entry) => entry.outcome === "Follow-up").length;
  const attorneyReached = entries.filter((entry) => entry.outcome === "Attorney Reached").length;
  const revenue = entries
    .filter((entry) => entry.outcome === "Closed")
    .reduce((sum, entry) => sum + Number(entry.saleAmount || 0), 0);
  return { activity, calls, averageClicks, demos, closed, followUps, attorneyReached, onboarding, revenue };
}

function getEmptyStats() {
  return { activity: 0, calls: 0, averageClicks: 0, demos: 0, closed: 0, followUps: 0, onboarding: 0, revenue: 0 };
}

function rankReps(state) {
  return state.reps
    .map((rep) => ({ ...rep, ...getRepStats(state, rep.id) }))
    .sort((a, b) => b.closed - a.closed || b.demos - a.demos || b.calls - a.calls || b.onboarding - a.onboarding);
}

function buildAdminAnalytics(state, repId) {
  const reps = repId === "all" ? state.reps : state.reps.filter((rep) => rep.id === repId);
  const selectedIds = new Set(reps.map((rep) => rep.id));
  const calls = (state.scriptCalls || []).filter((call) => selectedIds.has(call.repId));
  const crm = state.crm.filter((entry) => selectedIds.has(entry.repId));
  const clickTotal = calls.reduce((sum, call) => sum + call.buttonClicks, 0);
  const responseMap = new Map();

  calls.forEach((call) => {
    (call.responses || []).forEach((response) => {
      const label = response.response || "Unknown response";
      responseMap.set(label, (responseMap.get(label) || 0) + 1);
    });
  });

  const responseCount = Array.from(responseMap.values()).reduce((sum, count) => sum + count, 0);
  const commonResponses = Array.from(responseMap, ([label, count]) => ({
    label,
    count,
    share: responseCount ? Math.max(4, Math.round((count / responseCount) * 100)) : 0
  }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 6);
  const demos = crm.filter((entry) => entry.outcome === "Demo Booked").length;
  const closed = crm.filter((entry) => entry.outcome === "Closed").length;
  const revenue = crm
    .filter((entry) => entry.outcome === "Closed")
    .reduce((sum, entry) => sum + Number(entry.saleAmount || 0), 0);
  const mostCommon = commonResponses[0]?.label;
  const signals = [];

  if (!calls.length) {
    signals.push("No tracked Script calls yet. Completed calls will begin forming a coaching baseline.");
  } else {
    signals.push(
      `${calls.length} calls average ${formatAverageClicks(clickTotal / calls.length)} response clicks before restart.`
    );
    if (mostCommon) {
      signals.push(`Most frequent response: "${mostCommon}". Review whether this branch earns a clear next step.`);
    } else {
      signals.push("Older counted calls do not yet contain response paths; new calls will reveal objection patterns.");
    }
    if (demos) {
      signals.push(`${demos} demos are recorded in CRM versus ${calls.length} tracked Script calls for this view.`);
    } else {
      signals.push("No booked demos are recorded in CRM for this view yet; monitor which response branches precede bookings.");
    }
  }

  return {
    label: repId === "all" ? "Full team" : reps[0]?.name || "Member",
    calls: calls.length,
    averageClicks: calls.length ? clickTotal / calls.length : 0,
    demos,
    closed,
    revenue,
    demoRate: calls.length ? demos / calls.length : 0,
    shortCalls: calls.filter((call) => call.buttonClicks <= 2).length,
    deepCalls: calls.filter((call) => call.buttonClicks >= 6).length,
    longestCall: calls.reduce((max, call) => Math.max(max, call.buttonClicks), 0),
    responseCoverage: calls.length
      ? calls.filter((call) => (call.responses || []).length > 0).length / calls.length
      : 0,
    responseCount,
    commonResponses,
    signals
  };
}

function initialsFor(value) {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatAverageClicks(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value || 0);
}

function formatPercent(value) {
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(value || 0);
}

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const domestic = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (domestic.length !== 10) return value || "-";
  return `(${domestic.slice(0, 3)}) ${domestic.slice(3, 6)}-${domestic.slice(6)}`;
}

function formatPracticeArea(value) {
  if (!value) return "-";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapFirmRow(row) {
  return {
    id: row.id,
    attorney: row.lead_attorney_full_name || "",
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    firmName: row.firm_name || "",
    practiceArea: row.practice_area || "",
    website: row.website || "",
    phone: row.firm_phone || "",
    email: row.attorney_email || "",
    linkedinUrl: row.linkedin_url || "",
    title: row.title || "",
    address: row.address || "",
    city: row.city || "",
    state: row.state || "",
    zip: row.zip || "",
    sourceUrl: row.source_url || "",
    confidenceScore: Number(row.confidence_score || 0),
    notes: row.notes || "",
    dataSources: row.data_sources || "",
    outreachTier: row.outreach_tier || "",
    emailDomain: row.email_domain || "",
    freeEmail: Boolean(row.free_email),
    laneTarget: row.lane_target || "",
    emailValid: Boolean(row.email_is_valid),
    calledBy: row.called_by || null,
    calledAt: row.called_at || "",
    callCount: Number(row.call_count || 0)
  };
}

function profileFromUser(user) {
  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "New Rep";
  return {
    id: user.id,
    name,
    email: user.email,
    role: "rep",
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

function safeParseJson(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function isMissingCourseAnswersTable(error) {
  const message = error?.message || "";
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("course_answers");
}

function isMissingCrmSalesFields(error) {
  const message = error?.message || "";
  return (
    error?.code === "PGRST204" ||
    message.includes("sale_amount") ||
    message.includes("contract_term") ||
    message.includes("close_date")
  );
}

function isMissingScriptCallTable(error) {
  const message = error?.message || "";
  return error?.code === "42P01" || error?.code === "PGRST205" || message.includes("script_call_metrics");
}

function isMissingScriptPathFields(error) {
  const message = error?.message || "";
  return Boolean(error) && (error?.code === "PGRST204" || message.includes("response_path") || message.includes("practice_area"));
}

function isMissingFirmsSetup(error) {
  const message = error?.message || "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST202" ||
    error?.code === "PGRST205" ||
    message.includes("firms") ||
    message.includes("mark_firm_called")
  );
}

async function loadScriptCallMetrics(supabase) {
  const result = await supabase
    .from("script_call_metrics")
    .select("id, user_id, button_clicks, response_path, practice_area, created_at")
    .order("created_at", { ascending: false });

  if (!isMissingScriptPathFields(result.error)) return result;

  const fallback = await supabase
    .from("script_call_metrics")
    .select("id, user_id, button_clicks, created_at")
    .order("created_at", { ascending: false });

  return { ...fallback, legacy: !fallback.error };
}

function nextCourseTask(state, currentStats) {
  if (currentStats.onboarding >= 100) {
    return {
      title: "Keep the board moving",
      action: "Open CRM",
      view: "crm"
    };
  }

  const currentRepId = state.currentRepId;
  const progress = state.progress[currentRepId] || {};
  const nextDay = bootcampDays.find((day) => (progress[day.id] || 0) < 100) || bootcampDays[0];
  return {
    title: nextDay.title,
    action: "Continue",
    view: "course"
  };
}
