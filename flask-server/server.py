import numpy as np
from scipy import interpolate
from flask import Flask, jsonify, request, Response 
from flask_cors import CORS
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash  # For hashing passwords
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity  # JWT handling
from datetime import timedelta, datetime

app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = 'agkasdgmdlşfbhmklbhsnfşögnhj' 
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=12)
jwt = JWTManager(app)


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    try:
        conn = connect_db()
        cur = conn.cursor()

        # Check if the user exists
        cur.execute('SELECT password FROM auth WHERE username = %s', (username,))
        user = cur.fetchone()

        cur.close()
        conn.close()
        if user and check_password_hash(user[0], password):  # Check if the password matches
            # Create JWT token
            access_token = create_access_token(identity={'username': username})
            return jsonify({'access_token': access_token}), 200
        else:
            return jsonify({'message': 'Invalid username or password'}), 401

    except BaseException as e:
        print(e)
        return jsonify({'message': 'Error logging in'}), 400

@app.route('/data', methods = ['POST'] )
def saveData():
    conn = connect_db()
    cur = conn.cursor()
    data = request.get_json()
    temperature1 = data.get('temperature1')
    temperature2 = data.get('temperature2')
    humidty1 = data.get('humidity1')
    humidty2 = data.get('humidity2')
    time = data.get('time')

    try:
        cur.execute('''INSERT INTO tempOBS (temperature, time, sensor_id) VALUES (%s, %s, %s)''',(temperature1, time, 1))
        cur.execute('''INSERT INTO tempOBS (temperature, time, sensor_id) VALUES (%s, %s, %s)''',(temperature2, time, 2))
        cur.execute('''INSERT INTO humOBS (humidity, time, sensor_id) VALUES (%s, %s, %s)''',(humidty1, time, 1))
        cur.execute('''INSERT INTO humOBS (humidity, time, sensor_id) VALUES (%s, %s, %s)''',(humidty2, time, 2))
        
        
        conn.commit()

        cur.close()
        conn.close()

    except BaseException as e  :
        print(e)
        return jsonify({'message': 'error'}), 301

    return jsonify({'message': 'success'}), 201
        



@app.route('/dem-data', methods=['GET','POST'])
@jwt_required()
def get_dem_data():
    if request.method == 'POST':

        

        data = request.get_json()

        server = data.get('name')

        temperature = data.get('temperature')
        time = data.get('time')
        
        try:
            conn = connect_db()
            cur = conn.cursor()
            #cur.execute('''INSERT INTO servers (name, temperature, time) VALUES (%s, %s, %s)''',(server, temperature, time))
            #conn.commit()

            cur.close()
            conn.close()

        except BaseException as e  :
            print(e)
            return jsonify({'message': 'error'}), 301

        return jsonify({'message': 'success'}), 201 
        
    else:
        #values in database
        conn = connect_db()
        cur = conn.cursor()
        start_time = datetime.combine(datetime.today(), datetime.min.time())
            
        
            

        # Original grid data
        x = np.arange(0, 11, 1)
        y = np.arange(0, 11, 1)
        x, y = np.meshgrid(x, y)
        z = np.ones([11, 11]) 
        
        #z[2,8] = 20
        #z[8,2] = 20
        z[8,8] = 20
        z[2,2] = 10
        '''
        for j in range(11):
            for i in range(11):
                z[j,i] = z[8,8]/np.square(np.abs((12-i))+np.abs((12-j)))
                print(z[j,i])
        print(z)'''

        # Interpolated grid data
        xnew = np.linspace(0, 10, num=100)
        ynew = np.linspace(0, 10, num=100)
        tck = interpolate.bisplrep(x.ravel(), y.ravel(), z.ravel(), s=750)
        znew = interpolate.bisplev(xnew, ynew, tck)
        #znew += 20- znew.max()
        xnew, ynew = np.meshgrid(xnew, ynew)


        # Send interpolated data to frontend
        return jsonify({
            'x': xnew.tolist(),
            'y': ynew.tolist(),
            'z': znew.tolist()
        })



@app.route("/chart" , methods = ['GET'])
@jwt_required()
def Chart():
    conn = connect_db()
    cur = conn.cursor()

    # Get the date from the query parameter, default to today's date
    date_str = request.args.get('date', datetime.today().strftime('%Y-%m-%d'))
    start_time = datetime.strptime(date_str, '%Y-%m-%d')
    end_time = start_time + timedelta(days=1)
    print(start_time,end_time)

    cur.execute('''SELECT temperature, time FROM tempOBS WHERE time >= %s AND time < %s AND sensor_id = %s''',
                (start_time, end_time, '1'))
    data1 = cur.fetchall()

    cur.execute('''SELECT temperature, time FROM tempOBS WHERE time >= %s AND time < %s AND sensor_id = %s''',
                (start_time, end_time, '2'))
    data2 = cur.fetchall()

    cur.execute('''SELECT humidity, time FROM humOBS WHERE time >= %s AND time < %s AND sensor_id = %s''',
                (start_time, end_time, '1'))
    data3 = cur.fetchall()

    cur.execute('''SELECT humidity, time FROM humOBS WHERE time >= %s AND time < %s AND sensor_id = %s''',
                (start_time, end_time, '2'))
    data4 = cur.fetchall()

    response_data = {
        "time": [record[1].strftime('%H:%M:%S') for record in data1],
        "Temperature1": [record[0] for record in data1],
        "Temperature2": [record[0] for record in data2],
        "Humidity1": [record[0] for record in data3],
        "Humidity2": [record[0] for record in data4]
    }
    cur.close()
    conn.close()
    return jsonify(response_data)
    


def connect_db():
    conn = psycopg2.connect(database="flask_db",host="localhost",user="postgres",password="password",port="5432")
    return conn


def insert_data():
    conn = connect_db()
    cur = conn.cursor()

    try:
        while True:
            # Generate a random temperature between 20.0 and 30.0 (in Celsius)
            temperature = round(np.random.uniform(20.0, 30.0), 2)
            
            # Get the current timestamp
            timestamp = (datetime.now() + timedelta(days=1)).replace(microsecond=0)
            
            # Insert data into the database
            cur.execute(
                '''INSERT INTO tempOBS (temperature, time, server_id) VALUES (%s, %s, %s)''',
                (temperature, timestamp, 1)
            )
            
            # Commit changes to the database
            conn.commit()
            print(f"Inserted data - Temperature: {temperature}°C, Time: {timestamp}, Server ID: 1")
            
            # Wait for 5 seconds before the next insertion
            time.sleep(1)

    except KeyboardInterrupt:
        print("Data insertion stopped.")
        
    except Exception as e:
        print("An error occurred:", e)
        
    finally:
        # Close the database connection
        cur.close()
        conn.close()


