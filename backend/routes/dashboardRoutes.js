const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getDashboardMetrics,
} = require("../controllers/dashboardController");

const router = express.Router();

// All dashboard endpoints require authentication.
router.use(authMiddleware);

router.get("/metrics", getDashboardMetrics);

module.exports = router;