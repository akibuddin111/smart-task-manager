import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiRequest } from "../api";
import "../styles/layout.css";

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";

  // Treat PostgreSQL DATE values as calendar dates, avoiding timezone shifts.
  const datePart = String(deadline).slice(0, 10);
  const parts = datePart.split("-");

  if (parts.length !== 3) return datePart;

  const [year, month, day] = parts;

  if (!year || !month || !day) return datePart;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  ).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AppLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  const initial = (user?.name || "U").trim().charAt(0).toUpperCase();

  async function loadOverdueTasks() {
    if (!token) {
      setOverdueTasks([]);
      setNotificationsError("");
      return;
    }

    setNotificationsLoading(true);

    try {
      const result = await apiRequest("/dashboard/overdue-tasks", {
        token,
      });

      setOverdueTasks(
        Array.isArray(result.tasks) ? result.tasks : []
      );
      setNotificationsError("");
    } catch (error) {
      setNotificationsError(
        error.message || "Unable to load overdue tasks."
      );
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    async function refreshNotifications() {
      if (!token) {
        setOverdueTasks([]);
        setNotificationsError("");
        return;
      }

      try {
        const result = await apiRequest("/dashboard/overdue-tasks", {
          token,
        });

        if (!cancelled) {
          setOverdueTasks(
            Array.isArray(result.tasks) ? result.tasks : []
          );
          setNotificationsError("");
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationsError(
            error.message || "Unable to load overdue tasks."
          );
        }
      }
    }

    refreshNotifications();
    intervalId = window.setInterval(refreshNotifications, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function toggleSidebar() {
    if (window.matchMedia("(max-width: 640px)").matches) {
      setMobileOpen((open) => !open);
    } else {
      setCollapsed((value) => !value);
    }
  }

  function closeMobileSidebar() {
    setMobileOpen(false);
  }

  async function toggleNotifications() {
    const willOpen = !notificationsOpen;

    setNotificationsOpen(willOpen);
    setProfileOpen(false);

    if (willOpen) {
      await loadOverdueTasks();
    }
  }

  function openTasks() {
    setNotificationsOpen(false);
    navigate("/tasks");
  }

  return (
    <div
      className={[
        "app-shell",
        collapsed ? "sidebar-collapsed" : "",
        mobileOpen ? "mobile-sidebar-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <aside className="app-sidebar" aria-label="Workspace sidebar">
        <NavLink
          to="/dashboard"
          className="sidebar-brand"
          onClick={closeMobileSidebar}
          aria-label="Smart Task Manager home"
        >
          <span className="sidebar-logo">SM</span>
          <span className="sidebar-brand-text">
            <strong>Smart Task</strong>
          </span>
        </NavLink>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          <NavLink
            to="/dashboard"
            className="sidebar-link"
            title="Dashboard"
            onClick={closeMobileSidebar}
          >
            <span className="sidebar-link-icon" aria-hidden="true">▦</span>
            <span className="sidebar-link-label">Dashboard</span>
          </NavLink>

          <NavLink
            to="/projects"
            className="sidebar-link"
            title="Projects"
            onClick={closeMobileSidebar}
          >
            <span className="sidebar-link-icon" aria-hidden="true">▤</span>
            <span className="sidebar-link-label">Projects</span>
          </NavLink>

          <NavLink
            to="/tasks"
            className="sidebar-link"
            title="Tasks"
            onClick={closeMobileSidebar}
          >
            <span className="sidebar-link-icon" aria-hidden="true">☷</span>
            <span className="sidebar-link-label">Tasks</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
            title="Log out"
          >
            <span className="sidebar-logout-icon" aria-hidden="true">↪</span>
            <span className="sidebar-logout-label">Log out</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={
                mobileOpen || !collapsed
                  ? "Collapse or close sidebar"
                  : "Expand sidebar"
              }
              aria-expanded={
                window.matchMedia("(max-width: 640px)").matches
                  ? mobileOpen
                  : !collapsed
              }
              title="Toggle sidebar"
            >
              <span aria-hidden="true">☰</span>
            </button>

            <div className="topbar-heading">
              <strong>Smart Task Manager</strong>
              <span>Your workspace</span>
            </div>
          </div>

          <div className="topbar-actions">
            <div
              className="notification-container"
              ref={notificationsRef}
            >
              <button
                type="button"
                className={`notification-trigger ${
                  notificationsOpen ? "is-open" : ""
                }`}
                onClick={toggleNotifications}
                aria-label={`Overdue task notifications: ${overdueTasks.length}`}
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
                title="Overdue task notifications"
              >
                <span aria-hidden="true">🔔</span>

                {overdueTasks.length > 0 && (
                  <span className="notification-badge">
                    {overdueTasks.length > 99
                      ? "99+"
                      : overdueTasks.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <section
                  className="notification-dropdown"
                  aria-label="Overdue task notifications"
                >
                  <div className="notification-header">
                    <div>
                      <strong>Overdue tasks</strong>
                      <span>
                        {overdueTasks.length}{" "}
                        {overdueTasks.length === 1
                          ? "task needs"
                          : "tasks need"}{" "}
                        attention
                      </span>
                    </div>

                    <button
                      type="button"
                      className="notification-refresh"
                      onClick={loadOverdueTasks}
                      disabled={notificationsLoading}
                      aria-label="Refresh overdue tasks"
                      title="Refresh"
                    >
                      ↻
                    </button>
                  </div>

                  {notificationsLoading ? (
                    <div className="notification-state" role="status">
                      Loading overdue tasks…
                    </div>
                  ) : notificationsError ? (
                    <div className="notification-state notification-error" role="alert">
                      <p>{notificationsError}</p>
                      <button
                        type="button"
                        onClick={loadOverdueTasks}
                      >
                        Try again
                      </button>
                    </div>
                  ) : overdueTasks.length === 0 ? (
                    <div className="notification-state notification-empty">
                      <span aria-hidden="true">✓</span>
                      <strong>You're all caught up!</strong>
                      <p>There are no overdue tasks in your accessible projects.</p>
                    </div>
                  ) : (
                    <ul className="notification-list">
                      {overdueTasks.map((task) => (
                        <li key={task.id}>
                          <button
                            type="button"
                            className="notification-task"
                            onClick={openTasks}
                          >
                            <span className="notification-task-icon" aria-hidden="true">
                              !
                            </span>

                            <span className="notification-task-details">
                              <strong>{task.title}</strong>
                              <span>{task.project_name}</span>
                              <span>
                                Due {formatDeadline(task.deadline)}
                              </span>
                              <span className="notification-task-meta">
                                {task.priority} priority
                                {task.assignee_name
                                  ? ` · ${task.assignee_name}`
                                  : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    className="notification-view-all"
                    onClick={openTasks}
                  >
                    View all tasks <span aria-hidden="true">→</span>
                  </button>
                </section>
              )}
            </div>

            <div className="profile-menu-container" ref={profileRef}>
              <button
                type="button"
                className={`profile-trigger ${profileOpen ? "is-open" : ""}`}
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setNotificationsOpen(false);
                }}
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <span className="profile-avatar">{initial}</span>
                <span className="profile-trigger-details">
                  <strong>{user?.name || "User"}</strong>
                  <small>My account</small>
                </span>
                <span className="profile-chevron" aria-hidden="true">
                  {profileOpen ? "⌃" : "⌄"}
                </span>
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-user">
                    <span className="profile-avatar profile-avatar-large">
                      {initial}
                    </span>
                    <div>
                      <strong>{user?.name || "User"}</strong>
                      <span>{user?.email || ""}</span>
                    </div>
                  </div>

                  <div className="profile-dropdown-divider" />

                  <button
                    type="button"
                    className="profile-logout"
                    onClick={logout}
                  >
                    <span aria-hidden="true">↪</span>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {mobileOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Close navigation"
            onClick={closeMobileSidebar}
          />
        )}

        <div className="app-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}