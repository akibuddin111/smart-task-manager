const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const router = express.Router();

// Protect every task endpoint.
router.use(authMiddleware);

// Create and list tasks.
router.post("/", createTask);
router.get("/", getTasks);

// Retrieve, update, and delete an individual task.
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;