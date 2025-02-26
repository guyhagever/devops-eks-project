const mysql = require('mysql2');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',          
  port: process.env.DB_PORT || 3306,                   
  user: process.env.DB_USER || 'root',                 
  password: process.env.DB_PASSWORD || 'rootpassword', 
  database: process.env.DB_NAME || 'book_db'           
};

const pool = mysql.createPool(dbConfig);

module.exports = pool.promise();
