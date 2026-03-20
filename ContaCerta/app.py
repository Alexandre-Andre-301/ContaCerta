from flask import Flask, render_template, session, jsonify,request,url_for,redirect
from werkzeug.security import generate_password_hash,check_password_hash
import sqlite3
import secrets
app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
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
@app.route('/api/vendas-data')
def api_vendas_data():
    if not 'usuario' in session:
        return jsonify({"status": "error", "message": "Não autorizado"}), 401
    
    data = {
        "labels": ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
        "vendas": [15000, 28000, 19000, 32000, 45000, 60000, 35000],
        "lucro": [5000, 9500, 6200, 11000, 15000, 22000, 12000]
    }
    return jsonify(data)

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
        
        cursor.execute("""
            SELECT id, data_hora, total_esperado, (dinheiro_mao + tpa) as total_informado, 
                   diferenca, status 
            FROM fechamentos 
            ORDER BY data_hora DESC
        """)
        
        fechos = cursor.fetchall()
        
        lista = []
        for f in fechos:
            lista.append({
                'id': f[0],
                'data': f[1],
                'esperado': f[2],
                'informado': f[3],
                'diferenca': f[4],
                'status': f[5]
            })
            
        return jsonify({'status': 'ok', 'dados': lista})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        conn.close()
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == "__main__":
    app.run(debug=True)