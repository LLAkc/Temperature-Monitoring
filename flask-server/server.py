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





@app.route('/dem-data', methods=['GET','POST'])
@jwt_required()
def get_dem_data():
    if request.method == 'POST':

        conn = connect_db()
        cur = conn.cursor()

        data = request.get_json()

        server = data.get('name')
        temperature = data.get('temperature')
        time = data.get('time')
        
        try:
            cur.execute('''INSERT INTO servers (name, temperature, time) VALUES (%s, %s, %s)''',(server, temperature, time))
            conn.commit()

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
        '''
        for i in range(24 * 60):  # 1440 minutes in a day
            x =  round(np.random.uniform(low=20.0, high=30.0),2)
            timestamp = start_time + timedelta(minutes=i)'''
            
        
            
        
        cur.execute('''SELECT servers.name, tempOBS.temperature, 
                    tempOBS.time FROM servers JOIN tempOBS on servers.id = tempOBS.server_id''')
        tempValues = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        print(tempValues[1])
        
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

    cur.execute('''SELECT temperature, time FROM tempOBS WHERE time >= %s AND time < %s AND server_id = %s''',
                (start_time, end_time, '1'))

    data = cur.fetchall()
    response_data = {
        "time": [record[1].strftime('%H:%M:%S') for record in data],
        "Temperature1": [record[0] for record in data],
        "Temperature2": [record[0] + 1 for record in data],
        "Humidity1": [record[0] + 2 for record in data],
        "Humidity2": [record[0] + 3 for record in data]
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

# Run the function to start inserting data
insert_data()





sensors = [
    {"id": 1, "x": 1, "y": 1, "temperature": 22},
    {"id": 2, "x": 4, "y": 3, "temperature": 27}
]

def interpolate_temperature(x, y):
    # Simple bilinear interpolation for demonstration
    x1, y1, t1 = sensors[0]['x'], sensors[0]['y'], sensors[0]['temperature']
    x2, y2, t2 = sensors[1]['x'], sensors[1]['y'], sensors[1]['temperature']
    weight1 = 1 / (np.sqrt((x - x1)**2 + (y - y1)**2) + 1e-5)
    weight2 = 1 / (np.sqrt((x - x2)**2 + (y - y2)**2) + 1e-5)
    temperature = (t1 * weight1 + t2 * weight2) / (weight1 + weight2)
    return temperature

@app.route('/heatmap', methods=['GET'])
def get_heatmap_data():
    grid_size = 5  # Define grid size for the room
    heatmap_data = []
    
    for x in range(grid_size):
        row = []
        for y in range(grid_size):
            temperature = interpolate_temperature(x, y)
            row.append({"x": x, "y": y, "temperature": temperature})
        heatmap_data.append(row)
    
    print(heatmap_data)
    return jsonify(heatmap_data)

@app.route('/sensors', methods=['GET'])
def get_sensors():
    return jsonify(sensors)