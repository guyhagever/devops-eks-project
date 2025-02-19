const mysql = require('mysql2');

// Adjust credentials as needed
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'book_db'
};

const pool = mysql.createPool(dbConfig);

module.exports = pool.promise();
