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

      data = await db("pr_items").select("*").where("id", "like", `%${search}%`);

      res.status(201).json({
        message: `Search successful`, data
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
        message: `PR Items Viewed successfully`, data
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
);

module.exports = app;
