const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Filter Delivery Notes using Status
app.get("/filter-delivery-notes", authenticateToken, authorizePermission("view_delivery_notes"),
   async (req, res) => {
  try {
    const { search } = req.query;

    data = await db("delivery_notes").select("*").where("status", "like", `%${search}%`);

    res.status(201).json({
      message: `Delivery Notes filtered successfully`,
      data: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search Delivery Notes
app.get(
  "/search-delivery-notes",
  authenticateToken,
  authorizePermission("view_delivery_notes"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("delivery_notes")
        .select("*")
        .where("id", "like", `%${search}%`);

      res.status(201).json({
        message: `Search successful`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Delivery Notes
app.get(
  "/view-delivery-notes",
  authenticateToken,
  authorizePermission("view_delivery_notes"),
  async (req, res) => {
    try {
      data = await db("delivery_notes").select("*");
      res.status(201).json({
        message: `Delivery Notes Viewed successfully`,
        data: data,
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
      const { pr_id, verified_by, status } = req.body;

      await db("delivery_notes").insert({
        pr_id,
        verified_by,
        status,
      });

      res.status(201).json({
        message: `Delivery Note Created successfully`,
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
      const { pr_id, verified_by, status } = req.body;

      await db("delivery_notes").where({ id }).update({
        id,
        pr_id,
        verified_by,
        status,
      });

      res.status(201).json({
        message: `Delivery Note Updated successfully`,
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
        message: `Delivery Note Deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
