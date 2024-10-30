import psycopg2
from werkzeug.security import generate_password_hash

hashed_password = generate_password_hash("admin")


conn = psycopg2.connect(database="flask_db",host="localhost",user="postgres",password="password",port="5432")

cur = conn.cursor()

cur.execute('''CREATE TABLE IF NOT EXISTS servers (id serial PRIMARY KEY, name varchar(15), ip varchar(15))''')
cur.execute('''INSERT INTO servers (name, ip) VALUES (%s,%s) ''', ("Novus", "172.26.79.205"))

cur.execute('''CREATE TABLE IF NOT EXISTS tempOBS (id serial PRIMARY KEY, temperature integer, time timestamp, server_id integer, 
            CONSTRAINT fk_server FOREIGN KEY(server_id) REFERENCES servers(id), UNIQUE (server_id, time))''')
cur.execute('''INSERT INTO tempOBS (temperature, time, server_id) VALUES (%s,%s,%s)''',('19','2024-09-05 13:51:25','1'))

cur.execute('''CREATE TABLE IF NOT EXISTS auth (id serial PRIMARY KEY, username varchar(15),password varchar(255))''')
cur.execute('''INSERT INTO auth (username,password) VALUES (%s,%s)''',('admin',hashed_password))

conn.commit()
cur.close()
conn.close()