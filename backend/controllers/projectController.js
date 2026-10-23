const pool = require("../config/db");

// Create a project
async function createProject(req, res) {
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

// List projects owned by the authenticated user
async function getProjects(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, description, owner_id, created_at, updated_at
       FROM projects
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
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

// Get one project owned by the authenticated user
async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const result = await pool.query(
      `SELECT id, name, description, owner_id, created_at, updated_at
       FROM projects
       WHERE id = $1 AND owner_id = $2`,
      [id, req.user.id]
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

// Update one project owned by the authenticated user
async function updateProject(req, res) {
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

    // Load only a project owned by the authenticated user.
    const existingResult = await pool.query(
      `SELECT id, name, description
       FROM projects
       WHERE id = $1 AND owner_id = $2`,
      [id, req.user.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const existingProject = existingResult.rows[0];

    const updatedName =
      name === undefined ? existingProject.name : name.trim();

    const updatedDescription =
      description === undefined
        ? existingProject.description
        : description.trim();

    const result = await pool.query(
      `UPDATE projects
       SET name = $1,
           description = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND owner_id = $4
       RETURNING id, name, description, owner_id, created_at, updated_at`,
      [updatedName, updatedDescription, id, req.user.id]
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

// Delete one project owned by the authenticated user
async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const result = await pool.query(
      `DELETE FROM projects
       WHERE id = $1 AND owner_id = $2
       RETURNING id`,
      [id, req.user.id]
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