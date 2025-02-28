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

// Read Products
app.get(
  "/view-products",
  authenticateToken,
  authorizePermission("view_products"),
  async (req, res) => {
    try {
      const data = await db("products").select("*");
      res.status(201).json({
        message: `Products Viewed successfully`,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create Products
app.post(
  "/create-product",
  authenticateToken,
  authorizePermission("create_products"),
  async (req, res) => {
    try {
      const {
        id,
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      } = req.body;

      const data = await db("products").insert({
        id,
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      });

      res.status(201).json({
        message: `Product ${name} created successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Products
app.put(
  "/update-product/:id",
  authenticateToken,
  authorizePermission("update_products"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      } = req.body;

      const data = await db("products").where({ id }).update({
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      });

      res.status(201).json({
        message: `Product ${name} updated successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Products
app.delete(
  "/delete-product/:id",
  authenticateToken,
  authorizePermission("delete_products"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await db("products").where({ id }).del();

      res.status(201).json({
        message: `Product deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
