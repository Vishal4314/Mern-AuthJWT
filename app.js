require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT;
require("./db/conn");
var cookieParser = require("cookie-parser");
const router = require("./routes/router");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(router);

app.get("/", (req, res) => {
  res.send("Reached Backend");
});

app.listen(port, () => {
  console.log(`Server Started at port: ${port}`);
});
