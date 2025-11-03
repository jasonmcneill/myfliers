require("dotenv").config();

const express = require("express");
const app = express();
const PORT = 3001;
const bodyParser = require("body-parser");

app.use(express.static("."));
app.use("/api", require("./api/_index"));

app.listen(PORT, () => {
  console.log(`myfliers app running on port ${PORT}`);
});
