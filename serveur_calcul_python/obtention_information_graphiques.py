"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Entry point to get the required units for the regulations which are
specified by the user. He then has to opt out of parking regulations
which contain multiple units
"""

import os
import debugpy
import sys
import psycopg2
import config.config_db as cf_db
from psycopg2 import OperationalError
import time
import json
import utilitaires.frontend_chart_data_processing as FCDP

if __name__=="__main__":
    #print(sys.argv)
    try:
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
        df_out = FCDP.obtain_parking_regulations_info_for_graph(array)
        json_out = df_out.to_json(orient='records',force_ascii=False) 
        print(json_out)
        #breakpoint()
    except OperationalError as e:
        print(f"Erreur de connexion : {e}")
        #breakpoint()
    