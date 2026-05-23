"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Confirming your account...");

  useEffect(() => {
    async function finishAuth() {
      const supabase = createBrowserSupabaseClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        setMessage("This login link is missing a confirmation code. Try signing in again.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        setMessage(error.message);
        return;
      }

      window.location.replace("/");
    }

    finishAuth();
  }, []);

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand compact">
          <div className="mark">C</div>
          <h1>Coverable</h1>
        </div>
        <div className="loading-block">
          <div className="loading-bar" />
          <div className="notice">{message}</div>
        </div>
      </section>
    </main>
  );
}
