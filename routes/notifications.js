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

// Read Notifications
app.get(
  "/view-notifications",
  authenticateToken,
  authorizePermission("view_notifications"),
  async (req, res) => {
    try {
      const data = await db("notifications").select("*");
      res.status(201).json({
        message: `Notifications Viewed successfully`,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create Notifications
app.post(
  "/create-notification",
  authenticateToken,
  authorizePermission("create_notification"),
  async (req, res) => {
    try {
      const { id, user_id, message, status, created_at } = req.body;

      const data = await db("notifications").insert({
        id,
        user_id,
        message,
        status,
        created_at
      });

      res.status(201).json({
        message: `Notification Created successfully`,
        data: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;