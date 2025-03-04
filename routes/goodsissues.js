const express = require("express");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Read goods_issue
app.get(
  "/view-goods-issue",
  authenticateToken,
  authorizePermission("view_goods_issue"),
  async (req, res) => {
    try {
      const data = await db("goods_issue").select("*");
      res.status(201).json({
        message: `Goods Issue Viewed successfully`,
        data,
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
      const { id, product_id, issued_to, issued_by, issued_at } = req.body;

      const data = await db("goods_issue").insert({
        id,
        product_id,
        issued_to,
        issued_by,
        issued_at
      });

      res.status(201).json({
        message: `Goods Issue Created successfully`,
        data: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
// Update goods_issue
app.put(
  "/update-goods-issue/:id",
  authenticateToken,
  authorizePermission("update_goods_issue"),
  async (req, res) => {
    try {
      const { id, product_id, issued_to, issued_by, issued_at } = req.body;

      const data = await db("goods_issue")
        .where({ id: id })
        .update({
          product_id,
          issued_to,
          issued_by,
          issued_at
        });

      res.status(201).json({
        message: `Goods Issue Updated successfully`,
        data: data
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

      const data = await db("goods_issue").where({ id }).del();

      res.status(201).json({
        message: `Goods Issue Deleted successfully`,
        data: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;

