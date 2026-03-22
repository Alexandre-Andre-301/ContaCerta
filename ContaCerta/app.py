from flask import Flask, render_template, session, jsonify,request,url_for,redirect
from werkzeug.security import generate_password_hash,check_password_hash
import sqlite3
import secrets
from datetime import datetime, timedelta
app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
import os
from werkzeug.utils import secure_filename

# Configuração para salvar as fotos de perfil
UPLOAD_FOLDER = 'static/uploads/perfil'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# Limitar o tamanho da foto (ex: 2MB)
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
@app.route('/')
def redirecionar():
    return  redirect(url_for('login'))

@app.route('/auth/setup',methods = ["GET","POST"])
def setup():
    if request.method == "GET":
      return  render_template('setup.html')
    else:
        data = request.get_json()
        nome = data.get('nome','').strip()
        email= data.get('email','').strip()
        senha = data.get('senha','').strip()
        senha_hash = generate_password_hash(senha)
        if not nome or not email or not senha:
          return jsonify({
                  'status' : "error",
                'message': "Preencha bem os Campos!"
            }),400
        else:
            try:
                conn = sqlite3.connect('users.db')
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO users (nome,email,senha) VALUES(?,?,?)           
                    """,(nome,email,senha_hash))
                conn.commit()
                return jsonify({
                    'status' : "ok",
                    'message': f"{nome} Cadastrado com sucesso!",
                    'redirect': url_for('login')
                })
            except sqlite3.IntegrityError:
                return jsonify({
                    'status': 'error',
                    'message': 'Este email já está cadastrado'
                }), 409
            finally:
                conn.close()
        
@app.route('/login',methods= ["GET","POST"])
def login():
     if request.method == "GET":
        return render_template('login.html')
     else:
        data = request.get_json()
        nome = data.get('nome','').strip()
        senha = data.get('senha','').strip()
        if not nome or not senha:
            return jsonify({
             "message": "Preencha bem os Campos!",
             "status" : "error"

         }),400
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE  email = ?",(nome,)
        )
        usuario = cursor.fetchone()
        conn.close()
        if not usuario:
            return jsonify({
                'status':'error',
                'message' :'Credenciais Invalidas'
            }),401
        senha_banco = usuario[3]
        if not check_password_hash(senha_banco, senha):
            return jsonify({
                'status':'error',
                'message':'Credenciais Invalidas'
            }),401
        session["usuario"] = usuario[0]
        return jsonify({
            'status':'ok',
            'message':'Sucesso',
            'redirect': url_for('admin_painel')
        })
@app.route('/admin-painel',methods= ["GET" ,"POST"])
def admin_painel():
    if not "usuario" in session:
        return redirect(url_for('login'))
    return render_template('admin-painel.html')
@app.route('/vendas')
def vendas():
    if not 'usuario'in session:
        return redirect(url_for('login'))
    
    return render_template('vendas.html')
@app.route('/api/api-vendas-data') # Certifica-te que o nome coincide com o fetch do JS
def api_vendas_data():
    if not 'usuario' in session:
        return jsonify({"status": "error", "message": "Não autorizado"}), 401
    
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()

        # 1. Criar lista dos últimos 7 dias (ex: ['2023-10-01', '2023-10-02'...])
        hoje = datetime.now()
        datas_ultimos_7 = [(hoje - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(6, -1, -1)]
        
        # Dicionários para armazenar os totais por dia
        vendas_por_dia = {data: 0 for data in datas_ultimos_7}
        lucro_por_dia = {data: 0 for data in datas_ultimos_7}

        # 2. Query para buscar somas agrupadas por data
        # Usamos DATE(data_hora) para ignorar os segundos/minutos e agrupar pelo dia
        cursor.execute("""
            SELECT DATE(data_hora) as dia, 
                   SUM(dinheiro_mao + tpa) as total_venda,
                   SUM(total_esperado) as total_lucro
            FROM fechamentos 
            WHERE dia >= ?
            GROUP BY dia
        """, (datas_ultimos_7[0],))
        
        resultados = cursor.fetchall()

        # 3. Preencher os dicionários com os dados do banco
        for r in resultados:
            dia_db, venda, lucro = r
            if dia_db in vendas_por_dia:
                vendas_por_dia[dia_db] = venda
                lucro_por_dia[dia_db] = lucro

        # 4. Formatar os Labels para nomes de dias da semana (Opcional, mas fica mais bonito)
        # Em vez de 2023-10-25, aparecerá "Qua" ou "25/10"
        labels_formatados = []
        dias_semana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        
        for d in datas_ultimos_7:
            dt_obj = datetime.strptime(d, '%Y-%m-%d')
            # Podes usar o nome do dia: dias_semana[dt_obj.weekday()]
            # Ou a data formatada: dt_obj.strftime('%d/%m')
            labels_formatados.append(dt_obj.strftime('%d/%m'))

        return jsonify({
            "status": "ok",
            "labels": labels_formatados,
            "vendas": [vendas_por_dia[d] for d in datas_ultimos_7],
            "lucro": [lucro_por_dia[d] for d in datas_ultimos_7]
        })

    except Exception as e:
        print(f"Erro nos gráficos: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()
@app.route('/produtos',methods=['GET',"POST"])
def produtos():
    if not 'usuario' in session:
        return render_template('login.html')
    if request.method == "GET":
        return render_template('produtos.html')
@app.route('/api/produtos/novo', methods=['POST'])
def novo_produto():
    if not 'usuario' in session:
        return jsonify({'status': 'error', 'message': 'Não autorizado'}), 401
    
    data = request.get_json()
    nome = data.get('nome', '').strip().upper()
    qtd = data.get('quantidade')
    compra = data.get('compra')
    venda = data.get('venda')

    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM produtos WHERE nome = ?", (nome,))
        if cursor.fetchone():
            return jsonify({'status': 'error', 'message': 'Este produto já existe!'}), 409

        cursor.execute("""
            INSERT INTO produtos (nome, preco_compra, preco_venda, quantidade)
            VALUES (?, ?, ?, ?)
        """, (nome, compra, venda, qtd))
        
        conn.commit()
        return jsonify({'status': 'ok', 'message': 'Produto adicionado!'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()
@app.route('/api/produtos')
def api_produtos():
    if not 'usuario'in session:
        return jsonify({'status':'error','message':'Não autorizado'}),401
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM produtos"
    )
    produtos= cursor.fetchall()
    conn.commit()
    conn.close()
    return jsonify({"status":"ok",'message':produtos})

@app.route('/api/produtos/editar', methods=['POST'])
def editar_produto():
    if not 'usuario' in session: return jsonify({'status': 'error'}), 401
    data = request.json
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE produtos 
            SET nome=?, preco_compra=?, preco_venda=?, quantidade=? 
            WHERE id=?
        """, (data['nome'].upper(), data['compra'], data['venda'], data['quantidade'], data['id']))
        conn.commit()
        return jsonify({'status': 'ok'})
    finally:
        conn.close()

@app.route('/api/produtos/eliminar/<int:id>', methods=['DELETE'])
def eliminar_produto(id):
    if not 'usuario' in session: return jsonify({'status': 'error'}), 401
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute("DELETE FROM produtos WHERE id = ?", (id,))
        conn.commit()
        return jsonify({'status': 'ok'})
    finally:
        conn.close()
@app.route('/relatorios')
def relatorios():
    if not 'usuario' in session:
        return render_template('login.html')
    return render_template('relatorio.html')
@app.route('/api/historico')
def api_historico():
    if not 'usuario'in session:
        return jsonify({"status":"error"}),401
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT h.data_venda, p.nome, h.quantidade, h.valor_total, h.lucro_total 
        FROM historico_vendas h
        JOIN produtos p ON h.produto_id = p.id
        ORDER BY h.data_venda DESC
    """)
    historico = cursor.fetchall()
    conn.close()
    return jsonify({"status": "ok", "dados": historico})
@app.route('/api/fecho_caixa', methods=['POST'])
def fecho_caixa():
    if not 'usuario' in session: return jsonify({'status': 'error'}), 401
    
    dados = request.json 
    vendas = dados.get('vendas', [])
    
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        for item in vendas:
            p_id = item['id']
            qtd_vendida = int(item['qtd'])
            
            if qtd_vendida <= 0: continue


            cursor.execute("SELECT preco_compra, preco_venda, nome FROM produtos WHERE id = ?", (p_id,))
            p_compra, p_venda, nome = cursor.fetchone()
            
            valor_total = p_venda * qtd_vendida
            lucro_total = (p_venda - p_compra) * qtd_vendida

            cursor.execute("""
                INSERT INTO historico_vendas (produto_id, quantidade, valor_total, lucro_total)
                VALUES (?, ?, ?, ?)
            """, (p_id, qtd_vendida, valor_total, lucro_total))

            cursor.execute("UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?", (qtd_vendida, p_id))

        conn.commit()
        return jsonify({'status': 'ok', 'message': 'Fecho de caixa realizado!'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()
@app.route('/api/salvar_relatorio', methods=['POST'])
def salvar_relatorio():
    if not 'usuario' in session:
        return jsonify({'status': 'error'}), 401
    
    dados = request.json
    produtos = dados.get('produtos', [])
    
    cash = float(dados.get('dinheiro_mao', 0))
    tpa = float(dados.get('tpa', 0))
    total_informado = cash + tpa
    total_esperado = float(dados.get('total_esperado', 0))
    diferenca = total_informado - total_esperado
    status = "OK" if diferenca >= 0 else "QUEBRA"

    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO fechamentos (total_esperado, dinheiro_mao, tpa, diferenca, status)
            VALUES (?, ?, ?, ?, ?)
        """, (total_esperado, cash, tpa, diferenca, status))
        
        relatorio_id = cursor.lastrowid

        for p in produtos:
            qtd_venda = int(p['inicial']) - int(p['final'])
            
            cursor.execute("""
                INSERT INTO historico_detalhado 
                (fechamento_id, produto_nome, quantidade_inicial, quantidade_final, quantidade_vendida, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (relatorio_id, p['nome'], p['inicial'], p['final'], qtd_venda, p['subtotal']))

         
            cursor.execute("UPDATE produtos SET quantidade = ? WHERE nome = ?", (p['final'], p['nome']))

        conn.commit() 
        return jsonify({'status': 'ok', 'message': 'Relatório guardado e stock atualizado!'})

    except Exception as e:
        conn.rollback() 
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()
    
@app.route('/api/lista_fechamentos')
def lista_fechamentos():
    if not 'usuario' in session:
        return jsonify({'status': 'error'}), 401
    
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        # 1. Busca a lista para a tabela (o que já tinhas)
        cursor.execute("""
            SELECT id, data_hora, total_esperado, (dinheiro_mao + tpa) as total_informado, 
                   diferenca, status 
            FROM fechamentos 
            ORDER BY data_hora DESC
        """)
        fechos = cursor.fetchall()
        
        # 2. CALCULA OS TOTAIS PARA OS CARDS DO TOPO
        # Soma tudo o que foi vendido (dinheiro real que entrou)
        cursor.execute("SELECT SUM(dinheiro_mao + tpa) FROM fechamentos")
        total_vendas = cursor.fetchone()[0] or 0
        
        # Soma apenas as quebras (onde a diferença é negativa)
        cursor.execute("SELECT SUM(diferenca) FROM fechamentos WHERE diferenca < 0")
        total_quebras = cursor.fetchone()[0] or 0

        lista = []
        for f in fechos:
            lista.append({
                'id': f[0], 'data': f[1], 'esperado': f[2],
                'informado': f[3], 'diferenca': f[4], 'status': f[5]
            })
            
        return jsonify({
            'status': 'ok', 
            'dados': lista,
            'resumo_topo': {
                'vendas_acumuladas': total_vendas,
                'quebras_acumuladas': abs(total_quebras) # Transformamos em positivo para exibir no card
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()
@app.route('/api/detalhes_fechamento/<int:id>')
def detalhes_fechamento(id):
    if not 'usuario' in session: return jsonify({'status': 'error'}), 401
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        # Busca info do fechamento
        cursor.execute("SELECT total_esperado, (dinheiro_mao + tpa), diferenca, status FROM fechamentos WHERE id = ?", (id,))
        f = cursor.fetchone()
        resumo = {"esperado": f[0], "informado": f[1], "diferenca": f[2], "status": f[3]}
        
        # Busca produtos vendidos nesse fechamento
        cursor.execute("SELECT produto_nome, quantidade_vendida, subtotal FROM historico_detalhado WHERE fechamento_id = ?", (id,))
        prods = [{"nome": row[0], "qtd": row[1], "subtotal": row[2]} for row in cursor.fetchall()]
        
        conn.close()
        return jsonify({'status': 'ok', 'resumo': resumo, 'produtos': prods})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
@app.route('/api/eliminar_fechamento/<int:id>', methods=['DELETE'])
def eliminar_fechamento(id):
    if not 'usuario' in session: 
        return jsonify({'status': 'error', 'message': 'Sessão expirada'}), 401
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        # Apaga os detalhes e o resumo
        cursor.execute("DELETE FROM historico_detalhado WHERE fechamento_id = ?", (id,))
        cursor.execute("DELETE FROM fechamentos WHERE id = ?", (id,))
        conn.commit()
        return jsonify({'status': 'ok', 'message': 'Relatório removido!'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()
@app.route('/api/stats_dashboard')
def stats_dashboard():
    if not 'usuario' in session: return jsonify({'status': 'error'}), 401
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        # 1. Vendas de Hoje (Soma dinheiro_mao + tpa dos relatórios de hoje)
        # Nota: Ajusta 'date(data_hora)' se o formato da tua data for diferente
        cursor.execute("SELECT SUM(dinheiro_mao + tpa) FROM fechamentos WHERE date(data_hora) = date('now')")
        vendas_hoje = cursor.fetchone()[0] or 0
        
        # 2. Total de Produtos cadastrados
        cursor.execute("SELECT COUNT(*) FROM produtos")
        total_prods = cursor.fetchone()[0] or 0
        
        # 3. Lucro Total Acumulado (Soma de todos os 'total_esperado' registrados)
        cursor.execute("SELECT SUM(total_esperado) FROM fechamentos")
        lucro_bruto = cursor.fetchone()[0] or 0
        
        conn.close()
        return jsonify({
            'status': 'ok',
            'vendas_hoje': vendas_hoje,
            'total_produtos': total_prods,
            'lucro_total': lucro_bruto
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == "__main__":
    app.run(debug=True)