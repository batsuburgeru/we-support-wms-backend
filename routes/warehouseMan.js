const express = require("express");
const db = require("../db/db.js");
const { authenticateToken, authorizePermission } = require("../middleware/authentication.js");

const app = express.Router();
app.use(express.json());

const warehousePermissions = {
    "products": "view_products",
    "categories": "view_categories",
    "delivery_notes": "view_delivery_notes",
    "stock_transactions": "view_stock_transactions",  
    "goods_receipts": "view_goods_receipts",
    "goods_issue": "view_goods_issue"
};

//warehouseman routes
app.get(
    "/view/:table",
    authenticateToken, 
    (req, res, next) => {
        const { table } = req.params;

        if (req.user.role !== "WarehouseMan") {
            return res.status(403).json({ error: "Access denied. Only WarehouseMan can access this." });
        }

        if (!warehousePermissions[table]) {
            return res.status(403).json({ error: "Access denied. Invalid resource." });
        }

        // Use authorizePermission as middleware
        authorizePermission(warehousePermissions[table])(req, res, next);
    },
    async (req, res) => {
        try {
            const { table } = req.params;

            // Fetch data
            const data = await db(table).select("*");
            res.status(200).json({
                message: `${table.charAt(0).toUpperCase() + table.slice(1)} viewed successfully.`,
                data
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

module.exports = app;
