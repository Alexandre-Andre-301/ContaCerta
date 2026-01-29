"""import sqlite3
conn = sqlite3.connect("users.db")
cursor = conn.cursor()
cursor.execute(
    """#CREATE TABLE IF NOT EXISTS users(
    #id INTEGER PRIMARY KEY AUTOINCREMENT,
    #nome TEXT NOT NULL,
    #email TEXT UNIQUE NOT NULL,
    #senha TEXT NOT NULL
    #)"""
#)
#conn.commit()
#conn.close()
import sqlite3
conn = sqlite3.connect("users.db")
cursor = conn.cursor()

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
conn.close()