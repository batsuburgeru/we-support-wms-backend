const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Create Goods Receipt with Transaction
app.post(
  "/create-goods-receipt",
  authenticateToken,
  authorizePermission("create_goods_receipts"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      id = uuidv4();
      const { pr_id, received_by, status } = req.body;

      await trx("goods_receipts").insert({ pr_id, received_by, status });

      const newReceipt = await trx("goods_receipts").where({ id }).first();

      await trx.commit();
      res
        .status(201)
        .json({ message: `Goods Receipt Created successfully`, newReceipt });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Filter Goods Receipts using Status
app.get(
  "/filter-goods-receipts",
  authenticateToken,
  authorizePermission("view_goods_receipts"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const goodsReceipts = await db("goods_receipts")
        .select("*")
        .where("status", "like", `%${search}%`);

      if (!goodsReceipts || goodsReceipts.length === 0) {
        return res.status(200).json({
          message: "No matching Goods Receipt found.",
        });
      }

      res
        .status(200)
        .json({
          message: `Goods Receipts filtered successfully`,
          goodsReceipts,
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Goods Receipts
app.get(
  "/search-goods-receipt",
  authenticateToken,
  authorizePermission("view_goods_receipts"),
  async (req, res) => {
    try {
      const { search } = req.query;
      const goodsReceipts = await db("goods_receipts")
        .select("*")
        .where("id", "like", `%${search}%`);
      if (!goodsReceipts || goodsReceipts.length === 0) {
        return res.status(200).json({
          message: "No matching Goods Receipt found.",
        });
      }
      res.status(200).json({ message: `Search successful`, goodsReceipts });
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
      const goodsReceipts = await db("goods_receipts").select("*");
      if (!goodsReceipts || goodsReceipts.length === 0) {
        return res.status(200).json({
          message: "No matching Goods Receipt found.",
        });
      }
      res
        .status(200)
        .json({ message: `Goods Receipts Viewed successfully`, goodsReceipts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Goods Receipt with Transaction
app.put(
  "/update-goods-receipt/:id",
  authenticateToken,
  authorizePermission("update_goods_receipts"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { pr_id, received_by, status } = req.body;

      const updatedRows = await trx("goods_receipts")
        .where({ id })
        .update({ pr_id, received_by, status });

      if (!updatedRows || updatedRows.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching Goods Receipt found.",
        });
      }
      const updatedReceipt = await trx("goods_receipts").where({ id }).first();
      await trx.commit();
      res
        .status(200)
        .json({
          message: `Goods Receipt Updated successfully`,
          updatedReceipt,
        });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Goods Receipt Status
app.put(
  "/update-goods-receipt-status/:id",
  authenticateToken,
  authorizePermission("update_goods_receipts"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedRows = await trx("goods_receipts")
        .where({ id })
        .update({ status });

      if (!updatedRows || updatedRows.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching Goods Receipt found.",
        });
      }

      const updatedNote = await trx("goods_receipts").where({ id }).first();
      await trx.commit();
      res
        .status(200)
        .json({ message: `Goods Receipt Updated successfully`, updatedNote });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Goods Receipt with Transaction
app.delete(
  "/delete-goods-receipt/:id",
  authenticateToken,
  authorizePermission("delete_goods_receipts"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const goodsReceipt = await trx("goods_receipts").where({ id }).first();

      if (!goodsReceipt || goodsReceipt.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching Goods Receipt found.",
        });
      }
      await trx("goods_receipts").where({ id }).del();
      await trx.commit();
      res
        .status(200)
        .json({
          message: `Goods Receipt Deleted successfully`,
          deletedReceipt,
        });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

/* // Filter Goods Receipts using Status
app.get(
  "/filter-goods-receipts",
  authenticateToken,
  authorizePermission("view_goods_receipts"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("goods_receipts").select("*").where("status", "like", `%${search}%`);

      res.status(201).json({
        message: `Goods Receipts filtered successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Goods Receipts
app.get(
  "/search-goods-receipt",
  authenticateToken,
  authorizePermission("view_goods_receipts"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("goods_receipts")
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

// Read Goods Receipts
app.get(
  "/view-goods-receipts",
  authenticateToken,
  authorizePermission("view_goods_receipts"),
  async (req, res) => {
    try {
      data = await db("goods_receipts").select("*");
      res.status(201).json({
        message: `Goods Receipts Viewed successfully`,
        data: data,
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
      const { pr_id, received_by, status } = req.body;

      await db("goods_receipts").insert({
        pr_id,
        received_by,
        status,
      });

      res.status(201).json({
        message: `Goods Receipt Created successfully`,
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
      const { id, pr_id, received_by, status } = req.body;

      await db("goods_receipts").where({ id: req.params.id }).update({
        id,
        pr_id,
        received_by,
        status,
      });

      res.status(201).json({
        message: `Goods Receipt Updated successfully`,
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

      await db("goods_receipts").where({ id }).del();

      res.status(201).json({
        message: `Goods Receipt Deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
); */

module.exports = app;
