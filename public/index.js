document.addEventListener('DOMContentLoaded', () => {
    // 1. Set current date
    const dateElement = document.getElementById('current-date');
    const now = new Date();
    dateElement.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 2. Fetch Data
    fetchReport();
});

async function fetchReport() {
    try {
        // Try to hit your API
        const response = await fetch('/api/report');
        
        if (!response.ok) throw new Error('API not available');
        
        const data = await response.json();
        renderDashboard(data);

    } catch (error) {
        console.warn('API Error, loading mock data for UI demo:', error);
        loadMockData();
    }
}

function renderDashboard(data) {
    // Update Stats
    document.getElementById('global-volume').textContent = data.summary.volume || '$142.5B';
    document.getElementById('market-sentiment').textContent = data.summary.sentiment || 'Bullish';
    document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();

    // Clear loading states
    const commoditiesContainer = document.getElementById('commodities-container');
    const currencyContainer = document.getElementById('currency-container');
    commoditiesContainer.innerHTML = '';
    currencyContainer.innerHTML = '';

    // Render Commodities
    data.commodities.forEach(item => {
        commoditiesContainer.appendChild(createItemCard(item));
    });

    // Render Currencies
    data.currencies.forEach(item => {
        currencyContainer.appendChild(createItemCard(item));
    });
}

function createItemCard(item) {
    const div = document.createElement('div');
    // Determine class based on trend (up/down)
    const trendClass = item.change >= 0 ? 'trend-up' : 'trend-down';
    const badgeClass = item.change >= 0 ? 'up' : 'down';
    const icon = item.change >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
    const sign = item.change >= 0 ? '+' : '';

    div.className = `card item-card ${trendClass}`;
    div.innerHTML = `
        <div class="item-header">
            <span class="item-name">${item.name}</span>
            <i class="fa-solid ${icon}" style="color: ${item.change >= 0 ? '#22c55e' : '#ef4444'}"></i>
        </div>
        <div class="item-price">${item.value}</div>
        <div class="trend-badge ${badgeClass}">
            ${sign}${item.change}% Since yesterday
        </div>
    `;
    return div;
}

// --- MOCK DATA GENERATOR (For testing UI without Backend) ---
function loadMockData() {
    const mockData = {
        summary: { volume: "$4.2T", sentiment: "Volatile" },
        commodities: [
            { name: "Brent Crude Oil", value: "$82.40", change: 1.2 },
            { name: "Gold (oz)", value: "$1,945.50", change: -0.5 },
            { name: "Silver", value: "$23.10", change: 0.1 },
            { name: "Natural Gas", value: "$2.80", change: -2.4 }
        ],
        currencies: [
            { name: "EUR / USD", value: "1.082", change: -0.12 },
            { name: "GBP / USD", value: "1.245", change: 0.45 },
            { name: "JPY / USD", value: "145.20", change: -0.05 },
            { name: "BTC / USD", value: "$42,500", change: 3.2 }
        ]
    };
    renderDashboard(mockData);
}