const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

app.post(
  "/create-product",
  authenticateToken,
  authorizePermission("create_products"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { name, sku, description, category_id, stock_quantity, unit_price } = req.body;
      const id = uuidv4(); // Generate UUID manually

      await trx("products").insert({
        id,
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      });

      await trx.commit(); // Commit transaction

      res.status(201).json({
        message: "Product created successfully",
        product: { id, name, sku, description, category_id, stock_quantity, unit_price },
      });
    } catch (error) {
      await trx.rollback(); // Rollback on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Specific Product
app.get(
  "/search-products",
  authenticateToken,
  authorizePermission("view_products"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { search } = req.query;

      const data = await trx("products")
        .select("*")
        .where("name", "like", `%${search}%`);

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: "Search successful",
        data,
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Read All Products
app.get(
  "/view-products",
  authenticateToken,
  authorizePermission("view_products"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const data = await trx("products").select("*");

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: "Products viewed successfully",
        data,
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Product with Transaction
app.put(
  "/update-product/:id",
  authenticateToken,
  authorizePermission("update_products"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction
    try {
      const { id } = req.params;
      const { name, sku, description, category_id, stock_quantity, unit_price } = req.body;

      // Update product
      const updatedRows = await trx("products").where({ id }).update({
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      });

      if (!updatedRows) {
        await trx.rollback();
        return res.status(404).json({ error: "Product not found." });
      }

      // Retrieve updated product
      const updatedProduct = await trx("products").where({ id }).first();

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: "Product updated successfully",
        data: updatedProduct, // Return updated row
      });
    } catch (error) {
      await trx.rollback(); // Rollback on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Product with Transaction
app.delete(
  "/delete-product/:id",
  authenticateToken,
  authorizePermission("delete_products"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction
    try {
      const { id } = req.params;

      // Delete the product
      await trx("products").where({ id }).del();

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: "Product deleted successfully"
      });
    } catch (error) {
      await trx.rollback(); // Rollback on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Product

/* // Search Products
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
); */

module.exports = app;
