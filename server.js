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

/* Test DB connection */
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ DB Connection Error:", err.message);
  } else {
    console.log("✅ Connected to PostgreSQL");
    release();
  }
});

/* =========================
   ROOT ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("Food Delivery API is running 🍔");
});

/* =========================
   MENU ROUTES
========================= */

//* GET menu items */
app.get("/menu", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY id ASC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error("MENU ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch menu",
      message: err.message
    });
  }
});

/* POST new menu item */
app.post("/menu", async (req, res) => {
  try {
    const { name, price, category } = req.body;

    const result = await pool.query(
      "INSERT INTO menu_items (name, price, category) VALUES ($1, $2, $3) RETURNING *",
      [name, price, category]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: "Failed to add menu item",
      message: err.message
    });
  }
});

/* PUT update menu item */
app.put("/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body;

    const result = await pool.query(
      "UPDATE menu_items SET name=$1, price=$2, category=$3 WHERE id=$4 RETURNING *",
      [name, price, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: "Failed to update item",
      message: err.message
    });
  }
});

/* DELETE menu item */
app.delete("/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM menu_items WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({
      message: "Deleted successfully",
      item: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to delete item",
      message: err.message
    });
  }
});

/* =========================
   ORDER ROUTES
========================= */

/* GET orders */
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch orders",
      message: err.message
    });
  }
});

/* POST order */
app.post("/orders", async (req, res) => {
  try {
    const { item_name, quantity } = req.body;

    const result = await pool.query(
      "INSERT INTO orders (item_name, quantity, status) VALUES ($1, $2, $3) RETURNING *",
      [item_name, quantity, "pending"]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: "Failed to create order",
      message: err.message
    });
  }
});

/* UPDATE order */
app.put("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE orders SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: "Failed to update order",
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