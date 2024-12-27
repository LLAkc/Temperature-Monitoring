from . import db
from sqlalchemy.dialects.postgresql import ARRAY

class Sensors(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(80), nullable = False, unique = True)
    ip = db.Column(db.String(80), nullable = False)
    data_types = db.Column(ARRAY(db.String), nullable = False, default = list)

class TempOBS(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    temperature = db.Column(db.Float, nullable = False)
    time = db.Column(db.DateTime, nullable = False, unique = True) 
    sensor_id = db.Column(db.Integer, nullable = False)

class HumOBS(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    humidity = db.Column(db.Float, nullable = False)
    time = db.Column(db.DateTime, nullable = False, unique = True)
    sensor_id = db.Column(db.Integer, nullable = False)

class Auth(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(80), nullable = False)
    password = db.Column(db.String(200), nullable = False)