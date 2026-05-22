"use client";

import { useState } from "react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const [fullName, setFullName] = useState("");
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
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName.trim() } }
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email for the confirmation link, then sign in.");
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
            <p>Use your rep account to save CRM activity, onboarding progress, and sales-floor ranking.</p>
          </div>

          {mode === "signup" ? (
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder="Maya Rivera"
              />
            </div>
          ) : null}

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
