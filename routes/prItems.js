const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Search PR Items
app.get(
  "/search-pr-items",
  authenticateToken,
  authorizePermission("view_pr_items"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const prItem = await db("pr_items")
        .select("*")
        .where("id", "like", `%${search}%`);

      if (!prItem || prItem.length === 0) {
        return res.status(200).json({
          message: "No matching Purchase Request Item found.",
        });
      }

      res.status(200).json({
        message: `Search successful`,
        prItem,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read PR Items
app.get(
  "/view-pr-items",
  authenticateToken,
  authorizePermission("view_pr_items"),
  async (req, res) => {
    try {
      const prItem = await db("pr_items").select("*");

      if (!prItem || prItem.length === 0) {
        return res.status(200).json({
          message: "No matching Purchase Request Item found.",
        });
      }

      res.status(200).json({
        message: `PR Items Viewed successfully`,
        prItem,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update PR Items
app.put(
  "/update-pr-item/:id",
  authenticateToken,
  authorizePermission("update_pr_items"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { pr_id, product_id, quantity, unit_price } = req.body;

      // Update the row
      const updatedRows = await trx("pr_items").where({ id }).update({
        pr_id,
        product_id,
        quantity,
        unit_price,
      });

      if (!updatedRows || updatedRows.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching Purchase Request Item found.",
        });
      }

      // Fetch the updated row
      const updatedData = await trx("pr_items").where({ id }).first();

      await trx.commit();

      res.status(200).json({
        message: `PR Item Updated successfully`,
        data: updatedData,
      });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete PR Items
app.delete(
  "/delete-pr-item/:id",
  authenticateToken,
  authorizePermission("delete_pr_items"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;

      // Retrieve the item before deleting
      const prItem = await trx("pr_items").where({ id }).first();

      if (!prItem || prItem.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching Purchase Request Item found.",
        });
      }

      // Delete the row
      await trx("pr_items").where({ id }).del();

      await trx.commit();

      res.status(200).json({
        message: `PR Item Deleted successfully`,
        prItem, // Return the deleted row details
      });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

/* // Search PR Items
app.get(
  "/search-pr-items",
  authenticateToken,
  authorizePermission("view_pr_items"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const data = await db("pr_items")
        .select("*")
        .where("id", "like", `%${search}%`);

      res.status(200).json({
        message: `Search successful`,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read PR Items
app.get(
  "/view-pr-items",
  authenticateToken,
  authorizePermission("view_pr_items"),
  async (req, res) => {
    try {
      const data = await db("pr_items").select("*");
      res.status(200).json({
        message: `PR Items Viewed successfully`,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create PR Items
app.post(
  "/create-pr-item",
  authenticateToken,
  authorizePermission("create_pr_items"),
  async (req, res) => {
    try {
      const { pr_id, product_id, quantity, unit_price, total_price } = req.body;

      const insertedData = await db.transaction(async (trx) => {
        const [newItem] = await trx("pr_items")
          .insert({ pr_id, product_id, quantity, unit_price, total_price })
          .returning("*");
        return newItem;
      });

      res.status(201).json({
        message: `PR Item Created successfully`,
        data: insertedData,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update PR Items
app.put(
  "/update-pr-item/:id",
  authenticateToken,
  authorizePermission("update_pr_items"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { pr_id, product_id, quantity, unit_price, total_price } = req.body;

      const updatedData = await db.transaction(async (trx) => {
        const [updatedItem] = await trx("pr_items")
          .where({ id })
          .update({ pr_id, product_id, quantity, unit_price, total_price })
          .returning("*");
        return updatedItem;
      });

      res.status(200).json({
        message: `PR Item Updated successfully`,
        data: updatedData,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete PR Items
app.delete(
  "/delete-pr-item/:id",
  authenticateToken,
  authorizePermission("delete_pr_items"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const deletedData = await db.transaction(async (trx) => {
        const [deletedItem] = await trx("pr_items")
          .where({ id })
          .del()
          .returning("*");
        return deletedItem;
      });

      res.status(200).json({
        message: `PR Item Deleted successfully`,
        data: deletedData,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
); */

/* // Search PR Items
app.get(
  "/search-pr-items",
  authenticateToken,
  authorizePermission("view_pr_items"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("pr_items")
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

// Read PR Items
app.get(
  "/view-pr-items",
  authenticateToken,
  authorizePermission("view_pr_items"),
  async (req, res) => {
    try {
      data = await db("pr_items").select("*");
      res.status(201).json({
        message: `PR Items Viewed successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create PR Items
app.post(
  "/create-pr-item",
  authenticateToken,
  authorizePermission("create_pr_items"),
  async (req, res) => {
    try {
      const { pr_id, product_id, quantity, unit_price, total_price } = req.body;

      await db("pr_items").insert({
        pr_id,
        product_id,
        quantity,
        unit_price,
        total_price,
      });

      res.status(201).json({
        message: `PR Item Created successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update PR Items
app.put(
  "/update-pr-item/:id",
  authenticateToken,
  authorizePermission("update_pr_items"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { pr_id, product_id, quantity, unit_price, total_price } = req.body;

      await db("pr_items").where({ id }).update({
        pr_id,
        product_id,
        quantity,
        unit_price,
        total_price,
      });

      res.status(201).json({
        message: `PR Item Updated successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete PR Items
app.delete(
  "/delete-pr-item/:id",
  authenticateToken,
  authorizePermission("delete_pr_items"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db("pr_items").where({ id }).del();

      res.status(201).json({
        message: `PR Item Deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
); */

module.exports = app;
