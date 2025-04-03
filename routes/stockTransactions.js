const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Create Stock Transactions using transaction
app.post(
  "/create-stock-transaction",
  authenticateToken,
  authorizePermission("create_stock_transactions"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const id = uuidv4();
      const { product_id, transaction_type, quantity, performed_by } = req.body;

      await trx("stock_transactions").insert({
        id,
        product_id,
        transaction_type,
        quantity,
        performed_by,
      });

      // Retrieve the inserted stock transaction
      const stockTransaction = await trx("stock_transactions")
        .select("*")
        .where("id", id);
      await trx.commit();
      res
        .status(201)
        .json({
          message: "Stock Transaction Created successfully",
          stockTransaction,
        });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Filter Stock Transactions using Transaction Type
app.get(
  "/filter-stock-transactions",
  authenticateToken,
  authorizePermission("view_stock_transactions"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const stockTransactions = await db("stock_transactions")
        .select("*")
        .where("transaction_type", "like", `%${search}%`);

      if (!stockTransactions || stockTransactions.length === 0) {
        return res.status(200).json({
          message: "No matching Stock Transaction found.",
        });
      }

      res.status(200).json({
        message: "Stock Transactions filtered successfully",
        stockTransactions,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Stock Transactions
app.get(
  "/search-stock-transactions",
  authenticateToken,
  authorizePermission("view_stock_transactions"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const stockTransaction = await db("stock_transactions")
        .select("*")
        .where("id", "like", `%${search}%`);

      if (!stockTransaction || stockTransaction.length === 0) {
        return res.status(200).json({
          message: "No matching Stock Transaction found.",
        });
      }

      res.status(200).json({
        message: "Search successful",
        stockTransaction,
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
      const stockTransactions = await db("stock_transactions").select("*");

      if (!stockTransactions || stockTransactions.length === 0) {
        return res.status(200).json({
          message: "No matching Stock Transaction found.",
        });
      }

      res.status(200).json({
        message: "Stock Transactions viewed successfully",
        stockTransactions,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Stock Transactions using transaction
app.put(
  "/update-stock-transaction/:id",
  authenticateToken,
  authorizePermission("update_stock_transactions"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { product_id, transaction_type, quantity, performed_by } = req.body;

      const updatedRows = await trx("stock_transactions")
        .where({ id })
        .update({ product_id, transaction_type, quantity, performed_by });

      if (!updatedRows || updatedRows.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching Stock Transaction found.",
        });
      }

      // Retrieve the inserted stock transaction
      const updatedTransaction = await trx("stock_transactions")
        .select("*")
        .where("id", id);

      res
        .status(200)
        .json({
          message: "Stock Transaction Updated successfully",
          updatedTransaction,
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Stock Transactions using transaction
app.delete(
  "/delete-stock-transaction/:id",
  authenticateToken,
  authorizePermission("delete_stock_transactions"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;

      stockTransaction = await trx("stock_transactions").where({ id }).first();

      if (!stockTransaction || stockTransaction.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching Stock Transaction found.",
        });
      }

      await trx("stock_transactions").where({ id }).del();
      await trx.commit();
      res
        .status(200)
        .json({
          message: "Stock Transaction Deleted successfully",
          stockTransaction,
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/* // Filter Stock Transactions using Transaction Type
app.get(
  "/filter-stock-transactions",
  authenticateToken,
  authorizePermission("view_stock_transactions"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("stock_transactions")
        .select("*")
        .where("transaction_type", "like", `%${search}%`);

      res.status(201).json({
        message: "Stock Transactions filtered successfully",
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

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
); */

module.exports = app;
