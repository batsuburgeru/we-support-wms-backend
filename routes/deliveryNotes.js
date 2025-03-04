const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Read Delivery Notes
app.get(
  "/view-delivery-notes",
  authenticateToken,
  authorizePermission("view_delivery_notes"),
  async (req, res) => {
    try {
      const data = await db("delivery_notes").select("*");
      res.status(201).json({
        message: `Delivery Notes Viewed successfully`,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create Delivery Notes
app.post(
  "/create-delivery-note",
  authenticateToken,
  authorizePermission("create_delivery_notes"),
  async (req, res) => {
    try {
      const { id, pr_id, verified_by, verified_at, status } = req.body;

      const data = await db("delivery_notes").insert({
        id,
        pr_id,
        verified_by,
        verified_at,
        status,
      });

      res.status(201).json({
        message: `Delivery Note Created successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Delivery Notes
app.put(
  "/update-delivery-note/:id",
  authenticateToken,
  authorizePermission("update_delivery_notes"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { pr_id, verified_by, verified_at, status } = req.body;

      data = await db("delivery_notes").where({ id }).update({
        pr_id,
        verified_by,
        verified_at,
        status,
      });

      res.status(201).json({
        message: `Delivery Note ${id} Updated successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Delivery Notes
app.delete(
  "/delete-delivery-note/:id",
  authenticateToken,
  authorizePermission("delete_delivery_notes"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db("delivery_notes").where({ id }).del();

      res.status(201).json({
        message: `Delivery Note ${id} Deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

modeule.exports = app;
