const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

const categories = require("./routes/categories.js");
const deliveryNotes = require("./routes/deliveryNotes.js");
const goodsIssues = require("./routes/goodsIssues.js");
const goodsReceipts = require("./routes/goodsReceipts.js");
const notifications = require("./routes/notifications.js");
const prItems = require("./routes/prItems.js");
const products = require("./routes/products.js");
const purchaseRequests = require("./routes/purchaseRequest.js");
const sapSyncLogs = require("./routes/sapSyncLogs.js");
const stockTransactions = require("./routes/stockTransactions.js");
const users = require("./routes/users.js");

const app = express();
dotenv.config();

app.use(cors({
  origin: "http://localhost:3000", // Change this to your frontend URL
  credentials: true // Allows cookies to be sent from frontend
}));

app.use(express.json());
app.use(bodyParser.json());

app.use(express.json());
app.use(cookieParser()); 

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/categories", categories);
app.use("/deliveryNotes", deliveryNotes);
app.use("/goodsIssues", goodsIssues);
app.use("/goodsReceipts", goodsReceipts);
app.use("/notifications", notifications);
app.use("/prItems", prItems);
app.use("/products", products);
app.use("/purchaseRequests", purchaseRequests);
app.use("/sapSyncLogs", sapSyncLogs);
app.use("/stockTransactions", stockTransactions);
app.use("/users", users);

app.get("/", (req, res) => res.send("API Running"));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
