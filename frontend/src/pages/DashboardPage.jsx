
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";

const metricDefinitions = [
  {
    key: "totalProjects",
    label: "Total projects",
    icon: "▦",
    description: "Projects you own",
    color: "blue",
  },
  {
    key: "totalTasks",
    label: "Total tasks",
    icon: "☷",
    description: "Tasks across your projects",
    color: "purple",
  },
  {
    key: "completedTasks",
    label: "Completed",
    icon: "✓",
    description: "Tasks finished",
    color: "green",
  },
  {
    key: "pendingTasks",
    label: "Pending",
    icon: "◷",
    description: "Tasks not completed",
    color: "orange",
  },
  {
    key: "overdueTasks",
    label: "Overdue",
    icon: "!",
    description: "Incomplete tasks past deadline",
    color: "red",
  },
];

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/dashboard/metrics", { token });
      setMetrics(result.metrics);
    } catch (err) {
      setError(err.message || "Unable to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-logo">SM</div>
          <div>
            <strong>Smart Task Manager</strong>
            <span>Workspace overview</span>
          </div>
        </div>

        <div className="dashboard-user">
          <div className="user-avatar">
            {(user?.name || "U").trim().charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.email || ""}</span>
          </div>
          <button className="logout-button" onClick={logout} type="button">
            Log out
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">OVERVIEW</p>
            <h1>Your workspace at a glance</h1>
            <p className="dashboard-subtitle">
              Keep track of your projects, tasks, and deadlines.
            </p>
          </div>

          <button
            className="refresh-button"
            type="button"
            onClick={loadMetrics}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {error && (
          <div className="dashboard-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={loadMetrics}>
              Try again
            </button>
          </div>
        )}

        <div className="metrics-grid" aria-live="polite">
          {metricDefinitions.map((metric) => (
            <article
              className={`metric-card metric-${metric.color}`}
              key={metric.key}
            >
              <div className="metric-card-top">
                <span className="metric-label">{metric.label}</span>
                <span className="metric-icon" aria-hidden="true">
                  {metric.icon}
                </span>
              </div>

              <div className="metric-value">
                {loading ? "—" : (metrics?.[metric.key] ?? 0)}
              </div>

              <p>{metric.description}</p>
            </article>
          ))}
        </div>

        <section className="dashboard-lower">
          <div className="overview-card">
            <div className="overview-card-heading">
              <div>
                <h2>Workspace summary</h2>
                <p>A quick look at your current workload.</p>
              </div>
            </div>

            {loading ? (
              <p className="summary-message">Loading your workspace...</p>
            ) : (
              <div className="summary-content">
                <div className="summary-row">
                  <span>Tasks completed</span>
                  <strong>
                    {metrics?.totalTasks
                      ? Math.round(
                          (metrics.completedTasks / metrics.totalTasks) * 100
                        )
                      : 0}
                    %
                  </strong>
                </div>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Task completion"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={
                    metrics?.totalTasks
                      ? Math.round(
                          (metrics.completedTasks / metrics.totalTasks) * 100
                        )
                      : 0
                  }
                >
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        metrics?.totalTasks
                          ? Math.round(
                              (metrics.completedTasks / metrics.totalTasks) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <div className="summary-note">
                  {metrics?.overdueTasks > 0
                    ? `You have ${metrics.overdueTasks} overdue task${
                        metrics.overdueTasks === 1 ? "" : "s"
                      } to review.`
                    : "No overdue tasks in your current workload."}
                </div>
              </div>
            )}
          </div>

          <div className="overview-card next-steps-card">
            <h2>Next steps</h2>
            <p>Your workspace is connected to the backend.</p>
            <ul>
              <li>Review your project list.</li>
              <li>Track task priorities and deadlines.</li>
              <li>Keep task statuses up to date.</li>
            </ul>
            <span className="connection-status">
              <span className="status-dot" />
              API connection configured
            </span>
          </div>
        </section>

        <footer className="dashboard-footer">
          Smart Task Manager <span>·</span> Bright Mind Ltd. assessment
        </footer>
      </section>
    </main>
  );
}
