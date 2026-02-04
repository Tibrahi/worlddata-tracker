let marketChart;

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    loadData();

    // Auto-refresh every 60 seconds
    setInterval(loadData, 60000);
});

async function loadData() {
    try {
        // 1. Fetch Live Tiles
        const resLive = await fetch('/api/live');
        const liveData = await resLive.json();
        renderTiles(liveData);

        // 2. Fetch History for Chart
        const resHist = await fetch('/api/history');
        const histData = await resHist.json();
        updateChart(histData);

    } catch (error) {
        console.error("System Sync Error:", error);
    }
}

function renderTiles(data) {
    const container = document.getElementById('data-container');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<p style="color:gray;">Waiting for first data sync...</p>';
        return;
    }

    data.forEach(item => {
        // Style Logic
        const isPositive = item.change_pct >= 0;
        const colorClass = isPositive ? 'text-green' : 'text-red';
        const badgeClass = isPositive ? 'bg-green-dim' : 'bg-red-dim';
        const icon = isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
        const sign = isPositive ? '+' : '';

        // Icon Selection
        let catIcon = 'fa-chart-pie';
        if (item.category === 'crypto') catIcon = 'fa-bitcoin';
        if (item.category === 'currency') catIcon = 'fa-money-bill-transfer';
        if (item.category === 'commodity') catIcon = 'fa-gem';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-top">
                <div>
                    <span class="card-category">${item.category}</span>
                    <div style="font-weight:600; font-size:1.1rem; margin-top:5px;">${item.item_name}</div>
                </div>
                <div class="card-icon">
                    <i class="fa-solid ${catIcon}" style="color:white;"></i>
                </div>
            </div>
            <div class="price-area">
                <h3>${formatPrice(item.price)}</h3>
                <div class="change-badge ${badgeClass}">
                    <i class="fa-solid ${icon}"></i>
                    ${sign}${item.change_pct}%
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function formatPrice(num) {
    // Format based on magnitude
    if (num > 1000) return '$' + Number(num).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    return '$' + Number(num).toFixed(4);
}

// --- CHART.JS CONFIGURATION ---
function initChart() {
    const ctx = document.getElementById('marketChart').getContext('2d');
    
    // Gradient Fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(41, 98, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(41, 98, 255, 0)');

    marketChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Market Trend (Primary Index)',
                data: [],
                borderColor: '#2962ff',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4, // Smooth curves
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainZXAspectRatio: false,
            plugins: {
                legend: { labels: { color: 'white' } }
            },
            scales: {
                y: {
                    grid: { color: '#333' },
                    ticks: { color: '#a0a0a0' }
                },
                x: {
                    grid: { display: false },
                    ticks: { display: false } // Hide time labels for cleanliness
                }
            }
        }
    });
}

function updateChart(data) {
    if (!marketChart || data.length === 0) return;
    
    // Map DB data to Chart format
    const prices = data.map(d => d.price);
    const labels = data.map(d => new Date(d.captured_at).toLocaleTimeString());

    marketChart.data.labels = labels;
    marketChart.data.datasets[0].data = prices;
    marketChart.update();
}