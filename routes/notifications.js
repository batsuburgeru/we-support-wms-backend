const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Search Notifications
app.get(
  "/search-notification",
  authenticateToken,
  authorizePermission("view_notifications"),
  async (req, res) => {
    try {
      const { search } = req.query;

      await db("notifications")
        .select("*")
        .where("message", "like", `%${search}%`);

      res.status(201).json({
        message: "Search successful",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Notifications
app.get(
  "/view-notifications",
  authenticateToken,
  authorizePermission("view_notifications"),
  async (req, res) => {
    try {
      await db("notifications").select("*");
      res.status(201).json({
        message: "Notifications Viewed successfully",
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
      const { user_id, message, status } = req.body;

      await db("notifications").insert({
        user_id,
        message,
        status,
      });

      res.status(201).json({
        message: "Notification Created successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//Update Notifications
app.put(
  "/update-notification",
  authenticateToken,
  authorizePermission("update_notification"),
  async (req, res) => {
    try {
      const { user_id, message, status } = req.body;

      await db("notifications").where("user_id", user_id).update({
        message,
        status,
      });

      res.status(201).json({
        message: "Notification Updated successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//Delete Notifications
app.delete(
  "/delete-notification",
  authenticateToken,
  authorizePermission("delete_notification"),
  async (req, res) => {
    try {
      const { user_id } = req.body;

      await db("notifications").where("user_id", user_id).del();

      res.status(201).json({
        message: "Notification Deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
