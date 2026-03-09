import classes.parking_inventory_inputs as PII
import classes.parking_inventory as PI
import classes.parking_reg_sets as PRS
import classes.tax_dataset as TD
import calcs.inventory_calcs as IC
import pandas as pd
import config.config_db as cfg
from sqlalchemy import create_engine,Engine
if __name__ =="__main__":
    pg_host = 'localhost'
    pg_port = cfg.pg_port #defaut 5432
    pg_dbname = cfg.pg_dbname# specifique a l'application
    pg_username = cfg.pg_username # defaut postgres
    pg_password = cfg.pg_password # specifique a l'application
    pg_schemaname = cfg.pg_schemaname
    #variables derivees
    pg_string = 'postgresql://' + pg_username + ':'  + pg_password + '@'  + pg_host + ':'  + pg_port + '/'  + pg_dbname
    rel_eng:Engine = create_engine(pg_string)
    with rel_eng.connect() as con:
        # Va chercher un PRS quelconque pour l'instant
        [random_prs] = PRS.from_sql(1,con=con)
        # va chercher un territoire d'analyse pour l'instant
        tax_data = TD.tax_database_for_analysis_territory(1)
        parking_inputs = PII.generate_input_from_PRS_TD(random_prs,tax_data)
        parking_inventory = IC.calculate_inventory_from_inputs_class(parking_inputs)
        print(parking_inventory)