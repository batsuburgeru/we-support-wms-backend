const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Search Stock Transactions
app.get(
  "/search-stock-transactions",
  authenticateToken,
  authorizePermission("view_stock_transactions"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("stock_transactions")
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

// Read Stock Transactions
app.get(
  "/view-stock-transactions",
  authenticateToken,
  authorizePermission("view_stock_transactions"),
  async (req, res) => {
    try {
      data = await db("stock_transactions").select("*");
      res.status(201).json({
        message: "Stock Transactions Viewed successfully",
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create Stock Transactions
app.post(
  "/create-stock-transaction",
  authenticateToken,
  authorizePermission("create_stock_transactions"),
  async (req, res) => {
    try {
      const { product_id, transaction_type, quantity, performed_by } = req.body;

      await db("stock_transactions").insert({
        product_id,
        transaction_type,
        quantity,
        performed_by,
      });

      res.status(201).json({
        message: "Stock Transaction Created successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Stock Transactions
app.put(
  "/update-stock-transaction/:id",
  authenticateToken,
  authorizePermission("update_stock_transactions"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { product_id, transaction_type, quantity, performed_by } = req.body;

      await db("stock_transactions").where({ id }).update({
        product_id,
        transaction_type,
        quantity,
        performed_by,
      });

      res.status(201).json({
        message: "Stock Transaction Updated successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Stock Transactions
app.delete(
  "/delete-stock-transaction/:id",
  authenticateToken,
  authorizePermission("delete_stock_transactions"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db("stock_transactions").where({ id }).del();

      res.status(201).json({
        message: `Stock Transaction Deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
