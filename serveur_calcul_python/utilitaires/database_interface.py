from config import config_db
from sqlalchemy import create_engine,text
import pandas as pd
import numpy as np
import geopandas as gpd
import psycopg2 as pg2

def main():
    #data1=retrieve_land_use_data()
    #data2=retrieve_large_periods()
    PATH_GJ = r'C:\Users\paulc\Documents\01-Poly Msc\Recherche\Python\stationnement_vdq_hors_rue_reglementaire\assets\secteurs_analyse.geojson'
    PATH_regs =r'C:\Users\paulc\Documents\01-Poly Msc\Recherche\SIG\Personnel\jointure_role_cadastre_2024.csv'
    insert_GeoJSON(PATH_GJ,"sec_analyse")
    #import_csv_to_db(PATH_regs,"association_cadastre_role")
    #parking_regs_main = retrieve_parking_regs(type = 2, value = 522) 
    #print(parking_regs_main.head)
    #parking_regs = import_csv_to_db(PATH_regs,"association_er_reg_stat")
    #expand_regs_for_past(40,44,"association_er_reg_stat","entete_reg_stationnement","reg_stationnement_empile")
    #reset_sequence_to_max("entete_reg_stationnement","id_reg_stat")

def insert_CUBF():
    LOCALISATION_SPECIFICATION_USAGE = r'C:\Users\paulc\Documents\01-Poly Msc\Recherche\SIG\ROLE2024_FGDB\CUBF_MEFQ.xlsx'
    engine = create_engine(config_db.pg_string)
    CUBF_data = pd.read_excel(LOCALISATION_SPECIFICATION_USAGE,header=1,usecols=["CUBF","DESCRIPTION"],skipfooter=6)
    CUBF_data.drop(CUBF_data.loc[CUBF_data["CUBF"]=="2-3"].index,inplace=True)
    CUBF_data = CUBF_data.astype({"CUBF": int, "DESCRIPTION": str})
    CUBF_manuf = pd.DataFrame(data = {"CUBF":[2,3],"DESCRIPTION":["INDUSTRIES MANUFACTURIÈRES","INDUSTRIES MANUFACTURIÈRES"]})
    CUBF_data = pd.concat([CUBF_data,CUBF_manuf],ignore_index=True)
    CUBF_data.sort_values(by=["CUBF"],inplace=True) 
    CUBF_data = CUBF_data.rename(columns={"CUBF":"cubf","DESCRIPTION":"description"})
                              
    CUBF_data.to_sql(name="cubf",con=engine,if_exists="append",schema="public",index=False)

def import_csv_to_db(path,table):
    df = pd.read_csv(path)
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        df.to_sql(con=con,name = table,schema="public",if_exists="append",index=False)

def expand_regs_for_past(input_reg_set_index: int,output_reg_set_index:int,reg_set_association_table:str,header_table:str,piled_table:str):
    """expand_regs_for_past
        Input:
            - input_reg_set_index: numéro de l'ensemble de règlements à reproduire
            - output_reg_set_index: numéro de l'ensemble de règlements à remplir
            - reg_set_association_table: table de définition des ensembles de règlements
            - header_table: table de définition des entete de règlements
            - piled_table : table de règlements empiles
        output:
            aucun"""
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        # pull the regulation set
        command = f"SELECT * from {reg_set_association_table} WHERE id_er = {input_reg_set_index}"
        input_reg_set: pd.DataFrame = pd.read_sql(command,con)
        # find unique regulations, calculate their number
        input_regs_to_copy: np.array = pd.unique(input_reg_set["id_reg_stat"])
        n_regs_to_create:int = len(input_regs_to_copy)
        # check what the largest id_reg_stat is to find where to write
        command = f"SELECT MAX(id_reg_stat) from {header_table}"
        next_available_reg_stat_id_head:int = pd.read_sql(command,con).to_numpy()[0,0]
        command = f"SELECT MAX(id_reg_stat) from {piled_table}"
        next_available_reg_stat_id_piled:int = pd.read_sql(command,con).to_numpy()[0,0]
        next_id_to_output:int = max(next_available_reg_stat_id_head,next_available_reg_stat_id_piled)+1
        print(f'Maximum header table rule: {next_available_reg_stat_id_head}\nMaximum piled table rule: {next_available_reg_stat_id_piled}\nUsing following index as start point: {next_id_to_output}\nCreating {n_regs_to_create} regulations from current set')
        # create an array to equivalence old index to new index
        next_regs:np.array = next_id_to_output + np.array(range(n_regs_to_create))
        reg_equivalence:np.array = np.transpose([input_regs_to_copy,next_regs])
        print(f'Regulation equivalence: {reg_equivalence}')
        command =  f"SELECT * from {header_table} WHERE id_reg_stat IN ({",".join(input_regs_to_copy.astype(str))})"
        print(command)
        # retrieve the current data
        old_reg_headers = pd.read_sql(command,con)
        reg_headers = old_reg_headers.copy()
        command =  f"SELECT * from {piled_table} WHERE id_reg_stat IN ({",".join(input_regs_to_copy.astype(str))})"
        print(command)
        old_reg_piled = pd.read_sql(command,con)
        reg_piled = old_reg_piled.copy()
        # mise a jour des colonnes en commun dans l'entete
        reg_headers.loc[:,"annee_fin_reg"] = reg_headers["annee_debut_reg"].min() -1
        reg_headers.loc[:,"annee_debut_reg"] = np.nan
        reg_headers.loc[:,"description"] = reg_headers["description"] + " - Remplissage"
        reg_headers.loc[:,"texte_loi"] = reg_headers["texte_loi"] + " - Remplissage"
        reg_headers.loc[:,"article_loi"] = reg_headers["article_loi"] + " - Remplissage"
        reg_headers.loc[:,"paragraphe_loi"] = reg_headers["paragraphe_loi"] + " - Remplissage"
        reg_headers.loc[:,"ville"] = reg_headers["ville"] + " - Remplissage"
        # mise a jour de l'index de l'ensemble
        output_reg_set = input_reg_set.copy()
        output_reg_set["id_er"] = output_reg_set_index
        # mise a jour des index
        for reg_eq in zip(reg_equivalence):
            current_reg = reg_eq[0][0]
            new_reg = reg_eq[0][1]
            print(f"Current reg = {current_reg}; New reg = {new_reg}")
            reg_headers.loc[reg_headers["id_reg_stat"]==current_reg,"id_reg_stat"] = new_reg
            reg_piled.loc[reg_piled["id_reg_stat"]==current_reg,"id_reg_stat"] = new_reg
            output_reg_set.loc[output_reg_set["id_reg_stat"]==current_reg,"id_reg_stat"] = new_reg
        output_reg_set = output_reg_set.drop(columns=["id_assoc_er_reg"])
        reg_piled = reg_piled.drop(columns=["id_reg_stat_emp"])
        output_reg_set.to_sql(name=reg_set_association_table,con=engine,if_exists="append",index=False,schema="public")
        reg_headers.to_sql(name=header_table,con=engine,if_exists="append",index=False,schema="public")
        reg_piled.to_sql(name=piled_table,con=engine,if_exists="append",index=False,schema="public")
    reset_sequence_to_max(header_table,"id_reg_stat")
    print("ready")
        
def retrieve_land_use_data():
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        command = "SELECT * FROM cubf"
        data3 = pd.read_sql(command,con,index_col='cubf')
    #print(data)
    print(data3.head(50))

def retrieve_parking_regs(**kwargs):
    """retrieve_parking_regs
        kwargs:
            - type: type de requete: 
                -   0 pour une période
                -   1 pour un arrondissement(assume une période)
                -   2 un règlement
            - value : valeur de la periode, du quartier ou du règlement
        output:
            Règlements"""
    value = kwargs.get('value',None)
    type = kwargs.get("type",None)
    engine = create_engine(config_db.pg_string)
    # tous les règlements pour une période
    if type == 0 and value:
        with engine.connect() as con:
            command = f"SELECT * FROM cartographie_secteurs WHERE id_periode = {value}"
            cartographie_secteurs = pd.read_sql(command,con,index_col='id_periode_geo')
            command2 = f"SELECT * FROM parking_regs WHERE id_periode_geo IN ({",".join(map(str,cartographie_secteurs.index.values))})"
            reglements = pd.read_sql(command2,con,index_col ="reg_id")
            print(command2)
    # tous les règlements pour un arrondissement(assume une période)
    elif type == 1 and value:
        with engine.connect() as con:
            command2 = f"SELECT * FROM parking_regs WHERE id_periode_geo = ({value})"
            reglements = pd.read_sql(command2,con,index_col ="reg_id")
    # un règlement spécifique
    elif type == 2 and value:
        with engine.connect() as con:
            command2 = f"SELECT * FROM parking_regs WHERE reg_id= ({value})"
            reglements = pd.read_sql(command2,con,index_col ="reg_id")
    # rous les règlements
    else:
        with engine.connect() as con:
            command2 = f"SELECT * FROM parking_regs"
            reglements = pd.read_sql(command2,con,index_col ="reg_id")
    return reglements

def retrieve_large_periods():
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        command = "SELECT * FROM historique_geopol ORDER BY id_periode_geo;"
        #data = con.execute(text(command)).fetchall()
        data2 = pd.read_sql(command,con,index_col='id_periode_geo')
    print(data2.head(6))
    return data2

def insert_GeoJSON(path,table):
    """
    # insert_GeoJSON
        Inputs: 
        - path: path to relevant geojson file to insert into the database
        - table: table name in which to insert things
    """
    engine = create_engine(config_db.pg_string)
    gdf = gpd.read_file(path)
    gdf.to_postgis(table,con=engine,if_exists="append",schema="public",index=False)

def insert_parking_requirements(path,table):
    """
    # insert_parking_requirements:
        Inputs:
            path: path to csv file that contains the parking requirements
            table: name of the table to insert into
        Outputs:
            none
    """
    engine = create_engine(config_db.pg_string)
    df = pd.read_csv(path)
    with engine.connect() as con:
        df.to_sql(table,con=con,if_exists="append",schema="public",index=False)

def reset_sequence_to_max(table_name:str,id_name:str):
    conn = pg2.connect(config_db.pg_string)
    cursor = conn.cursor()
    command = f"SELECT MAX({id_name}) FROM {table_name}"
    cursor.execute(command)
    last_id = cursor.fetchall()[0][0]
    seq_name = f"{table_name}_{id_name}_seq"
    command = f"SELECT last_value FROM {seq_name};"
    cursor.execute(command)
    currval_seq = cursor.fetchall()[0][0]
    if last_id>currval_seq:
        command = f"SELECT setval('{seq_name}',{last_id})"
        cursor.execute(command)
    conn.commit()
    cursor.close()
    conn.close()

def insert_parking_regs_excel(path,table):
    """insert_parking_regs_excel:
        Inputs:
            path: path to csv file that contains the parking requirements
            table: name of the table to insert into
        Outputs:
            none"""
    engine = create_engine(config_db.pg_string)
    df = pd.read_excel(path)
    with engine.connect() as con:
        df.to_sql(table,con=con,if_exists="append",schema="public",index=False)

def retrieve_table(table,id_column):
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        command = f"SELECT * FROM public.{table}"
        reglements = pd.read_sql(command,con,index_col = id_column)
    return reglements

if __name__ =="__main__":
    #insert_CUBF()
    main()