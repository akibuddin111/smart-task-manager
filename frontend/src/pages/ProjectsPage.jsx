
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import {
  showSuccess,
  showError,
  confirmDelete,
} from "../utils/alerts";
import "../styles/projects.css";

const initialForm = {
  name: "",
  description: "",
};

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getProjectMetrics(projectId, tasks) {
  const projectTasks = tasks.filter(
    (task) => String(task.project_id) === String(projectId)
  );

  const completed = projectTasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pending = projectTasks.filter(
    (task) => task.status !== "Completed"
  ).length;

  const today = getTodayString();

  const overdue = projectTasks.filter((task) => {
    if (!task.deadline || task.status === "Completed") return false;

    return String(task.deadline).slice(0, 10) < today;
  }).length;

  const total = projectTasks.length;

  return {
    total,
    completed,
    pending,
    overdue,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function ProjectIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m14 5 5 5" />
      <path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="m6 7 1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m18 6-12 12M6 6l12 12" />
    </svg>
  );
}

export default function ProjectsPage() {
  const { token } = useAuth();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [projectResponse, taskResponse] = await Promise.all([
        apiRequest("/projects", { token }),
        apiRequest("/tasks", { token }),
      ]);

      setProjects(
        Array.isArray(projectResponse)
          ? projectResponse
          : projectResponse?.projects ?? []
      );

      setTasks(
        Array.isArray(taskResponse)
          ? taskResponse
          : taskResponse?.tasks ?? []
      );
    } catch (err) {
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function openCreateForm() {
    setEditingId(null);
    setForm(initialForm);
    setFormOpen(true);
    setError("");
  }

  function openEditForm(project) {
    setEditingId(project.id);
    setForm({
      name: project.name || "",
      description: project.description || "",
    });
    setFormOpen(true);
    setError("");
  }

  function closeForm() {
    if (saving) return;

    setFormOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Please enter a project name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = { name, description };

      if (editingId !== null) {
        await apiRequest(`/projects/${editingId}`, {
          method: "PUT",
          token,
          body: payload,
        });

        setFormOpen(false);
        setEditingId(null);
        setForm(initialForm);

        await loadProjects();
        await showSuccess("Project updated successfully.");
      } else {
        await apiRequest("/projects", {
          method: "POST",
          token,
          body: payload,
        });

        setFormOpen(false);
        setForm(initialForm);

        await loadProjects();
        await showSuccess("Project created successfully.");
      }
    } catch (err) {
      const message = err.message || "Unable to save this project.";
      setError(message);
      await showError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project) {
    const confirmed = await confirmDelete(
      `Delete "${project.name}"?`,
      "This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/projects/${project.id}`, {
        method: "DELETE",
        token,
      });

      await loadProjects();
      await showSuccess("Project deleted successfully.");
    } catch (err) {
      await showError(err.message || "Unable to delete this project.");
    }
  }

  return (
    <section className="projects-page">
      <header className="projects-header">
        <div className="projects-heading-copy">
          <p className="projects-eyebrow">WORKSPACE / PORTFOLIO</p>
          <h1>Project Management</h1>
          <p className="projects-subtitle">
            Organize initiatives, track progress, and keep your work moving.
          </p>
        </div>

        <button
          className="projects-create-button"
          type="button"
          onClick={openCreateForm}
        >
          <span aria-hidden="true">+</span>
          Create Project
        </button>
      </header>

      <section className="projects-list-section">
        <div className="projects-section-heading">
          <div>
            <h2>Your projects</h2>
            <p>Progress is calculated from each project's tasks.</p>
          </div>

          <span className="projects-count">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>

        {error && !formOpen && (
          <div className="projects-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={loadProjects}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="projects-state" role="status">
            Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="projects-empty">
            <div className="projects-empty-icon">
              <ProjectIcon />
            </div>
            <h3>No projects yet</h3>
            <p>Create your first project to start organizing your work.</p>
            <button
              className="projects-create-button projects-empty-button"
              type="button"
              onClick={openCreateForm}
            >
              + Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => {
              const metrics = getProjectMetrics(project.id, tasks);

              return (
                <article className="project-card" key={project.id}>
                  <div className="project-card-top">
                    <div className="project-card-icon">
                      <ProjectIcon />
                    </div>

                    <div className="project-card-actions">
                      <button
                        className="project-icon-button"
                        type="button"
                        aria-label={`Edit ${project.name}`}
                        title="Edit project"
                        onClick={() => openEditForm(project)}
                      >
                        <EditIcon />
                      </button>

                      <button
                        className="project-icon-button project-delete-button"
                        type="button"
                        aria-label={`Delete ${project.name}`}
                        title="Delete project"
                        onClick={() => handleDelete(project)}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>

                  <h3 className="project-card-title">{project.name}</h3>

                  {project.description?.trim() && (
                    <p className="project-description">
                      {project.description}
                    </p>
                  )}

                  <p className="project-created">
                    Created {formatDate(project.created_at)}
                  </p>

                  <div className="project-progress">
                    <div className="project-progress-label">
                      <span>Task completion</span>
                      <strong>{metrics.percentage}%</strong>
                    </div>

                    <div
                      className="project-progress-track"
                      role="progressbar"
                      aria-label={`${project.name} task completion`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={metrics.percentage}
                    >
                      <div
                        className="project-progress-fill"
                        style={{ width: `${metrics.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="project-task-summary">
                    <div className="project-task-stat">
                      <span className="project-stat-dot completed-dot" />
                      <span>Completed</span>
                      <strong>{metrics.completed}</strong>
                    </div>

                    <div className="project-task-stat">
                      <span className="project-stat-dot pending-dot" />
                      <span>Pending</span>
                      <strong>{metrics.pending}</strong>
                    </div>

                    {metrics.overdue > 0 && (
                      <div className="project-task-stat project-overdue-stat">
                        <span className="project-stat-dot overdue-dot" />
                        <span>Overdue</span>
                        <strong>{metrics.overdue}</strong>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {formOpen && (
        <div
          className="projects-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="projects-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="projects-modal-title"
          >
            <div className="projects-modal-header">
              <div>
                <p className="projects-eyebrow">
                  {editingId !== null ? "EDIT DETAILS" : "NEW WORKSPACE"}
                </p>
                <h2 id="projects-modal-title">
                  {editingId !== null ? "Edit project" : "Create project"}
                </h2>
              </div>

              <button
                className="project-icon-button"
                type="button"
                aria-label="Close form"
                onClick={closeForm}
                disabled={saving}
              >
                <CloseIcon />
              </button>
            </div>

            {error && (
              <div className="projects-error" role="alert">
                {error}
              </div>
            )}

            <form className="projects-form" onSubmit={handleSubmit}>
              <label htmlFor="project-name">
                Project name <span aria-hidden="true">*</span>
                <input
                  id="project-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Website redesign"
                  maxLength={150}
                  required
                  autoFocus
                />
              </label>

              <label htmlFor="project-description">
                Description
                <textarea
                  id="project-description"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="What is this project about?"
                  rows={3}
                />
              </label>

              <div className="projects-form-actions">
                <button
                  className="projects-cancel-button"
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="projects-create-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : editingId !== null
                      ? "Save changes"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
