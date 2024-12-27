from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, create_access_token
from datetime import datetime, timedelta
import numpy as np
from scipy import interpolate
from .queries import get_user_by_username, insert_temperature_data, insert_humidity_data, fetch_sensor_data, DataTypes
from werkzeug.security import check_password_hash

api_blueprint = Blueprint("api",__name__)

@api_blueprint.route("/login", methods = ["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = get_user_by_username(username)
    if user and check_password_hash(user.password,password):
        access_token = create_access_token(identity={"username": username})
        return jsonify({"access_token":access_token}),200
    return jsonify({"message":"Invalid username or password"}),401

@api_blueprint.route("/data", methods = ["POST"])
def save_data():
    data = request.get_json()
    t1 = data.get("temperature1")
    t2 = data.get("temperature2")
    
    h1 = data.get("humidity1")
    h2 = data.get("humidity2")

    time = datetime.fromisoformat(data.get("time"))

    try:
        insert_temperature_data(t1,time,1)
        insert_temperature_data(t2,time,2)
        insert_humidity_data(h1,time,1)
        insert_humidity_data(h2,time,2)

        return jsonify({"message":"success"}), 201

    except Exception as e:
        print(e)
        return jsonify({"message":"error"}), 400


@api_blueprint.route("/chart", methods = ["GET"])
@jwt_required()
def chart():
    data = request.get_json()
    date = data.get("date")
    start_time = data.get("start_time")
    end_time = data.get("duration")
    sensor_names = data.get("sensor_names",[])
    result = {}

    if not sensor_names:
        return jsonify({"message": "No sensor name provided"}), 400
    
    for sensor_name in sensor_names:
        result[sensor_name] = fetch_sensor_data(start_time, end_time, sensor_name)
    
    return result


@api_blueprint.route("/dem-data", methods=["GET"])
@jwt_required()
def get_dem_data():
    x = np.arange(0, 11, 1)
    y = np.arange(0, 11, 1)
    x, y = np.meshgrid(x, y)
    z = np.ones([11, 11])
    z[8, 8] = 20
    z[2, 2] = 10

    xnew = np.linspace(0, 10, num=100)
    ynew = np.linspace(0, 10, num=100)
    tck = interpolate.bisplrep(x.ravel(), y.ravel(), z.ravel(), s=750)
    znew = interpolate.bisplev(xnew, ynew, tck)
    xnew, ynew = np.meshgrid(xnew, ynew)

    return jsonify({
        "x": xnew.tolist(),
        "y": ynew.tolist(),
        "z": znew.tolist()
    })  

