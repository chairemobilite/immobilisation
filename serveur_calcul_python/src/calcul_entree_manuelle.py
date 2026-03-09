import sys
import json
import pandas as pd
import classes.parking_inventory as PI
import os
import debugpy
import time
import psycopg2
import config.config_db as cf_db
import classes.parking_inventory_inputs as PII
import calcs.inventory_calcs as IC

def main():
    if os.getenv("DEBUGPY_CALC_ENABLE", "true").lower() == "true":
            time.sleep(10)
            debugpy.listen(("0.0.0.0", 5678))
            print("Waiting for debugger attach...")
            debugpy.wait_for_client()
            print("Debugger attached!")
            # Établir la connexion
            connection = psycopg2.connect(cf_db.pg_string)
            print("Connexion à la base de données réussie")
    # Read the JSON data from stdin
    data = sys.stdin.read()

    # Deserialize the JSON data to a Python list of dictionaries
    array = json.loads(data)

    # Convert the list of dictionaries to a DataFrame
    PII_transmit = PII.ParkingCalculationInputs(array)

    # Perform your calculations here
    inventaire = IC.calculate_inventory_from_inputs_class(PII_transmit)
    # convert dataframe to string for dumping it to console
    string_output = inventaire.to_json()
    # Print the result to stdout
    print(string_output)

if __name__ == '__main__':
    main()