"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      window.location.reload();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-auth-page">
      <form className="admin-auth-card" onSubmit={handleSubmit}>
        <p className="admin-kicker">PRIVATE PORTFOLIO CMS</p>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your portfolio.</p>
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="admin-primary" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
