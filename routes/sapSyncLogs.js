const express = require("express");
const uuidv4 = require("uuid").v4;

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Create SAP Sync Logs
app.post(
  "/create-sap-sync-log",
  authenticateToken,
  authorizePermission("create_sap_sync_logs"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { pr_id, transaction_id, status } = req.body;
      const id = uuidv4();

      await trx("sap_sync_logs").insert({ id, pr_id, transaction_id, status });

      const newLog = await trx("sap_sync_logs").where({ id }).first();

      await trx.commit();
      res.status(201).json({
        message: "SAP Sync Log Created successfully",
        newLog,
      });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Filter SAP Sync Logs using Status
app.get(
  "/filter-sap-sync-logs",
  authenticateToken,
  authorizePermission("view_sap_sync_logs"),
  async (req, res) => {
    try {
      const { search } = req.query;
      const sapSyncLogs = await db("sap_sync_logs")
        .select("*")
        .where("status", "like", `%${search}%`);

      if (!sapSyncLogs || sapSyncLogs.length === 0) {
        return res.status(200).json({
          message: "No matching SAP Sync Log found.",
        });
      }

      res.status(200).json({
        message: "SAP Sync Logs filtered successfully",
        sapSyncLogs,
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
      const sapSyncLog = await db("sap_sync_logs")
        .select("*")
        .where("id", "like", `%${search}%`);

      if (!sapSyncLog || sapSyncLog.length === 0) {
        return res.status(200).json({
          message: "No matching SAP Sync Log found.",
        });
      }
      res.status(200).json({
        message: "Search successful",
        sapSyncLog,
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
      const sapSyncLogs = await db("sap_sync_logs").select("*");
      if (!sapSyncLogs || sapSyncLogs.length === 0) {
        return res.status(200).json({
          message: "No matching SAP Sync Log found.",
        });
      }

      res.status(200).json({
        message: "SAP Sync Logs Viewed successfully",
        sapSyncLogs,
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
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedRows = await trx("sap_sync_logs")
        .where({ id })
        .update({ status }, ["*"]);

      if (!updatedRows || updatedRows.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching SAP Sync Log found.",
        });
      }

      const updatedSapSyncLog = await trx("sap_sync_logs")
        .where({ id })
        .first();

      await trx.commit();
      res.status(200).json({
        message: "SAP Sync Log Updated successfully",
        data: updatedSapSyncLog,
      });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Update SAP Sync Log Status
app.put(
  "/update-sap-sync-log-status/:id",
  authenticateToken,
  authorizePermission("update_sap_sync_logs"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedRows = await trx("sap_sync_logs")
        .where({ id })
        .update({ status });

      if (!updatedRows || updatedRows.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching SAP Sync Log found.",
        });
      }

      const updatedNote = await trx("sap_sync_logs").where({ id }).first();
      await trx.commit();
      res
        .status(200)
        .json({ message: `SAP Sync Log Updated successfully`, updatedNote });
    } catch (error) {
      await trx.rollback();
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
    const trx = await db.transaction();
    try {
      const { id } = req.params;

      sapSyncLog = await trx("categories").where({ id }).first();
      if (!sapSyncLog || sapSyncLog.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching SAP Sync Log found.",
        });
      }

      await trx("sap_sync_logs").where({ id }).del(["*"]);

      await trx.commit();
      res.status(200).json({
        message: "SAP Sync Log Deleted successfully",
        data: sapSyncLog,
      });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

/* // Filter SAP Sync Logs using Status
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
); */

module.exports = app;
