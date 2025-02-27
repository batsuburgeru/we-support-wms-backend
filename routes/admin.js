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

app.get(
    "/view/:table",
    authenticateToken,
    authorizePermission(
      "view_products",
      "view_categories",
      "view_purchase_requests",
      "view_pr_items",
      "view_stock_transactions",
      "view_goods_receipts",
      "view_goods_issue",
      "view_delivery_notes",
      "view_notifications"
    ),
    async (req, res) => {
      const { table } = req.params;
  
      try {
        const data = await db(table).select("*");
  
        res
          .status(201)
          .json({
            message: `${
              table.charAt(0).toUpperCase() + table.slice(1)
            } Viewed successfully`,
            data,
          });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );



