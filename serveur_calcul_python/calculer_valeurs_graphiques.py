"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Entry point to calculate parking graphs. Was seriously rejigged in 
2026 to farm out calculation to a dedicated utility rather than 
running a lot of it in the entry point itslef
"""

import sys
import json
import classes.parking_inventory as PI
import os
import debugpy
import time
import psycopg2
import config.config_db as cf_db
import classes.parking_regs as PR
import classes.parking_reg_sets as PRS
import utilitaires.frontend_chart_data_processing as FCDP

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

    json_out= FCDP.process_chart_creation(array)
    
    
    # Print the result to stdout
    print(json_out)

if __name__ == '__main__':
    main()