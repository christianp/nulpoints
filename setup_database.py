import sqlite3

conn = sqlite3.connect('ratings.db')
conn.execute('''CREATE TABLE users (id integer primary key, name varchar(200), ratings text)''')
conn.commit()
conn.close()
