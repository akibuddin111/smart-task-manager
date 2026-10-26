
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
         ) AS overdue_tasks,

         COUNT(t.id) FILTER (
           WHERE t.status = 'To Do'
         ) AS todo_tasks,

         COUNT(t.id) FILTER (
           WHERE t.status = 'In Progress'
         ) AS in_progress_tasks,

         COUNT(t.id) FILTER (
           WHERE t.priority = 'Low'
         ) AS low_priority_tasks,

         COUNT(t.id) FILTER (
           WHERE t.priority = 'Medium'
         ) AS medium_priority_tasks,

         COUNT(t.id) FILTER (
           WHERE t.priority = 'High'
         ) AS high_priority_tasks

       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE
         $1 = 'Admin'
         OR EXISTS (
           SELECT 1
           FROM project_members pm
           WHERE pm.project_id = p.id
             AND pm.user_id = $2
         )`,
      [req.user.role, req.user.id]
    );

    const metrics = result.rows[0];

    return res.status(200).json({
      metrics: {
        totalProjects: Number(metrics.total_projects),
        totalTasks: Number(metrics.total_tasks),
        completedTasks: Number(metrics.completed_tasks),
        pendingTasks: Number(metrics.pending_tasks),
        overdueTasks: Number(metrics.overdue_tasks),
        todoTasks: Number(metrics.todo_tasks),
        inProgressTasks: Number(metrics.in_progress_tasks),
        lowPriorityTasks: Number(metrics.low_priority_tasks),
        mediumPriorityTasks: Number(metrics.medium_priority_tasks),
        highPriorityTasks: Number(metrics.high_priority_tasks),
      },
    });
  } catch (error) {
    console.error("Dashboard metrics failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch dashboard metrics.",
    });
  }
}

async function getOverdueTasks(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         t.id,
         t.title,
         t.project_id,
         p.name AS project_name,
         t.assignee_id,
         u.name AS assignee_name,
         t.status,
         t.priority,
         t.deadline
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id
       INNER JOIN users u ON u.id = t.assignee_id
       WHERE t.status <> 'Completed'
         AND t.deadline < CURRENT_DATE
         AND (
           $1 = 'Admin'
           OR EXISTS (
             SELECT 1
             FROM project_members pm
             WHERE pm.project_id = p.id
               AND pm.user_id = $2
           )
         )
       ORDER BY t.deadline ASC, t.id DESC`,
      [req.user.role, req.user.id]
    );

    return res.status(200).json({
      count: result.rows.length,
      tasks: result.rows,
    });
  } catch (error) {
    console.error("Fetch overdue tasks failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch overdue tasks.",
    });
  }
}

module.exports = {
  getDashboardMetrics,
  getOverdueTasks,
};
