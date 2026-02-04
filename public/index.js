async function fetchGlobalData() {
    const container = document.getElementById('stats-container');
    const timeDisplay = document.getElementById('last-updated');

    try {
        const response = await fetch('/api/report');
        const data = await response.json();

        // Update timestamp
        timeDisplay.innerText = `Last Updated: ${new Date(data.timestamp).toLocaleTimeString()}`;

        // Clear loading state
        container.innerHTML = '';

        // Render Cards
        data.trends.forEach(item => {
            const isUp = item.direction === 'up';
            const card = document.createElement('div');
            card.className = 'card';
            
            card.innerHTML = `
                <div class="card-header">
                    <span>${item.category}</span>
                    <i data-lucide="${getIcon(item.category)}"></i>
                </div>
                <div class="card-value">${item.value}</div>
                <div class="trend ${item.direction}">
                    <i data-lucide="${isUp ? 'trending-up' : 'trending-down'}"></i>
                    ${item.change}% vs Yesterday
                </div>
            `;
            container.appendChild(card);
        });

        // Initialize icons
        lucide.createIcons();

    } catch (error) {
        container.innerHTML = `<p class="error">Failed to load data. Is the server running?</p>`;
    }
}

function getIcon(category) {
    const icons = {
        'Oil': 'droplet',
        'Gold': 'shave',
        'Currency': 'dollar-sign',
        'Market': 'bar-chart'
    };
    return icons[category] || 'activity';
}

// Initial load
fetchGlobalData();
// Refresh every minute
setInterval(fetchGlobalData, 60000);