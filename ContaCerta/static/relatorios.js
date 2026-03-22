let totalEsperadoGlobal = 0;

// Carrega o histórico assim que a página abre
document.addEventListener('DOMContentLoaded', carregarHistoricoPrincipal);

// --- 1. FUNÇÕES DO HISTÓRICO E CARDS ---

async function carregarHistoricoPrincipal() {
    const corpo = document.getElementById('listaFechamentos');
    if (!corpo) return;

    try {
        const res = await fetch('/api/lista_fechamentos');
        const result = await res.json();
        
        if (result.status === 'ok') {
            // ATUALIZA OS CARDS NO TOPO
            if (result.resumo_topo) {
                const elVendas = document.getElementById('totalVendasMes');
                const elQuebras = document.getElementById('totalQuebras');
                
                if (elVendas) elVendas.innerText = result.resumo_topo.vendas_acumuladas.toLocaleString('pt-AO') + " AOA";
                if (elQuebras) elQuebras.innerText = result.resumo_topo.quebras_acumuladas.toLocaleString('pt-AO') + " AOA";
            }

            // PREENCHE A TABELA
            corpo.innerHTML = ""; // Limpa a tabela antes de preencher

            if (result.dados.length === 0) {
                corpo.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Nenhum relatório encontrado.</td></tr>';
                return;
            }

            result.dados.forEach(f => {
                const tr = document.createElement('tr');
                const data = new Date(f.data).toLocaleString('pt-AO');
                const corDif = f.diferenca < 0 ? 'color:#ef4444' : 'color:#22c55e';
                
                tr.innerHTML = `
                    <td>${data}</td>
                    <td>${f.esperado.toLocaleString('pt-AO')} AOA</td>
                    <td>${f.informado.toLocaleString('pt-AO')} AOA</td>
                    <td style="${corDif}; font-weight:bold;">${f.diferenca.toLocaleString('pt-AO')} AOA</td>
                    <td style="display: flex; gap: 12px; align-items: center;">
                        <button class="btn-download" onclick="gerarPDF(${f.id})" title="Baixar PDF" style="background:none; border:none; color:#3b82f6; cursor:pointer; font-size:1.2rem;">
                            <i class="ri-file-pdf-line"></i>
                        </button>
                        
                        <button class="btn-delete" onclick="confirmarEliminar(${f.id})" title="Eliminar Relatório" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.2rem;">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </td>
                `;
                corpo.appendChild(tr); // <--- ESTA LINHA TINHA DESAPARECIDO
            });
        }
    } catch (e) { 
        console.error("Erro ao carregar histórico:", e);
        corpo.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Erro ao carregar dados.</td></tr>';
    }
}

// --- 2. FUNÇÕES DE CRIAÇÃO DE NOVO RELATÓRIO ---

async function abrirModalConferencia() {
    const modal = document.getElementById('modalConferencia');
    const corpo = document.getElementById('corpoConferencia');
    modal.style.display = 'flex';
    corpo.innerHTML = '<tr><td colspan="5">A carregar...</td></tr>';

    try {
        const res = await fetch('/api/produtos');
        const data = await res.json();
        corpo.innerHTML = ""; 

        data.message.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="prod-nome" style="font-weight:600;">${prod[1]}</td>
                <td><input type="number" class="ini-val" value="${prod[4]}" readonly style="background:transparent; border:none; color:gray; width:50px"></td>
                <td><input type="number" class="input-final" value="${prod[4]}" min="0" max="${prod[4]}" oninput="calcularVendaIndividual(this, ${prod[3]})" style="width:60px; background:#1e293b; color:white; border:1px solid #334155; border-radius:4px; padding: 4px;"></td>
                <td class="col-venda">0</td>
                <td class="col-subtotal" data-valor="0" style="font-weight:600;">0,00 AOA</td>
            `;
            corpo.appendChild(tr);
        });
    } catch (error) { console.error(error); }
}

function calcularVendaIndividual(input, preco) {
    const tr = input.closest('tr');
    const inicial = parseInt(tr.querySelector('.ini-val').value);
    const final = parseInt(input.value) || 0;
    
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
        soma += parseFloat(td.dataset.valor || 0);
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
    
    const msg = document.getElementById('msgAlerta');
    if (msg) msg.style.display = totalInformado < totalEsperadoGlobal ? 'block' : 'none';
}

async function salvarRelatorioFinal() {
    const btn = document.querySelector('.btn-full');
    const listaProdutos = [];
    let houveVenda = false;

    document.querySelectorAll('#corpoConferencia tr').forEach(tr => {
        const elNome = tr.querySelector('.prod-nome');
        if (elNome) {
            const inicial = parseInt(tr.querySelector('.ini-val').value) || 0;
            const final = parseInt(tr.querySelector('.input-final').value) || 0;
            const vendido = inicial - final;
            const subtotal = parseFloat(tr.querySelector('.col-subtotal').dataset.valor || 0);

            if (vendido > 0) houveVenda = true;

            listaProdutos.push({
                nome: elNome.innerText,
                inicial: inicial,
                final: final,
                subtotal: subtotal
            });
        }
    });

    if (!houveVenda) {
        alert("⚠️ Operação Cancelada: Não podes salvar um relatório sem nenhuma venda registada!");
        return;
    }

    const payload = {
        total_esperado: totalEsperadoGlobal,
        dinheiro_mao: document.getElementById('cashInput').value || 0,
        tpa: document.getElementById('tpaInput').value || 0,
        produtos: listaProdutos
    };

    btn.disabled = true;
    btn.innerHTML = 'A processar...';

    try {
        const response = await fetch('/api/salvar_relatorio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const res = await response.json();
        if (res.status === 'ok') {
            alert("✅ Relatório guardado com sucesso!");
            if(res.relatorio_id) gerarPDF(res.relatorio_id);
            fecharModalConferencia();
            carregarHistoricoPrincipal();
        } else {
            alert("❌ Erro: " + res.message);
        }
    } catch (error) {
        alert("❌ Erro de conexão.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ri-save-3-line"></i> Finalizar e Salvar Relatório';
    }
}

async function confirmarEliminar(id) {
    if (!confirm("Tem a certeza que deseja eliminar este relatório permanentemente?")) return;

    try {
        const res = await fetch(`/api/eliminar_fechamento/${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.status === 'ok') {
            carregarHistoricoPrincipal();
        } else {
            alert("Erro ao eliminar: " + data.message);
        }
    } catch (e) {
        console.error("Erro na conexão:", e);
    }
}

function fecharModalConferencia() {
    document.getElementById('modalConferencia').style.display = 'none';
}

// --- 3. FUNÇÃO DO PDF ---

async function gerarPDF(id) {
    try {
        const res = await fetch(`/api/detalhes_fechamento/${id}`);
        const data = await res.json();
        if (data.status !== 'ok') return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Relatório de Fechamento - ContaCerta", 14, 20);
        
        doc.autoTable({
            startY: 30,
            head: [['Descrição', 'Valor']],
            body: [
                ['Venda Esperada', data.resumo.esperado.toLocaleString() + " AOA"],
                ['Informado', data.resumo.informado.toLocaleString() + " AOA"],
                ['Diferença', data.resumo.diferenca.toLocaleString() + " AOA"],
                ['Status', data.resumo.status]
            ]
        });

        const rows = data.produtos.map(p => [p.nome, p.qtd, p.subtotal.toLocaleString() + " AOA"]);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Produto', 'Qtd', 'Subtotal']],
            body: rows
        });

        doc.save(`Fechamento_${id}.pdf`);
    } catch (e) { console.error(e); }
}