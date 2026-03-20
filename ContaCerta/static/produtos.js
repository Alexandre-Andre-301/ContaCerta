document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
});

function carregarProdutos() {
    const grid = document.getElementById('produtosGrid');

    fetch('/api/produtos')
        .then(resp => resp.json())
        .then(data => {
            if (data.status === "ok") {
                grid.innerHTML = ""; 
                
                data.message.forEach(prod => {
                    const card = document.createElement('div');
                    card.className = 'produto-card';
                    
                    card.innerHTML = `
                        <div class="produto-header">
                            <h3>${prod[1]}</h3>
                        </div>
                        <div class="produto-info">
                            <div class="info-item">
                                <span class="info-label">Preço de Compra</span>
                                <span class="info-value">${prod[2].toLocaleString('pt-AO', {style: 'currency', currency: 'Kz'})}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Preço de Venda</span>
                                <span class="info-value value-venda">${prod[3].toLocaleString('pt-AO', {style: 'currency', currency: 'Kz'})}</span>
                            </div>
                        </div>
                        <button class="btn-add-stock" onclick="adicionarProduto(${prod[0]})">
                            <i class="ri-add-circle-line"></i> Adicionar Unidade
                        </button>
                    `;
                    grid.appendChild(card);
                });
            }
        });
}

function adicionarProduto(id) {
    console.log("Adicionar unidade ao produto ID:", id);
}
const modal = document.getElementById('modalProduto');
const btnNovo = document.getElementById('btnNovoProduto');
const btnFechar = document.getElementById('btnCloseModal');
const form = document.getElementById('formProduto');

btnNovo.onclick = () => modal.style.display = 'flex';

btnFechar.onclick = () => {
    modal.style.display = 'none';
    form.reset();
};


window.onclick = (e) => { if(e.target == modal) btnFechar.onclick(); }


form.onsubmit = async (e) => {
    e.preventDefault();
    const msgErro = document.getElementById('msgErro');
    
    const dados = {
        nome: document.getElementById('p_nome').value,
        quantidade: document.getElementById('p_qtd').value,
        compra: document.getElementById('p_compra').value,
        venda: document.getElementById('p_venda').value
    };

    const response = await fetch('/api/produtos/novo', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    });

    const res = await response.json();

    if (res.status === 'ok') {
        btnFechar.onclick(); 
        carregarProdutos();  
    } else {
        msgErro.innerText = res.message;
    }
};
document.addEventListener('DOMContentLoaded', () => {

    carregarProdutos();

    const modal = document.getElementById('modalProduto');
    const btnNovo = document.getElementById('btnNovoProduto');
    const btnFechar = document.getElementById('btnCloseModal');
    const form = document.getElementById('formProduto');

    if (btnNovo) {
        btnNovo.onclick = () => {
            modal.style.display = 'flex';
            document.getElementById('p_nome').focus();
        };
    }

    if (btnFechar) {
        btnFechar.onclick = () => {
            modal.style.display = 'none';
            form.reset();
            document.getElementById('msgErro').innerText = "";
        };
    }


    window.onclick = (e) => {
        if (e.target == modal) btnFechar.onclick();
    };


    form.onsubmit = async (e) => {
        e.preventDefault();
        const msgErro = document.getElementById('msgErro');
        
        const dados = {
            nome: document.getElementById('p_nome').value,
            quantidade: parseInt(document.getElementById('p_qtd').value),
            compra: parseFloat(document.getElementById('p_compra').value),
            venda: parseFloat(document.getElementById('p_venda').value)
        };

        try {
            const response = await fetch('/api/produtos/novo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const res = await response.json();

            if (res.status === 'ok') {
                btnFechar.onclick(); 
                carregarProdutos();  
            } else {
                msgErro.innerText = res.message;
            }
        } catch (err) {
            msgErro.innerText = "Erro ao conectar com o servidor.";
        }
    };
});


async function carregarProdutos() {
    const grid = document.getElementById('produtosGrid');
    if (!grid) return;

    try {
        const response = await fetch('/api/produtos');
        const data = await response.json();

        if (data.status === "ok") {
            grid.innerHTML = ""; 

            if (data.message.length === 0) {
                grid.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; text-align: center; margin-top: 20px;">Nenhum produto cadastrado.</p>`;
                return;
            }

            data.message.forEach((prod, index) => {
                const card = document.createElement('div');
                card.className = 'produto-card';
                
                card.style.animationDelay = `${index * 0.05}s`;

                card.innerHTML = `
                    <div class="produto-header">
                        <h3>${prod[1]}</h3>
                        <span class="info-label">Qtd em Stock: <strong>${prod[4]}</strong></span>
                    </div>
                    <div class="produto-info">
                        <div class="info-item">
                            <span class="info-label">Custo</span>
                            <span class="info-value">${formatarMoeda(prod[2])}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Preço de Venda</span>
                            <span class="info-value value-venda">${formatarMoeda(prod[3])}</span>
                        </div>
                    </div>
                    <button class="btn-add-stock" onclick="detalhesProduto(${prod[0]})">
                        <i class="ri-eye-line"></i> Ver Detalhes
                    </button>
                `;
                grid.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}


function formatarMoeda(valor) {
    return valor.toLocaleString('pt-AO', {
        style: 'currency',
        currency: 'AOA' 
    });
}


function detalhesProduto(id) {
    console.log("Abrindo detalhes do produto:", id);

}
const modalDet = document.getElementById('modalDetalhes');
const btnCloseDet = document.getElementById('btnCloseDetalhes');

btnCloseDet.onclick = () => modalDet.style.display = 'none';


async function detalhesProduto(id) {
    const response = await fetch('/api/produtos');
    const data = await response.json();
    const prod = data.message.find(p => p[0] === id);

    if (prod) {

        document.getElementById('edit_id').value = prod[0];
        document.getElementById('edit_nome').value = prod[1];
        document.getElementById('edit_compra').value = prod[2];
        document.getElementById('edit_venda').value = prod[3];
        document.getElementById('edit_qtd').value = prod[4];

        // 3. Mostramos o modal
        modalDet.style.display = 'flex';
    }
}

// Lógica de Atualizar
document.getElementById('formEdicao').onsubmit = async (e) => {
    e.preventDefault();
    const dados = {
        id: document.getElementById('edit_id').value,
        nome: document.getElementById('edit_nome').value,
        compra: document.getElementById('edit_compra').value,
        venda: document.getElementById('edit_venda').value,
        quantidade: document.getElementById('edit_qtd').value
    };

    const res = await fetch('/api/produtos/editar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    });

    if ((await res.json()).status === 'ok') {
        modalDet.style.display = 'none';
        carregarProdutos();
    }
};


document.getElementById('btnEliminar').onclick = async () => {
    const id = document.getElementById('edit_id').value;
    const nome = document.getElementById('edit_nome').value;

    if (confirm(`Tem certeza que deseja eliminar o produto ${nome}?`)) {
        const res = await fetch(`/api/produtos/eliminar/${id}`, { method: 'DELETE' });
        if ((await res.json()).status === 'ok') {
            modalDet.style.display = 'none';
            carregarProdutos();
        }
    }
};