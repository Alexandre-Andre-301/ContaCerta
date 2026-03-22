document.addEventListener('DOMContentLoaded', () => {
    
    // Função para animar os números (Count Up)
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // Quanto menor, mais rápido

    counters.forEach(counter => {
        const updateCount = () => {
            // Pega o valor alvo definido no HTML (data-target)
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace('.', ''); // Remove pontos se houver para calculo

            // Define o incremento
            const inc = target / speed;

            if (count < target) {
                // Formata o número com ponto (ex: 25.000)
                counter.innerText = Math.ceil(count + inc).toLocaleString('pt-AO');
                setTimeout(updateCount, 15);
            } else {
                counter.innerText = target.toLocaleString('pt-AO');
            }
        };

        updateCount();
    });

    // Interatividade simples do Menu (apenas visual para demo)
    const navItems = document.querySelectorAll('.nav-item:not(.logout)');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Remove active de todos
            navItems.forEach(nav => nav.classList.remove('active'));
            // Adiciona ao clicado
            item.classList.add('active');
        });
    });
});
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. BUSCAR DADOS REAIS DO SERVIDOR
    try {
        const response = await fetch('/api/stats_dashboard');
        const data = await response.json();

        if (data.status === 'ok') {
            // Atualiza os data-targets com os valores reais
            document.getElementById('vendasHoje').setAttribute('data-target', data.vendas_hoje);
            document.getElementById('totalProdutos').setAttribute('data-target', data.total_produtos);
            document.getElementById('lucroTotal').setAttribute('data-target', data.lucro_total);
        }
    } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
    }

    // 2. FUNÇÃO DE ANIMAÇÃO (A que já tinhas, mas otimizada)
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace(/\./g, '').replace(',', ''); 
            
            const speed = 50; // Velocidade da animação
            const inc = target / speed;

            if (count < target) {
                const novoValor = Math.ceil(count + inc);
                counter.innerText = (novoValor > target ? target : novoValor).toLocaleString('pt-AO');
                setTimeout(updateCount, 20);
            } else {
                counter.innerText = target.toLocaleString('pt-AO');
            }
        };
        updateCount();
    });
});
// Função para abrir o modal ao clicar no Avatar
document.querySelector('.avatar').onclick = function() {
    document.getElementById('modalPerfil').style.display = 'flex';
};

function fecharModalPerfil() {
    document.getElementById('modalPerfil').style.display = 'none';
}

// Pré-visualização da imagem antes de salvar
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewFoto').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Enviar os dados para o Python
async function salvarPerfil() {
    const nome = document.getElementById('nomeUsuario').value;
    const senha = document.getElementById('novaSenha').value;
    const foto = document.getElementById('inputFoto').files[0];

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('senha', senha);
    if (foto) formData.append('foto', foto);

    try {
        const res = await fetch('/api/atualizar_perfil', {
            method: 'POST',
            body: formData // Usamos FormData para poder enviar o arquivo de imagem
        });
        const data = await res.json();
        
        if (data.status === 'ok') {
            fecharModalPerfil();
            location.reload(); // Atualiza para ver o nome/foto novos
        }
    } catch (e) {
        alert("Erro ao atualizar perfil");
    }
}