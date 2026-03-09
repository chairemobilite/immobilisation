import pandas as pd
import logging
from config import config_db
from classes import parking_inventory as PI


def dissolve_list(list_to_dissolve:list[PI.ParkingInventory])->PI.ParkingInventory:
    for inx,item_to_concat in enumerate(list_to_dissolve):
        if inx==0:
            inventory_to_out = item_to_concat
        else:
            inventory_to_out.concat(item_to_concat)
    return inventory_to_out

def aggregate_statistics_by_land_use(inventory:PI.ParkingInventory, lot_uses:pd.DataFrame, level:int=1)->pd.DataFrame:
    logging.info('Entrée dans la création de statistiques agrégées')
    stats = []
    match level:
        case 1:
            unique_land_uses = lot_uses['cubf_lvl1'].unique().tolist()
            for land_use in unique_land_uses:
                lots_to_aggregate = lot_uses.loc[lot_uses['cubf_lvl1']==land_use, config_db.db_column_lot_id].unique().tolist()
                subset = inventory.parking_frame[inventory.parking_frame[config_db.db_column_lot_id].isin(lots_to_aggregate)]
                stats.append({
                    'land_use': land_use,
                    'n_lots': len(lots_to_aggregate),
                    'n_places_min': subset['n_places_min'].sum()
                })
        case 2:
            unique_land_uses = lot_uses['cubf_lvl2'].unique().tolist()
            for land_use in unique_land_uses:
                lots_to_aggregate = lot_uses.loc[lot_uses['cubf_lvl2']==land_use, config_db.db_column_lot_id].unique().tolist()
                subset = inventory.parking_frame[inventory.parking_frame[config_db.db_column_lot_id].isin(lots_to_aggregate)]
                stats.append({
                    'land_use': land_use,
                    'n_lots': len(lots_to_aggregate),
                    'n_places_min': subset['n_places_min'].sum()
                })
        case 3:
            unique_land_uses = lot_uses['cubf_lvl3'].unique().tolist()
            for land_use in unique_land_uses:
                lots_to_aggregate = lot_uses.loc[lot_uses['cubf_lvl3']==land_use, config_db.db_column_lot_id].unique().tolist()
                subset = inventory.parking_frame[inventory.parking_frame[config_db.db_column_lot_id].isin(lots_to_aggregate)]
                stats.append({
                    'land_use': land_use,
                    'n_lots': len(lots_to_aggregate),
                    'n_places_min': subset['n_places_min'].sum()
                })
    return pd.DataFrame(stats)


def inventory_duplicates_agg_function(x:pd.DataFrame):
    d = {}
    d[config_db.db_column_land_use_id] = '/'.join(map(str, x[config_db.db_column_land_use_id]))
    d[config_db.db_column_reg_sets_id] = '/'.join(map(str, x[config_db.db_column_reg_sets_id]))
    d[config_db.db_column_parking_regs_id] = '/'.join(map(str, x[config_db.db_column_parking_regs_id]))
    d['n_places_min'] = x['n_places_min'].sum()
    d['n_places_max'] = x['n_places_max'].sum()
    d['commentaire'] = ', '.join(map(str, x['commentaire']))
    d['methode_estime'] = x['methode_estime'].values[0]
    return pd.Series(d,index = [config_db.db_column_land_use_id,config_db.db_column_reg_sets_id,config_db.db_column_parking_regs_id,'n_places_min','n_places_max','commentaire','methode_estime'])

def merge_lot_data(inventory:PI.ParkingInventory)->None:
    '''
    #merge_lot_data
        Utilisé pour faire le ménage de duplication de lots lorque plusieurs entrées d'inventaire sont présentes pour un même lot du rôle foncier.
    '''
    logger = logging.getLogger(__name__)
    inventory.parking_frame.reset_index(inplace=True)
    inventory.parking_frame.drop(columns='index',inplace=True)
    lots_to_clean_up = inventory.parking_frame.loc[inventory.parking_frame[config_db.db_column_lot_id].duplicated(keep=False)]
    lots_list_to_purge_from_self = lots_to_clean_up[config_db.db_column_lot_id].unique().tolist()
    if len(lots_list_to_purge_from_self)>0:
        aggregate_parking_data = lots_to_clean_up.groupby([config_db.db_column_lot_id]).apply(inventory_duplicates_agg_function, include_groups=True).reset_index()
        aggregate_parking_data.loc[(aggregate_parking_data['n_places_min']>aggregate_parking_data['n_places_max']) |(aggregate_parking_data['n_places_max']==0.0),'n_places_max'] =None
        new_parking_frame = inventory.parking_frame.drop(inventory.parking_frame[inventory.parking_frame[config_db.db_column_lot_id].isin(lots_list_to_purge_from_self)].index)
        new_parking_frame = pd.concat([new_parking_frame,aggregate_parking_data])

        inventory.parking_frame = new_parking_frame 
        logger.info(f'found following items which have two estimates : {lots_list_to_purge_from_self} - estimates were summed')
    else: 
            logger.info('No duplicate entries, continue,continuting on')