import psycopg2
from werkzeug.security import generate_password_hash

hashed_password = generate_password_hash("Fearless21!")


conn = psycopg2.connect(database="flask_db",host="localhost",user="postgres",password="password",port="5432")

cur = conn.cursor()

cur.execute('''CREATE TABLE IF NOT EXISTS sensors (id serial PRIMARY KEY, name varchar(15), ip varchar(15))''')
cur.execute('''INSERT INTO sensors (name, ip) VALUES (%s,%s) ''', ("Novus1", "172.26.79.205"))
cur.execute('''INSERT INTO sensors (name, ip) VALUES (%s,%s) ''', ("Novus2", "172.26.79.205"))


cur.execute('''CREATE TABLE IF NOT EXISTS tempOBS (id serial PRIMARY KEY, temperature float, time timestamp, sensor_id integer, 
            CONSTRAINT fk_sensor FOREIGN KEY(sensor_id) REFERENCES sensors(id), UNIQUE (sensor_id, time))''')

cur.execute('''CREATE TABLE IF NOT EXISTS HumOBS (id serial PRIMARY KEY, humidity float, time timestamp, sensor_id integer, 
            CONSTRAINT fk_sensor FOREIGN KEY(sensor_id) REFERENCES sensors(id), UNIQUE (sensor_id, time))''')

cur.execute('''CREATE TABLE IF NOT EXISTS auth (id serial PRIMARY KEY, username varchar(15),password varchar(255))''')
cur.execute('''INSERT INTO auth (username,password) VALUES (%s,%s)''',('root',hashed_password))

conn.commit()
cur.close()
conn.close()