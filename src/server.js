const express = require('express');
const path = require('path');
const db = require('./database'); // Import our DB connection
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(express.json());

// 2. Serve Static Files (This exposes your 'public' folder to the web)
// Now, going to localhost:3000 will load your index.html
app.use(express.static(path.join(__dirname, '../public')));

// 3. The Main API Endpoint
app.get('/api/report', async (req, res) => {
    try {
        // PLAN: In a full production app, you would query the DB here.
        // Example: const [rows] = await db.query('SELECT * FROM daily_reports ORDER BY date DESC LIMIT 1');
        
        // FOR NOW: We will construct the object to match exactly what your frontend expects.
        // This simulates the "Report Generator" output.
        
        const reportData = {
            timestamp: new Date(),
            summary: {
                volume: "$5.4T",
                sentiment: "Bullish", // You can calculate this based on positive/negative trends
                status: "Active"
            },
            commodities: [
                { name: "Brent Crude", value: "$85.20", change: 1.5 },
                { name: "Gold", value: "$1,950.00", change: 0.8 },
                { name: "Silver", value: "$24.10", change: -0.2 },
                { name: "Copper", value: "$3.80", change: -1.1 }
            ],
            currencies: [
                { name: "EUR / USD", value: "1.09", change: 0.1 },
                { name: "GBP / USD", value: "1.27", change: 0.3 },
                { name: "JPY / USD", value: "144.50", change: -0.4 },
                { name: "BTC / USD", value: "$45,200", change: 2.1 }
            ]
        };

        // Send the JSON back to the frontend
        res.json(reportData);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 4. Start the Server
app.listen(PORT, () => {
    console.log(`\n🚀 GlobalPulse is running!`);
    console.log(`🌍 Dashboard: http://localhost:${PORT}`);
    console.log(`🔌 API Route: http://localhost:${PORT}/api/report\n`);
});