const express = require("express");
const bodyParser = require('body-parser');
const users = require('./routes/users.js');
const warehousemanRoutes = require('./routes/warehouseMan.js');

const app = express();

app.use(express.json());
app.use(bodyParser.json());

app.use('/users', users);
app.use("/warehouseman", warehousemanRoutes); 

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
