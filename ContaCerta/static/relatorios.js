let totalEsperadoGlobal = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Carregar histórico inicial (vazio por agora)
});

async function abrirModalConferencia() {
    document.getElementById('modalConferencia').style.display = 'flex';
    const res = await fetch('/api/produtos');
    const data = await res.json();
    const corpo = document.getElementById('corpoConferencia');
    corpo.innerHTML = "";

    data.message.forEach(prod => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${prod[1]}</td>
            <td><input type="number" class="input-conferencia input-readonly" value="${prod[4]}" readonly></td>
            <td><input type="number" class="input-conferencia input-final" value="${prod[4]}" min="0" max="${prod[4]}" oninput="calcularVendaIndividual(this, ${prod[3]})"></td>
            <td class="col-venda" style="font-weight: 700; color: #3b82f6;">0</td>
            <td class="col-subtotal" data-valor="0" style="font-weight: 700;">0,00 AOA</td>
        `;
        corpo.appendChild(tr);
    });
}

function fecharModalConferencia() {
    document.getElementById('modalConferencia').style.display = 'none';
}

function calcularVendaIndividual(input, preco) {
    const tr = input.closest('tr');
    const inicial = parseInt(tr.querySelector('.input-readonly').value);
    const final = parseInt(input.value) || 0;
    
    // Calcula a diferença
    let vendido = inicial - final;
    if (vendido < 0) { input.value = inicial; vendido = 0; }

    tr.querySelector('.col-venda').innerText = vendido;
    
    const subtotal = vendido * preco;
    const cellSub = tr.querySelector('.col-subtotal');
    cellSub.innerText = subtotal.toLocaleString('pt-AO') + " AOA";
    cellSub.dataset.valor = subtotal;

    atualizarResumoFinanceiro();
}

function atualizarResumoFinanceiro() {
    let soma = 0;
    document.querySelectorAll('.col-subtotal').forEach(td => {
        soma += parseFloat(td.dataset.valor);
    });
    totalEsperadoGlobal = soma;
    document.getElementById('valorEsperado').innerText = soma.toLocaleString('pt-AO') + " AOA";
    validarFinanceiro();
}

function validarFinanceiro() {
    const cash = parseFloat(document.getElementById('cashInput').value) || 0;
    const tpa = parseFloat(document.getElementById('tpaInput').value) || 0;
    const totalInformado = cash + tpa;
    
    document.getElementById('valorInformado').innerText = totalInformado.toLocaleString('pt-AO') + " AOA";
    
    const statusBox = document.getElementById('statusCaixa');
    const msg = document.getElementById('msgAlerta');

    if (totalInformado < totalEsperadoGlobal) {
        statusBox.classList.add('caixa-errado');
        msg.style.display = 'block';
    } else {
        statusBox.classList.remove('caixa-errado');
        msg.style.display = 'none';
    }
}

async function salvarRelatorioFinal() {
    const btn = document.querySelector('.btn-full');
    const listaProdutos = [];

    document.querySelectorAll('#corpoConferencia tr').forEach(tr => {
        const nome = tr.querySelector('.prod-nome').innerText;
        const inicial = tr.querySelector('.ini-val').value;
        const final = tr.querySelector('.fin-val').value;
        const subtotal = parseFloat(tr.querySelector('.col-subtotal').dataset.valor);

        listaProdutos.push({
            nome: nome,
            inicial: inicial,
            final: final,
            subtotal: subtotal
        });
    });

    // 2. Montar o objeto (Payload) exatamente como o teu app.py espera
    const payload = {
        total_esperado: totalVendaEsperada, // Calculado na função atualizarTotaisGerais
        dinheiro_mao: document.getElementById('cashInput').value || 0,
        tpa: document.getElementById('tpaInput').value || 0,
        produtos: listaProdutos
    };

    // 3. Enviar para o servidor
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-line animate-spin"></i> A processar...';

    try {
        const response = await fetch('/api/salvar_relatorio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const res = await response.json();

        if (res.status === 'ok') {
            alert("✅ " + res.message);
            fecharModalConferencia();
            // Recarrega a lista de fechamentos para mostrar o novo na tabela
            carregarHistoricoPrincipal(); 
        } else {
            alert("❌ Erro: " + res.message);
        }
    } catch (error) {
        alert("❌ Erro de conexão com o servidor.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-save-3-line"></i> Finalizar e Salvar Relatório';
    }
}