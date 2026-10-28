import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import { useAuth } from "../context/useAuth";
import "../styles/auth.css";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const demoAccounts = [
    {
      label: "Fill Admin Demo",
      name: "Admin",
      email: import.meta.env.VITE_DEMO_ADMIN_EMAIL || "",
      password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || "",
      badge: "Full Access",
    },
    {
      label: "Fill Team Member Demo",
      name: "Team Member",
      email: import.meta.env.VITE_DEMO_MEMBER_EMAIL || "",
      password: import.meta.env.VITE_DEMO_MEMBER_PASSWORD || "",
      badge: "Member View",
    },
  ];

  function fillDemoAccount(account) {
    setEmail(account.email);
    setPassword(account.password);
    setShowPassword(false);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await apiRequest("/auth/register", {
          method: "POST",
          body: { name, email, password },
        });
      }

      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      saveSession(result);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="brand-mark">SM</div>
        <p className="eyebrow">SMART TASK MANAGER</p>
        <h1>Make work clearer. Make progress visible.</h1>
        <p className="brand-description">
          Organize projects, manage tasks, and keep track of
          deadlines in one place.
        </p>

        <div className="brand-points">
          <div><span>01</span> Plan projects with confidence</div>
          <div><span>02</span> Track priorities and deadlines</div>
          <div><span>03</span> Measure progress at a glance</div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">
            {isRegister ? "GET STARTED" : "WELCOME BACK"}
          </p>

          <h2>
            {isRegister ? "Create your account" : "Sign in to your workspace"}
          </h2>

          <p className="auth-subtitle">
            {isRegister
              ? "Create an account to start organizing your work."
              : "Enter your details to access your projects."}
          </p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <label>
                Full name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                autoComplete="email"
                required
              />
            </label>

            
            <label>
              Password
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  maxLength={72}
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A11 11 0 0121 12a11.8 11.8 0 01-3.1 3.9" />
                      <path d="M6.2 6.2A12 12 0 003 12a11 11 0 0018 6" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>


            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Please wait..."
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
          
          {!isRegister && (
            <section className="demo-accounts">
              <div className="demo-divider" />

              <h3 className="demo-heading">
                <span aria-hidden="true">⚡</span>
                DEMO ACCOUNTS (CLICK TO FILL FIELDS)
              </h3>

              {demoAccounts.map((account) => (
                <button
                  key={account.name}
                  type="button"
                  className="demo-account-button"
                  onClick={() => fillDemoAccount(account)}
                  disabled={!account.email || !account.password}
                >
                  <span className="demo-account-icon" aria-hidden="true">
                    {account.name === "Admin" ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24">
                        <circle cx="9" cy="8" r="4" />
                        <path d="M2 21v-2a7 7 0 0114 0v2" />
                        <path d="M19 8v6M16 11h6" />
                      </svg>
                    )}
                  </span>

                  <span className="demo-account-label">
                    {account.label}
                    <small>{account.name}</small>
                  </span>

                  <span
                    className={`demo-account-badge ${
                      account.name === "Admin"
                        ? "demo-badge-admin"
                        : "demo-badge-member"
                    }`}
                  >
                    {account.badge}
                  </span>
                </button>
              ))}

              {demoAccounts.some(
                (account) => !account.email || !account.password
              ) && (
                <p className="demo-setup-note">
                  Configure the demo account variables to enable these buttons.
                </p>
              )}
            </section>
          )}

          <p className="auth-switch">
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <Link to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create one"}
            </Link>
          </p>

          <p className="auth-footer">
            Smart Task Manager · Bright Mind Ltd. assessment
          </p>
        </div>
      </section>
    </main>
  );
}