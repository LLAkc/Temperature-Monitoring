
from datetime import timedelta

class Config:
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:password@localhost:5432/flask_db"
    SQL_ALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "agkasdgmdl\u015fbhmklbhsnf\u00f6gnhj"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=365)