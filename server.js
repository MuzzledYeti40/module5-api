console.log("🔥 NEW DEPLOYMENT LOADED");
const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ============================
   PostgreSQL Connection
============================ */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ DB Connection Error:", err.message);
  } else {
    console.log("✅ Connected to PostgreSQL");
    release();
  }
});

/* ============================
   Root Route
============================ */
app.get("/", (req, res) => {
  res.send("Food Delivery API is running 🍔");
});

/* ============================
   MENU ROUTES
============================ */

/* GET all menu items */
app.get("/menu", async (req, res) => {
  try {
    const { category } = req.query;

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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE menu item (NEW) */
app.delete("/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM menu_items WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    res.json({
      message: "Menu item deleted successfully",
      item: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   ORDERS ROUTES (NEW)
============================ */

/* CREATE order */
app.post("/orders", async (req, res) => {
  try {
    const { item_name, quantity } = req.body;

    const result = await pool.query(
      "INSERT INTO orders (item_name, quantity, status) VALUES ($1, $2, $3) RETURNING *",
      [item_name, quantity, "pending"]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET all orders */
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE order status */
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
    res.status(500).json({ error: err.message });
  }
});

/* ============================
   START SERVER
============================ */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});