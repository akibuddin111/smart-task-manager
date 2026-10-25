
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/layout.css";

export default function AppLayout() {
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  const initial = (user?.name || "U").trim().charAt(0).toUpperCase();

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
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
            <small>Management workspace</small>
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

          <div className="profile-menu-container" ref={profileRef}>
            <button
              type="button"
              className={`profile-trigger ${profileOpen ? "is-open" : ""}`}
              onClick={() => setProfileOpen((open) => !open)}
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
