const express = require("express");
const uuidv4 = require("uuid").v4;

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Filter Notifications using Status
app.get(
  "/filter-notifications",
  authenticateToken,
  authorizePermission("view_notifications"),
  async (req, res) => {
    try {
      const { search } = req.query;
      const data = await db("notifications").select("*").where("status", "like", `%${search}%`);
      res.status(200).json({ message: "Notifications filtered successfully", data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Notifications
app.get(
  "/search-notification",
  authenticateToken,
  authorizePermission("view_notifications"),
  async (req, res) => {
    try {
      const { search } = req.query;
      const data = await db("notifications").select("*").where("id", "like", `%${search}%`);
      res.status(200).json({ message: "Search successful", data });
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
      const data = await db("notifications").select("*");
      res.status(200).json({ message: "Notifications Viewed successfully", data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create Notifications
app.post(
  "/create-notification",
  authenticateToken,
  authorizePermission("create_notifications"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      id = uuidv4();
      const { user_id, message, status } = req.body;
      await trx("notifications").insert({ id, user_id, message, status });
        
      [notification] = await trx("notifications").select("*").where("id", id);
      
      await trx.commit();
      res.status(201).json({ message: "Notification Created successfully", data: notification });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Notifications
app.put(
  "/update-notification/:id",
  authenticateToken,
  authorizePermission("update_notifications"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { user_id, message, status } = req.body; 

      const updatedRows = await trx("notifications").where({ id }).update({ user_id, message, status });
      
      if (!updatedRows) {
        await trx.rollback();
        return res.status(404).json({ error: "Product not found." });
      }

      const updatedNotification = await trx("notifications").where({ id }).first();

      await trx.commit(); 

      res.status(200).json({ message: "Notification Updated successfully", data: updatedNotification });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Notifications
app.delete(
  "/delete-notification/:id",
  authenticateToken,
  authorizePermission("delete_notifications"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;

      // Check if the purchase request exists
      const notification = await trx("notifications").where({ id }).first();
      if (!notification) {
        throw new Error("Purchase Request not found.");
      }

      await trx("notifications").where({ id }).del();

      await trx.commit();

      res.status(200).json({ message: "Notification Deleted successfully", data: notification });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);


/* // Filter Notifications using Status
app.get(
  "/filter-notifications",
  authenticateToken,
  authorizePermission("view_notifications"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("notifications").select("*").where("status", "like", `%${search}%`);

      res.status(201).json({
        message: `Notifications filtered successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Notifications
app.get(
  "/search-notification",
  authenticateToken,
  authorizePermission("view_notifications"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("notifications")
        .select("*")
        .where("message", "like", `%${search}%`);

      res.status(201).json({
        message: "Search successful",
        data: data,
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
      data = await db("notifications").select("*");
      res.status(201).json({
        message: "Notifications Viewed successfully",
        data: data,
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
); */

module.exports = app;
