const express = require("express");
const app = express();
const PORT = 3000;

// Logs requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Test route
app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
