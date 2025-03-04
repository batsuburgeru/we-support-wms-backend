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
      const data = await db("purchase_requests").select("*");
      res.status(201).json({
        message: `Purchase Requests Viewed successfully`,
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
      const {
        id,
        created_by,
        status,
        aproved_by,
        sap_sync_status,
        created_at,
        updated_at,
      } = req.body;

      const data = await db("purchase_requests").insert({
        id,
        created_by,
        status,
        aproved_by,
        sap_sync_status,
        created_at,
        updated_at,
      });

      res.status(201).json({
        message: `Purchase Request Created successfully`,
        data: data,
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
      const {
        created_by,
        status,
        aproved_by,
        sap_sync_status,
        created_at,
        updated_at,
      } = req.body;

      const data = await db("purchase_requests").where({ id }).update({
        created_by,
        status,
        aproved_by,
        sap_sync_status,
        created_at,
        updated_at,
      });

      res.status(201).json({
        message: `Purchase Request Updated successfully`,
        data: data,
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

      const data = await db("purchase_requests").where({ id }).del();

      res.status(201).json({
        message: `Purchase Request Deleted successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
