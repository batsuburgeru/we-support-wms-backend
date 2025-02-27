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

// LOGIN ROUTE
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

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register METHOD
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

      await db("users").insert({
        name,
        email,
        password_hash: hashedPassword,
        role,
      });

      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET USERS ROUTE
app.get(
  "/users",
  authenticateToken,
  authorizePermission("view_users", "edit_users"),
  async (req, res) => {
    try {
      const users = await db("users").select("*");
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
