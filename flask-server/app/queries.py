from .models import TempOBS, HumOBS, Auth, Sensors
from werkzeug.security import check_password_hash,generate_password_hash
from . import db

class DataTypes():
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"

def get_sensor_by_name(name):
    return Sensors.query.filter_by(Sensors.name == name).first()

def get_user_by_username(username):
    return Auth.query.filter_by(username=username).first()

def insert_temperature_data(temperature,time,sensor_id):
    new_entry = TempOBS(temperature=temperature, time=time, sensor_id = sensor_id)
    db.session.add(new_entry)
    db.session.commit()

def insert_humidity_data(humidity, time, sensor_id):
    new_entry = HumOBS(humidity=humidity, time=time, sensor_id = sensor_id)
    db.session.add(new_entry)
    db.session.commit()

def fetch_sensor_data(start_time, end_time, sensor_name):
    sensor = get_sensor_by_name(sensor_name)
    sensor_id = sensor.id
    data_types = sensor.data_types
    sensor_data = {}

    if "temperature" in data_types:
        temperature_data = TempOBS.query.filter(
            TempOBS.time >= start_time,
            TempOBS.time < end_time,
            TempOBS.sensor_id == sensor_id
        ).all()
        sensor_data["temperature"] = [
            {"time": record.time.strftime("%d-%m-%Y %H:%M:%S"), "value": record.temperature}
            for record in temperature_data
        ]

    if "humidity" in data_types:
        humidity_data = HumOBS.query.filter(
            HumOBS.time >= start_time,
            HumOBS.time < end_time,
            HumOBS.sensor_id == sensor_id
        ).all()
        sensor_data["humidity"] = [
            {"time": record.time.strftime("%d-%m-%Y %H:%M:%S"), "value": record.humidity}
            for record in humidity_data
        ]

    return sensor_data
        
