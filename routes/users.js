const express = require("express");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Login Users
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await db("users")
      .select("id", "name", "email", "password_hash", "role")
      .where("email", email)
      .first();

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Set token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevents JavaScript access (More Secure)
      secure: process.env.NODE_ENV === "production", // Enables Secure flag in production (HTTPS required)
      sameSite: "Strict", // Prevents CSRF attacks
      maxAge: 60 * 60 * 1000, // Expires in 1 hour
    });

    res.json({ message: "Login successful", data: token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout Users
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.json({ message: "Logged out successfully" });
});

// Create User
app.post(
  "/register",
  authenticateToken,
  authorizePermission("create_users"),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      const validRoles = [
        "WarehouseMan",
        "Supervisor",
        "PlantOfficer",
        "Guard",
        "Admin",
      ];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role provided" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const data = await db("users").insert({
        name,
        email,
        password_hash: hashedPassword,
        role,
      });

      res.status(201).json({
        message: `User Created successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Filter Users using Role
app.get(
  "/filter-users",
  authenticateToken,
  authorizePermission("view_users"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const data = await db("users").select("*").where("role", "like", `%${search}%`);

      res.status(201).json({
        message: `Users filtered successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Users
app.get(
  "/search-users",
  authenticateToken,
  authorizePermission("view_users"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const data = await db("users")
        .select("*")
        .where("name", "like", `%${search}%`);

      res.status(201).json({
        message: `Search successful`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Users
app.get(
  "/view-users",
  authenticateToken,
  authorizePermission("view_users"),
  async (req, res) => {
    try {
      const data = await db("users").select("*");
      res.status(201).json({
        message: `Users Viewed successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update User
app.put(
  "/update-user/:id",
  authenticateToken,
  authorizePermission("update_users"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;

      await db("users").where("id", id).update({ name, email, role });

      res.status(201).json({
        message: `User Updated successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete User
app.delete(
  "/delete-user/:id",
  authenticateToken,
  authorizePermission("delete_users"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db("users").where("id", id).del();

      res.status(201).json({ message: "User Deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
