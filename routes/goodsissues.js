const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Search Goods Issue
app.get(
  "/search-goods-issue",
  authenticateToken,
  authorizePermission("view_goods_issue"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("goods_issue")
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

// Read goods_issue
app.get(
  "/view-goods-issue",
  authenticateToken,
  authorizePermission("view_goods_issue"),
  async (req, res) => {
    try {
      data = await db("goods_issue").select("*");
      res.status(201).json({
        message: `Goods Issue Viewed successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create goods_issue
app.post(
  "/create-goods-issue",
  authenticateToken,
  authorizePermission("create_goods_issue"),
  async (req, res) => {
    try {
      const { product_id, issued_to, issued_by } = req.body;

      await db("goods_issue").insert({
        product_id,
        issued_to,
        issued_by,
      });

      res.status(201).json({
        message: `Goods Issue Created successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
// Update goods_issue
app.put(
  "/update-goods-issue/:id",
  authenticateToken,
  authorizePermission("update_goods_issue"),
  async (req, res) => {
    try {
      const { id, product_id, issued_to, issued_by } = req.body;

      await db("goods_issue").where({ id: id }).update({
        product_id,
        issued_to,
        issued_by,
      });

      res.status(201).json({
        message: `Goods Issue Updated successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
// Delete goods_issue
app.delete(
  "/delete-goods-issue/:id",
  authenticateToken,
  authorizePermission("delete_goods_issue"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db("goods_issue").where({ id }).del();

      res.status(201).json({
        message: `Goods Issue Deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
