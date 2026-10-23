const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const router = express.Router();

// All project endpoints require authentication.
router.use(authMiddleware);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

module.exports = router;