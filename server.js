// Imports
require("dotenv").config();
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = 3000;

//-----------------------------------------Middleware----------------------------------------
// Logs requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Allow server to read JSON request bodies
app.use(express.json());

//-----------------------------------------MongoDB----------------------------------------
const client = new MongoClient(process.env.MONGO_URI);


async function connectDB() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || "afterSchool");
    console.log("Connected to MongoDB Atlas (connection test only)");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}
//-----------------------------------------Routes----------------------------------------
app.get("/", (req, res) => {
  res.send("Hello");
});

// Returns lessons from MongoDB as JSON
app.get("/lessons", async (req, res) => {
  try {
    const lessons = await lessonsCollection.find({}).toArray();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
});

// Save a new order into MongoDB
app.post("/orders", async (req, res) => {
  try {
    const { name, phone, lessonIDs } = req.body || {};

    // Basic validation
    if (!name || !phone || !Array.isArray(lessonIDs) || lessonIDs.length === 0) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const newOrder = {
      name,
      phone,
      lessonIDs,
      createdAt: new Date()
    };

    const result = await ordersCollection.insertOne(newOrder);

    res.status(201).json({
      message: "Order saved",
      order: { _id: result.insertedId, ...newOrder }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to save order" });
  }
});

// Update any attribute of a lesson by ID
// Supports either numeric "id" (your frontend style) OR MongoDB "_id"
app.put("/lessons/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    const updates = req.body || {};

    if ("id" in updates || "_id" in updates) {
      return res.status(400).json({ message: "Cannot update lesson id" });
    }

    // Build a filter that works whether you pass numeric id or Mongo ObjectId
    const filter = {};
    const numericId = Number(idParam);

    if (!Number.isNaN(numericId) && String(numericId) === idParam) {
      filter.id = numericId; // match documents that have { id: 1, 2, 3... }
    } else if (ObjectId.isValid(idParam)) {
      filter._id = new ObjectId(idParam); // match documents by Mongo _id
    } else {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const result = await lessonsCollection.findOneAndUpdate(
      filter,
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.json({
      message: "Lesson updated",
      lesson: result.value
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update lesson" });
  }
});

//-----------------------------------------Server----------------------------------------
connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
