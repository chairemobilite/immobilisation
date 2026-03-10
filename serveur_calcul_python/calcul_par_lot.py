import classes.parking_inventory as PI
import serveur_calcul_python.calcs.calcs_inventaire as IC
import sys
import os
import config.config_db as cf_db
import psycopg2
import debugpy
import time
from psycopg2 import OperationalError
if __name__=="__main__":
    #print(sys.argv)
    try:
        lot_a_analyser = sys.argv[1]
        if os.getenv("DEBUGPY_CALC_ENABLE", "true").lower() == "true":
            print(f'Lot à analyser: {lot_a_analyser}')
            time.sleep(10) 
            debugpy.listen(("0.0.0.0", 5678))
            print("Waiting for debugger attach...")
            debugpy.wait_for_client()
            print("Debugger attached!")
            # Établir la connexion
            connection = psycopg2.connect(cf_db.pg_string)
            print("Connexion à la base de données réussie")
        #breakpoint()
        inventaire_lot = IC.calculate_inventory_by_lot(lot_a_analyser)
        json_inventaire_quartier = inventaire_lot.to_json()
        #breakpoint()
        print(json_inventaire_quartier)
    except OperationalError as e:
        print(f"Erreur de connexion : {e}")
        #breakpoint()