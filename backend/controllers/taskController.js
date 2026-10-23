const pool = require("../config/db");

const VALID_STATUSES = ["To Do", "In Progress", "Completed"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

// Validate a positive integer ID.
function isValidId(value) {
  return /^[1-9]\d*$/.test(String(value));
}

// Validate a real calendar date in YYYY-MM-DD format.
function isValidDate(value) {
  if (typeof value !== "string") {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Check that a project belongs to the authenticated user.
async function userOwnsProject(projectId, userId) {
  const result = await pool.query(
    `SELECT id
     FROM projects
     WHERE id = $1 AND owner_id = $2`,
    [projectId, userId]
  );

  return result.rows.length > 0;
}

// Create a task.
async function createTask(req, res) {
  try {
    const {
      title,
      description = "",
      project_id,
      assignee_id,
      status = "To Do",
      priority = "Medium",
      deadline,
    } = req.body;

    // Validate required fields.
    if (
      typeof title !== "string" ||
      !title.trim() ||
      project_id === undefined ||
      assignee_id === undefined ||
      deadline === undefined
    ) {
      return res.status(400).json({
        message:
          "Title, project_id, assignee_id, and deadline are required.",
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        message: "Title must not exceed 200 characters.",
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({
        message: "Description must be a string.",
      });
    }

    if (!isValidId(project_id) || !isValidId(assignee_id)) {
      return res.status(400).json({
        message: "project_id and assignee_id must be positive integers.",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid task status.",
        allowedStatuses: VALID_STATUSES,
      });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: "Invalid task priority.",
        allowedPriorities: VALID_PRIORITIES,
      });
    }

    if (!isValidDate(deadline)) {
      return res.status(400).json({
        message: "Deadline must be a valid date in YYYY-MM-DD format.",
      });
    }

    // The authenticated user must own the selected project.
    const ownsProject = await userOwnsProject(
      project_id,
      req.user.id
    );

    if (!ownsProject) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    // Confirm that the assignee is a registered user.
    const assigneeResult = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [assignee_id]
    );

    if (assigneeResult.rows.length === 0) {
      return res.status(400).json({
        message: "The selected assignee does not exist.",
      });
    }

    const result = await pool.query(
      `INSERT INTO tasks (
         title,
         description,
         project_id,
         assignee_id,
         status,
         priority,
         deadline
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id,
         title,
         description,
         project_id,
         assignee_id,
         status,
         priority,
         deadline,
         created_at,
         updated_at`,
      [
        title.trim(),
        description.trim(),
        project_id,
        assignee_id,
        status,
        priority,
        deadline,
      ]
    );

    return res.status(201).json({
      message: "Task created successfully.",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Create task failed:", error.message);

    return res.status(500).json({
      message: "Unable to create task.",
    });
  }
}

// List tasks, optionally filtered by project, status, priority, and assignee.
async function getTasks(req, res) {
  try {
    const {
      project_id,
      status,
      priority,
      assignee_id,
    } = req.query;

    const conditions = ["p.owner_id = $1"];
    const values = [req.user.id];

    function addFilter(column, value) {
      values.push(value);
      conditions.push(`${column} = $${values.length}`);
    }

    if (project_id !== undefined) {
      if (!isValidId(project_id)) {
        return res.status(400).json({
          message: "Invalid project_id filter.",
        });
      }

      addFilter("t.project_id", project_id);
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Invalid status filter.",
          allowedStatuses: VALID_STATUSES,
        });
      }

      addFilter("t.status", status);
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          message: "Invalid priority filter.",
          allowedPriorities: VALID_PRIORITIES,
        });
      }

      addFilter("t.priority", priority);
    }

    if (assignee_id !== undefined) {
      if (!isValidId(assignee_id)) {
        return res.status(400).json({
          message: "Invalid assignee_id filter.",
        });
      }

      addFilter("t.assignee_id", assignee_id);
    }

    const query = `
      SELECT
        t.id,
        t.title,
        t.description,
        t.project_id,
        p.name AS project_name,
        t.assignee_id,
        u.name AS assignee_name,
        t.status,
        t.priority,
        t.deadline,
        t.created_at,
        t.updated_at
      FROM tasks t
      INNER JOIN projects p ON p.id = t.project_id
      INNER JOIN users u ON u.id = t.assignee_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY t.deadline ASC, t.created_at DESC
    `;

    const result = await pool.query(query, values);

    return res.status(200).json({
      count: result.rows.length,
      tasks: result.rows,
    });
  } catch (error) {
    console.error("Fetch tasks failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch tasks.",
    });
  }
}

// Retrieve one task from a project owned by the authenticated user.
async function getTaskById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    const result = await pool.query(
      `SELECT
         t.id,
         t.title,
         t.description,
         t.project_id,
         p.name AS project_name,
         t.assignee_id,
         u.name AS assignee_name,
         t.status,
         t.priority,
         t.deadline,
         t.created_at,
         t.updated_at
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id
       INNER JOIN users u ON u.id = t.assignee_id
       WHERE t.id = $1 AND p.owner_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Fetch task failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch task.",
    });
  }
}

// Update a task.
async function updateTask(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    const {
      title,
      description,
      project_id,
      assignee_id,
      status,
      priority,
      deadline,
    } = req.body;

    const allowedFields = [
      "title",
      "description",
      "project_id",
      "assignee_id",
      "status",
      "priority",
      "deadline",
    ];

    if (!allowedFields.some((field) => req.body[field] !== undefined)) {
      return res.status(400).json({
        message: "Provide at least one field to update.",
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Title cannot be empty.",
        });
      }

      if (title.trim().length > 200) {
        return res.status(400).json({
          message: "Title must not exceed 200 characters.",
        });
      }
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Description must be a string.",
      });
    }

    if (
      project_id !== undefined &&
      !isValidId(project_id)
    ) {
      return res.status(400).json({
        message: "Invalid project_id.",
      });
    }

    if (
      assignee_id !== undefined &&
      !isValidId(assignee_id)
    ) {
      return res.status(400).json({
        message: "Invalid assignee_id.",
      });
    }

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid task status.",
        allowedStatuses: VALID_STATUSES,
      });
    }

    if (
      priority !== undefined &&
      !VALID_PRIORITIES.includes(priority)
    ) {
      return res.status(400).json({
        message: "Invalid task priority.",
        allowedPriorities: VALID_PRIORITIES,
      });
    }

    if (
      deadline !== undefined &&
      !isValidDate(deadline)
    ) {
      return res.status(400).json({
        message: "Deadline must be a valid date in YYYY-MM-DD format.",
      });
    }

    // Load the existing task only if its project belongs to this user.
    const existingResult = await pool.query(
      `SELECT t.*
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.owner_id = $2`,
      [id, req.user.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    const existing = existingResult.rows[0];

    const updatedProjectId =
      project_id === undefined ? existing.project_id : project_id;

    const updatedAssigneeId =
      assignee_id === undefined ? existing.assignee_id : assignee_id;

    // If the task moves to another project, the user must own that project too.
    const ownsTargetProject = await userOwnsProject(
      updatedProjectId,
      req.user.id
    );

    if (!ownsTargetProject) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const assigneeResult = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [updatedAssigneeId]
    );

    if (assigneeResult.rows.length === 0) {
      return res.status(400).json({
        message: "The selected assignee does not exist.",
      });
    }

    const result = await pool.query(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           project_id = $3,
           assignee_id = $4,
           status = $5,
           priority = $6,
           deadline = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING
         id,
         title,
         description,
         project_id,
         assignee_id,
         status,
         priority,
         deadline,
         created_at,
         updated_at`,
      [
        title === undefined ? existing.title : title.trim(),
        description === undefined
          ? existing.description
          : description.trim(),
        updatedProjectId,
        updatedAssigneeId,
        status === undefined ? existing.status : status,
        priority === undefined ? existing.priority : priority,
        deadline === undefined ? existing.deadline : deadline,
        id,
      ]
    );

    return res.status(200).json({
      message: "Task updated successfully.",
      task: result.rows[0],
    });
  } catch (error) {
    console.error("Update task failed:", error.message);

    return res.status(500).json({
      message: "Unable to update task.",
    });
  }
}

// Delete a task from a project owned by the authenticated user.
async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    const result = await pool.query(
      `DELETE FROM tasks t
       USING projects p
       WHERE t.project_id = p.id
         AND t.id = $1
         AND p.owner_id = $2
       RETURNING t.id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("Delete task failed:", error.message);

    return res.status(500).json({
      message: "Unable to delete task.",
    });
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};