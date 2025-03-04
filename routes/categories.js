const express = require("express");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");


// Search Category
app.get(
  "/search-category",
  authenticateToken,
  authorizePermission("view_categories"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const categories = await db("categories")
        .select("*")
        .where("name", "like", `%${search}%`);

      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Categories
app.get(
  "/view-categories",
  authenticateToken,
  authorizePermission("view_categories"),
  async (req, res) => {
    try {
      const data = await db("categories").select("*");
      res.status(201).json({
        message: `Categories Viewed successfully`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create Categories
app.post(
  "/create-category",
  authenticateToken,
  authorizePermission("create_categories"),
  async (req, res) => {
    try {
      const { id, name, description } = req.body;

      const data = await db("categories").insert({
        id,
        name,
        description,
      });

      res.status(201).json({
        message: `Category Created successfully`,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update Categories
app.put(
  "/update-category/:id",
  authenticateToken,
  authorizePermission("update_categories"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const data = await db("categories")
        .where({ id })
        .update({ name, description });

      res.status(201).json({
        message: `Category Updated successfully`,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete Categories
app.delete(
  "/delete-category/:id",
  authenticateToken,
  authorizePermission("delete_categories"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const data = await db("categories").where({ id }).del();

      res.status(201).json({
        message: `Category Deleted successfully`,
        data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
