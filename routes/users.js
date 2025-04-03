const express = require("express");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const uploadImage = require("../middleware/uploadImage"); // Adjust the path as needed
const fs = require("fs");
const path = require("path");


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

    // Check if user exists and fetch acc_status
    const user = await db("users")
      .select("id", "name", "email", "password_hash", "role", "acc_status")
      .where("email", email)
      .first();

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if the account is verified
    if (user.acc_status !== "Verified") {
      return res.status(403).json({ error: "Account not verified. Please verify your email before logging in." });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      SECRET_KEY
    );

    // Set token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevents JavaScript access (More Secure)
      secure: process.env.NODE_ENV === "production", // Enables Secure flag in production (HTTPS required)
      sameSite: "Strict", // Prevents CSRF attacks
    });

    res.json({ message: "Login successful", token });
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

app.post(
  "/register",
  authenticateToken,
  authorizePermission("create_users"),
  uploadImage('profilePictures'), // Middleware to process image uploads
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { name, email, password, role, org_name, comp_add, contact_num,} = req.body;
      let { image } = req.body; 
      const id = uuidv4();

      const validRoles = [
        "WarehouseMan",
        "Supervisor",
        "PlantOfficer",
        "Guard",
        "Admin",
        "Client"
      ];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role provided" });
      }

      const existingUser = await trx("users").where({ email }).first();
      if (existingUser) {
        throw new Error("Email already exists"); // Trigger rollback
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Determine profile picture path
      if (req.file) {
        image = `/assets/profilePictures/${req.file.filename}`; // Save only relative path in DB
      } else if (!image) {
        image = null; // No file uploaded, and no path provided
      }

      // ✅ Use `trx` for database operations
      await trx("users").insert({
        id: id, // Generate a new UUID for the user
        name,
        email,
        password_hash: hashedPassword,
        role,
        img_url: image, // Store image path (or null if none)
      });

      let client = null;
      if (role === "Client") {
        await trx("clients").insert({
          client_id : id,
          org_name,
          comp_add,
          contact_num,
        });
        client = await trx("clients").where({ client_id: id }).first();
      }

      // ✅ Use `trx` to fetch the user within the same transaction
      const user = await trx("users").where({ id }).first();

      await trx.commit(); // Commit transaction

      if (role === "Client") {
        res.status(201).json({ message: "User Created successfully", user, client });
      } else {
        res.status(201).json({ message: "User Created successfully", user });
      }

    } catch (error) {
      await trx.rollback(); // Rollback transaction if any error occurs

      // 🔥 Corrected file deletion path (pointing to root `/assets` folder)
      if (req.file) {
        const filePath = path.join(__dirname, "..", "assets", "profilePictures", req.file.filename);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Failed to delete file:", err);
        });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// User Info Display
app.get(
  "/display-user-info",
  authenticateToken,
  authorizePermission("view_users"),
  async (req, res) => {
    try {
      const id = req.user.id;

      const userInfo = await db("users")
        .select("id", "name", "email", "role")
        .where("id", "like", id)
        .first();

      res.status(201).json({
        message: `User Information retrieved successfully`,
        userInfo,
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

      const users = await db("users")
        .select("*")
        .where("role", "like", `%${search}%`);

      if (!users || users.length === 0) {
        return res.status(200).json({
          message: "No matching User found.",
        });
      }

      res.status(201).json({
        message: `Users filtered successfully`,
        users,
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

      const user = await db("users")
        .select("*")
        .where("name", "like", `%${search}%`);

      if (!user || user.length === 0) {
        return res.status(200).json({
          message: "No matching User found.",
        });
      }

      res.status(201).json({
        message: `Search successful`,
        user,
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction if any error occurs

      // 🔥 Corrected file deletion path (pointing to root `/assets` folder)
      if (req.file) {
        const filePath = path.join(__dirname, "..", "assets", "profilePictures", req.file.filename);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Failed to delete file:", err);
        });
      }
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
      const users = await db("users").select("*");

      if (!users || users.length === 0) {
        return res.status(200).json({
          message: "No matching User found.",
        });
      }

      res.status(201).json({
        message: `Users Viewed successfully`,
        users,
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
    const trx = await db.transaction();

    try {
      const { id } = req.params;
      const { name, email, role } = req.body;

      updatedRows = await trx("users")
        .where("id", id)
        .update({ name, email, role });

      if (!updatedRows) {
        await trx.rollback();
        return { message: "No matching User found." };
      }

      const updatedUser = await trx("users").where({ id }).first();

      await trx.commit();

      res.status(201).json({
        message: `User Updated successfully`,
        updatedUser,
      });
    } catch (error) {
      await trx.rollback();
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
    const trx = await db.transaction();

    try {
      const { id } = req.params;

      user = await trx("users").where({ id }).first();
      if (!user) {
        return { message: "No matching User found." };
      }

      await trx("users").where("id", id).del();

      await trx.commit();

      res.status(201).json({ message: "User Deleted successfully", user });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
