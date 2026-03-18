const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* Test DB connection */
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ DB Connection Error:", err.message);
  } else {
    console.log("✅ Connected to PostgreSQL");
    release();
  }
});

/* Root route */
app.get("/", (req, res) => {
  res.send("Food Delivery API is running 🍔");
});

/* ============================
   GET menu (all or filtered)
   ============================ */
app.get("/menu", async (req, res) => {
  try {
    const { category } = req.query; // optional filter
    let query = "SELECT * FROM menu_items";
    const values = [];

    if (category) {
      query += " WHERE category = $1";
      values.push(category);
    }

    query += " ORDER BY id ASC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Query Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   POST menu (add new item)
   ============================ */
app.post("/menu", async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const result = await pool.query(
      "INSERT INTO menu_items (name, price, category) VALUES ($1, $2, $3) RETURNING *",
      [name, price, category]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ POST Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   PUT menu (update existing item)
   ============================ */
app.put("/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body;
    const result = await pool.query(
      "UPDATE menu_items SET name=$1, price=$2, category=$3 WHERE id=$4 RETURNING *",
      [name, price, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ PUT Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});