
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { apiRequest } from "../api";
import { useAuth } from "../context/useAuth";
import "../styles/tasks.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  project_id: "",
  assignee_id: "",
  status: "To Do",
  priority: "Medium",
  deadline: "",
};

const STATUSES = ["To Do", "In Progress", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];

function getToday() {
  const now = new Date();
  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function getDeadlineClass(task) {
  if (task.status === "Completed") return "deadline-normal";

  const deadline = String(task.deadline || "").slice(0, 10);

  if (deadline && deadline < getToday()) return "deadline-overdue";
  if (deadline === getToday()) return "deadline-today";

  return "deadline-normal";
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3.5 6.5h17" />
      <path d="M9 6.5V4.2h6v2.3" />
      <path d="m5.5 6.5 1 13h11l1-13" />
      <path d="M10 10v6" />
      <path d="M14 10v6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m14 5 5 5" />
      <path d="M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z" />
    </svg>
  );
}

export default function TasksPage() {
  const { token, user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    project_id: "",
    status: "",
    priority: "",
    assignee_id: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const isAdmin = user?.role === "Admin";
  const isReadOnlyTaskEdit = Boolean(editingTask) && !isAdmin;

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const [taskResult, projectResult, userResult] = await Promise.all([
        apiRequest("/tasks", { token }),
        apiRequest("/projects", { token }),
        apiRequest("/auth/users", { token }),
      ]);

      setTasks(Array.isArray(taskResult.tasks) ? taskResult.tasks : []);
      setProjects(
        Array.isArray(projectResult)
          ? projectResult
          : projectResult.projects || []
      );
      setUsers(Array.isArray(userResult.users) ? userResult.users : []);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      loadData();
    }, 0);

    return () => clearTimeout(timerId);
  }, [loadData]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const searchableValues = [
        task.title,
        task.description,
        task.project_name,
        task.assignee_name,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      return (
        matchesSearch &&
        (!filters.project_id ||
          String(task.project_id) === filters.project_id) &&
        (!filters.status || task.status === filters.status) &&
        (!filters.priority || task.priority === filters.priority) &&
        (!filters.assignee_id ||
          String(task.assignee_id) === filters.assignee_id)
      );
    });
  }, [tasks, search, filters]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function openCreateModal() {
    setEditingTask(null);
    setForm({
      ...EMPTY_FORM,
      project_id: projects.length ? String(projects[0].id) : "",
      assignee_id: users.length ? String(users[0].id) : "",
      deadline: getToday(),
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      project_id: String(task.project_id || ""),
      assignee_id: String(task.assignee_id || ""),
      status: task.status || "To Do",
      priority: task.priority || "Medium",
      deadline: String(task.deadline || "").slice(0, 10),
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingTask(null);
    setFormError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    
    // Team Members editing a task may submit only its status.
    if (isReadOnlyTaskEdit) {
      if (!STATUSES.includes(form.status)) {
        setFormError("Please select a valid task status.");
        return;
      }
    } else {
      if (
        !form.title.trim() ||
        !form.project_id ||
        !form.assignee_id ||
        !form.deadline
      ) {
        setFormError(
          "Title, project, assignee, and deadline are required."
        );
        return;
      }

      const [year, month, day] = form.deadline.split("-").map(Number);
      const parsedDate = new Date(Date.UTC(year, month - 1, day));

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(form.deadline) ||
        !year ||
        parsedDate.getUTCFullYear() !== year ||
        parsedDate.getUTCMonth() !== month - 1 ||
        parsedDate.getUTCDate() !== day
      ) {
        setFormError("Please provide a valid calendar date.");
        return;
      }
    }

    const payload = isReadOnlyTaskEdit
      ? { status: form.status }
      : {
          title: form.title.trim(),
          description: form.description.trim(),
          project_id: Number(form.project_id),
          assignee_id: Number(form.assignee_id),
          status: form.status,
          priority: form.priority,
          deadline: form.deadline,
        };


    setSaving(true);

    try {
      if (editingTask) {
        await apiRequest(`/tasks/${editingTask.id}`, {
          method: "PUT",
          token,
          body: payload,
        });
      } else {
        await apiRequest("/tasks", {
          method: "POST",
          token,
          body: payload,
        });
      }

      setModalOpen(false);
      setEditingTask(null);

      await loadData();

      await Swal.fire({
        icon: "success",
        title: editingTask ? "Task updated" : "Task created",
        text: editingTask
          ? "Your changes have been saved."
          : "Your new task has been added.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(task) {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete this task?",
      text: `"${task.title}" will be permanently deleted.`,
      showCancelButton: true,
      confirmButtonText: "Delete task",
      cancelButtonText: "Keep task",
      confirmButtonColor: "#dc3545",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    try {
      await apiRequest(`/tasks/${task.id}`, {
        method: "DELETE",
        token,
      });

      setTasks((current) =>
        current.filter((item) => item.id !== task.id)
      );

      await Swal.fire({
        icon: "success",
        title: "Task deleted",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Unable to delete task",
        text: getErrorMessage(error),
      });
    }
  }

  function clearFilters() {
    setSearch("");
    setFilters({
      project_id: "",
      status: "",
      priority: "",
      assignee_id: "",
    });
  }

  return (
    <section className="tasks-page">
      <header className="tasks-page-header">
        <div className="tasks-heading-copy">
          <span className="tasks-eyebrow">WORKSPACE / TASKS</span>
          <h1>Task Management</h1>
          <p>
            Organize work, track deadlines, and keep projects moving.
          </p>
        </div>

        <button
          type="button"
          className="tasks-primary-button"
          onClick={openCreateModal}
          disabled={
            user?.role !== "Admin" ||
            !projects.length ||
            !users.length
          }
          title={
            user?.role !== "Admin"
              ? "Only Admin users can create tasks"
              : !projects.length
                ? "Create a project before adding a task"
                : !users.length
                  ? "Register a user before assigning a task"
                  : "Create a task"
          }
        >
          <span aria-hidden="true">＋</span>
          Create New Task
        </button>
      </header>

      <section className="tasks-panel">
        <div className="tasks-panel-heading">
          <div>
            <h2>All tasks</h2>
            <p>
              {filteredTasks.length} shown
              {filteredTasks.length !== tasks.length
                ? ` out of ${tasks.length}`
                : " in your workspace"}
            </p>
          </div>

          <button
            type="button"
            className="tasks-refresh-button"
            onClick={loadData}
            disabled={loading}
          >
            <span aria-hidden="true">↻</span>
            Refresh
          </button>
        </div>

        <div className="tasks-toolbar">
          <label className="tasks-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search tasks, projects, assignees..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search tasks"
            />
          </label>

          <div className="tasks-filters">
            <select
              value={filters.project_id}
              onChange={(event) =>
                updateFilter("project_id", event.target.value)
              }
              aria-label="Filter by project"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                updateFilter("status", event.target.value)
              }
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={filters.priority}
              onChange={(event) =>
                updateFilter("priority", event.target.value)
              }
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <select
              value={filters.assignee_id}
              onChange={(event) =>
                updateFilter("assignee_id", event.target.value)
              }
              aria-label="Filter by assignee"
            >
              <option value="">All assignees</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="tasks-clear-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        </div>

        {pageError && (
          <div className="tasks-error" role="alert">
            <span>{pageError}</span>
            <button type="button" onClick={loadData}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="tasks-state">Loading your tasks...</div>
        ) : !pageError && filteredTasks.length === 0 ? (
          <div className="tasks-state">
            <div className="tasks-empty-icon" aria-hidden="true">
              ✓
            </div>
            <h3>{tasks.length ? "No matching tasks" : "No tasks yet"}</h3>
            <p>
              {tasks.length
                ? "Try changing your search or filters."
                : "Create your first task to get your workspace moving."}
            </p>

            {tasks.length === 0 && (
              <button
                type="button"
                className="tasks-primary-button"
                onClick={openCreateModal}
                disabled={!projects.length || !users.length}
              >
                ＋ Create your first task
              </button>
            )}
          </div>
        ) : (
          <div className="tasks-table-wrap">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div className="tasks-title-cell">
                        <strong>{task.title}</strong>
                        {task.description && (
                          <span title={task.description}>
                            {task.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>{task.project_name || "—"}</td>

                    <td>
                      <div className="tasks-assignee">
                        <span className="tasks-avatar" aria-hidden="true">
                          {(task.assignee_name || "?")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <span>{task.assignee_name || "Unassigned"}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`tasks-badge priority-${String(
                          task.priority || ""
                        ).toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`tasks-badge status-${String(
                          task.status || ""
                        ).toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {task.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`tasks-deadline ${getDeadlineClass(task)}`}
                      >
                        {formatDate(task.deadline)}
                      </span>
                    </td>

                    <td>
                      <div className="tasks-row-actions">
                        <button
                          type="button"
                          className="tasks-icon-button"
                          onClick={() => openEditModal(task)}
                          aria-label={`Edit ${task.title}`}
                          title="Edit task"
                        >
                          <EditIcon />
                        </button>

                        <button
                          type="button"
                          className="tasks-icon-button tasks-delete-button"
                          onClick={() => handleDelete(task)}
                          aria-label={`Delete ${task.title}`}
                          title="Delete task"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="tasks-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="tasks-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tasks-modal-title"
          >
            <header className="tasks-modal-header">
              <div>
                <span className="tasks-eyebrow">
                  {editingTask ? "UPDATE WORK ITEM" : "NEW WORK ITEM"}
                </span>
                <h2 id="tasks-modal-title">
                  {editingTask ? "Edit task" : "Create a task"}
                </h2>
              </div>

              <button
                type="button"
                className="tasks-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close task form"
              >
                ×
              </button>
            </header>

            <form onSubmit={handleSubmit} className="tasks-form">
              <label className="tasks-field tasks-field-full">
                Task title <span>*</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  disabled={isReadOnlyTaskEdit}
                  maxLength={200}
                  required
                  autoFocus
                  placeholder="e.g. Prepare project proposal"
                />
              </label>

              <label className="tasks-field tasks-field-full">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  disabled={isReadOnlyTaskEdit}
                  rows={3}
                  placeholder="Add details about this task..."
                />
              </label>

              <label className="tasks-field">
                Project <span>*</span>
                <select
                  name="project_id"
                  value={form.project_id}
                  onChange={handleFormChange}
                  disabled={isReadOnlyTaskEdit}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tasks-field">
                Assignee <span>*</span>
                <select
                  name="assignee_id"
                  value={form.assignee_id}
                  onChange={handleFormChange}
                  disabled={isReadOnlyTaskEdit}
                  required
                >
                  <option value="">Select an assignee</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </label>

              <label className="tasks-field">
                Priority
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleFormChange}
                  disabled={isReadOnlyTaskEdit}
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tasks-field">
                Status
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tasks-field tasks-field-full">
                Deadline <span>*</span>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleFormChange}
                  disabled={isReadOnlyTaskEdit}
                  required
                />
              </label>

              {formError && (
                <p className="tasks-form-error" role="alert">
                  {formError}
                </p>
              )}

              <footer className="tasks-form-actions">
                <button
                  type="button"
                  className="tasks-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tasks-primary-button"
                  disabled={saving || !projects.length || !users.length}
                >
                  {saving
                    ? "Saving..."
                    : isReadOnlyTaskEdit
                      ? "Update status"
                      : editingTask
                        ? "Save changes"
                        : "Create task"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
