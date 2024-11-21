from pymodbus.client import ModbusTcpClient
from pymodbus.payload import BinaryPayloadDecoder
from pymodbus.constants import Endian
import time
import requests
from datetime import timedelta, datetime

# Replace with your FieldLogger's IP and port
FIELDLOGGER_IP = "172.26.79.205"
PORT = 502

# Replace with your Flask API endpoint URL
API_ENDPOINT = "http://localhost:5000/data"  # Replace with your actual API URL

# Connect to the FieldLogger
client = ModbusTcpClient(FIELDLOGGER_IP, port=PORT)

if client.connect():
    print("Connected to FieldLogger.")
    
    try:
        while True:
            # Read registers for all 4 values (adjust register addresses as needed)
            
            result = client.read_holding_registers(0, 10, slave=255) 
            if result.isError():
                print("Error reading registers.",result)
            
            else:
                # Decode the values
                temperature1 = result.registers[3] / 100.0 
                temperature2 = result.registers[5] / 100.0
                humidity1 = result.registers[4] / 100.0
                humidity2 = result.registers[6] / 100.0


                print(f"Temperature 1: {temperature1} °C")
                print(f"Temperature 2: {temperature2} °C")
                print(f"Humidity 1: {humidity1} %")
                print(f"Humidity 2: {humidity2} %")
                
                time1 = datetime.now()
                current_time_str = time1.strftime("%Y-%m-%d %H:%M:%S")
                # Prepare the data payload
                payload = {
                    "temperature1": temperature1,
                    "temperature2": temperature2,
                    "humidity1": humidity1,
                    "humidity2": humidity2,
                    "time":current_time_str
                }

                # Send the data to the API
                
                try:
                    response = requests.post(API_ENDPOINT, json=payload)
                    if response.status_code == 201:
                        print("Data successfully sent to API.")
                    else:
                        print(f"Failed to send data. Status code: {response.status_code}, Response: {response.text}")
                except Exception as e:
                    print(f"Error sending data to API: {e}")
            
            # Wait for 1 second before reading the next set of values
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopped by user.")
    finally:
        client.close()
else:
    print("Failed to connect to FieldLogger.")