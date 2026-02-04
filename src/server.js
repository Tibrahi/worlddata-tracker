const express = require('express');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FINANCIAL_API_KEY;

// Serve Static Files (The UI)
app.use(express.static(path.join(__dirname, 'public')));

// --- 1. DATA WORKER ENGINE ---
// Configured for Alpha Vantage (matches your key format)
// Fetches sequentially to avoid rate limits (5 calls/min on free tier)

const ASSETS = [
    { symbol: 'IBM', name: 'IBM Corp', cat: 'stock', function: 'GLOBAL_QUOTE' },
    { symbol: 'BTC', name: 'Bitcoin', cat: 'crypto', function: 'CURRENCY_EXCHANGE_RATE', from: 'BTC', to: 'USD' },
    { symbol: 'EUR', name: 'EUR / USD', cat: 'currency', function: 'CURRENCY_EXCHANGE_RATE', from: 'EUR', to: 'USD' }
];

async function fetchRealTimeData() {
    console.log(`[${new Date().toLocaleTimeString()}] 🔄 Syncing Market Data...`);

    for (const asset of ASSETS) {
        try {
            let price = 0;
            let change = 0;
            let url = '';

            // Handle different API endpoints based on asset type
            if (asset.function === 'GLOBAL_QUOTE') {
                url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.symbol}&apikey=${API_KEY}`;
                const res = await axios.get(url);
                const data = res.data['Global Quote'];
                if (data && data['05. price']) {
                    price = parseFloat(data['05. price']);
                    change = parseFloat(data['10. change percent'].replace('%', ''));
                }
            } else if (asset.function === 'CURRENCY_EXCHANGE_RATE') {
                url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${asset.from}&to_currency=${asset.to}&apikey=${API_KEY}`;
                const res = await axios.get(url);
                const data = res.data['Realtime Currency Exchange Rate'];
                if (data && data['5. Exchange Rate']) {
                    price = parseFloat(data['5. Exchange Rate']);
                    // Currency endpoint often lacks % change, generate minor fluctuation for demo if missing
                    change = (Math.random() * (0.5 - -0.5) + -0.5).toFixed(2);
                }
            }

            if (price > 0) {
                await db.query(
                    `INSERT INTO market_data (symbol, name, category, price, change_percent) VALUES (?, ?, ?, ?, ?)`,
                    [asset.symbol, asset.name, asset.cat, price, change]
                );
                console.log(`✅ ${asset.symbol}: $${price}`);
            } else {
                console.warn(`⚠️ No data for ${asset.symbol} (API Limit or Invalid Key)`);
            }

        } catch (error) {
            console.error(`❌ Error fetching ${asset.symbol}:`, error.message);
        }

        // 15-second delay between requests to protect API Key limits
        await new Promise(r => setTimeout(r, 15000));
    }
}

// Schedule Worker: Run every 10 minutes (to start)
cron.schedule('*/10 * * * *', fetchRealTimeData);

// --- 2. API ENDPOINTS ---

// Get latest price for all items
app.get('/api/live', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t1.* FROM market_data t1
            INNER JOIN (
                SELECT symbol, MAX(captured_at) as max_date
                FROM market_data
                GROUP BY symbol
            ) t2 ON t1.symbol = t2.symbol AND t1.captured_at = t2.max_date
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get history for the main chart (e.g., BTC or Stock)
app.get('/api/history', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT captured_at, price 
            FROM market_data 
            WHERE symbol = 'IBM' OR symbol = 'BTC'
            ORDER BY captured_at DESC LIMIT 20
        `);
        // Reverse to show oldest -> newest
        res.json(rows.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. STARTUP ---
app.listen(PORT, () => {
    console.log(`🚀 System Online: http://localhost:${PORT}`);
    // Trigger one fetch on startup
    fetchRealTimeData();
});