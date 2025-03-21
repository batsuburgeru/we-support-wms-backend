const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");

// Create Categories
app.post(
  "/create-category",
  authenticateToken,
  authorizePermission("create_categories"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { name, description } = req.body;
      const id = uuidv4(); // Generate UUID manually

      await trx("categories").insert({
        id,
        name,
        description,
      });

      const category = await trx("categories").where({ id }).first();

      await trx.commit(); // Commit transaction

      res.status(201).json({
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      await trx.rollback(); // Rollback on error
      res.status(500).json({ error: error.message });
    }
  }
);

// Read All Categories
app.get(
  "/view-categories",
  authenticateToken,
  authorizePermission("view_categories"),
  async (req, res) => {
    try {
      const categories = await db("categories").select("*");

      if (!categories || categories.length === 0) {
        return res.status(200).json({
          message: "No matching Category found.",
        });
      }

      res.status(200).json({
        message: "Categories viewed successfully",
        categories,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Read Specific Category
app.get(
  "/search-category",
  authenticateToken,
  authorizePermission("view_categories"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const category = await db("categories")
        .select("*")
        .where("name", "like", `%${search}%`);

      if (!category || category.length === 0) {
        return res.status(200).json({
          message: "No matching Category found.",
        });
      }

      res.status(200).json({
        message: "Categories searched successfully",
        category,
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
  authorizePermission("updatet_categories"),
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Update the category
      const updatedRows = await trx("categories")
        .where({ id })
        .update({ name, description });

      if (!updatedRows || updatedRows.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching Category found.",
        });
      }

      // Retrieve the updated category
      const updatedCategory = await trx("categories").where({ id }).first();

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: "Category updated successfully",
        data: updatedCategory, // Send updated row as response
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
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
    const trx = await db.transaction(); // Start transaction

    try {
      const { id } = req.params;

      category = await trx("categories").where({ id }).first();
      if (!category || category.length === 0) {
        await trx.rollback();
        return res.status(200).json({
          message: "No matching Category found.",
        });
      }

      // Delete category
      await trx("categories").where({ id }).del();

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: "Category deleted successfully",
        category,
      });
    } catch (error) {
      await trx.rollback(); // Rollback transaction on error
      res.status(500).json({ error: error.message });
    }
  }
);

/* // Search Category
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
); */

module.exports = app;
