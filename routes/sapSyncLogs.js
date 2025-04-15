const express = require("express");
const uuidv4 = require("uuid").v4;
const { Parser } = require("json2csv");
const db = require("../db/db.js");
const app = express.Router();
app.use(express.json());

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// SAP Sync Route
app.post(
  "/sap-sync",
  authenticateToken,
  authorizePermission("create_sap_sync_logs"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { pr_id } = req.body;
      const transaction_id = `SAP_${Date.now()}`;
      const id = uuidv4();

      if (!pr_id) {
        await trx.rollback();
        return res.status(400).json({ error: "prId is required" });
      }

      // 1. Insert log as Pending
      await trx("sap_sync_logs").insert({
        id,
        pr_id: pr_id,
        transaction_id
      });

      // 2. Simulate SAP API call
      let sapResponse;
      try {
        const simulateSAPResponse = Math.random() < 0.3; // 80% chance of success

        if (!simulateSAPResponse) {
          throw new Error("Simulated SAP sync failed");
        }

        const sapResponse = {
          data: {
            success: true,
            message: "Simulated SAP sync success"
          }
        };

        // 3. Update purchase_requests and sap_sync_logs
        await trx("purchase_requests")
          .where({ id: pr_id })
          .update({ sap_sync_status: true });

        await trx("sap_sync_logs")
          .where({ id })
          .update({
            status: "Success"
          });

        const log = await trx("sap_sync_logs").where({ id }).first();
        await trx.commit();

        return res.status(200).json({
          message: "SAP sync successful",
          transaction_id,
          log,
        });
      } catch (error) {
        // 4. Mark as Failed
        await trx("sap_sync_logs")
          .where({ id })
          .update({
            status: "Failed"
          });

        await trx.commit(); // Still commit to save the failed log
        return res.status(500).json({
          error: "SAP sync failed",
          transaction_id,
          details: error.message,
        });
      }
    } catch (error) {
      await trx.rollback();
      return res.status(500).json({ error: error.message });
    }
  }
);

// SAP Re-Sync Route
app.post(
  "/sap-resync/:logId",
  authenticateToken,
  authorizePermission("create_sap_sync_logs"),
  async (req, res) => {
    const trx = await db.transaction();

    try {
      const { logId } = req.params;

      // Get the original failed log
      const oldLog = await trx("sap_sync_logs").where({ id: logId }).first();

      if (!oldLog) {
        await trx.rollback();
        return res.status(404).json({ error: "SAP sync log not found." });
      }

      if (!oldLog.pr_id) {
        await trx.rollback();
        return res.status(400).json({ error: "Cannot resync: pr_id is missing." });
      }

      const newLogId = uuidv4();
      const transaction_id = `SAP_${Date.now()}`;

      // Insert new sync log as Pending
      await trx("sap_sync_logs").insert({
        id: newLogId,
        pr_id: oldLog.pr_id,
        transaction_id,
        status: "Pending"
      });

      // Simulate SAP API call
      try {
        const simulateSAPResponse = Math.random() < 0.8;

        if (!simulateSAPResponse) {
          throw new Error("Simulated SAP sync failed");
        }

        // Simulated success response
        const sapResponse = {
          data: {
            success: true,
            message: "Simulated SAP sync success"
          }
        };

        // Update purchase request status
        await trx("purchase_requests")
          .where({ id: oldLog.pr_id })
          .update({ sap_sync_status: true });

        // Update new sync log as Success
        await trx("sap_sync_logs")
          .where({ id: newLogId })
          .update({
            status: "Success"
          });

        const log = await trx("sap_sync_logs").where({ id: newLogId }).first();
        await trx.commit();

        return res.status(200).json({
          message: "SAP re-sync successful",
          transaction_id,
          log
        });
      } catch (error) {
        // Mark new sync attempt as Failed
        await trx("sap_sync_logs")
          .where({ id: newLogId })
          .update({
            status: "Failed"
          });

        await trx.commit();
        return res.status(500).json({
          error: "SAP re-sync failed",
          transaction_id,
          details: error.message
        });
      }
    } catch (error) {
      await trx.rollback();
      return res.status(500).json({ error: error.message });
    }
  }
);

// Export SAP Sync Logs Route
app.get(
  "/export-sap-sync-logs",
  authenticateToken,
  authorizePermission("view_sap_sync_logs"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { startDate, endDate, status, prId } = req.query;

      const query = trx("sap_sync_logs")
        .select(
          "id",
          "pr_id",
          "transaction_id",
          "status",
          "created_at"
        )
        .orderBy("created_at", "desc");

      // Apply filters
      if (status) {
        query.where("status", status);
      }

      if (prId) {
        query.where("pr_id", prId);
      }

      if (startDate && endDate) {
        query.whereBetween("created_at", [new Date(startDate), new Date(endDate)]);
      } else if (startDate) {
        query.where("created_at", ">=", new Date(startDate));
      } else if (endDate) {
        query.where("created_at", "<=", new Date(endDate));
      }

      const logs = await query;

      if (logs.length === 0) {
        await trx.commit(); // Commit even if no logs found, to avoid hanging transactions
        return res.status(404).json({ message: "No SAP sync logs found." });
      }

      const parser = new Parser();
      const csv = parser.parse(logs);

      res.header("Content-Type", "text/csv");
      res.attachment("sap_sync_logs.csv");
      await trx.commit(); // Commit after CSV generation
      return res.send(csv);
      
    } catch (error) {
      await trx.rollback(); // Rollback on error
      console.error("[EXPORT ERROR]", error.message);
      return res.status(500).json({ error: "Failed to export logs" });
    }
  }
);

app.post(
  "/sap-sync-all",
  authenticateToken,
  authorizePermission("create_sap_sync_logs"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      // Optional filters from body or query (future enhancement)
      const unsyncedRequests = await trx("purchase_requests")
        .where({ sap_sync_status: false });

      if (unsyncedRequests.length === 0) {
        await trx.commit();
        return res.status(200).json({ message: "No unsynced purchase requests found." });
      }

      const results = [];

      for (const pr of unsyncedRequests) {
        const transaction = await db.transaction(); // Separate trx per PR
        const logId = uuidv4();
        const transaction_id = `SAP_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        try {
          // Insert pending log
          await transaction("sap_sync_logs").insert({
            id: logId,
            pr_id: pr.id,
            transaction_id,
            status: "Pending",
          });

          // Simulate SAP sync
          const simulateSAPResponse = Math.random() < 0.8;

          if (!simulateSAPResponse) throw new Error("Simulated SAP failure");

          // Update PR and log as Success
          await transaction("purchase_requests")
            .where({ id: pr.id })
            .update({ sap_sync_status: true });

          await transaction("sap_sync_logs")
            .where({ id: logId })
            .update({ status: "Success" });

          await transaction.commit();
          results.push({ pr_id: pr.id, status: "Success", transaction_id });

        } catch (err) {
          await transaction("sap_sync_logs")
            .where({ id: logId })
            .update({ status: "Failed" });

          await transaction.commit(); // Commit log even if failed
          results.push({ pr_id: pr.id, status: "Failed", transaction_id, error: err.message });
        }
      }

      await trx.commit();
      return res.status(200).json({
        message: "Bulk SAP sync completed",
        summary: {
          total: results.length,
          success: results.filter(r => r.status === "Success").length,
          failed: results.filter(r => r.status === "Failed").length,
        },
        details: results,
      });

    } catch (error) {
      await trx.rollback();
      return res.status(500).json({ error: error.message });
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

module.exports = app;
