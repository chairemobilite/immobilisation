# import external libs
import logging
import pandas as pd
from typing import Union
import numpy as np
# Import stuff from other files in the project
from classes import parking_inventory_inputs as PII
from classes import parking_inventory as PI
from config import config_db
from classes import parking_regs as PR
from classes import reg_set_territory as RST
from classes import parking_reg_sets as PRS
from classes import tax_dataset as TD
from aggregation import inventory_aggregation as IA


def calculate_inventory_by_analysis_sector(sector_to_calculate:int, create_html:bool = False,overwrite:int=0)->PI.ParkingInventory:
    '''
        # calculate_inventory_by_analysis_sector
        Permet de calculer le stationnement pour chaque lot danas un quartier d'analyse donné
    '''
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
    final_parking_inventory = IA.dissolve_list(parking_inventories)
    logging.info('Merging inventories for a given lot')
    out = IA.merge_lot_data(final_parking_inventory)
    
    return out

def calculate_inventory_by_lot(lot_to_calculate:str, create_html:bool = False,overwrite:int=0)->PI.ParkingInventory:
    '''
        # calculate_inventory_by_lot
            calculates the inventory for a lot
    '''
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
    final_parking_inventory = IA.dissolve_list(parking_inventories)
    logging.info('Merging inventories for a given lot')
    out = IA.merge_lot_data(final_parking_inventory)
    return out


def calculate_parking_for_reg_set_territories(reg_set_territories:Union[RST.RegSetTerritory,list[RST.RegSetTerritory]],tax_datas:Union[TD.TaxDataset,list[TD.TaxDataset]])->Union[PI.ParkingInventory,list[PI.ParkingInventory]]:
    logger = logging.getLogger(__name__)
    logger.info('-----------------------------------------------------------------------------------------------')
    logger.info('Entering Inventory')
    logger.info('-----------------------------------------------------------------------------------------------')
    if isinstance(reg_set_territories,RST.RegSetTerritory) and isinstance(tax_datas,TD.TaxDataset):
        logger.info('-----------------------------------------------------------------------------------------------')
        logger.info(f'Starting inventory for regset territory: {reg_set_territories}')
        logger.info('-----------------------------------------------------------------------------------------------')
        parking_calculation_input = PII.generate_input_from_PRS_TD(reg_set_territories.parking_regulation_set,tax_datas)
        parking_inventory_to_return = calculate_inventory_from_inputs_class(parking_calculation_input,2)
        return parking_inventory_to_return
    parking_inventory_list = []
    for sub_reg_set ,sub_tax_data in zip(reg_set_territories,tax_datas):
        if len(sub_tax_data.tax_table)>0 and len(sub_tax_data.lot_table)>0:
            logger.info('-----------------------------------------------------------------------------------------------')
            logger.info(f'Starting inventory for regset territory: {sub_reg_set}')
            logger.info('-----------------------------------------------------------------------------------------------')
            # find unique parking regs and recursively call function with only one
            parking_calculation_input = PII.generate_input_from_PRS_TD(sub_reg_set.parking_regulation_set,sub_tax_data)
            parking_inventory_to_potentially_append = calculate_inventory_from_inputs_class(parking_calculation_input,2)
            parking_inventory_list.append(parking_inventory_to_potentially_append)
    return parking_inventory_list


def calculate_parking_specific_reg_set( reg_set:PRS.ParkingRegulationSet,tax_data:TD.TaxDataset,reg_set_territory_to_transfer:int=0,scale:float=None)->PI.ParkingInventory:
    logger = logging.getLogger(__name__)
    logger.info('-----------------------------------------------------------------------------------------------')
    logger.info(f'Starting inventory for regset: {reg_set}')
    logger.info('-----------------------------------------------------------------------------------------------')
    if scale is None:
        scale = 1
    parking_calculation_input = PII.generate_input_from_PRS_TD(reg_set,tax_data,scale)
    parking_inventory = calculate_inventory_from_inputs_class(parking_calculation_input,2)
    return parking_inventory



def calculate_inventory_from_inputs_class(donnees_calcul:PII.ParkingCalculationInputs,methode_estime:int=3)->PI.ParkingInventory:
    
    ids_reglements_obtenir:list[int] = donnees_calcul[config_db.db_column_parking_regs_id].unique().tolist()
    reglements:PR.ParkingRegulations = PR.from_postgis(ids_reglements_obtenir)
    parking_out= []
    for id_reglement in ids_reglements_obtenir:
        donnees_pertinentes:pd.DataFrame = donnees_calcul.loc[donnees_calcul[config_db.db_column_parking_regs_id]==id_reglement]
        reglement:PR.ParkingRegulations = reglements.get_reg_by_id(int(id_reglement))
        unites = reglement.get_units()
        unites_donnees:list[int] = donnees_pertinentes.loc[donnees_pertinentes[config_db.db_column_parking_regs_id]==id_reglement,config_db.db_column_parking_unit_id].unique().tolist()
        if unites.sort()==unites_donnees.sort():
            parking_last = calculate_parking_specific_reg_from_inputs_class(reglement,donnees_pertinentes,methode_estime)
            parking_out.append(parking_last)
    parking_final = IA.dissolve_list(parking_out)
    out = IA.merge_lot_data(parking_final)
    return out

def calculate_parking_specific_reg_from_inputs_class(reg_to_calculate:PR.ParkingRegulations,provided_inputs:PII.ParkingCalculationInputs,methode_estime:int=3)->PI.ParkingInventory:
    if reg_to_calculate.check_only_one_regulation():
        subsets = reg_to_calculate.get_subset_numbers()
        relevant_data = provided_inputs.get_by_reg(reg_to_calculate.get_reg_id())
        for inx,subset in enumerate(subsets):
            parking_inventory_subset:PI.ParkingInventory = calculate_parking_subset_from_inputs_class(reg_to_calculate,subset,relevant_data,methode_estime)
            if inx ==0:
                parking_out:PI.ParkingInventory = parking_inventory_subset
            else:
                parking_out = subset_operation(parking_out,reg_to_calculate.get_subset_inter_operation_type(subset),parking_inventory_subset)
    return parking_out

def calculate_parking_subset_from_inputs_class(reg_to_calculate:PR.ParkingRegulations,subset:int,relevant_inputs:PII.ParkingCalculationInputs,methode_estime:int=3)->PI.ParkingInventory:
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
        ValueError('Can only calculate one rule at a time')

def calculate_threshold_based_subset_from_inputs_class(reg_to_calculate:PR.ParkingRegulations,subset:int,data:PII.ParkingCalculationInputs,methode_estime:int=3):
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
                    if zero_crossing_min is not None and slope_min is not None:
                        parking_frame_thresh['n_places_min'] = zero_crossing_min + slope_min * relevant_data['valeur']
                    elif zero_crossing_min is not None:
                        parking_frame_thresh['n_places_min'] = zero_crossing_min
                    else:
                        parking_frame_thresh['n_places_min'] = None
                    if zero_crossing_max is not None and slope_max is not None:
                        parking_frame_thresh['n_places_max'] = zero_crossing_max + slope_max * relevant_data['valeur']
                    elif zero_crossing_max is not None:
                        parking_frame_thresh['n_places_max'] = zero_crossing_max
                    else: 
                        parking_frame_thresh['n_places_max'] = None

                    parking_frame_thresh.loc[parking_frame_thresh['n_places_max']<parking_frame_thresh['n_places_min'],'n_places_max']=None
                    parking_frame_thresh['n_places_mesure'] = None
                    parking_frame_thresh['n_places_estime'] = None
                    parking_frame_thresh['methode_estime'] = methode_estime
                    parking_frame_thresh[config_db.db_column_parking_regs_id] = relevant_data[config_db.db_column_parking_regs_id]
                    if config_db.db_column_reg_sets_id in relevant_data.columns:
                        parking_frame_thresh[config_db.db_column_reg_sets_id] = relevant_data[config_db.db_column_reg_sets_id]
                    else: 
                        parking_frame_thresh[config_db.db_column_reg_sets_id]=0
                    parking_frame_thresh[config_db.db_column_land_use_id] = relevant_data[config_db.db_column_land_use_id]
                    parking_frame_thresh['commentaire'] = relevant_data.apply(lambda x: f'Unite: {x[config_db.db_column_parking_unit_id]} Val: {x['valeur']} ',axis=1)
                    if parking_final.empty:
                        parking_final = parking_frame_thresh
                    else:
                        parking_final = pd.concat([parking_final,parking_frame_thresh])
            parking_out = PI.ParkingInventory(parking_final)
            return parking_out
        else:
            ValueError('subset should have operator 4 and only one unit') 
    else:
        ValueError('Can only calculate one rule at a time')

def calculate_addition_based_subset_from_inputs_class(reg_to_calculate:PR.ParkingRegulations,subset:int,data:PII.ParkingCalculationInputs,methode_estime:int=3):
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

                inventory.loc[mask_both_min_not_none,'n_places_min'] = inventory.loc[mask_both_min_not_none,
                        config_db.db_column_parking_zero_crossing_min] + inventory.loc[mask_both_min_not_none,
                            config_db.db_column_parking_slope_min] * inventory.loc[mask_both_min_not_none,'valeur']
                inventory.loc[mask_crossing_min_not_none,'n_places_min'] = inventory.loc[mask_crossing_min_not_none,config_db.db_column_parking_zero_crossing_min]
                inventory.loc[mask_both_min_none,'n_places_min'] = np.nan

                inventory.loc[mask_both_max_not_note,'n_places_max'] = inventory.loc[mask_both_max_not_note,
                        config_db.db_column_parking_zero_crossing_max] + inventory.loc[mask_both_max_not_note,
                            config_db.db_column_parking_slope_max] * inventory.loc[mask_both_max_not_note,'valeur']
                inventory.loc[mask_crossing_max_not_none,'n_places_max'] = inventory.loc[mask_crossing_max_not_none,config_db.db_column_parking_zero_crossing_max]
                inventory.loc[mask_both_max_none,'n_places_max'] = np.nan
                inventory.drop(columns=['id_reg_stat_emp','ss_ensemble','seuil','oper','cases_fix_min','cases_fix_max','pente_min','pente_max'],inplace=True)
                inventory['commentaire'] = inventory.apply(lambda x: f'Unite: {x[config_db.db_column_parking_unit_id]} Val: {x['valeur']} ', axis=1)
                if config_db.db_column_reg_sets_id not in inventory.columns:
                    inventory[config_db.db_column_reg_sets_id]=0
                agg_dict = {
                    config_db.db_column_land_use_id: lambda x: '/'.join(map(str, x)),
                    config_db.db_column_parking_regs_id: lambda x: '/'.join(map(str, x)),
                    config_db.db_column_reg_sets_id: lambda x: '/'.join(map(str, x)), 
                    'commentaire': lambda x: '/'.join(set(x)),    # Concatenate unique names
                    'n_places_min': lambda x: x.sum(min_count=1),
                    'n_places_max': lambda x: x.sum(min_count=1)                  # Sum the values
                }
                inventory_out = inventory.groupby(by=config_db.db_column_lot_id).agg(agg_dict).reset_index()
                inventory_out.loc[inventory_out['n_places_max']<inventory_out['n_places_min'],'n_places_max']=None
                inventory_out['methode_estime'] = methode_estime
                inventory_out['n_places_mesure'] = np.nan
                inventory_out['n_places_estime'] = np.nan
                return PI.ParkingInventory(inventory_out)
            else:
                ValueError('You need to provide all relevant units for a regulation')


def subset_operation(inventory_1:PI.ParkingInventory,operator:int,inventory_2:PI.ParkingInventory) ->PI.ParkingInventory:
    logger = logging.getLogger(__name__)
    if isinstance(operator,int):
        match operator:
            case 1:
                raise NotImplementedError('Subset Operator not implemented')
            case 2:
                raise NotImplementedError('Obsolete operator')
            case 3:
                most_constraining_or_operation(inventory_1,inventory_2)
            case 4:
                raise NotImplementedError('Subset Operator not implemented')
            case 5:
                raise NotImplementedError('Obsolete operator')
            case 6:
                simple_or_operation(inventory_1,inventory_2)
    else:
        raise ValueError(f'Operator must be integer, you supplied {type(operator)}')
 

def most_constraining_or_operation(inventory_1:PI.ParkingInventory,inventory_2:PI.ParkingInventory)->PI.ParkingInventory:
    logger = logging.getLogger(__name__)
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
        parking_inventory_object = PI.ParkingInventory(new_parking_frame)
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
        parking_inventory_object = PI.ParkingInventory(new_parking_frame)
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
        parking_inventory_object = PI.ParkingInventory(new_parking_frame)
        logger.info('Complétion du cas de base')
    return parking_inventory_object

def simple_or_operation(inventory_1:PI.ParkingInventory,inventory_2:PI.ParkingInventory)->PI.ParkingInventory:
    logger = logging.getLogger(__name__)
    logger.info('entering simple OR operation')
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
    parking_inventory_object = PI.ParkingInventory(new_parking_frame)
    return parking_inventory_object