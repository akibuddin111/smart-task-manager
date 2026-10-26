
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

const {
  register,
  login,
  getCurrentUser,
  getUsers,
  getTeamMembers,
} = require("../controllers/authController");

const router = express.Router();



router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, getCurrentUser);
router.get("/users", authMiddleware, getUsers);

router.get(
  "/team-members",
  authMiddleware,
  requireRole("Admin"),
  getTeamMembers
);

module.exports = router;
