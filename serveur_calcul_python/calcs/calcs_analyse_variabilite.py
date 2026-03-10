# External libraries
import numpy as np
import pandas as pd
# import from within project
from config import config_db
from classes import tax_dataset as TD
from classes import parking_reg_sets as PRS
import serveur_calcul_python.calcs.calcs_inventaire as IC
from classes import parking_inventory as PI
from serveur_calcul_python.aggregation import agg_inventaire as IA
from sqlalchemy import Engine



def analyse_variabilite(engine:Engine,scales:list[float]=None):
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
    actual_inv_aggregate:pd.DataFrame = IA.aggregate_statistics_by_land_use(inventory_data,lot_uses=lot_list_final,level=1)
    actual_inv_aggregate.to_sql('inv_reg_aggreg_cubf_n1',con=engine.connect(),if_exists='replace')
    estim_comp.to_sql('donnees_brutes_ana_var',con=engine.connect(),if_exists='replace')
    return True