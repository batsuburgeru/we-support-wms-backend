const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Search Goods Receipts
app.get(
  "/search-goods-receipt",
  authenticateToken,
  authorizePermission("view_goods_receipts"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const data = await db("goods_receipts")
        .select("*")
        .where("id", "like", `%${search}%`);

      res.status(201).json({
        message: `Goods Receipts searched successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Goods Receipts
app.get(
  "/view-goods-receipts",
  authenticateToken,
  authorizePermission("view_goods_receipts"),
  async (req, res) => {
    try {
      const data = await db("goods_receipts").select("*");
      res.status(201).json({
        message: `Goods Receipts Viewed successfully`,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create Goods Receipts
app.post(
  "/create-goods-receipt",
  authenticateToken,
  authorizePermission("create_goods_receipts"),
  async (req, res) => {
    try {
      const {
        id,
        pr_id,
        received_by,
        status
      } = req.body;

      const data = await db("goods_receipts").insert({
        id,
        pr_id,
        received_by,
        status
      });

      res.status(201).json({
        message: `Goods Receipt Created successfully`,
        data: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Goods Receipts
app.put(
  "/update-goods-receipt/:id",
  authenticateToken,
  authorizePermission("update_goods_receipt"),
  async (req, res) => {
    try {
      const {
        id,
        pr_id,
        received_by,
        status
      } = req.body;

      const data = await db("goods_receipts")
        .where({ id: req.params.id })
        .update({
            id,
            pr_id,
            received_by,
            status
        });

      res.status(201).json({
        message: `Goods Receipt Updated successfully`,
        data: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Goods Receipts
app.delete(
  "/delete-goods-receipt/:id",
  authenticateToken,
  authorizePermission("delete_goods_receipt"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const data = await db("goods_receipts").where({ id }).del();

      res.status(201).json({
        message: `Goods Receipt Deleted successfully`,
        data: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;