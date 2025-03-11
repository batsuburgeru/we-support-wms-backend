const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Read Purchase Requests
app.get(
  "/view-purchase-requests",
  authenticateToken,
  authorizePermission("view_purchase_requests"),
  async (req, res) => {
    try {
      data = await db("purchase_requests").select("*");
      res.status(201).json({
        message: `Search successful`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Purchase Requests
app.get(
  "/search-purchase-request",
  authenticateToken,
  authorizePermission("view_purchase_requests"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("purchase_requests")
        .select("*")
        .where("id", "like", `%${search}%`);

      res.status(201).json({
        message: `Purchase Requests searched successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create Purchase Requests
app.post(
  "/create-purchase-request",
  authenticateToken,
  authorizePermission("create_purchase_requests"),
  async (req, res) => {
    try {
      const { created_by, status, approved_by, sap_sync_status } = req.body;

      data = await db("purchase_requests").insert({
        created_by,
        status,
        approved_by,
        sap_sync_status,
      });

      res.status(201).json({
        message: `Purchase Request Created successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Purchase Requests
app.put(
  "/update-purchase-request/:id",
  authenticateToken,
  authorizePermission("update_purchase_requests"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { created_by, status, approved_by, sap_sync_status } = req.body;

      await db("purchase_requests").where({ id }).update({
        created_by,
        status,
        approved_by,
        sap_sync_status,
      });

      res.status(201).json({
        message: `Purchase Request Updated successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Purchase Requests
app.delete(
  "/delete-purchase-request/:id",
  authenticateToken,
  authorizePermission("delete_purchase_requests"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db("purchase_requests").where({ id }).del();

      res.status(201).json({
        message: `Purchase Request Deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
