const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length > 100) {
      return res.status(400).json({
        message: "Name must not exceed 100 characters.",
      });
    }

    if (normalizedEmail.length > 255) {
      return res.status(400).json({
        message: "Email must not exceed 255 characters.",
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters.",
      });
    }

    // Hash the password before saving it
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [normalizedName, normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: "Registration successful.",
      user,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration failed:", error.message);

    return res.status(500).json({
      message: "Unable to register user.",
    });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    // Use the same public error for unknown users and wrong passwords
    if (
      !user ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Authentication service is not configured.",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      message: "Unable to log in.",
    });
  }
}
// GET /api/auth/me
async function getCurrentUser(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Fetching current user failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch current user.",
    });
  }
}

// GET /api/auth/users
async function getUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name
       FROM users
       ORDER BY name ASC`
    );

    return res.status(200).json({
      users: result.rows,
    });
  } catch (error) {
    console.error("Fetching users failed:", error.message);

    return res.status(500).json({
      message: "Unable to fetch users.",
    });
  }
}


 // GET /api/auth/team-members
  async function getTeamMembers(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, name, email
        FROM users
        WHERE role = $1
        ORDER BY name ASC`,
        ["Team Member"]
      );

      return res.status(200).json({
        users: result.rows,
      });
    } catch (error) {
      console.error("Fetching team members failed:", error.message);

      return res.status(500).json({
        message: "Unable to fetch team members.",
      });
    }
  }


module.exports = {
  register,
  login,
  getCurrentUser,
  getUsers,
  getTeamMembers,
};
