const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err) => {
  if (err) {
    console.error("❌ DB Connection Error:", err.message);
  } else {
    console.log("✅ Connected to PostgreSQL");
  }
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "Food Delivery API running 🍔"
  });
});

/* =========================
   RESTAURANTS
========================= */
app.get("/restaurants", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM restaurants ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch restaurants",
      message: err.message
    });
  }
});

/* =========================
   MENU
========================= */
app.get("/menu", async (req, res) => {
  try {
    const { restaurant_id } = req.query;

    let query = "SELECT * FROM menu_items";
    const values = [];

    if (restaurant_id) {
      query += " WHERE restaurant_id = $1";
      values.push(restaurant_id);
    }

    query += " ORDER BY id ASC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch menu",
      message: err.message
    });
  }
});

app.post("/menu", async (req, res) => {
  try {
    const { name, price, category, restaurant_id } = req.body;

    const result = await pool.query(
      `INSERT INTO menu_items (name, price, category, restaurant_id)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [name, price, category, restaurant_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: "Failed to add menu item",
      message: err.message
    });
  }
});

/* =========================
   ORDERS
========================= */
app.get("/orders", async (req, res) => {
  try {
    const { restaurant_id } = req.query;

    let query = "SELECT * FROM orders";
    const values = [];

    if (restaurant_id) {
      query += " WHERE restaurant_id = $1";
      values.push(restaurant_id);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch orders",
      message: err.message
    });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const { restaurant_id, item_name, quantity } = req.body;

    const result = await pool.query(
      `INSERT INTO orders (restaurant_id, item_name, quantity, status)
       VALUES ($1,$2,$3,'pending')
       RETURNING *`,
      [restaurant_id, item_name, quantity]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: "Failed to create order",
      message: err.message
    });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});