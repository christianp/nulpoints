import sqlite3

conn = sqlite3.connect('ratings.db')

if __name__ == '__main__':
	conn.execute('''CREATE TABLE users (id integer primary key, token varchar(64), name varchar(200), party varchar(200), ratings text)''')
	conn.commit()
	conn.close()
