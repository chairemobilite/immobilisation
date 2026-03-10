
import pandas as pd
import geopandas as gpd
from sqlalchemy import create_engine,text,Engine,MetaData,Table
import sqlalchemy as db_alchemy
from config import config_db
from typing_extensions import Self
import logging
import sqlalchemy

class ParkingInventory():
    '''
        # ParkingInventory
            Objet contenant un inventaire de stationnement. Pour l'instant l'inventaire de stationnment est aggrégé au niveau du lot cadastral pour l'instant pour permettre de créer un inventaire basé sur les réglements de stationnement. 
    '''
    def __init__(self,parking_inventory_frame: pd.DataFrame)->Self:
        f'''
            # __init__
            Fonction d'instanciation de l'object ParkingInventory.
            Inputs:
                - parking_inventory_frame: dataframe with columns:g_no_lot, n_places_min,n_places_max,methode_estime,id_ens_reg,id_reg_stat,rl,commentaire
        '''
        fields_to_confirm = [config_db.db_column_lot_id,'n_places_min','n_places_max','methode_estime',config_db.db_column_reg_sets_id,config_db.db_column_parking_regs_id,config_db.db_column_land_use_id, 'commentaire']
        if all(item in parking_inventory_frame.columns for item in fields_to_confirm):
            self.parking_frame:pd.DataFrame = parking_inventory_frame
        else: 
            KeyError("Colonnes suivantes doivent être présentes dans l'estimé ['g_no_lot','n_places_min','n_places_max','methode_estime','id_er','id_reg_stat','cubf','commentaire']")
       
    def __repr__(self):
        return f'N_lots ={len(self.parking_frame[config_db.db_column_lot_id].unique())}, N_places_min = {self.parking_frame['n_places_min'].agg('sum')}'
           
    def concat(self,inventory_2:Self)->Self:
        '''# concat
            concatène deux inventaire de stationnement en un sans en modificer le contenu
        '''
        logger = logging.getLogger(__name__)
        if self.parking_frame.empty==False and inventory_2.parking_frame.empty ==False:
            logger.info('Inventory concatenation - 2 inventories with data')
            self.parking_frame = pd.concat([self.parking_frame,inventory_2.parking_frame])
        elif self.parking_frame.empty==True:
            logger.info('Inventory concatenation - Main inventory empty, setting to inventory 2 frame')
            self.parking_frame = inventory_2.parking_frame
        else:
            logger.warning('Inventory concatenation - Both datasets are empty - continuing')
        
    def to_postgis(self,con:db_alchemy.Engine=None):
        '''
        # to_postgis
        Fonction qui envoie l'inventaire de stationnement sur la base de données
        '''
        logger = logging.getLogger(__name__)
        if isinstance(con,db_alchemy.Engine):
            logger.info('Using existing connection engine')
        else: 
            con = db_alchemy.create_engine(config_db.pg_string)
        self.parking_frame.to_sql(config_db.db_table_parking_inventory,con=con,if_exists='replace',index=False)

    def to_json(self)->str :
        '''# to_json
            Transforme les données         
        '''
        return self.parking_frame.to_json(orient='records',force_ascii=False)
    
    def copy(self:Self)->Self:
        '''
            # copy
            renvoie une copie du dataframe.
        '''
        return ParkingInventory(self.parking_frame.copy())


def to_sql(inventory_to_save:ParkingInventory,engine:sqlalchemy.Engine=None,overwrite:int=0):
    ''' # to_sql
        inserts parking frame into relevant 
    '''
    logger = logging.getLogger(__name__)
    if engine is None:
        engine = sqlalchemy.create_engine(config_db.pg_string)
        
    
    query_existing_inventory = f"SELECT * FROM public.{config_db.db_table_parking_inventory}"
    with engine.connect() as con:
        existing_inventory:pd.DataFrame = pd.read_sql(query_existing_inventory,con=con)
    existing_g_no_lot = existing_inventory[config_db.db_column_lot_id].unique().tolist()
    already_existing_inventory = inventory_to_save.parking_frame.loc[((inventory_to_save.parking_frame[config_db.db_column_lot_id].isin(existing_g_no_lot)) & (inventory_to_save.parking_frame['methode_estime']==2))]
    not_existing_inventory = inventory_to_save.parking_frame.loc[(~(inventory_to_save.parking_frame[config_db.db_column_lot_id].isin(existing_g_no_lot)) & (inventory_to_save.parking_frame['methode_estime']==2))]
    if already_existing_inventory.empty:
        inventory_to_save.parking_frame.to_sql(config_db.db_table_parking_inventory,con=engine,schema='public',if_exists='append',index=False)
        print('save_complete')
    else:
        if overwrite==1:
            logger.info(f'Les lots suivants sont déja dans la base de données \n {already_existing_inventory[config_db.db_column_lot_id].to_list()}\n')
            question_unanswered = True
            while question_unanswered:
                answer= str(input('Voulez vous remplacer les estimés pour lots en question[o/n]?'))
                if answer == 'o':
                    question_unanswered=False
                    lots_to_alter = already_existing_inventory[config_db.db_column_lot_id].unique().tolist()
                    query = f"DELETE FROM public.{config_db.db_table_parking_inventory} WHERE {config_db.db_column_lot_id} IN ('{"','".join(map(str,lots_to_alter))}') AND methode_estime = 2;"
                    statement = db_alchemy.text(query)
                    #meta = MetaData()
                    with engine.connect() as con:
                        dude = con.execute(statement)
                        con.commit()
                    inventory_to_save.parking_frame.to_sql(config_db.db_table_parking_inventory,con=engine,schema='public',if_exists='append',index=False)
                elif answer =='n':
                    logger.info(f'Nous sauverons seulement les éléments non-dupliqués')
                    question_unanswered=False
                    if not not_existing_inventory.empty:
                        not_existing_inventory.to_sql(config_db.db_table_parking_inventory,con=engine,schema='public',if_exists='append',index=False)
                else:
                    logger.info('Entrée invalide, seul y et n sont des entrés valides')
        else:
            logger.info("Seuls les items nos dupliqués seront sauvegardés, changez l'option overwrite pour supprimer les anciens estimés")
            if not not_existing_inventory.empty:
                not_existing_inventory.to_sql(config_db.db_table_parking_inventory,con=engine,schema='public',if_exists='append',index=False)

def check_neighborhood_inventory()->bool:
    NotImplementedError('Not Yet implemented')

def get_lot_data_by_estimation(lot_ids:list[str],estimation_method:int,con:Engine=None)->ParkingInventory:
    if con is None:
        con = create_engine(config_db.pg_string)
    with con.connect() as con2:
        query = f'''
                    SELECT 
                        *
                    FROM 
                        {config_db.db_table_parking_inventory}
                    WHERE {config_db.db_column_lot_id} in ('{("','").join(lot_ids)}') AND methode_estime={estimation_method}
                '''
        data = pd.read_sql(query,con=con2)
        data_PI = ParkingInventory(data)
    return data_PI
