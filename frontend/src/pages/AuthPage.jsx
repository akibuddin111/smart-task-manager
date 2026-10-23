import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
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
              <input
                type="password"
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