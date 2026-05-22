"use client";

import { useState } from "react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!configured) {
      setMessage("Supabase is not connected yet. Add the env vars, then this login becomes live.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand compact">
          <div className="mark">C</div>
          <div>
            <h1>Coverable Command</h1>
            <span>Sales onboarding login</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <div className="eyebrow">Rep access</div>
            <h2>{mode === "signup" ? "Create your rep account" : "Sign in to your sales floor"}</h2>
            <p>
              This will use Supabase Auth once the free Supabase project is connected. Until then,
              the app runs in demo mode.
            </p>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="rep@coverable.ai"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
          </div>

          {message ? <div className="notice">{message}</div> : null}

          <button className="button" type="submit" disabled={loading}>
            {loading ? "Working..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>

          <button
            className="ghost"
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? "Already have an account?" : "Need to create an account?"}
          </button>

          {!configured ? (
            <a className="ghost text-center" href="/">
              Continue in demo mode
            </a>
          ) : null}
        </form>
      </section>
    </main>
  );
}
