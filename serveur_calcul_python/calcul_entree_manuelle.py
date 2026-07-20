"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Entry point for the semi manual calculation of required parking
Here the user specifies the relevant units and the rules which applied
at time and place are applied.
"""

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
import config.config_db as config_db
import classes.parking_regs as PR
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
    PII_transmit.check_columns()
    reglements_a_calc:list[int] = PII_transmit[config_db.db_column_parking_regs_id].unique().tolist()
    reglements:PR.ParkingRegulations = PR.from_postgis(reglements_a_calc)
    reglements.validate()
    # Perform your calculations here
    inventaire = PI.calculate_inventory_from_inputs_class(PII_transmit,reglements)
    # convert dataframe to string for dumping it to console
    string_output = inventaire.to_json()
    # Print the result to stdout
    print(string_output)

if __name__ == '__main__':
    main()