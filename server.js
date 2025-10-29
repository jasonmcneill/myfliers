const express = require("express");
const app = express();
const PORT = 3001;

// Example route
app.get("/", (req, res) => {
  res.send("Hello from myfliers.com!");
});

// Serve static files if you have a frontend build
// app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`myfliers.com app running on port ${PORT}`);
});
