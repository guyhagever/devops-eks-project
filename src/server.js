const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('../config/db');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve the front-end
app.use('/', express.static(path.join(__dirname, '../public')));

// 1) On startup, ensure tables exist, and seed if empty
async function initDB() {
  try {
    // Create database if it doesn't exist (only works if user has privileges)
    await db.query('CREATE DATABASE IF NOT EXISTS book_db');
    await db.query('USE book_db');

    // Create Books table
    await db.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        author VARCHAR(255),
        year INT,
        sold BIGINT
      )
    `);

    // Create Search History table
    await db.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        query VARCHAR(255),
        search_time DATETIME
      )
    `);

    // Check if 'books' table is empty
    const [rows] = await db.query('SELECT COUNT(*) as count FROM books');
    if (rows[0].count === 0) {
      console.log('Seeding the database with 100 best sellers...');
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../seedData.json'), 'utf8'));

      for (let book of data) {
        const { title, author, year, sold } = book;
        await db.query(
          'INSERT INTO books (title, author, year, sold) VALUES (?, ?, ?, ?)',
          [title, author, year, sold]
        );
      }
      console.log('Seeding complete.');
    } else {
      console.log('Books table is already populated.');
    }
  } catch (err) {
    console.error('Error during initDB:', err);
  }
}

// 2) GET /api/books?search=keyword - Search books by title or author
app.get('/api/books', async (req, res) => {
  const { search } = req.query;
  console.log("blala")
  try {
    // Insert search query into search_history
    if (search && search.trim().length > 0) {
      console.log("paka")
      await db.query('INSERT INTO search_history (query, search_time) VALUES (?, NOW())', [search]);
    }

    let queryStr = 'SELECT * FROM books';
    let params = [];

    if (search && search.trim().length > 0) {
      console.log("paka2")
      queryStr += ' WHERE title LIKE ? OR author LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
      console.log(`%${search}%`)
    }
    console.log(queryStr)
    console.log(params)

    const [rows] = await db.query(queryStr, params);
    console.log("rows")
    console.log(rows)
    res.json(rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3) GET /history - Basic route to display search history
app.get('/history', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM search_history ORDER BY search_time DESC');
    let html = '<h2>Search History</h2><ul>';
    
    rows.forEach((item) => {
      // Remove the backslashes so we actually interpolate variables:
      html += `<li>${item.query} - ${item.search_time}</li>`;
    });

    html += '</ul><p><a href="/">Back to Home</a></p>';
    res.send(html);
  } catch (err) {
    console.error('Error fetching search history:', err);
    res.status(500).send('Internal server error');
  }
});

// 4) Enhanced /health endpoint for Kubernetes probes
app.get('/health', async (req, res) => {
  try {
    // Perform a simple query to verify database connectivity
    await db.query('SELECT 1');
    res.sendStatus(200);
  } catch (err) {
    console.error('Health check failed:', err);
    res.sendStatus(500);
  }
});

// Initialize DB and start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log('Server listening on port', PORT);
  await initDB();
});
