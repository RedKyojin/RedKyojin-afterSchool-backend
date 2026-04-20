// Imports
// require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------------- Middleware ----------------------------------------
app.use(cors());

// Logs requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Allow server to read JSON request bodies
app.use(express.json());

// ----------------------------------------- MongoDB ----------------------------------------
const client = new MongoClient(process.env.MONGODB_URI);

let lessonsCollection;
let ordersCollection;

async function connectDB() {
  await client.connect();
  const db = client.db(process.env.DB_NAME || "afterSchool");
  lessonsCollection = db.collection("lesson");
  ordersCollection = db.collection("order");
  console.log("Connected to MongoDB Atlas");
}

// Convert DB doc -> frontend shape (frontend expects `spaces`)
function toFrontendLesson(doc) {
  if (!doc) return doc;

  // If DB uses `space`, expose it as `spaces`
  if (doc.spaces === undefined && doc.space !== undefined) {
    return { ...doc, spaces: doc.space };
  }
  return doc;
}

// Convert frontend updates -> DB shape (store as `space` if needed)
function toDbUpdates(updates) {
  const u = { ...(updates || {}) };

  // Frontend sends `spaces`, DB may store `space`
  if (u.spaces !== undefined && u.space === undefined) {
    u.space = u.spaces;
    delete u.spaces;
  }
  return u;
}

// ----------------------------------------- Routes ----------------------------------------
app.get("/", (req, res) => {
  res.send("Backend running");
});

// GET all lessons
app.get("/lessons", async (req, res) => {
  try {
    const lessons = await lessonsCollection.find({}).toArray();
    res.json(lessons.map(toFrontendLesson));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
});

// POST an order
app.post("/orders", async (req, res) => {
  try {
    const { name, phone, lessonIDs } = req.body || {};

    // Basic validation
    if (!name || !phone || !Array.isArray(lessonIDs) || lessonIDs.length === 0) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const newOrder = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      lessonIDs,
      createdAt: new Date()
    };

    const result = await ordersCollection.insertOne(newOrder);

    // IMPORTANT: correct spread syntax
    res.status(201).json({
      message: "Order saved",
      order: { _id: result.insertedId, ...newOrder }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save order" });
  }
});

// PUT update any attribute of a lesson by ID
// Supports numeric `id` OR Mongo `_id`
app.put("/lessons/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    const updates = toDbUpdates(req.body || {});

    // Prevent changing identifiers
    if ("id" in updates || "_id" in updates) {
      return res.status(400).json({ message: "Cannot update lesson id" });
    }

    // Build filter
    const filter = {};
    const numericId = Number(idParam);

    if (!Number.isNaN(numericId) && String(numericId) === idParam) {
      filter.id = numericId;
    } else if (ObjectId.isValid(idParam)) {
      filter._id = new ObjectId(idParam);
    } else {
      return res.status(400).json({ message: "Invalid lesson id" });
    }

    const result = await lessonsCollection.findOneAndUpdate(
      filter,
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.json({
      message: "Lesson updated",
      lesson: toFrontendLesson(result)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update lesson" });
  }
});

// ----------------------------------------- Server ----------------------------------------
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
