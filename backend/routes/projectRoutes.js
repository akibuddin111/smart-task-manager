const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");


const requireRole = require("../middleware/requireRole");

const {
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} = require("../controllers/projectMembershipController");

const router = express.Router();

// All project endpoints require authentication.
router.use(authMiddleware);


router.get(
  "/:id/members",
  requireRole("Admin"),
  getProjectMembers
);

router.post(
  "/:id/members",
  requireRole("Admin"),
  addProjectMember
);

router.delete(
  "/:id/members/:userId",
  requireRole("Admin"),
  removeProjectMember
);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

module.exports = router;