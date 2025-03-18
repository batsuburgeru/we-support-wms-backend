const express = require("express");
const uuidv4 = require("uuid").v4;

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Create Goods Issue with Transaction
app.post(
  "/create-goods-issue",
  authenticateToken,
  authorizePermission("create_goods_issue"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const id = uuidv4();
      const { product_id, issued_to, issued_by } = req.body;

      await trx("goods_issue").insert({ id, product_id, issued_to, issued_by });

      const goodsIssue = await trx("goods_issue").where({ id }).first();

      await trx.commit();
      res
        .status(201)
        .json({ message: `Goods Issue Created successfully`, goodsIssue });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Search Goods Issue
app.get(
  "/search-goods-issue",
  authenticateToken,
  authorizePermission("view_goods_issue"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { search } = req.query;
      const goodsIssue = await trx("goods_issue")
        .select("*")
        .where("id", "like", `%${search}%`);

        if (!goodsIssue) {
          throw new Error("Goods Issue not found.");
        }

      await trx.commit();

      res.status(200).json({ message: "Search successful", goodsIssue });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Goods Issue
app.get(
  "/view-goods-issue",
  authenticateToken,
  authorizePermission("view_goods_issue"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const goodsIssue = await trx("goods_issue").select("*");

      if (categories.length === 0) {
        throw new Error("No Goods Issues found.");
      }

      await trx.commit();

      res.status(200).json({ 
        message: "Goods Issue Viewed successfully", goodsIssue });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Goods Issue with Transaction
app.put(
  "/update-goods-issue/:id",
  authenticateToken,
  authorizePermission("update_goods_issue"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { product_id, issued_to, issued_by } = req.body;

      updatedRows = await trx("goods_issue")
        .where({ id })
        .update({ product_id, issued_to, issued_by });

        if (!updatedRows) {
          await trx.rollback();
          return res.status(404).json({ error: "Category not found." });
        }
        
      const updatedIssue = await trx("goods_issue").where({ id }).first();

      await trx.commit();
      res
        .status(200)
        .json({
          message: `Goods Issue Updated successfully`,
          updatedIssue,
        });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Goods Issue with Transaction
app.delete(
  "/delete-goods-issue/:id",
  authenticateToken,
  authorizePermission("delete_goods_issue"),
  async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;

      const goodsIssue = await trx("goods_issue").where({ id }).first();

      if (!goodsIssue) {
        return res.status(404).json({ error: "Goods Issue not found" });
      }

      await trx("goods_issue").where({ id }).del();

      await trx.commit();
      res
        .status(200)
        .json({
          message: `Goods Issue Deleted successfully`,
          goodsIssue,
        });
    } catch (error) {
      await trx.rollback();
      res.status(500).json({ error: error.message });
    }
  }
);

/* // Search Goods Issue
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
); */

module.exports = app;
