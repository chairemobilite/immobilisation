"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

One of the main classes of the project, Parking Inventories represent
the parking supply and the data format was initially devised to 
accomodate different calculation methods. This should probably be revised 
so they're not all stored in one big table which could lead to issues 
surrounding preserving manual overrids
"""

import os
#print(os.getcwd())
import pandas as pd
import geopandas as gpd
from sqlalchemy import create_engine,text,Engine,MetaData,Table
import sqlalchemy as db_alchemy
from config import config_db
from classes import parking_inventory as PI
from typing_extensions import Self
import logging
import numpy as np
import sqlalchemy
from classes import tax_dataset as TD
from classes import reg_set_territory as RST
from classes import parking_reg_sets as PRS
from classes import parking_regs as PR
from classes import parking_inventory_inputs as PII

from typing import Union

class ParkingInventory():
    """
        # ParkingInventory
            Objet contenant un inventaire de stationnement. Pour l'instant l'inventaire de stationnment est aggrégé au niveau du lot cadastral pour l'instant pour permettre de créer un inventaire basé sur les réglements de stationnement. 
    """
    def __init__(self,parking_inventory_frame: pd.DataFrame)->Self:
        f"""
            # __init__
            Fonction d'instanciation de l'object ParkingInventory.
            Inputs:
                - parking_inventory_frame: dataframe with columns:g_no_lot, n_places_min,n_places_max,methode_estime,id_ens_reg,id_reg_stat,rl,commentaire
        """
        fields_to_confirm = [config_db.db_column_lot_id,'n_places_min','n_places_max','methode_estime',config_db.db_column_reg_sets_id,config_db.db_column_parking_regs_id,config_db.db_column_land_use_id, 'commentaire']
        if all(item in parking_inventory_frame.columns for item in fields_to_confirm):
            self.parking_frame:pd.DataFrame = parking_inventory_frame
        else: 
            KeyError("Colonnes suivantes doivent être présentes dans l'estimé ['id_cadastre','n_places','methode_estime','ens_reg_estim','reg_estim','commentaire']")
       
    def __repr__(self):
        return f'N_lots ={len(self.parking_frame[config_db.db_column_lot_id].unique())}, N_places_min = {self.parking_frame['n_places_min'].agg('sum')}'
           
    def concat(self,inventory_2:Self)->Self:
        """# concat
            concatène deux inventaire de stationnement en un sans en modificer le contenu
        """
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
        """
        # to_postgis
        Fonction qui envoie l'inventaire de stationnement sur la base de données
        """
        logger = logging.getLogger(__name__)
        if isinstance(con,db_alchemy.Engine):
            logger.info('Using existing connection engine')
        else: 
            con = db_alchemy.create_engine(config_db.pg_string)
        self.parking_frame.to_sql(config_db.db_table_parking_inventory,con=con,if_exists='replace',index=False)

    def to_json(self)->str :
        """# to_json
            Transforme les données         
        """
        return self.parking_frame.to_json(orient='records',force_ascii=False)
    
    def copy(self:Self)->Self:
        """
            # copy
            renvoie une copie du dataframe.
        """
        return ParkingInventory(self.parking_frame.copy())

    def merge_lot_data(self:Self)->None:
        """
        #merge_lot_data
            Utilisé pour faire le ménage de duplication de lots lorque plusieurs entrées d'inventaire sont présentes pour un même lot du rôle foncier.
            Applique une opération de groupment des identifiants et de somme des estimés
        """
        logger = logging.getLogger(__name__)
        self.parking_frame.reset_index(inplace=True)
        self.parking_frame.drop(columns='index',inplace=True)
        lots_to_clean_up = self.parking_frame.loc[self.parking_frame[config_db.db_column_lot_id].duplicated(keep=False)]
        lots_list_to_purge_from_self = lots_to_clean_up[config_db.db_column_lot_id].unique().tolist()
        if len(lots_list_to_purge_from_self)>0:

            aggregate_parking_data = lots_to_clean_up.groupby([config_db.db_column_lot_id]).apply(inventory_duplicates_agg_function, include_groups=True).reset_index()
            aggregate_parking_data.loc[(
                aggregate_parking_data[config_db.db_column_supply_min]>aggregate_parking_data[config_db.db_column_supply_max]) |
                (aggregate_parking_data[config_db.db_column_supply_max]==0.0),
                config_db.db_column_supply_max] =None
            new_parking_frame = self.parking_frame.drop(self.parking_frame[self.parking_frame[config_db.db_column_lot_id].isin(lots_list_to_purge_from_self)].index)
            new_parking_frame = pd.concat([new_parking_frame,aggregate_parking_data])

            self.parking_frame = new_parking_frame 
            logger.info(f'found following items which have two estimates : {lots_list_to_purge_from_self} - estimates were summed')
        else: 
            logger.info('No duplicate entries, continue,continuting on')

    def aggregate_statistics_by_land_use(self:Self, lot_uses:pd.DataFrame, level:int=1)->pd.DataFrame:
        """
        # aggregate_statistics_by_land_use
        Sums the estimated parking supply based on the land use codes. the level flag specifies how 
        large the land use bins are. Basically the lot_uses specifies the lot uses at the different levels of 
        aggregation. The scheme follows how quebec land use codes are specifid where each subsequent digit
        in a 4 digit code specifies a narrower land use

        Inputs: 
            - self: the ParkingInventory object to which this method is applied
            - lot_uses: a pandas dataframe with the lot identifiers and the aggregation identifiers for
            each level of aggregation are specified for each lot. In this implementation
            only the numbers are specified, but as long as the codes are unique the aggregation should function
            the Dataframe must contain the following columns
                - g_no_lot: the cadastral lot id specidied in config_db.db_column_lot_id
                - cubf_lvl1: the most generic land use definition of the lot (industrial - 2)
                - cubf_lvl2: the second most generic land use definition (food processing industry - 22)
                - cubf_lvl3: the third most generic land use definition (meat processing and slaughter houses - 223)
            - level: the aggregation level you want to specify for the aggregation operation. Must be 1, 2 or 3
        Output: 
            - a pandas dataframe with the following columns:
                - land_use: the land use code for which the aggregate is computed
                - n_lots: the number of lots in the aggregation layer
                - n_places_min: the sum of the minimum number of required parking spots
        """
        logging.info('Entrée dans la création de statistiques agrégées')
        stats = []
        match level:
            case 1:
                unique_land_uses = lot_uses['cubf_lvl1'].unique().tolist()
                for land_use in unique_land_uses:
                    lots_to_aggregate = lot_uses.loc[lot_uses['cubf_lvl1']==land_use, config_db.db_column_lot_id].unique().tolist()
                    subset = self.parking_frame[self.parking_frame[config_db.db_column_lot_id].isin(lots_to_aggregate)]
                    stats.append({
                        'land_use': land_use,
                        'n_lots': len(lots_to_aggregate),
                        'n_places_min': subset['n_places_min'].sum()
                    })
            case 2:
                unique_land_uses = lot_uses['cubf_lvl2'].unique().tolist()
                for land_use in unique_land_uses:
                    lots_to_aggregate = lot_uses.loc[lot_uses['cubf_lvl2']==land_use, config_db.db_column_lot_id].unique().tolist()
                    subset = self.parking_frame[self.parking_frame[config_db.db_column_lot_id].isin(lots_to_aggregate)]
                    stats.append({
                        'land_use': land_use,
                        'n_lots': len(lots_to_aggregate),
                        'n_places_min': subset['n_places_min'].sum()
                    })
            case 3:
                unique_land_uses = lot_uses['cubf_lvl3'].unique().tolist()
                for land_use in unique_land_uses:
                    lots_to_aggregate = lot_uses.loc[lot_uses['cubf_lvl3']==land_use, config_db.db_column_lot_id].unique().tolist()
                    subset = self.parking_frame[self.parking_frame[config_db.db_column_lot_id].isin(lots_to_aggregate)]
                    stats.append({
                        'land_use': land_use,
                        'n_lots': len(lots_to_aggregate),
                        'n_places_min': subset['n_places_min'].sum()
                    })
        return pd.DataFrame(stats)

def subset_operation(inventory_1:ParkingInventory,operator,inventory_2:ParkingInventory) ->ParkingInventory:
    """
    # subset_operation
    This function is used when you want to choose between two inventory estiamtes covering a given set of 
    cadastral lots. The basic idea is to represent cases in parking regulations where two different calculation
    methods are specified. Two conditions have been found: a "simple or" which is typically where there are two 
    calculation method. In this case, the least constraining option for minimum parking will be chosen. The 
    second case, a "most constraining or" requires the applicant to choose the calculation methods which is most 
    constraining. This is interpreted as the maximum of the two minimums must be chosen.
    Inputs:
        - inventory_1: a ParkingInventory object coming from the first ParkingRegulations subset
        - operator: integer specifying the calculation method. 3 denotes most constraining or, 6 denotes a 
        simple or
        - inventory_2: a ParkingInventory object coming from the second subset

    Outputs
        - inventory: the result of the selection operation
    """
    logger = logging.getLogger(__name__)
    if isinstance(operator,int):
        match operator:
            case 1:
                raise NotImplementedError('Subset Operator no implemented')
            case 2:
                raise NotImplementedError('Obsolete operator')
            case 3:
                logger.info('entering MOST CONSTRAINING OR operation')
                if (inventory_1.parking_frame['n_places_min'].isnull().all() and inventory_2.parking_frame['n_places_max'].isnull().all()): # one is a min, one is a max if min > max
                    logger.info('Entrée dans l''opération de subset par défaut')
                    # create dataframe
                    parking_frame_out = pd.DataFrame()
                    # pull data from left
                    parking_frame_out = inventory_1.parking_frame[[config_db.db_column_lot_id,'n_places_max']].copy()
                    parking_frame_out.rename(columns={'n_places_max':'n_places_max_left'},inplace=True)
                    # pull data from right
                    parking_frame_right =inventory_2.parking_frame[[config_db.db_column_lot_id,'n_places_min']].copy()
                    parking_frame_right.rename(columns={'n_places_min':'n_places_min_right'},inplace=True)
                    #merge data
                    parking_frame_out = parking_frame_out.merge(parking_frame_right,on=config_db.db_column_lot_id)
                    # case 1 min<=max
                    parking_frame_out.loc[parking_frame_out['n_places_min_right']<=parking_frame_out['n_places_max_left'],'n_places_min_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_right']<=parking_frame_out['n_places_max_left'],'n_places_min_right'] 
                    parking_frame_out.loc[parking_frame_out['n_places_min_right']<=parking_frame_out['n_places_max_left'],'n_places_max_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_right']<=parking_frame_out['n_places_max_left'],'n_places_max_left'] 
                    # case 2 min>max
                    parking_frame_out.loc[parking_frame_out['n_places_min_right']>parking_frame_out['n_places_max_left'],'n_places_min_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_right']>parking_frame_out['n_places_max_left'],'n_places_max_left'] 
                    parking_frame_out.loc[parking_frame_out['n_places_min_right']>parking_frame_out['n_places_max_left'],'n_places_max_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_right']>parking_frame_out['n_places_max_left'],'n_places_max_left'] 
                    # clean up the right left stuff
                    parking_frame_out.drop(columns=['n_places_min_right','n_places_max_left'],inplace=True)
                    # copy old parking frame
                    old_parking_frame = inventory_1.parking_frame.copy()
                    # merge the data to the old parking frame
                    new_parking_frame = old_parking_frame.merge(parking_frame_out,how='left',on=config_db.db_column_lot_id)
                    # drop the old data
                    new_parking_frame.drop(columns=['n_places_min','n_places_max'],inplace=True)
                    # rename columns
                    new_parking_frame.rename(columns={'n_places_min_final':'n_places_min','n_places_max_final':'n_places_max'},inplace=True)
                    #create parking inventory object
                    parking_inventory_object = ParkingInventory(new_parking_frame)
                elif (inventory_1.parking_frame['n_places_max'].isnull().all() and inventory_2.parking_frame['n_places_min'].isnull().all()): # one is a min, one is a max if min > max
                    logger.info('Entrée dans l''opération de subset par défaut')
                    # create dataframe
                    parking_frame_out = pd.DataFrame()
                    # pull data from left
                    parking_frame_out = inventory_1.parking_frame[[config_db.db_column_lot_id,'n_places_min']].copy()
                    parking_frame_out.rename(columns={'n_places_min':'n_places_min_left'},inplace=True)
                    # pull data from right
                    parking_frame_right =inventory_2.parking_frame[[config_db.db_column_lot_id,'n_places_max']].copy()
                    parking_frame_right.rename(columns={'n_places_max':'n_places_max_right'},inplace=True)
                    #merge data
                    parking_frame_out = parking_frame_out.merge(parking_frame_right,on=config_db.db_column_lot_id)
                    # case 1 min<=max
                    parking_frame_out.loc[parking_frame_out['n_places_min_left']<=parking_frame_out['n_places_max_right'],'n_places_min_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_left']<=parking_frame_out['n_places_max_right'],'n_places_min_left'] 
                    parking_frame_out.loc[parking_frame_out['n_places_min_left']<=parking_frame_out['n_places_max_right'],'n_places_max_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_left']<=parking_frame_out['n_places_max_right'],'n_places_max_right'] 
                    # case 2 min>max
                    parking_frame_out.loc[parking_frame_out['n_places_min_left']>parking_frame_out['n_places_max_right'],'n_places_min_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_left']>parking_frame_out['n_places_max_right'],'n_places_max_right'] 
                    parking_frame_out.loc[parking_frame_out['n_places_min_left']>parking_frame_out['n_places_max_right'],'n_places_max_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_left']>parking_frame_out['n_places_max_right'],'n_places_max_right'] 
                    # clean up the right left stuff
                    parking_frame_out.drop(columns=['n_places_min_left','n_places_max_right'],inplace=True)
                    # copy old parking frame
                    old_parking_frame = inventory_1.parking_frame.copy()
                    # merge the data to the old parking frame
                    new_parking_frame = old_parking_frame.merge(parking_frame_out,how='left',on=config_db.db_column_lot_id)
                    # drop the old data
                    new_parking_frame.drop(columns=['n_places_min','n_places_max'],inplace=True)
                    # rename columns
                    new_parking_frame.rename(columns={'n_places_min_final':'n_places_min','n_places_max_final':'n_places_max'},inplace=True)
                    #create parking inventory object
                    parking_inventory_object = ParkingInventory(new_parking_frame)
                else: # default case, i have a min and a max
                    logger.info('Entrée dans l''opération de subset par défaut')
                    # create an emptry dataframe
                    parking_frame_out = pd.DataFrame()
                    # copy over self.parking_frame, mins and maxes, rename left
                    parking_frame_out = inventory_1.parking_frame[[config_db.db_column_lot_id,'n_places_min','n_places_max']].copy()
                    parking_frame_out.rename(columns={'n_places_min':'n_places_min_left','n_places_max':'n_places_max_left'},inplace=True)
                    # copy over inventory_2.parking_frame, mins and maxes, rename right
                    parking_frame_right =inventory_2.parking_frame[[config_db.db_column_lot_id,'n_places_min','n_places_max']].copy()
                    parking_frame_right.rename(columns={'n_places_min':'n_places_min_right','n_places_max':'n_places_max_right'},inplace=True)
                    # merge the dataframes
                    parking_frame_out = parking_frame_out.merge(parking_frame_right,on=config_db.db_column_lot_id)
                    # mins and maxes and cleanup
                    parking_frame_out['n_places_min_final'] = parking_frame_out[['n_places_min_left','n_places_min_right']].max(axis=1)
                    parking_frame_out['n_places_max_final'] = parking_frame_out[['n_places_max_left','n_places_max_right']].min(axis=1)
                    parking_frame_out.drop(columns=['n_places_min_left','n_places_min_right','n_places_max_left','n_places_max_right'],inplace=True)
                    # copy th old frame
                    old_parking_frame = inventory_1.parking_frame.copy()
                    # merge new onto old
                    new_parking_frame = old_parking_frame.merge(parking_frame_out,how='left',on=config_db.db_column_lot_id)
                    # drop old
                    new_parking_frame.drop(columns=['n_places_min','n_places_max'],inplace=True)
                    #name cleanup
                    new_parking_frame.rename(columns={'n_places_min_final':'n_places_min','n_places_max_final':'n_places_max'},inplace=True)
                    new_parking_frame['commentaire'] = inventory_1.parking_frame['commentaire']+'/' +inventory_2.parking_frame['commentaire']
                    #create object
                    parking_inventory_object = ParkingInventory(new_parking_frame)
                logger.info('Complétion du cas de base')
                return parking_inventory_object
            case 4:
                raise NotImplementedError('Subset Operator no implemented')
            case 5:
                raise NotImplementedError('Obsolete operator')
            case 6:
                logger.info('Entrée dans l''opération OU SIMPLE')
                parking_frame_out = pd.DataFrame()
                parking_frame_out = inventory_1.parking_frame[[config_db.db_column_lot_id,'n_places_min','n_places_max']].copy()
                parking_frame_out.rename(columns={'n_places_min':'n_places_min_left','n_places_max':'n_places_max_left'},inplace=True)
                parking_frame_right =inventory_2.parking_frame[[config_db.db_column_lot_id,'n_places_min','n_places_max']].copy()
                parking_frame_right.rename(columns={'n_places_min':'n_places_min_right','n_places_max':'n_places_max_right'},inplace=True)
                parking_frame_out = parking_frame_out.merge(parking_frame_right,on=config_db.db_column_lot_id)
                # implémenté comme prenant le minimum des requis minimaux. Ceci et mis en place selon la logique qu'un développeur immobilier voudrait potentiellement 
                # Cas 1 la gauche_min est plus petit: min_final = min_left, max_final = max_left
                parking_frame_out.loc[parking_frame_out['n_places_min_left']<parking_frame_out['n_places_min_right'],'n_places_min_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_left']<parking_frame_out['n_places_min_right'],'n_places_min_left']
                parking_frame_out.loc[parking_frame_out['n_places_min_left']<parking_frame_out['n_places_min_right'],'n_places_max_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_left']<parking_frame_out['n_places_min_right'],'n_places_max_left']
                # Cas 2 la droite_min est plus petit: min_final = min_right, max_final = max_right
                parking_frame_out.loc[parking_frame_out['n_places_min_left']>=parking_frame_out['n_places_min_right'],'n_places_min_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_left']>=parking_frame_out['n_places_min_right'],'n_places_min_right']
                parking_frame_out.loc[parking_frame_out['n_places_min_left']>=parking_frame_out['n_places_min_right'],'n_places_max_final'] = parking_frame_out.loc[parking_frame_out['n_places_min_left']>=parking_frame_out['n_places_min_right'],'n_places_max_right']
                # ramène le vieux frame
                old_parking_frame = inventory_1.parking_frame.copy()
                # drop gauche/droite
                parking_frame_out.drop(columns=['n_places_min_left','n_places_min_right','n_places_max_left','n_places_max_right'],inplace=True)
                new_parking_frame = old_parking_frame.merge(parking_frame_out,how='left',on=config_db.db_column_lot_id)
                new_parking_frame.drop(columns=['n_places_min','n_places_max'],inplace=True)
                new_parking_frame.rename(columns={'n_places_min_final':'n_places_min','n_places_max_final':'n_places_max'},inplace=True)
                new_parking_frame['commentaire'] = inventory_1.parking_frame['commentaire']+'/' +inventory_2.parking_frame['commentaire']
                if config_db.db_column_reg_sets_id not in new_parking_frame.columns:
                    new_parking_frame[config_db.db_column_reg_sets_id]=0
                parking_inventory_object = ParkingInventory(new_parking_frame)
                return parking_inventory_object
    else:
        raise ValueError(f'Operator must be integer, you supplied {type(operator)}')
        
def dissolve_list(list_to_dissolve:list[ParkingInventory])->ParkingInventory:
    """
    # dissolve_list
    takes a list of ParkingInventory objects and concatenates them into a single one.

    Inputs:
        - list_to_dissolve: a list of ParkingInventory objects

    Output:
        - inventory_to_out: the result of the concatenation of the input ParkingInventory objects
    """
    for inx,item_to_concat in enumerate(list_to_dissolve):
        if inx==0:
            inventory_to_out = item_to_concat
        else:
            inventory_to_out.concat(item_to_concat)
    return inventory_to_out

def inventory_duplicates_agg_function(x:pd.DataFrame):
    """
    # inventory_duplicates_agg_function
    Defines what to do to each entry in the ParkingInventory where there are multiple entries for the 
    same lot.THis is put in place to aggregate
    """
    d = {}
    d[config_db.db_column_land_use_id] = '/'.join(map(str, x[config_db.db_column_land_use_id]))
    d[config_db.db_column_reg_sets_id] = '/'.join(map(str, x[config_db.db_column_reg_sets_id]))
    d[config_db.db_column_parking_regs_id] = '/'.join(map(str, x[config_db.db_column_parking_regs_id]))
    d[config_db.db_column_supply_min] = x[config_db.db_column_supply_min].sum()
    d[config_db.db_column_supply_max] = x[config_db.db_column_supply_max].sum()
    d[config_db.db_column_supply_comment] = ', '.join(map(str, x[config_db.db_column_supply_comment]))
    d[config_db.db_column_supply_est_meth] = x[config_db.db_column_supply_est_meth].values[0]
    return pd.Series(d,index = [
        config_db.db_column_land_use_id,
        config_db.db_column_reg_sets_id,
        config_db.db_column_parking_regs_id,
        config_db.db_column_supply_min,
        config_db.db_column_supply_max,
        config_db.db_column_supply_comment,
        config_db.db_column_supply_est_meth])

def calculate_inventory_by_analysis_sector(sector_to_calculate:int)->ParkingInventory:
    """
        # calculate_inventory_by_analysis_sector
        Permet de calculer le stationnement pour chaque lot danas un quartier d'analyse donné
        
        Inputs:
            - sector_to_calculate: integer identifier of analysis sector to compute for
        
        Outputs
            - ParkingInventory reprensenting the supply for each lot in the sector
    """
    # find all points within sector
    logging.info('Getting tax data sets within neighbourhoods')
    tax_data_to_analyse: TD.TaxDataset = TD.tax_database_for_analysis_territory(sector_to_calculate)
    # find all territories that touch the data
    logging.info('Finding relevant parking rulesets')
    [RSTs,TDs] = RST.get_rst_by_tax_data(tax_data_to_analyse)
    #creating  parking inventories
    logging.info('Calculating parking inventory')
    parking_inventories:list[PI.ParkingInventory] = calculate_parking_for_reg_set_territories(RSTs,TDs)
    logging.info('Inventory completed - merging inventory list into one list')
    final_parking_inventory = PI.dissolve_list(parking_inventories)
    logging.info('Merging inventories for a given lot')
    final_parking_inventory.merge_lot_data()
    return final_parking_inventory

def calculate_inventory_by_lot(lot_to_calculate:str)->ParkingInventory:
    """
        # calculate_inventory_by_lot
            calculates the inventory for a lot
            
            Inputs:
                - lot_to_calculate: Identifier of the lot for which to estimate the parking supply
            
            Ouputs:
                - ParkingInventory representing the supply of parking on the lot
    """
    # find all points within sector
    logging.info(f'Starting parking inventory calculation for lot: {lot_to_calculate}')
    logging.info('Getting tax data sets within neighbourhoods')
    tax_data_to_analyse = TD.tax_database_from_lot_id(lot_to_calculate)
    # find all territories that touch the data
    logging.info('Finding relevant parking rulesets')
    [RSTs,TDs] = RST.get_rst_by_tax_data(tax_data_to_analyse)
    #creating  parking inventories
    logging.info('Calculating parking inventory')
    parking_inventories:list[PI.ParkingInventory] = calculate_parking_for_reg_set_territories(RSTs,TDs)
    logging.info('Inventory completed - merging inventory list into one list')
    final_parking_inventory = PI.dissolve_list(parking_inventories)
    logging.info('Merging inventories for a given lot')
    final_parking_inventory.merge_lot_data()
    return final_parking_inventory

def to_sql(inventory_to_save:ParkingInventory,engine:sqlalchemy.Engine=None,overwrite:int=0):
    """ # to_sql
        inserts parking frame into relevant 
    """
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

def calculate_parking_for_reg_set_territories(
        reg_set_territories:Union[RST.RegSetTerritory,list[RST.RegSetTerritory]],
        tax_datas:Union[TD.TaxDataset,list[TD.TaxDataset]]
        )->Union[PI.ParkingInventory,list[PI.ParkingInventory]]:
    """
    # calculate_parking_for_reg_set_territories
    Entry point for calculating the inventory for both the lot and neigborhood calculation method both go
    through this function. It loops through the different Reg set territories, converts the relevant tax data 
    to ParkingCalculationInputs. The relevant regulations are extracted from the reg set territory, they're 
    validated and the relevant calculation is launched. Note that if lists are used they must be the same
    length and the position in the list is used to match the reg set territory to the tax data
    
    Inputs:
        - reg_set_territories: reg set territory or list of reg set territories
        - tax_datas: tax_data for which we are calculating inventory.Can be a single tax_data or multiple in a list

    Outputs:
        - inventory: a single inventory or list of inventories is returned depending on the input.
    """
    logger = logging.getLogger(__name__)
    logger.info('-----------------------------------------------------------------------------------------------')
    logger.info('Entering Inventory')
    logger.info('-----------------------------------------------------------------------------------------------')
    # Two cases occur: the first is that the provided inputs are single instance at which point there is no need to
    # loop over them to complete calculations

    if isinstance(reg_set_territories,RST.RegSetTerritory) and isinstance(tax_datas,TD.TaxDataset):
        logger.info('-----------------------------------------------------------------------------------------------')
        logger.info(f'Starting inventory for regset territory: {reg_set_territories}')
        logger.info('-----------------------------------------------------------------------------------------------')
        reg_set_territories.parking_regulation_set.expand_land_use_table()
        reg_set_territories.parking_regulation_set.validate()
        parking_calculation_input = PII.generate_input_from_PRS_TD(reg_set_territories.parking_regulation_set,tax_datas)
        parking_calculation_input.check_columns()
        parking_regs:PR.ParkingRegulations = reg_set_territories.parking_regulation_set.get_reg_by_id(
                parking_calculation_input[
                    config_db.db_column_parking_regs_id
                    ].unique().tolist()) 
        parking_regs.validate()
        parking_inventory_to_return = calculate_inventory_from_inputs_class(
            parking_calculation_input,
            parking_regs,
            2)
        return parking_inventory_to_return
    else:
    # In the second case, we have a list. In this instance we've chosen to loop over them successively, which frankly is 
    # computationally not very efficient in Python. An approach using a concatenation of all the inputs and then merging 
    # the relevant rules would likely be more elegant legible and generally a better solution.
        if not isinstance(reg_set_territories, list) or not isinstance(tax_datas, list):
            raise TypeError("reg_set_territories and tax_datas must both be single objects or both be lists")
        if len(reg_set_territories) != len(tax_datas):
            raise ValueError("reg_set_territories and tax_datas must have the same length")
        parking_inventory_list = []
        for sub_reg_set ,sub_tax_data in zip(reg_set_territories,tax_datas):
            if len(sub_tax_data.tax_table)>0 and len(sub_tax_data.lot_table)>0:
                logger.info('-----------------------------------------------------------------------------------------------')
                logger.info(f'Starting inventory for regset territory: {sub_reg_set}')
                logger.info('-----------------------------------------------------------------------------------------------')
                # find unique parking regs and recursively call function with only one
                sub_reg_set.parking_regulation_set.expand_land_use_table()
                sub_reg_set.parking_regulation_set.validate()
                parking_calculation_input = PII.generate_input_from_PRS_TD(
                    sub_reg_set.parking_regulation_set,
                    sub_tax_data)
                parking_calculation_input.check_columns()
                parking_regs = sub_reg_set.parking_regulation_set.get_reg_by_id(
                        parking_calculation_input[
                            config_db.db_column_parking_regs_id
                            ].unique().tolist())
                parking_regs.validate() 
                parking_inventory_to_potentially_append = calculate_inventory_from_inputs_class(
                        parking_calculation_input,
                        parking_regs,
                        2
                    )
                parking_inventory_list.append(parking_inventory_to_potentially_append)
        return parking_inventory_list

def calculate_parking_specific_reg_set( reg_set:PRS.ParkingRegulationSet,tax_data:TD.TaxDataset,scale:float=None)->PI.ParkingInventory:
    """
    calculate_parking_specific_reg_set
    Calculates the minimum parking requirements for a given combination of regulation set and tax data set. A scale can be applied to unit conversions 
    which is then passed on to the calculate inputs function and the relevant minimum parking requriements. This function is mostly a helper
    function for the variability analysis

    Inputs:
        - reg_set: the regulation set we want to calculate for
        - tax_data: the relevant tax data for which we want to calculate minimum parking requirements
        - scale: a scale factor to be pushed through the unit conversion process

    Outputs
        - parking_inventory: a parking minimum calculation for the inputted data.
    """
    logger = logging.getLogger(__name__)
    logger.info('-----------------------------------------------------------------------------------------------')
    logger.info(f'Starting inventory for regset: {reg_set}')
    logger.info('-----------------------------------------------------------------------------------------------')
    if scale is None:
        scale = 1
    reg_set.expand_land_use_table()
    parking_calculation_input = PII.generate_input_from_PRS_TD(reg_set,tax_data,scale=scale)
    parking_regs = PRS.concat_to_PR([reg_set])
    parking_regs.validate()
    parking_inventory = calculate_inventory_from_inputs_class(parking_calculation_input,parking_regs,2)
    return parking_inventory

def check_have_matching_parking_regs(donnees_calcul:PII.ParkingCalculationInputs,reglements:PR.ParkingRegulations):
    """
    # check_having_matching_parking_regs
    Ensure that all the regs in donnees_calcul_are present in reglements

    Inputs:
        - donnees_calcul: the ParkingCalculationsInputs data which specifies the input data and rule to use
        - reglements: the regulations required to calculate
    
    Output:
        None: raises error if the required parking regulations are not present input data
    """
    required_regs = set(donnees_calcul[config_db.db_column_parking_regs_id])
    acquired_regs = set(reglements.reg_head[config_db.db_column_parking_regs_id])

    if len(required_regs-acquired_regs)>0:
        raise ValueError('Missing a required regulation - please check inputs')

def calculate_inventory_from_inputs_class(donnees_calcul:PII.ParkingCalculationInputs,reglements:PR.ParkingRegulations,methode_estime:int=3)->ParkingInventory:
    """
    # calculate_inventory_from_inputs_class
    Allows the calculation of minimum parking requirements for a given set of regulations and a parking inputs file. 
    Inputs:
        - donnees_calcul: the ParkingCalculationInputs which specify the relevant units for the lots of the inital tax 
        dataset which was input earlier in the pipeline
        - reglements: the parking regulations which are required for the calculation. 
        - methode_estime: a integer code which specifies what type of estimate this is. If not specidied, this defaults
        to 3 which implies that the calculation is based on manual inputs. Specifying 2 implies that the calculation is
        based on tax data which went through the unit conversion and preparation processs
    Outputs
        - parking_final: a single ParkingInventory object for the provided data. The output ensures that data for a given lot
        is consolidated on one estimate
    """
    check_have_matching_parking_regs(donnees_calcul,reglements)
    reglements_a_calc:list[int] = donnees_calcul[config_db.db_column_parking_regs_id].unique().tolist()
    #reglements:PR.ParkingRegulations = PR.from_postgis(reglements_a_calc)
    parking_out= []
    for id_reglement in reglements_a_calc:
        donnees_pertinentes:pd.DataFrame = donnees_calcul.loc[donnees_calcul[config_db.db_column_parking_regs_id]==id_reglement]
        reglement:PR.ParkingRegulations = reglements.get_reg_by_id(int(id_reglement))
        unites = reglement.get_units()
        unites_donnees:list[int] = donnees_pertinentes.loc[donnees_pertinentes[config_db.db_column_parking_regs_id]==id_reglement,config_db.db_column_parking_unit_id].unique().tolist()
        if unites.sort()==unites_donnees.sort():
            parking_last = calculate_parking_specific_reg_from_inputs_class(reglement,donnees_pertinentes,methode_estime)
            parking_out.append(parking_last)
    parking_final = dissolve_list(parking_out)
    parking_final.merge_lot_data()
    return parking_final

def calculate_parking_specific_reg_from_inputs_class(reg_to_calculate:PR.ParkingRegulations,provided_inputs:PII.ParkingCalculationInputs,methode_estime:int=3)->ParkingInventory:
    """
    # calculate_parking_specific_reg_from_inputs_class
    Helper function which iterates through the regulation subsets, gets the estimates for each and then consolidates the inventory into 
    the final output for the given regulation
    Inputs:
        - reg_to_calculate: Regulation which you're trying to output the inventory for
        - provided_inputs: the ParkingCalculationInputs required for calculation
        - methode_estime: flag which sets the methode_estime in the output. Set to 2 to denote an automatic calculation
        Set to 3 for a manually inputed tax data. Defaults to 3
    Outputs:
        - parking_inventory: a ParkingInventory object for the provided regulation and calculation input
    """
    if reg_to_calculate.check_only_one_regulation():
        subsets = reg_to_calculate.get_subset_numbers()
        relevant_data = provided_inputs.get_by_reg(reg_to_calculate.get_reg_id())
        for inx,subset in enumerate(subsets):
            parking_inventory_subset:ParkingInventory = calculate_parking_subset_from_inputs_class(reg_to_calculate,subset,relevant_data,methode_estime)
            if inx ==0:
                parking_out:ParkingInventory = parking_inventory_subset
            else:
                parking_out =subset_operation(parking_out,reg_to_calculate.get_subset_inter_operation_type(subset),parking_inventory_subset)
    return parking_out

def calculate_parking_subset_from_inputs_class(reg_to_calculate:PR.ParkingRegulations,subset:int,relevant_inputs:PII.ParkingCalculationInputs,methode_estime:int=3)->ParkingInventory:
    """
    # calculate_parking_subset_from_inputs_class
    Parking regulations are divided into subsets and then the subset_operation function allows you to choose which
    subset to use in the final inventory.

    Inputs: 
        - reg_to_calculate: the regulation which you are calculating outputs for
        - subset: identifier of the subset for which you're calculating the estimated parking supply
        - relevant_inputs: the ParkingCalculationInput data which is used as input to the calculation it can 
        be manually entered or based on conversions from tax data
        - methode_estime: flag which sets the methode_estime in the output. Set to 2 to denote an automatic calculation
        Set to 3 for a manually inputed tax data. Defaults to 3

    Outputs:
        - parking_inventory: a parking supply estimate for the chosen subset
    """
    if reg_to_calculate.check_only_one_regulation():
        match reg_to_calculate.get_subset_intra_operation_type(subset):
            case 1:
                inventory = calculate_addition_based_subset_from_inputs_class(reg_to_calculate,subset,relevant_inputs,methode_estime)
                #NotImplementedError('Not yet Implemented')
            case 2:
                AttributeError('Operation 2  deprecated and no longer in use. Use operator 4 instead')
            case 3:
                AttributeError('Operation 3 not supported within one subset')
            case 4:
                inventory = calculate_threshold_based_subset_from_inputs_class(reg_to_calculate,subset,relevant_inputs,methode_estime)
            case 5:
                AttributeError('Operation 5 not supported within one subset')
            case 6:
                AttributeError('Operation 6 not supported within one subset')
        return inventory
    else:
        raise ValueError('Can only calculate one rule at a time')

def calculate_threshold_based_subset_from_inputs_class(reg_to_calculate:PR.ParkingRegulations,subset:int,data:PII.ParkingCalculationInputs,methode_estime:int=3):
    """
    # calculate_threshold_based_subset_from_inputs_class
    This is the core calculation function for regulations which are threshold based. The function check that 
    there's only one regulation on the input and that the subset exists, checks that only one unit is present
    and that the operator is as expected. It then instanciates a DataFrame, sorts the thresholds, then loops
    through the thresholds, selects relevant inputs and calculates the required parking based on the regulation and 
    input data supplied. 

    Inputs: 
        - reg_to_calculate: single ParkingRegulations object (i.e. only one unique reg id).
        - subset: subset that you're trying to calculate, needs to be an integer
        - data: ParkingCalculationInputs data which is used to calculate the required number of parking spots
        Only inputs which are of a consistent unit with the regulation are calculated
        - methode_estime: specifies the type of calculation. Setting this value to 2 indicates that the calculation
        is being done directly from the assessment roll data whereas a value of 3 implies that the calculation is done 
        based on manual inputs. Value is set at 3 by default
    Outputs:
        - ParkingInventory object: the function outputs a ParkingInventory object which can be used as an input for 
        subset operations further down the processing stream

    Future development suggestions:
        - Use joins apply rather than loops to iterate through the thresholds and assign coefficients, this will likely
        result in much quicker execution time 
        - Move various upstream checks to helper functions.Current function does is all with a bunch of indented if
        statements which aren't the easiest to read through and understand. A helper function that does this separately
        and then only does the math in this function would likely help maintainability in the long run.
    """
    if reg_to_calculate.check_subset_exists(subset) and reg_to_calculate.check_only_one_regulation():
        units = reg_to_calculate.get_subset_units(subset)
        operator = reg_to_calculate.get_subset_intra_operation_type(subset)
        if len(units)==1 and operator ==4:
            thresholds = reg_to_calculate.get_subset_thresholds(subset)
            previous_threshold = None
            parking_final = pd.DataFrame()
            for threshold in thresholds:
                lower_thresh = float(threshold)
                if previous_threshold is not None:
                    upper_thresh = float(previous_threshold)
                else:
                    upper_thresh = previous_threshold
                
                relevant_data = data.get_by_reg(reg_to_calculate.get_reg_id()).get_by_units(units[0]).filter_by_threshold(lower_thresh, upper_thresh)
                previous_threshold=threshold
                if not relevant_data.empty:
                    line_def = reg_to_calculate.get_line_item_by_subset_threshold(subset,threshold)
                    zero_crossing_min = line_def[config_db.db_column_parking_zero_crossing_min].values[0]
                    zero_crossing_max = line_def[config_db.db_column_parking_zero_crossing_max].values[0]
                    slope_min = line_def[config_db.db_column_parking_slope_min].values[0]
                    slope_max = line_def[config_db.db_column_parking_slope_max].values[0]
                    parking_frame_thresh = pd.DataFrame()
                    parking_frame_thresh[config_db.db_column_lot_id] = relevant_data[config_db.db_column_lot_id]
                    # check that at least min or max spot definition is valid

                    if PR.is_valid_slope_or_intercept(zero_crossing_min) and PR.is_valid_slope_or_intercept(slope_min):
                        parking_frame_thresh[config_db.db_column_supply_min] = zero_crossing_min + slope_min * relevant_data[config_db.db_column_converted_value]
                    elif PR.is_valid_slope_or_intercept(zero_crossing_min) :
                        parking_frame_thresh[config_db.db_column_supply_min] = zero_crossing_min
                    else:
                        parking_frame_thresh[config_db.db_column_supply_min] = None

                    if PR.is_valid_slope_or_intercept(zero_crossing_max) and PR.is_valid_slope_or_intercept(slope_max):
                        parking_frame_thresh[config_db.db_column_supply_max] = zero_crossing_max + slope_max * relevant_data[config_db.db_column_converted_value]
                    elif PR.is_valid_slope_or_intercept(zero_crossing_max) :
                        parking_frame_thresh[config_db.db_column_supply_max] = zero_crossing_max
                    else: 
                        parking_frame_thresh[config_db.db_column_supply_max] = None

                    parking_frame_thresh.loc[parking_frame_thresh[config_db.db_column_supply_max]<parking_frame_thresh[config_db.db_column_supply_min],config_db.db_column_supply_max]=None
                    parking_frame_thresh[config_db.db_column_supply_meas] = None
                    parking_frame_thresh[config_db.db_column_supply_estimated] = None
                    parking_frame_thresh[config_db.db_column_supply_est_meth] = methode_estime
                    parking_frame_thresh[config_db.db_column_parking_regs_id] = relevant_data[config_db.db_column_parking_regs_id]
                    if config_db.db_column_reg_sets_id in relevant_data.columns:
                        parking_frame_thresh[config_db.db_column_reg_sets_id] = relevant_data[config_db.db_column_reg_sets_id]
                    else: 
                        parking_frame_thresh[config_db.db_column_reg_sets_id]=0
                    parking_frame_thresh[config_db.db_column_land_use_id] = relevant_data[config_db.db_column_land_use_id]
                    parking_frame_thresh[config_db.db_column_supply_comment] = (
                            "Unite: "
                            + relevant_data[config_db.db_column_parking_unit_id].astype(str)
                            + " Val: "
                            + relevant_data[config_db.db_column_converted_value].astype(str)
                            + ' '
                        )
                    if parking_final.empty:
                        parking_final = parking_frame_thresh
                    else:
                        parking_final = pd.concat([parking_final,parking_frame_thresh])
            parking_out = ParkingInventory(parking_final)
            return parking_out
        else:
            raise ValueError('subset should have operator 4 and only one unit') 
    else:
        raise ValueError('Can only calculate one rule at a time')

def calculate_addition_based_subset_from_inputs_class(reg_to_calculate:PR.ParkingRegulations,subset:int,data:PII.ParkingCalculationInputs,methode_estime:int=3):
    """
    # calculate_addition_based_subset_from_inputs_class
    Calculates addition based rules like One spot per doctor plus one spot per two nurses.
    Inputs:
        - reg_to_calculate: ParkingRegulations instance with only one parking id in it
        - subset: id of the subset to calculate
        - data: ParkingCalculationsInput which contains the inputs which are used to calculate
        the regulation
        - methode_estime: integer representing the calculation method. Value of 3 represents that the supply was
        calculated from manually inputed data while value of 2 represents automatic calculation based on tax 
        assessment data.
    Outputs:
        - ParkingInventory: Returns a parking inventory for the subset which will then need to be
        chosen amongst the ParkingInventory for different subsets
    Future Improvements:
        - Reduce the complexity of the function by combining if statements
        - Ensure that the concatenation of the input are done properly.
    """
    if reg_to_calculate.check_subset_exists(subset) and reg_to_calculate.check_only_one_regulation():
        operator = reg_to_calculate.get_subset_intra_operation_type(subset)
        if operator==1:
            subset_def = reg_to_calculate.get_subset_def(subset)
            relevant_data = data.get_by_reg(reg_to_calculate.get_reg_id())
            reg_units = reg_to_calculate.get_subset_units(subset)

            if relevant_data.check_units_present(reg_units):
                inventory = pd.DataFrame(relevant_data.loc[relevant_data[config_db.db_column_parking_unit_id].isin(reg_units)].merge(subset_def,on=[config_db.db_column_parking_regs_id,config_db.db_column_parking_unit_id],how='left'))
                
                # Create a mask for rows where both conditions are not None
                mask_both_min_not_none = (
                    inventory[config_db.db_column_parking_zero_crossing_min].notna() & 
                    inventory[config_db.db_column_parking_slope_min].notna()
                )
                mask_both_max_not_note = (
                    inventory[config_db.db_column_parking_zero_crossing_max].notna() & 
                    inventory[config_db.db_column_parking_slope_max].notna()
                )
                # Create a mask for rows where both conditions are not None
                mask_crossing_min_not_none = (
                    inventory[config_db.db_column_parking_zero_crossing_min].notna()& 
                    inventory[config_db.db_column_parking_slope_min].isna()
                )
                mask_crossing_max_not_none = (
                    inventory[config_db.db_column_parking_zero_crossing_max].notna()& 
                    inventory[config_db.db_column_parking_slope_max].isna()
                )

                mask_both_min_none = (
                    inventory[config_db.db_column_parking_zero_crossing_min].isna()& 
                    inventory[config_db.db_column_parking_slope_min].isna()
                )
                mask_both_max_none = (
                    inventory[config_db.db_column_parking_zero_crossing_max].isna()& 
                    inventory[config_db.db_column_parking_slope_max].isna()
                )
                # slope and intercept min
                inventory.loc[
                    mask_both_min_not_none,
                    config_db.db_column_supply_min
                    ] = inventory.loc[
                            mask_both_min_not_none,
                            config_db.db_column_parking_zero_crossing_min
                            ] + inventory.loc[
                                    mask_both_min_not_none,
                                    config_db.db_column_parking_slope_min
                                    ] * inventory.loc[
                                            mask_both_min_not_none,
                                            config_db.db_column_converted_value
                                            ]
                # intercept min only
                inventory.loc[
                    mask_crossing_min_not_none,
                    config_db.db_column_supply_min
                    ] = inventory.loc[
                        mask_crossing_min_not_none,
                        config_db.db_column_parking_zero_crossing_min]
                # No min definition
                inventory.loc[mask_both_min_none,config_db.db_column_supply_min] = np.nan
                # slope and intercept max
                inventory.loc[
                    mask_both_max_not_note,
                    config_db.db_column_supply_max
                    ] = inventory.loc[
                            mask_both_max_not_note,
                            config_db.db_column_parking_zero_crossing_max
                            ] + inventory.loc[
                                    mask_both_max_not_note,
                                    config_db.db_column_parking_slope_max
                                    ] * inventory.loc[
                                        mask_both_max_not_note,
                                        config_db.db_column_converted_value
                                        ]
                # intercept only max
                inventory.loc[
                    mask_crossing_max_not_none,
                    config_db.db_column_supply_max
                    ] = inventory.loc[
                            mask_crossing_max_not_none,
                            config_db.db_column_parking_zero_crossing_max
                            ]
                # no max defintion
                inventory.loc[mask_both_max_none,config_db.db_column_supply_max] = np.nan
                # Drop calculation column
                inventory.drop(columns=[
                    config_db.db_column_stacked_parking_id,
                    config_db.db_column_parking_subset_id,
                    config_db.db_column_threshold_value,
                    config_db.db_column_parking_operation,
                    config_db.db_column_parking_zero_crossing_min,
                    config_db.db_column_parking_zero_crossing_max,
                    config_db.db_column_parking_slope_min,
                    config_db.db_column_parking_slope_max],inplace=True)
                # Sort to make deterministic
                inventory = inventory.sort_values(by=[config_db.db_column_lot_id,config_db.db_column_parking_unit_id])
                # Add comment with intermediate steps
                inventory[config_db.db_column_supply_comment] = (
                    "Unite: "
                    + inventory[config_db.db_column_parking_unit_id].astype(str)
                    + " Val: "
                    + inventory[config_db.db_column_converted_value].astype(str)
                    + ' '
                )
                if config_db.db_column_reg_sets_id not in inventory.columns:
                    inventory[config_db.db_column_reg_sets_id]='0'
                agg_dict = {
                    config_db.db_column_supply_comment:lambda x: '/'.join(sorted(set(map(str, x.dropna())))),    # Concatenate unique names / sort the output for determinism
                    config_db.db_column_supply_min: lambda x: x.sum(min_count=1),
                    config_db.db_column_supply_max: lambda x: x.sum(min_count=1)                  # Sum the values
                }
                inventory_out = inventory.groupby(by=[config_db.db_column_lot_id,
                                                      config_db.db_column_land_use_id,
                                                      config_db.db_column_parking_regs_id,
                                                      config_db.db_column_reg_sets_id]).agg(agg_dict).reset_index()
                inventory_out.loc[inventory_out[config_db.db_column_supply_max]<inventory_out[config_db.db_column_supply_min],
                                  config_db.db_column_supply_max]=None
                inventory_out[config_db.db_column_supply_est_meth] = methode_estime
                inventory_out[config_db.db_column_supply_meas] = np.nan
                inventory_out[config_db.db_column_supply_estimated] = np.nan
                return ParkingInventory(inventory_out)
            else:
                ValueError('You need to provide all relevant units for a regulation')

def get_lot_data_by_estimation(lot_ids:list[str],estimation_method:int,con:Engine=None)->ParkingInventory:
    """
    # get_lot_data_by_estimation
    Database interface function which allows you to obtain a set of parking supply estimates from the database
    based on the estimation method and the lot identifiers

    Inputs:
        - lot_ids: list of string with cadastral lot identifiers
        - estimation_method: integer denoting which estimation method we're trying to obtain estimates for
        - con: the sqlalchemy connection engine to use to obtain the data
    
    Outputs:
        - parking_inventory: a ParkingInventory object which contains the supply estimates for the provided list
        of lots which use the specied parking supply estimation method.
    """
    if con is None:
        con = create_engine(config_db.pg_string)
    with con.connect() as con2:
        query = f"""
                    SELECT 
                        *
                    FROM 
                        {config_db.db_table_parking_inventory}
                    WHERE {config_db.db_column_lot_id} in ('{("','").join(lot_ids)}') AND methode_estime={estimation_method}
                """
        data = pd.read_sql(query,con=con2)
        data_PI = ParkingInventory(data)
    return data_PI

def analyse_variabilite(engine:Engine,scales:list[float]=None):
    """
    # analyse_variabilite
    Variability analysis that computes the parking supply on all the lots in the city using all the available ParkingRegulationSets. 
    A list of scale factors can be provided. These scale factors apply to the unit conversions for units which are not a straight
    passthrough from the tax dataset. Bascially, trying to understand how much parking supply varies between the parkingRegulationSets
    as well as how much a variation in conversion factors on weird units affects the parking supply estimate
    
    Inputs:
        - engine: a sqlAlchemy connection engine for access to the database
        - scales: a list of scale factors which are to be used in the analysis
    Outputs
        - None. Data is directly saved to database
    """
    # obtenir les données foncières et un dataframe avec le nombre d'usage, la validité des entrées foncières et l'usage principal
    tax_dataset,lot_land_use_and_validity = TD.get_all_lots_with_valid_data(engine=engine)
    # conversion a une liste d'identifiants
    valid_lot_list = lot_land_use_and_validity[config_db.db_column_lot_id].unique().tolist()
    # obtenir les données actuelles de l'inventaire chacune calculée avec l'ER pertinent
    inventory_data = PI.get_lot_data_by_estimation(valid_lot_list,2) # Obtiens les données calculées
    # Liste de lots ou un inventaire demeure
    inventory_data_lot_list = inventory_data.parking_frame[config_db.db_column_lot_id].unique().tolist()
    # filtrer la liste de données opur que la comparaison soit valide entre l'inventaire calculé et l'analyse de variabilité
    tax_data_set_final = tax_dataset.filter_by_id(inventory_data_lot_list)
    lot_list_final = lot_land_use_and_validity.loc[lot_land_use_and_validity[config_db.db_column_lot_id].isin(inventory_data_lot_list)]
    # Obtention ensembles de règlements
    reg_sets = PRS.get_all_reg_sets_from_database(engine=engine)
    final_aggregate_data = pd.DataFrame()
    estim_comp = pd.DataFrame()
    estim_comp = lot_list_final.copy()
    estim_comp = estim_comp.merge(inventory_data.parking_frame[['g_no_lot','n_places_min']], on='g_no_lot',how='left')
    estim_comp.rename(columns={'n_places_min':'inv_reg_min'},inplace=True)
    # itération sur les ensembles de règlements
    if scales is None:
        scales = [1]
    for scale in scales:
        for reg_set in reg_sets:
            print(f'calcul en cours: reg_set {reg_set.ruleset_id} echelle:{scale}')
            # calcul des inputs pour l'ER sélectionné pour la boucle
            parking_inventory_indiv_reg_set =  PI.calculate_parking_specific_reg_set(reg_set,tax_data_set_final,scale=scale)
            # calcul de l'inventaire
            aggregate_data = parking_inventory_indiv_reg_set.aggregate_statistics_by_land_use(lot_uses=lot_list_final,level=1)
            aggregate_data['id_er']=reg_set.ruleset_id
            aggregate_data['facteur_echelle'] = scale
            if scale==1:
                #print('dude')
                estim_comp = estim_comp.merge(parking_inventory_indiv_reg_set.parking_frame[['g_no_lot','n_places_min']],on='g_no_lot',how='left')
                estim_comp.rename(columns={'n_places_min':f'inv_er_{reg_set.ruleset_id}_min'},inplace=True)
            # Concaténation dans un dataframe
            if final_aggregate_data.empty:
                final_aggregate_data = aggregate_data
            else:
                final_aggregate_data=pd.concat([final_aggregate_data,aggregate_data])
    # application d'un ceil pour approximer au nombre de places entier supérieur
    final_aggregate_data['n_places_min']= final_aggregate_data['n_places_min'].apply(np.ceil)
    # injection dans la base de données
    final_aggregate_data.to_sql('variabilite',con=engine.connect(),if_exists='replace')
    # Agrégation de l'inventaire actuel par utilisation du sol pour l'inventaire actuel
    actual_inv_aggregate = inventory_data.aggregate_statistics_by_land_use(lot_uses=lot_list_final,level=1)
    actual_inv_aggregate.to_sql('inv_reg_aggreg_cubf_n1',con=engine.connect(),if_exists='replace')
    estim_comp.to_sql('donnees_brutes_ana_var',con=engine.connect(),if_exists='replace')
    return True