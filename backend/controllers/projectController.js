
const pool = require("../config/db");

function isAdmin(req) {
  return req.user?.role === "Admin";
}

// Create a project: Admin only.
async function createProject(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({
      message: "Only Admins can create projects.",
    });
  }

  try {
    const { name, description = "" } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Project name is required.",
      });
    }

    if (name.trim().length > 150) {
      return res.status(400).json({
        message: "Project name must not exceed 150 characters.",
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({
        message: "Description must be a string.",
      });
    }

    const result = await pool.query(
      `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, owner_id, created_at, updated_at`,
      [name.trim(), description.trim(), req.user.id]
    );

    return res.status(201).json({
      message: "Project created successfully.",
      project: result.rows[0],
    });
  } catch (error) {
    console.error("Create project failed:", error.message);

    return res.status(500).json({
      message: "Unable to create project.",
    });
  }
}

// Admins see all projects; Team Members see their memberships.
async function getProjects(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.description,
         p.owner_id,
         p.created_at,
         p.updated_at
       FROM projects p
       WHERE
         $1 = 'Admin'
         OR EXISTS (
           SELECT 1
           FROM project_members pm
           WHERE pm.project_id = p.id
             AND pm.user_id = $2
         )
       ORDER BY p.created_at DESC`,
      [req.user.role, req.user.id]
    );

    return res.status(200).json({
      count: result.rows.length,
      projects: result.rows,
    });
  } catch (error) {
    console.error("Fetch projects failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch projects.",
    });
  }
}

// Retrieve a project visible to the current user.
async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const result = await pool.query(
      `SELECT
         p.id, p.name, p.description, p.owner_id,
         p.created_at, p.updated_at
       FROM projects p
       WHERE p.id = $1
         AND (
           $2 = 'Admin'
           OR EXISTS (
             SELECT 1
             FROM project_members pm
             WHERE pm.project_id = p.id
               AND pm.user_id = $3
           )
         )`,
      [id, req.user.role, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      project: result.rows[0],
    });
  } catch (error) {
    console.error("Fetch project failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch project.",
    });
  }
}

// Update a project: Admin only.
async function updateProject(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({
      message: "Only Admins can update projects.",
    });
  }

  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    if (name === undefined && description === undefined) {
      return res.status(400).json({
        message: "Provide a project name or description to update.",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Project name cannot be empty.",
        });
      }

      if (name.trim().length > 150) {
        return res.status(400).json({
          message: "Project name must not exceed 150 characters.",
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

    const existingResult = await pool.query(
      `SELECT id, name, description
       FROM projects
       WHERE id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const existing = existingResult.rows[0];
    const updatedName =
      name === undefined ? existing.name : name.trim();
    const updatedDescription =
      description === undefined
        ? existing.description
        : description.trim();

    const result = await pool.query(
      `UPDATE projects
       SET name = $1,
           description = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, description, owner_id, created_at, updated_at`,
      [updatedName, updatedDescription, id]
    );

    return res.status(200).json({
      message: "Project updated successfully.",
      project: result.rows[0],
    });
  } catch (error) {
    console.error("Update project failed:", error.message);

    return res.status(500).json({
      message: "Unable to update project.",
    });
  }
}

// Delete a project: Admin only.
async function deleteProject(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({
      message: "Only Admins can delete projects.",
    });
  }

  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const result = await pool.query(
      `DELETE FROM projects
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Delete project failed:", error.message);

    return res.status(500).json({
      message: "Unable to delete project.",
    });
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
