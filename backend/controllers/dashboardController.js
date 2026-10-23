const pool = require("../config/db");

async function getDashboardMetrics(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(DISTINCT p.id) AS total_projects,
         COUNT(t.id) AS total_tasks,

         COUNT(t.id) FILTER (
           WHERE t.status = 'Completed'
         ) AS completed_tasks,

         COUNT(t.id) FILTER (
           WHERE t.status <> 'Completed'
         ) AS pending_tasks,

         COUNT(t.id) FILTER (
           WHERE t.status <> 'Completed'
             AND t.deadline < CURRENT_DATE
         ) AS overdue_tasks

       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.owner_id = $1`,
      [req.user.id]
    );

    const metrics = result.rows[0];

    return res.status(200).json({
      metrics: {
        totalProjects: Number(metrics.total_projects),
        totalTasks: Number(metrics.total_tasks),
        completedTasks: Number(metrics.completed_tasks),
        pendingTasks: Number(metrics.pending_tasks),
        overdueTasks: Number(metrics.overdue_tasks),
      },
    });
  } catch (error) {
    console.error("Dashboard metrics failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch dashboard metrics.",
    });
  }
}

module.exports = { getDashboardMetrics };