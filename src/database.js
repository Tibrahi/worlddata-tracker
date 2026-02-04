const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool
// This handles multiple connections automatically and keeps the app fast
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'globalpulse',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Export the "promise" version so we can use async/await (much cleaner code)
module.exports = pool.promise();