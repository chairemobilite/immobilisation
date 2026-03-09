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

if __name__=="__main__":
    data = {'g_no_lot':['test','test','test2','test3','test3'],'unite':[2,1,2,4,13],'id_er':[0,0,0,0,0],'id_reg_stat':[189,189,1197,533,533],'valeur':[35,35,35,100,2],'cubf':[1000,1000,1000,2000,2000]}
    PII_transmit = PII.ParkingCalculationInputs(data)
    print(PII_transmit)
    inventaire = IC.calculate_inventory_from_inputs_class(PII_transmit)
    inventaire_out = inventaire.to_json()
    print(inventaire_out)