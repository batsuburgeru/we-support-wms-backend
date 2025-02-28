const express = require("express");
const bodyParser = require("body-parser");

const categories = require("./routes/categories.js");
const deliveryNotes = require("./routes/deliveryNotes.js");
const prItems = require("./routes/prItems.js");
const products = require("./routes/products.js");
const purchaseRequests = require("./routes/purchaseRequests.js");
const sapSyncLogs = require("./routes/sapSyncLogs.js");
const stockTransactions = require("./routes/stockTransactions.js");
const users = require("./routes/users.js");

const app = express();

app.use(express.json());
app.use(bodyParser.json());

app.use("/categories", categories);
app.use("/deliveryNotes", deliveryNotes);
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
