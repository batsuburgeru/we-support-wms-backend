const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Create Delivery Note with Transaction
app.post("/create-delivery-note", authenticateToken, authorizePermission("create_delivery_notes"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      id = uuidv4();
      const { pr_id, verified_by, note, status } = req.body;
      await trx("delivery_notes").insert({ id, pr_id, verified_by, note, status })

      // Retrieve the inserted delivery note
      const deliveryNote = await trx("delivery_notes").where({ id }).first();

      await trx.commit();
      res.status(201).json({ message: `Delivery Note Created successfully`, deliveryNote });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Filter Delivery Notes using Status
app.get("/filter-delivery-notes", authenticateToken, authorizePermission("view_delivery_notes"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { search } = req.query;
      const deliveryNotes = await trx("delivery_notes").select("*").where("status", "like", `%${search}%`);
      
      if (deliveryNotes.length === 0) {
        throw new Error("No Delivery Notes found.");
      }
      await trx.commit()

      res.status(200).json({ message: `Delivery Notes filtered successfully`, deeliveryNotes });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Delivery Notes
app.get("/search-delivery-notes", authenticateToken, authorizePermission("view_delivery_notes"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { search } = req.query;
      const deliveryNote = await trx("delivery_notes").select("*").where("id", "like", `%${search}%`);
      
      if (!deliveryNote) {
        throw new Error("Delivery Note not found.");
      }

      await trx.commit();

      res.status(200).json({ message: `Search successful`, deliveryNote });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Delivery Notes
app.get("/view-delivery-notes", authenticateToken, authorizePermission("view_delivery_notes"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const deliveryNotes = await trx("delivery_notes").select("*");
      
      if (deliveryNotes.length === 0) {
        throw new Error("No Delivery Notes found.");
      }
      await trx.commit();

      res.status(200).json({ message: `Delivery Notes Viewed successfully`, deliveryNotes });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Delivery Note with Transaction
app.put("/update-delivery-note/:id", authenticateToken, authorizePermission("update_delivery_notes"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { pr_id, verified_by, note, status } = req.body;

      const updatedRows = await trx("delivery_notes").where({ id }).update({ pr_id, verified_by, note, status });
      
      if (!updatedRows) {
        await trx.rollback();
        return res.status(404).json({ error: "Delivery Note not found." });
      }

      const updatedNote = await trx("delivery_notes").where({ id }).first();
      await trx.commit();
      res.status(200).json({ message: `Delivery Note Updated successfully`, updatedNote });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Delivery Note with Transaction
app.delete("/delete-delivery-note/:id", authenticateToken, authorizePermission("delete_delivery_notes"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;

      const deliveryNote = await trx("delivery_notes").where({ id }).first();
      if (!deliveryNote) {
        await trx.rollback();
        return res.status(404).json({ error: "Delivery Note not found" });
      }
      await trx("delivery_notes").where({ id }).del();

      await trx.commit();
      res.status(200).json({ message: `Delivery Note Deleted successfully`, deliveryNote });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

/* // Filter Delivery Notes using Status
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
); */

module.exports = app;
