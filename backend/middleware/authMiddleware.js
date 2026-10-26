
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  const token = authHeader.slice(7);

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      message: "Authentication service is not configured.",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, role
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User account no longer exists.",
      });
    }

    // Always use the current database role, not a role
    // supplied by the client or trusted from the JWT.
    req.user = result.rows[0];

    return next();
  } catch (error) {
    console.error("Authentication lookup failed:", error.message);

    return res.status(500).json({
      message: "Unable to authenticate request.",
    });
  }
}

module.exports = authMiddleware;
