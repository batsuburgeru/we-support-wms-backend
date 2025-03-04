const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Read PR Items
app.get(
  "/view-pr-items",
  authenticateToken,
  authorizePermission("view_pr_items"),
  async (req, res) => {
    try {
      const data = await db("pr_items").select("*");
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
      const { id, pr_id, product_id, quantity, unit_rice, total_price } =
        req.body;

      const data = await db("pr_items").insert({
        id,
        pr_id,
        product_id,
        quantity,
        unit_rice,
        total_price,
      });

      res.status(201).json({
        message: `PR Item Created successfully`,
        data: data,
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
      const { pr_id, product_id, quantity, unit_rice, total_price } = req.body;

      const data = await db("pr_items").where({ id }).update({
        pr_id,
        product_id,
        quantity,
        unit_rice,
        total_price,
      });

      res.status(201).json({
        message: `PR Item Updated successfully`,
        data: data,
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

      const data = await db("pr_items").where({ id }).del();

      res.status(201).json({
        message: `PR Item Deleted successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
