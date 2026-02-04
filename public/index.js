let marketChart;

document.addEventListener('DOMContentLoaded', () => {
    startClock();
    initChart();
    fetchData();

    // Refresh data every 60 seconds
    setInterval(fetchData, 60000);
});

function startClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString();
    }, 1000);
}

async function fetchData() {
    try {
        // 1. Get Live Data
        const resLive = await fetch('/api/live');
        const liveData = await resLive.json();
        renderCards(liveData);

        // 2. Get History for Chart
        const resHist = await fetch('/api/history');
        const histData = await resHist.json();
        updateChart(histData);

    } catch (error) {
        console.error("Sync Error:", error);
    }
}

function renderCards(data) {
    const container = document.getElementById('ticker-container');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="loading">Waiting for server sync...</div>';
        return;
    }

    data.forEach(item => {
        const isUp = item.change_percent >= 0;
        const trendClass = isUp ? 'trend-up' : 'trend-down';
        const iconClass = isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
        
        // Define an icon for the card header based on category
        let headerIcon = 'fa-tag';
        if(item.category === 'crypto') headerIcon = 'fa-bitcoin';
        if(item.category === 'stock') headerIcon = 'fa-building';
        if(item.category === 'currency') headerIcon = 'fa-money-bill-transfer';

        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <div class="card-top">
                <span class="card-name">${item.name}</span>
                <div class="card-icon"><i class="fa-solid ${headerIcon}"></i></div>
            </div>
            <span class="card-price">$${Number(item.price).toLocaleString()}</span>
            <div class="trend-badge ${trendClass}">
                <i class="fa-solid ${iconClass}"></i>
                ${item.change_percent}%
            </div>
        `;
        container.appendChild(div);
    });
}

// --- Chart Configuration ---
function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Gradient effect
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(41, 98, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(41, 98, 255, 0)');

    marketChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Market Trend',
                data: [],
                borderColor: '#2962ff',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: '#222' },
                    ticks: { color: '#666' }
                }
            }
        }
    });
}

function updateChart(data) {
    if (!marketChart || data.length === 0) return;

    const prices = data.map(d => d.price);
    const labels = data.map(d => new Date(d.captured_at).toLocaleTimeString());

    marketChart.data.labels = labels;
    marketChart.data.datasets[0].data = prices;
    marketChart.update();
}