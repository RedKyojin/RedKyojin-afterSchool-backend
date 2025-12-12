// Imports
const express = require("express");
const app = express();
const PORT = 3000;

// Middlewere
// Logs requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Allow server to read JSON request bodies
app.use(express.json());

// Data
const lessons = [
  { id: 1, subject: "Maths", location: "M5", price: 20, space: 9 },
  { id: 2, subject: "Science", location: "S2", price: 20, space: 12 },
  { id: 3, subject: "Chess", location: "R6", price: 25, space: 13 },
  { id: 4, subject: "Dodgeball", location: "GYM", price: 35, space: 3 },
];
const orders = []; //Temporary array to hold JSON Post from postman.


// Route
app.get("/", (req, res) => {
  res.send("Hello");
});

// Returns lessons as JSON
app.get("/lessons", (req, res) => {
  res.json(lessons);
});


// Save a new order
app.post("/orders", (req, res) => {
  const { name, phone, lessonIDs } = req.body;

  if (!name || !phone || !lessonIDs || !Array.isArray(lessonIDs)) {
    return res.status(400).json({ message: "Invalid order data" });
  }

  const newOrder = {
    id: orders.length + 1,
    name,
    phone,
    lessonIDs
  };

  orders.push(newOrder); //Sends Post to Array.

  res.status(201).json({
    message: "Order saved", //Express sends to postman.
    order: newOrder
  });
});




// Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
