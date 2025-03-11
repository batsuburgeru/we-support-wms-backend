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

      data = await db("categories")
        .select("*")
        .where("name", "like", `%${search}%`);

      res.status(201).json({
        message: `Categories Searched successfully`,
        data: data,
      });
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
      data = await db("categories").select("*");
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

      await db("categories").insert({
        id,
        name,
        description,
      });

      res.status(201).json({
        message: `Category Created successfully`,
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

      await db("categories").where({ id }).update({ name, description });

      res.status(201).json({
        message: `Category Updated successfully`,
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

      await db("categories").where({ id }).del();

      res.status(201).json({
        message: `Category Deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
