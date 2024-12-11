const mongoose = require("mongoose");
const URI = process.env.DATABASE;

mongoose
  .connect(URI, {
    useUnifiedTopology: true,
    UseNewUrlParser: true,
  })
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("error connecting to Databse", err));
