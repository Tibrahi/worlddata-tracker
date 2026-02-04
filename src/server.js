const express = require('express');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FINANCIAL_API_KEY; // Get your key from TwelveData or similar

// --- 1. DATA FETCH ENGINE (The "Worker") ---

async function updateGlobalPulseData() {
    console.log('🔄 Triggering Global Data Sync...');
    try {
        // Example using Twelve Data API for Gold, Oil, EUR/USD, and BTC
        // URL: https://api.twelvedata.com/quote?symbol=XAU/USD,WTI/USD,EUR/USD,BTC/USD&apikey=YOUR_KEY
        const symbols = "XAU/USD,WTI/USD,EUR/USD,BTC/USD";
        const url = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${API_KEY}`;
        
        const response = await axios.get(url);
        const data = response.data;

        // Map API response to our Database categories
        const mappings = [
            { sym: 'XAU/USD', name: 'Gold', cat: 'commodity' },
            { sym: 'WTI/USD', name: 'Crude Oil', cat: 'commodity' },
            { sym: 'EUR/USD', name: 'EUR / USD', cat: 'currency' },
            { sym: 'BTC/USD', name: 'Bitcoin', cat: 'crypto' }
        ];

        for (const item of mappings) {
            const asset = data[item.sym];
            if (asset) {
                await db.query(
                    `INSERT INTO market_data (entry_date, category, item_name, price, change_pct) 
                     VALUES (CURDATE(), ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE price = VALUES(price), change_pct = VALUES(change_pct)`,
                    [item.cat, item.name, asset.close, asset.percent_change]
                );
            }
        }
        console.log('✅ Database sync complete.');
    } catch (error) {
        console.error('❌ Sync Failed:', error.message);
    }
}

// --- 2. AUTOMATION (The "Cron Job") ---

// Schedule to run every hour (0 * * * *)
cron.schedule('0 * * * *', () => {
    updateGlobalPulseData();
});

// --- 3. THE REST API (For Frontend) ---

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/report', async (req, res) => {
    try {
        // Fetch the most recent data for each item from DB
        const [rows] = await db.query(
            `SELECT item_name as name, category, price as value, change_pct as \`change\` 
             FROM market_data 
             WHERE entry_date = CURDATE() OR entry_date = (SELECT MAX(entry_date) FROM market_data)`
        );

        const response = {
            timestamp: new Date(),
            summary: {
                volume: "$5.4T", // Aggregate or fetch from high-level API
                sentiment: "Stable"
            },
            commodities: rows.filter(r => r.category === 'commodity'),
            currencies: rows.filter(r => r.category === 'currency' || r.category === 'crypto')
        };

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- 4. STARTUP ---

app.listen(PORT, () => {
    console.log(`🚀 Server active on http://localhost:${PORT}`);
    // Optional: Run one update immediately on startup to ensure data exists
    if (API_KEY) updateGlobalPulseData();
});