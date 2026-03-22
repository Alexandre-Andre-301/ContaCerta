import sqlite3
conn = sqlite3.connect("users.db")
cursor = conn.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL
    )
"""
    
)
conn.commit()



cursor.execute("""
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco_compra REAL NOT NULL,
    preco_venda REAL NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0
)
""")

conn.commit()

cursor.execute("""
CREATE TABLE IF NOT EXISTS historico_vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER,
    quantidade INTEGER,
    valor_total REAL,
    lucro_total REAL,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(produto_id) REFERENCES produtos(id)
)
""")

conn.commit()
conn.close()

def criar_tabelas_relatorio():
    conn = sqlite3.connect("users.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fechamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_esperado REAL,
        dinheiro_mao REAL,
        tpa REAL,
        diferenca REAL,
        status TEXT
    )
    """)


    cursor.execute("""
    CREATE TABLE IF NOT EXISTS historico_detalhado (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fechamento_id INTEGER,
        produto_nome TEXT,
        quantidade_inicial INTEGER,
        quantidade_final INTEGER,
        quantidade_vendida INTEGER,
        subtotal REAL,
        FOREIGN KEY(fechamento_id) REFERENCES fechamentos(id)
    )
    """)
    conn.commit()
    conn.close()

criar_tabelas_relatorio()