import classes.parking_inventory as PI
import calcs.inventory_calcs as IC
import sys
import json
import psycopg2
from psycopg2 import OperationalError
import config.config_db as cf_db
import debugpy
import time
import os

if __name__=="__main__":
    #print(sys.argv)
    try:
        quartier_a_analyser = int(sys.argv[1])
        if os.getenv("DEBUGPY_CALC_ENABLE", "true").lower() == "true":
            print(f'Quartier à analyser: {quartier_a_analyser}')
            time.sleep(10) 
            debugpy.listen(("0.0.0.0", 5678))
            print("Waiting for debugger attach...")
            debugpy.wait_for_client()
            print("Debugger attached!")
            # Établir la connexion
            connection = psycopg2.connect(cf_db.pg_string)
            print("Connexion à la base de données réussie")
        inventaire_quartier = IC.calculate_inventory_by_analysis_sector(quartier_a_analyser)
        #print(inventaire_quartier)
        json_inventaire_quartier = inventaire_quartier.to_json()
        #breakpoint()
        print(json_inventaire_quartier)
    except OperationalError as e:
        print(f"Erreur de connexion : {e}")
        #breakpoint()
    