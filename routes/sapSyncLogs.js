const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Filter SAP Sync Logs using Status
app.get(
  "/filter-sap-sync-logs",
  authenticateToken,
  authorizePermission("view_sap_sync_logs"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("sap_sync_logs").select("*").where("status", "like", `%${search}%`);

      res.status(201).json({
        message: "SAP Sync Logs filtered successfully",
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Search SAP Sync Logs
app.get(
  "/search-sap-sync-log",
  authenticateToken,
  authorizePermission("view_sap_sync_logs"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("sap_sync_logs")
        .select("*")
        .where("id", "like", `%${search}%`);

      res.status(201).json({
        message: "Search successful",
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read SAP Sync Logs
app.get(
  "/view-sap-sync-logs",
  authenticateToken,
  authorizePermission("view_sap_sync_logs"),
  async (req, res) => {
    try {
      data = await db("sap_sync_logs").select("*");
      res.status(201).json({
        message: "SAP Sync Logs Viewed successfully",
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create SAP Sync Logs
app.post(
  "/create-sap-sync-log",
  authenticateToken,
  authorizePermission("create_sap_sync_logs"),
  async (req, res) => {
    try {
      const { pr_id, transaction_id, status } = req.body;

      await db("sap_sync_logs").insert({
        pr_id,
        transaction_id,
        status,
      });

      res.status(201).json({
        message: "SAP Sync Log Created successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update SAP Sync Logs
app.put(
  "/update-sap-sync-log/:id",
  authenticateToken,
  authorizePermission("update_sap_sync_logs"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      await db("sap_sync_logs").where({ id }).update({ status });

      res.status(201).json({
        message: "SAP Sync Log Updated successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete SAP Sync Logs
app.delete(
  "/delete-sap-sync-log/:id",
  authenticateToken,
  authorizePermission("delete_sap_sync_logs"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db("sap_sync_logs").where({ id }).del();

      res.status(201).json({
        message: "SAP Sync Log Deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
