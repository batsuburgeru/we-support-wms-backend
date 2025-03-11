const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Search Products
app.get(
  "/search-products",
  authenticateToken,
  authorizePermission("view_products"),
  async (req, res) => {
    try {
      const { search } = req.query;

      data = await db("products")
        .select("*")
        .where("name", "like", `%${search}%`);

      res.status(201).json({
        message: "Search successful",
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Products
app.get(
  "/view-products",
  authenticateToken,
  authorizePermission("view_products"),
  async (req, res) => {
    try {
      data = await db("products").select("*");
      res.status(201).json({
        message: "Products viewed successfully",
        data: data,
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
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      } = req.body;

      await db("products").insert({
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      });

      res.status(201).json({
        message: "Product created successfully",
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

      await db("products").where({ id }).update({
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      });

      res.status(201).json({
        message: "Product updated successfully",
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
        message: "Product deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
