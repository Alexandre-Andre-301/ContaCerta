document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/vendas-data');
        const data = await response.json();

        renderVendasChart(data.labels, data.vendas);
        renderLucroChart(data.labels, data.lucro);
        
    } catch (error) {
        console.error("Erro ao carregar os dados das vendas:", error);
    }
});

function renderVendasChart(labels, valores) {
    const ctx = document.getElementById('vendasChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas (Kz)',
                data: valores,
                backgroundColor: '#22c55e', 
                borderRadius: 8,
                barThickness: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderLucroChart(labels, valores) {
    const ctx = document.getElementById('lucroChart').getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                borderColor: '#22c55e',
                borderWidth: 3,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointRadius: 4 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}