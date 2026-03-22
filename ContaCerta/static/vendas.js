document.addEventListener('DOMContentLoaded', async () => {
    console.log("Iniciando carregamento dos gráficos...");

    try {
        // 1. FAZ O FETCH PARA A ROTA QUE CRIAMOS NO PYTHON
        // Importante: Verifica se no app.py a rota é @app.route('/api/vendas-data')
        const response = await fetch('/api/api-vendas-data');
        const data = await response.json();

        console.log("Dados recebidos do Python:", data);

        if (data.status === 'ok') {
            renderVendasChart(data.labels, data.vendas);
            renderLucroChart(data.labels, data.lucro);
        } else {
            console.error("Erro retornado pela API:", data.message);
        }
        
    } catch (error) {
        console.error("Erro crítico ao carregar os dados das vendas:", error);
    }
});

function renderVendasChart(labels, valores) {
    const canvas = document.getElementById('vendasChart');
    if (!canvas) {
        console.error("Erro: Elemento 'vendasChart' não encontrado no HTML.");
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico existente se houver (evita bugs ao recarregar)
    if (window.chartVendas) window.chartVendas.destroy();

    window.chartVendas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas (Kz)',
                data: valores,
                backgroundColor: '#22c55e', 
                borderRadius: 8,
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    callbacks: {
                        label: function(context) {
                            return context.raw.toLocaleString('pt-AO') + " Kz";
                        }
                    }
                }
            },
            scales: {
                y: { 
                    grid: { color: '#334155' }, 
                    ticks: { color: '#94a3b8', callback: (v) => v.toLocaleString() } 
                },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function renderLucroChart(labels, valores) {
    const canvas = document.getElementById('lucroChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Criar um gradiente bonito para a linha
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

    if (window.chartLucro) window.chartLucro.destroy();

    window.chartLucro = new Chart(ctx, {
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
                pointRadius: 5,
                pointBackgroundColor: '#22c55e',
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    grid: { color: '#334155' }, 
                    ticks: { color: '#94a3b8', callback: (v) => v.toLocaleString() }
                },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}