const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Smart Task Manager API is running!",
  });
});

// Database health check
app.get("/api/health/db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS server_time"
    );

    res.json({
      message: "Database connection successful",
      ...result.rows[0],
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// Authentication routes
app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Protected test endpoint
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User account no longer exists.",
      });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Fetching user failed:", error.message);

    res.status(500).json({
      message: "Unable to fetch user information.",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});