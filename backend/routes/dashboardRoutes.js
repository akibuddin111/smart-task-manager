const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getDashboardMetrics,
  getOverdueTasks,
} = require("../controllers/dashboardController");

const router = express.Router();

// All dashboard endpoints require authentication.
router.use(authMiddleware);

router.get("/metrics", getDashboardMetrics);
router.get("/overdue-tasks", getOverdueTasks);

module.exports = router;