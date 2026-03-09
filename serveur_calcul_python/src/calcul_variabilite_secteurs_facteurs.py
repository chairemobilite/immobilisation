import os
import calcs.variability_analysis as VA
import config.config_db as cf
import sqlalchemy
import debugpy
import time
import psycopg2
if __name__== "__main__":
    try:
        if os.getenv("DEBUGPY_CALC_ENABLE", "false").lower() == "true":
            time.sleep(10)
            debugpy.listen(("0.0.0.0", 5678))
            print("Waiting for debugger attach...")
            debugpy.wait_for_client()
            print("Debugger attached!")
            # Établir la connexion
            connection = psycopg2.connect(cf.pg_string)
            print("Connexion à la base de données réussie")
        con = sqlalchemy.create_engine(cf.pg_string)
        success = VA.analyse_variabilite(con,[0.75,1,1.25])
        if success:
            print('[true]')
        else:
            print('[false]')
    except Exception as e:
       print('caught exception in calcul_variabilite_secteurs_facteurs [false]')