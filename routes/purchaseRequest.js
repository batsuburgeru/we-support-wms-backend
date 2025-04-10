const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Create Purchase Request
app.post(
  "/create-purchase-request",
  authenticateToken,
  authorizePermission("create_purchase_requests"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const id = uuidv4(); // Generate UUID manually
      const created_by = req.user.id;
      const { client_id, note, items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Items array is required and cannot be empty.");
      }

      // Insert into purchase_requests
      await trx("purchase_requests").insert({
        id: id,
        client_id,
        created_by,
      });
      // Retrieve the inserted purchase request
      const [purchaseRequest] = await trx("purchase_requests")
        .select("*")
        .where("id", id);

      // Insert into delivery_notes
      await trx("delivery_notes").insert({
        id: uuidv4(),
        pr_id: id,
        note: note,
      });

      // Retrieve the inserted delivery note
      const [deliveryNote] = await trx("delivery_notes")
        .select("*")
        .where("pr_id", id);

      const prItemsData = items.map((item) => ({
        id: uuidv4(),
        pr_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      await trx("pr_items").insert(prItemsData);

      // Retrieve all inserted PR items
      const prItems = await trx("pr_items").select("*").where("pr_id", id);

      await trx.commit(); // Commit transaction;'

      res.status(201).json({
        message: `Purchase Request, Delivery Note, and PR Items created successfully`,
        purchaseRequest,
        deliveryNote,
        prItems, // Return all inserted items
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Purchase Requests with Status Count & Total Count
app.get(
  "/count-purchase-requests",
  authenticateToken,
  authorizePermission("view_purchase_requests"),
  async (req, res) => {
    try {
      // Fetch purchase requests grouped by status
      const statusCounts = await db("purchase_requests")
        .select("status")
        .count("* as count")
        .groupBy("status");

      // Fetch total number of purchase requests
      const totalRequests = await db("purchase_requests").count("* as total");

      // Convert result into an object like { "Pending": 3, "Rejected": 5 }
      const formattedCounts = statusCounts.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {});

      res.status(200).json({
        message: "Search successful",
        status_counts: formattedCounts,
        total_requests: totalRequests[0].total, // Extract total count
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read All Purchase Requests
app.get(
  "/read-purchase-requests",
  authenticateToken,
  authorizePermission("view_purchase_requests"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      // Fetch all purchase requests with creator and approver details
      const purchaseRequests = await trx("purchase_requests as pr")
        .select(
          "pr.*",
          "uc.name as created_by_name",  
          "uc.role as created_by_role",  
          "ua.name as approved_by_name",  
          "ua.role as approved_by_role",
          "ub.name as client_name", // Include client name from users table
          "ub.role as client_role" // Include client role from users table
        )
        .leftJoin("users as uc", "pr.created_by", "uc.id") // Join with users table for creator
        .leftJoin("users as ua", "pr.approved_by", "ua.id") // Join with users table for approver
        .leftJoin("users as ub", "pr.client_id", "ub.id") // Join with users table for client

      if (!purchaseRequests || purchaseRequests.length === 0) {
        await trx.commit();
        return res.status(200).json({
          message: "No matching Purchase Request found.",
        });
      }

      // Process results for each purchase request
      const results = await Promise.all(
        purchaseRequests.map(async (purchaseRequest) => {
          const prId = purchaseRequest.id;

          // Fetch related delivery note
          const [deliveryNote] = await trx("delivery_notes")
            .select("*")
            .where("pr_id", prId);

          // Fetch related PR items with product names
          const prItems = await trx("pr_items as pi")
            .select(
              "pi.*",
              "p.name as product_name" // Fetch product name from products table
            )
            .leftJoin("products as p", "pi.product_id", "p.id") // Join with products table
            .where("pi.pr_id", prId);

          return {
            purchaseRequest,
            deliveryNote: deliveryNote || null,
            prItems,
          };
        })
      );

      await trx.commit();
      res.status(200).json(results);
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Specific Purchase Request
app.get(
  "/search-purchase-request",
  authenticateToken,
  authorizePermission("view_purchase_requests"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { search } = req.query;

      // Fetch the purchase request along with creator and approver details
      const purchaseRequest = await trx("purchase_requests as pr")
        .select(
          "pr.*",
          "uc.name as created_by_name",
          "uc.role as created_by_role",
          "ua.name as approved_by_name",
          "ua.role as approved_by_role",
          "ub.name as client_name", // Include client name from users table
          "ub.role as client_role" // Include client role from users table
        )
        .leftJoin("users as uc", "pr.created_by", "uc.id") // Join with users table for creator
        .leftJoin("users as ua", "pr.approved_by", "ua.id") // Join with users table for approver
        .leftJoin("users as ub", "pr.client_id", "ub.id") // Join with users table for client
        .where("pr.id", search)
        .first();

      if (!purchaseRequest) {
        await trx.commit();
        return res.status(200).json({
          message: "No matching Purchase Request found.",
        });
      }

      // Fetch related delivery note
      const deliveryNote = await trx("delivery_notes")
        .select("*")
        .where("pr_id", search)
        .first();

      // Fetch related PR items with product names
      const prItems = await trx("pr_items as pi")
        .select(
          "pi.*",
          "p.name as product_name" // Include product name from products table
        )
        .leftJoin("products as p", "pi.product_id", "p.id") // Join with products table
        .where("pi.pr_id", search);

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: `Purchase Request retrieved successfully`,
        data: {
          purchaseRequest: {
            ...purchaseRequest
          },
          deliveryNote: deliveryNote || null,
          prItems,
        },
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Filter Purchase Requests using Status
app.get(
  "/filter-purchase-requests",
  authenticateToken,
  authorizePermission("view_purchase_requests"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { search } = req.query;
      // Fetch all purchase requests
      const purchaseRequests = await trx("purchase_requests")
        .where("status", search)
        .select("*");

      if (!purchaseRequests || purchaseRequests.length === 0) {
        await trx.commit();
        return res.status(200).json({
          message: "No matching Purchase Request found.",
        });
      }

      // Process results for each purchase request
      const results = await Promise.all(
        purchaseRequests.map(async (purchaseRequest) => {
          const prId = purchaseRequest.id;

          // Fetch related delivery note
          const [deliveryNote] = await trx("delivery_notes")
            .select("*")
            .where("pr_id", prId);

          // Fetch related PR items
          const prItems = await trx("pr_items")
            .select("*")
            .where("pr_id", prId);

          return {
            purchaseRequest,
            deliveryNote: deliveryNote || null,
            prItems,
          };
        })
      );

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: `All Purchase Requests retrieved successfully`,
        data: results,
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Purchase Request
app.put(
  "/update-purchase-request/:id",
  authenticateToken,
  authorizePermission("update_purchase_requests"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { id } = req.params;
      const { note, items } = req.body;

      // Fetch existing purchase request
      const existingPurchaseRequest = await trx("purchase_requests")
        .where({ id })
        .first();

      if (!existingPurchaseRequest || existingPurchaseRequest.length === 0) {
        await trx.commit();
        return res.status(200).json({
          message: "No matching Purchase Request found.",
        });
      }

      // Update delivery_notes only if note is provided
      if (note !== undefined && note !== null) {
        await trx("delivery_notes").where({ pr_id: id }).update({ note: note });
      }

      // Handle items update
      if (Array.isArray(items) && items.length > 0) {
        // Delete old items and insert new ones
        await trx("pr_items").where({ pr_id: id }).del();

        const prItemsData = items.map((item) => ({
          id: uuidv4(),
          pr_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        await trx("pr_items").insert(prItemsData);
      }

      // Retrieve updated data
      const updatedPurchaseRequest = await trx("purchase_requests")
        .where({ id })
        .first();
      const updatedDeliveryNote = await trx("delivery_notes")
        .where({ pr_id: id })
        .first();
      const updatedPrItems = await trx("pr_items").where({ pr_id: id });

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: "Purchase Request updated successfully",
        purchaseRequest: updatedPurchaseRequest,
        deliveryNote: updatedDeliveryNote,
        prItems: updatedPrItems,
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Purchase Request Status
app.put(
  "/update-purchase-request-status/:id",
  authenticateToken,
  authorizePermission("update_purchase_requests"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const approved_by = req.user.id;
      const name = req.user.name; // Fix: Correctly getting name from token

      if (!status) {
        throw new Error("Status is required.");
      }

      // Fetch existing purchase request
      const existingPurchaseRequest = await trx("purchase_requests")
        .where({ id })
        .first();
      if (!existingPurchaseRequest) {
        await trx.rollback();
        return res.status(404).json({
          message: "No matching Purchase Request found.",
        });
      }

      // Update status and approved_by in purchase_requests
      await trx("purchase_requests").where({ id }).update({ status, approved_by });

      // Append new formatted note if provided
      if (note !== undefined && note.trim() !== "") {
        const formattedNote = `${name} ${status} Purchase Request: ${note}`;

        const existingNote = await trx("delivery_notes")
          .where({ pr_id: id })
          .select("note")
          .first();

        const updatedNote = existingNote?.note
          ? `${existingNote.note}\n${formattedNote}`
          : formattedNote;

        await trx("delivery_notes")
          .where({ pr_id: id })
          .update({ note: updatedNote });
      }

      await trx.commit();

      res.status(200).json({
        message: "Purchase Request status updated successfully",
        purchaseRequest: { id, status, approved_by },
        deliveryNote: note ? { pr_id: id, note } : null,
      });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);



// Delete Purchase Request
app.delete(
  "/delete-purchase-request/:id",
  authenticateToken,
  authorizePermission("delete_purchase_requests"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { id } = req.params;

      // Check if the purchase request exists
      const purchaseRequest = await trx("purchase_requests")
        .where({ id })
        .first();
      if (!purchaseRequest || purchaseRequest.length === 0) {
        await trx.commit();
        return res.status(200).json({
          message: "No matching Purchase Request found.",
        });
      }

      // Delete related PR items
      await trx("pr_items").where({ pr_id: id }).del();

      // Delete related delivery note
      await trx("delivery_notes").where({ pr_id: id }).del();

      // Delete purchase request
      await trx("purchase_requests").where({ id }).del();

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: `Purchase Request and related records deleted successfully.`,
        purchaseRequest,
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
      res.status(500).json({ error: error.message });
    }
  }
);

/* // Filter Purchase Requests using Status
app.get(
  "/filter-purchase-requests",
  authenticateToken,
  authorizePermission("view_purchase_requests"),
  async (req, res) => {
    const trx = await db.transaction(); // Start a transaction

    try {
      const { search } = req.query;

      const data = await trx("purchase_requests")
        .select("*")
        .where("status", "like", `%${search}%`);

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: `Purchase Requests filtered successfully`,
        data: data,
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
      res.status(500).json({ error: error.message });
    }
  }
); */

// Update Purchase Request

/* // Search Purchase Requests
app.get(
  "/search-purchase-request",
  authenticateToken,
  authorizePermission("view_purchase_requests"),
  async (req, res) => {
    const trx = await db.transaction(); // Start a transaction

    try {
      const { search } = req.query;

      const data = await trx("purchase_requests")
        .select("*")
        .where("id", "like", `%${search}%`);

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: `Purchase Requests searched successfully`,
        data: data,
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
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
); */

module.exports = app;