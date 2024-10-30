import numpy as np
from scipy import interpolate
from flask import Flask, jsonify, request, Response 
from flask_cors import CORS
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash  # For hashing passwords
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity  # JWT handling
from datetime import timedelta

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
        cur.execute('''SELECT servers.name, tempOBS.temperature, 
                    tempOBS.time FROM servers JOIN tempOBS on servers.id = tempOBS.server_id''')
        tempValues = cur.fetchone()
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
    return jsonify({
        'Temperature1':23,
        'Temperature2':27,
        'Humidity1':33,
        'Humidity2':38
    })


def connect_db():
    conn = psycopg2.connect(database="flask_db",host="localhost",user="postgres",password="password",port="5432")
    return conn






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