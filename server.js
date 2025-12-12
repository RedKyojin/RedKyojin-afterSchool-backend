// Imports
const express = require("express");
const app = express();
const PORT = 3000;

// Logs requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Data
const lessons = [
  { id: 1, subject: "Maths", location: "M5", price: 20, space: 9 },
  { id: 2, subject: "Science", location: "S2", price: 20, space: 12 },
  { id: 3, subject: "Chess", location: "R6", price: 25, space: 13 },
  { id: 4, subject: "Dodgeball", location: "GYM", price: 35, space: 3 },
];

// Route
app.get("/", (req, res) => {
  res.send("Hello");
});

// Returns lessons as JSON
app.get("/lessons", (req, res) => {
  res.json(lessons);
});



// Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
