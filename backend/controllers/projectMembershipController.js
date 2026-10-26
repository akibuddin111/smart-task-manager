
const pool = require("../config/db");

function isValidPositiveId(value) {
  return typeof value === "string" && /^[1-9]\d*$/.test(value);
}

async function getProjectIdOrRespond(projectId, res) {
  if (!isValidPositiveId(projectId)) {
    res.status(400).json({ message: "Invalid project ID." });
    return false;
  }

  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1",
    [projectId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ message: "Project not found." });
    return false;
  }

  return true;
}

// GET /api/projects/:id/members
async function getProjectMembers(req, res) {
  try {
    const valid = await getProjectIdOrRespond(req.params.id, res);
    if (!valid) return;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, pm.created_at AS added_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY u.name ASC`,
      [req.params.id]
    );

    return res.status(200).json({ members: result.rows });
  } catch (error) {
    console.error("Fetch project members failed:", error.message);
    return res.status(500).json({
      message: "Unable to fetch project members.",
    });
  }
}

// POST /api/projects/:id/members
async function addProjectMember(req, res) {
  try {
    const { id: projectId } = req.params;
    const { userId } = req.body;

    const valid = await getProjectIdOrRespond(projectId, res);
    if (!valid) return;

    if (!isValidPositiveId(String(userId ?? ""))) {
      return res.status(400).json({
        message: "A valid userId is required.",
      });
    }

    const userResult = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [userId]
    );

    const member = userResult.rows[0];

    if (!member) {
      return res.status(404).json({ message: "User not found." });
    }

    if (member.role !== "Team Member") {
      return res.status(400).json({
        message: "Only Team Member accounts can be added to a project.",
      });
    }

    const result = await pool.query(
      `INSERT INTO project_members (project_id, user_id, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO NOTHING
       RETURNING project_id, user_id, added_by, created_at`,
      [projectId, member.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        message: "This user is already a member of the project.",
      });
    }

    return res.status(201).json({
      message: "Team Member added to the project successfully.",
      membership: result.rows[0],
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
      },
    });
  } catch (error) {
    console.error("Add project member failed:", error.message);
    return res.status(500).json({
      message: "Unable to add project member.",
    });
  }
}

// DELETE /api/projects/:id/members/:userId
async function removeProjectMember(req, res) {
  try {
    const { id: projectId, userId } = req.params;

    const valid = await getProjectIdOrRespond(projectId, res);
    if (!valid) return;

    if (!isValidPositiveId(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Keep a project's owner associated with it.
    const ownerResult = await pool.query(
      "SELECT owner_id FROM projects WHERE id = $1",
      [projectId]
    );

    if (String(ownerResult.rows[0].owner_id) === String(userId)) {
      return res.status(400).json({
        message: "The project owner cannot be removed from the project.",
      });
    }

    const result = await pool.query(
      `DELETE FROM project_members
       WHERE project_id = $1 AND user_id = $2
       RETURNING project_id, user_id`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Project membership not found.",
      });
    }

    return res.status(200).json({
      message: "Team Member removed from the project successfully.",
    });
  } catch (error) {
    console.error("Remove project member failed:", error.message);
    return res.status(500).json({
      message: "Unable to remove project member.",
    });
  }
}

module.exports = {
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
};
