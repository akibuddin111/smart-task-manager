
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useAuth } from "../context/useAuth";
import "../styles/dashboard.css";

const metricDefinitions = [
  {
    key: "totalProjects",
    label: "Total projects",
    icon: "▦",
    description: "Projects available to you",
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

const STATUS_OPTIONS = [
  { name: "To Do", key: "todoTasks", color: "#8b98ad" },
  { name: "In Progress", key: "inProgressTasks", color: "#397cf6" },
  { name: "Completed", key: "completedTasks", color: "#10b981" },
];

const PRIORITY_OPTIONS = [
  {
    name: "High",
    key: "highPriorityTasks",
    color: "high",
    description: "High Priority",
  },
  {
    name: "Medium",
    key: "mediumPriorityTasks",
    color: "medium",
    description: "Medium Priority",
  },
  {
    name: "Low",
    key: "lowPriorityTasks",
    color: "low",
    description: "Low Priority",
  },
];

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "No deadline";

  const dateString = String(value).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (!match) return "Invalid date";

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getProjectProgress(projectId, tasks) {
  const projectTasks = tasks.filter(
    (task) => String(task.project_id) === String(projectId)
  );

  const completed = projectTasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const total = projectTasks.length;

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function isOverdue(task, today) {
  return (
    task.status !== "Completed" &&
    Boolean(task.deadline) &&
    String(task.deadline).slice(0, 10) < today
  );
}

function SectionHeading({ title, description, trailing }) {
  return (
    <div className="dashboard-section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {trailing}
    </div>
  );
}

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [metrics, setMetrics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [metricsResponse, projectsResponse, tasksResponse, overdueResponse,] =
        await Promise.all([
          apiRequest("/dashboard/metrics", { token }),
          apiRequest("/projects", { token }),
          apiRequest("/tasks", { token }),
          apiRequest("/dashboard/overdue-tasks", { token }),
        ]);

      if (!metricsResponse?.metrics) {
        throw new Error("The dashboard metrics response is invalid.");
      }

      const projectList = Array.isArray(projectsResponse)
        ? projectsResponse
        : projectsResponse?.projects;

      const taskList = Array.isArray(tasksResponse)
        ? tasksResponse
        : tasksResponse?.tasks;

      if (!Array.isArray(projectList) || !Array.isArray(taskList)) {
        throw new Error("The projects or tasks response is invalid.");
      }

      setMetrics(metricsResponse.metrics);
      setProjects(projectList);
      setTasks(taskList);
      setOverdueTasks(
        Array.isArray(overdueResponse?.tasks)
          ? overdueResponse.tasks
          : []
      );
    } catch (err) {
      setError(err.message || "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      loadDashboard();
    }, 0);

    return () => clearTimeout(timerId);
  }, [loadDashboard]);

  const today = getTodayString();

  const statusData = STATUS_OPTIONS.map((status) => ({
    ...status,
    value: Number(metrics?.[status.key] ?? 0),
  }));

  const priorityData = PRIORITY_OPTIONS.map((priority) => ({
    ...priority,
    value: Number(metrics?.[priority.key] ?? 0),
  }));

  const totalTasks = Number(metrics?.totalTasks ?? 0);
  const completedTasks = Number(metrics?.completedTasks ?? 0);

  const completionPercentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const activeProjects = projects
    .filter((project) =>
      tasks.some(
        (task) =>
          String(task.project_id) === String(project.id) &&
          task.status !== "Completed"
      )
    )
    .map((project) => ({
      ...project,
      progress: getProjectProgress(project.id, tasks),
    }))
    .sort((a, b) => {
      const aOverdue = tasks.some(
        (task) =>
          String(task.project_id) === String(a.id) &&
          isOverdue(task, today)
      );

      const bOverdue = tasks.some(
        (task) =>
          String(task.project_id) === String(b.id) &&
          isOverdue(task, today)
      );

      return Number(bOverdue) - Number(aOverdue);
    });

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-logo">SM</div>
          <div>
            <strong>Smart Task Manager</strong>
            <span>{isAdmin ? "Platform overview" : "Workspace overview"}</span>
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
            <h1>
              {isAdmin ? "Platform overview" : "Your workspace at a glance"}
            </h1>
            <p className="dashboard-subtitle">
              {isAdmin
                ? "Monitor projects, tasks, and deadlines across the platform."
                : "Keep track of your projects, tasks, and deadlines."}
            </p>
          </div>

          <button
            className="refresh-button"
            type="button"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {error && (
          <div className="dashboard-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={loadDashboard}>
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

        <section className="dashboard-analytics">
          <article className="dashboard-panel status-panel">
            <SectionHeading
              title="Task Status Breakdown"
              description="Track progress across all your tasks."
              trailing={
                <span className="overall-progress">
                  Overall Progress:{" "}
                  {loading ? "—" : `${completionPercentage}%`}
                </span>
              }
            />

            {loading ? (
              <div className="dashboard-state">Loading task status...</div>
            ) : !metrics || totalTasks === 0 ? (
              <div className="dashboard-state">
                No tasks yet. Create a task to see your progress.
              </div>
            ) : (
              <div className="status-breakdown">
                {statusData.map((status) => {
                  const percentage =
                    totalTasks > 0
                      ? Math.round((status.value / totalTasks) * 100)
                      : 0;

                  return (
                    <div className="status-item" key={status.key}>
                      <div className="status-item-heading">
                        <span style={{ color: status.color }}>
                          {status.name}
                        </span>
                        <strong>
                          {status.value}{" "}
                          {status.value === 1 ? "task" : "tasks"}
                        </strong>
                      </div>

                      <div
                        className="status-progress-track"
                        role="progressbar"
                        aria-label={`${status.name} tasks`}
                        aria-valuemin={0}
                        aria-valuemax={totalTasks}
                        aria-valuenow={status.value}
                      >
                        <div
                          className="status-progress-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: status.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="dashboard-panel priority-panel">
            <SectionHeading
              title="Tasks by Priority"
              description="Understand where attention is needed."
            />

            {loading ? (
              <div className="dashboard-state">Loading priorities...</div>
            ) : !metrics || totalTasks === 0 ? (
              <div className="dashboard-state">
                No tasks yet. Priority counts will appear here.
              </div>
            ) : (
              <div className="priority-cards">
                {priorityData.map((priority) => (
                  <div
                    className={`priority-card priority-${priority.color}`}
                    key={priority.key}
                  >
                    <strong>{priority.value}</strong>
                    <span>{priority.description}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="dashboard-panel project-overview-panel">
          <SectionHeading
            title="Active Project Overview"
            description="Projects with at least one task that is not completed."
            trailing={
              <span className="section-count">
                {loading ? "—" : activeProjects.length} active
              </span>
            }
          />

          {loading ? (
            <div className="dashboard-state">Loading projects...</div>
          ) : activeProjects.length === 0 ? (
            <div className="dashboard-state">
              No active projects. Projects with unfinished tasks will appear
              here.
            </div>
          ) : (
            <div className="active-project-list">
              {activeProjects.map((project) => {
                const overdueCount = tasks.filter(
                  (task) =>
                    String(task.project_id) === String(project.id) &&
                    isOverdue(task, today)
                ).length;

                return (
                  <article className="active-project-item" key={project.id}>
                    <div className="active-project-main">
                      <div className="active-project-icon" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          width="21"
                          height="21"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="4"
                            y="4"
                            width="16"
                            height="16"
                            rx="3"
                          />
                          <path d="M8 8h8M8 12h8M8 16h5" />
                        </svg>
                      </div>

                      <div className="active-project-info">
                        <h3>{project.name}</h3>
                        <p>
                          {project.progress.completed} of{" "}
                          {project.progress.total} tasks completed
                        </p>
                      </div>

                      <strong className="project-percentage">
                        {project.progress.percentage}%
                      </strong>
                    </div>

                    <div
                      className="project-progress-track"
                      role="progressbar"
                      aria-label={`${project.name} completion`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={project.progress.percentage}
                    >
                      <div
                        className="project-progress-fill"
                        style={{
                          width: `${project.progress.percentage}%`,
                        }}
                      />
                    </div>

                    <div className="active-project-footer">
                      <span>
                        {project.progress.total - project.progress.completed}{" "}
                        unfinished{" "}
                        {project.progress.total -
                          project.progress.completed ===
                        1
                          ? "task"
                          : "tasks"}
                      </span>

                      {overdueCount > 0 && (
                        <span className="project-overdue-badge">
                          {overdueCount} overdue
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-panel overdue-panel">
          <SectionHeading
            title="Overdue Tasks"
            description="Incomplete tasks whose deadlines have passed."
            trailing={
              <span
                className={`overdue-count ${
                  overdueTasks.length > 0 ? "has-overdue" : ""
                }`}
              >
                {loading ? "—" : overdueTasks.length} overdue
              </span>
            }
          />

          {loading ? (
            <div className="dashboard-state">Loading overdue tasks...</div>
          ) : overdueTasks.length === 0 ? (
            <div className="overdue-empty">
              <span className="overdue-empty-icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <strong>You're all caught up</strong>
                <p>No incomplete tasks are past their deadlines.</p>
              </div>
            </div>
          ) : (
            <div className="overdue-task-list">
              {overdueTasks.map((task) => (
                <article className="overdue-task-item" key={task.id}>
                  <div className="overdue-task-indicator" />

                  <div className="overdue-task-main">
                    <h3>{task.title}</h3>
                    <p>
                      {task.project_name || "Project"}{" "}
                      <span aria-hidden="true">·</span>{" "}
                      {task.assignee_name || "Unassigned"}
                    </p>
                  </div>

                  <div className="overdue-task-meta">
                    <span
                      className={`task-priority-tag task-priority-${String(
                        task.priority || "Medium"
                      ).toLowerCase()}`}
                    >
                      {task.priority || "Medium"}
                    </span>
                    <span className="overdue-deadline">
                      Due {formatDate(task.deadline)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          Smart Task Manager <span>·</span> Bright Mind Ltd. assessment
        </footer>
      </section>
    </main>
  );
}
