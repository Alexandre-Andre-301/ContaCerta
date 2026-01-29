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

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == "__main__":
    app.run(debug=True)