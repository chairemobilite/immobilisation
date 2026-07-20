"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Entry point to conduct variability analysis which aims to apply all 
the regulations to all the properties in the city with the aim of 
understand how aggregate parking supply could vary depending on regulations
"""

import os
import classes.parking_inventory as PI
import classes.parking_inventory_inputs as PII
import classes.parking_regs as PR
import classes.parking_reg_sets as PRS
import classes.tax_dataset as TD
import config.config_db as cf
import pandas as pd
import numpy as np
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
        success = PI.analyse_variabilite(con,[0.75,1,1.25])
        if success:
            print('[true]')
        else:
            print('[false]')
    except Exception as e:
       print('caught exception in calcul_variabilite_secteurs_facteurs [false]')