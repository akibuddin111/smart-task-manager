
import {
  showSuccess,
  showError,
  confirmDelete,
} from "../utils/alerts";

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = { name: "", description: "" };

export default function ProjectsPage() {
  const { token, user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/projects", { token });
      setProjects(result.projects);
    } catch (err) {
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function startEdit(project) {
    setEditingId(project.id);
    setForm({
      name: project.name,
      description: project.description || "",
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    const isEditing = editingId !== null;

    try {
      const result = await apiRequest(
        isEditing ? `/projects/${editingId}` : "/projects",
        {
          method: isEditing ? "PUT" : "POST",
          token,
          body: {
            name: form.name.trim(),
            description: form.description.trim(),
          },
        }
      );

      setForm(EMPTY_FORM);
      setEditingId(null);

      await loadProjects();

      await showSuccess(
        isEditing ? "Project updated!" : "Project created!",
        result.message ||
          (isEditing
            ? "Your project has been updated successfully."
            : "Your project has been created successfully.")
      );
    } catch (err) {
      await showError(
        "Unable to save project",
        err.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project) {
    const confirmation = await confirmDelete({
      title: `Delete "${project.name}"?`,
      text: "Tasks associated with this project will also be deleted. This action cannot be undone.",
      confirmText: "Yes, delete project",
    });

    if (!confirmation.isConfirmed) return;

    setError("");

    try {
      const result = await apiRequest(`/projects/${project.id}`, {
        method: "DELETE",
        token,
      });

      if (editingId === project.id) {
        cancelEdit();
      }

      await loadProjects();

      await showSuccess(
        "Project deleted",
        result.message || "The project was deleted successfully."
      );
    } catch (err) {
      await showError(
        "Unable to delete project",
        err.message || "Please try again."
      );
    }
  }

  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <Link className="workspace-brand" to="/dashboard">
          <span className="workspace-logo">SM</span>
          <span>
            <strong>Smart Task Manager</strong>
            <small>Project workspace</small>
          </span>
        </Link>

        <div className="workspace-user">
          <span>{user?.name}</span>
          <button type="button" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="workspace-content">
        <nav className="workspace-nav" aria-label="Main navigation">
          <Link to="/dashboard">Overview</Link>
          <Link className="active" to="/projects">Projects</Link>
          <Link to="/tasks">Tasks</Link>
        </nav>

        <div className="workspace-heading">
          <div>
            <p className="dashboard-eyebrow">WORK MANAGEMENT</p>
            <h1>Projects</h1>
            <p>Organize your work into manageable projects.</p>
          </div>
          <span className="project-count">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>

        {error && (
          <div className="workspace-alert error" role="alert">
            {error}
          </div>
        )}

        <section className="workspace-panel">
          <div className="panel-heading">
            <h2>{editingId === null ? "Create a project" : "Edit project"}</h2>
            <p>
              {editingId === null
                ? "Give your project a name and an optional description."
                : "Update the details of your project."}
            </p>
          </div>

          <form className="project-form" onSubmit={handleSubmit}>
            <label>
              Project name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={150}
                placeholder="e.g. Website redesign"
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="What is this project about?"
              />
            </label>

            <div className="form-actions">
              <button className="primary-button" disabled={saving} type="submit">
                {saving
                  ? "Saving..."
                  : editingId === null
                    ? "Create project"
                    : "Save changes"}
              </button>

              {editingId !== null && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="project-list-section">
          <div className="panel-heading">
            <h2>Your projects</h2>
            <p>Projects visible to your account.</p>
          </div>

          {loading ? (
            <p className="empty-message">Loading projects...</p>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">▦</div>
              <h3>No projects yet</h3>
              <p>Create your first project using the form above.</p>
            </div>
          ) : (
            <div className="project-grid">
              {projects.map((project) => (
                <article className="project-card" key={project.id}>
                  <div className="project-card-icon">▦</div>
                  <h3>{project.name}</h3>
                  <p className="project-description">
                    {project.description || "No description provided."}
                  </p>

                  <p className="project-meta">
                    Created{" "}
                    {project.created_at
                      ? new Date(project.created_at).toLocaleDateString()
                      : "—"}
                  </p>

                  <div className="project-card-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => startEdit(project)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleDelete(project)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
