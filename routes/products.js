const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const DEFAULT_IMAGE = "/assets/products/default.jpg";

const app = express.Router();
app.use(express.json());

const db = require("../db/db.js");

const {
  authenticateToken,
  authorizePermission,
} = require("../middleware/authentication.js");
const uploadImage = require("../middleware/uploadImage.js");

app.post(
  "/create-product",
  authenticateToken,
  authorizePermission("create_products"),
  uploadImage("products"), // Use the custom middleware for image upload
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction

    try {
      const {
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
      } = req.body;
      let image = req.file;
      const id = uuidv4(); // Generate UUID manually

      // Determine profile picture path
      if (req.file) {
        image = `/assets/products/${req.file.filename}`; // Save only relative path in DB
      } else if (!image) {
        image = DEFAULT_IMAGE; // No file uploaded, and no path provided
      }

      await trx("products").insert({
        id,
        name,
        sku,
        description,
        category_id,
        stock_quantity,
        unit_price,
        img_url: image,
      });

      const product = await trx("products").where({ id }).first();

      await trx.commit(); // Commit transaction

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      await trx.rollback(); // Rollback on error
       // 🔥 Corrected file deletion path (pointing to root `/assets` folder)
       if (req.file) {
        const filePath = path.join(
          __dirname,
          "..",
          "assets",
          "products",
          req.file.filename
        );
        fs.unlink(filePath, (err) => {
          if (err) console.error("Failed to delete file:", err);
        });
      }
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
    try {
      const { search } = req.query;

      const product = await db("products")
        .select("*")
        .where("name", "like", `%${search}%`);

      if (!product || product.length === 0) {
        return res.status(200).json({
          message: "No matching Product found.",
        });
      }

      res.status(200).json({
        message: "Search successful",
        product,
      });
    } catch (error) {
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
    try {
      const products = await db("products").select("*");

      if (!products || products.length === 0) {
        return res.status(200).json({
          message: "No matching Product found.",
        });
      }

      res.status(200).json({
        message: "Products viewed successfully",
        products,
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
  uploadImage("products"), // Use the custom middleware for image upload
  async (req, res) => {
    const trx = await db.transaction(); // Start transaction
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
      let image = DEFAULT_IMAGE;

      // Fetch current product data
      const product = await trx("products").where({ id }).first();
      if (!product) {
        throw new Error("No matching Product found");
      }

      // Handle image upload and deletion
            if (req.file) {
              if (product.img_url && product.img_url !== DEFAULT_IMAGE) {
                const oldImagePath = path.join(__dirname, "..", product.img_url);
                fs.unlink(oldImagePath, (err) => {
                  if (err) {
                    console.error("Failed to delete old image:", err.message);
                  }
                });
              }
              image = `/assets/products/${req.file.filename}`;
            } else if (!image || image.trim() === "") {
              image = product.img_url || DEFAULT_IMAGE;
            }

      // Prepare updated data (fall back to current values if missing or empty)
      const updatedData = {
        name: name?.trim() !== "" ? name : product.name,
        sku: sku?.trim() !== "" ? sku : product.sku,
        description: description?.trim() !== "" ? description : product.description,
        category_id: category_id?.trim() !== "" ? category_id : product.category_id,
        stock_quantity: stock_quantity?.trim() !== "" ? stock_quantity : product.stock_quantity,
        unit_price: unit_price?.trim() !== "" ? unit_price : product.unit_price,
        img_url: image,
      };

      // Update products table
      const updatedRows = await trx("products").where("id", id).update(updatedData);
      if (!updatedRows) {
        throw new Error("No matching Product found");
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
      // 🔥 Corrected file deletion path (pointing to root `/assets` folder)
      if (req.file) {
        const filePath = path.join(
          __dirname,
          "..",
          "assets",
          "products",
          req.file.filename
        );
        fs.unlink(filePath, (err) => {
          if (err) console.error("Failed to delete file:", err);
        });
      }
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

      // Check if user exists
      const product = await trx("products").where({ id }).first();
      if (!product) {
        throw new Error("No matching Product found");
      }
      // Check if product has an image and delete it from the folder
            if (product.img_url && product.img_url !== DEFAULT_IMAGE) {
              const imagePath = path.join(__dirname, "..", product.img_url);
              fs.unlink(imagePath, (err) => {
                if (err) {
                  console.error("Failed to delete user image:", err.message);
                } else {
                  console.log("User image deleted successfully.");
                }
              });
            }
            
      // Delete the product
      await trx("products").where({ id }).del();

      await trx.commit(); // Commit transaction

      res.status(200).json({
        message: "Product deleted successfully",
        product,
      });
    } catch (error) {
      await trx.rollback(); // Rollback on error
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = app;
