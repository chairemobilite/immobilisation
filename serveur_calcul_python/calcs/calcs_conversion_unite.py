import numpy as np
import pandas as pd
from config import config_db
from classes import parking_reg_sets as PRS
from classes import parking_regs as PR
from classes import parking_inventory_inputs as PCI
from classes import tax_dataset as TD

def generate_values_based_on_available_data(entree:dict)->PCI.ParkingCalculationInputs:
    '''# generate_values_based_on_available_data
        inputs: 
            entree: dictionnaire contenant les informations fournies par le front end pour le calcul des entrées pertinentes
        outputs:
            parking_inputs_out: un ParkingCalculationInputs qui peut être utilisé pour calculer le stationnement pour le ou les lots inclus
    '''
    units = entree.get('id_unite','0')
    reglements = entree.get('id_reg_stat','0').split(',')
    ensembles_reglements = entree.get('id_er', '0').split(',')
    valeur_min = entree.get('min','0')
    valeur_max = entree.get('max','100')
    pas = entree.get('pas','10')
    cubf = entree.get('cubf','0')
    if int(units)==0:
        ValueError('Vous devez spécifier une unité pour le graphique')
    if int(valeur_min)<= int(valeur_max) and int(valeur_min)+int(pas)<=int(valeur_max):
        parking_inputs = list(range(int(valeur_min),int(valeur_max),int(pas)))
    else:
        ValueError('Votre combinaison de min, max et pas est mathématiquement incompatible')

    
    if reglements != ['0'] and ensembles_reglements != ['0']:
        KeyError('Il ne faut pas fournir les ensembles de règlements et les règlements en même temps')
    if reglements ==['0'] and ensembles_reglements == ['0']:
        KeyError("Il faut au moins fournir un identifiant de règlement ou un identifiant d'ensemble de règlements")
    if ensembles_reglements != ['0'] and cubf =='0':
        KeyError('Pour fournir les ensembles de règlements, il faut aussi fournir un CUBF')
    if int(cubf)<0 and int(cubf)>9999:
       ValueError('cubf doit être en 1 et 9999') 
    df_out = pd.DataFrame()
    if reglements !=['0']:
        for i, reglement in enumerate(reglements):
            df_reg_uni = pd.DataFrame()
            df_reg_uni['valeur'] = parking_inputs
            df_reg_uni['id_reg_stat'] = int(reglement)
            df_reg_uni['id_er'] = 0
            reglement:PR.ParkingRegulations = PR.from_postgis(int(reglement))
            unites = reglement.reg_def[config_db.db_column_parking_unit_id].unique().tolist()
            if len(unites)>1 and unites[0]!= int(units):
                ValueError("L'option graphique ne supporte pas plus d'une unité à l'heure actuelle")
            df_reg_uni['unite'] = int(units)
            df_reg_uni['cubf'] = int(cubf)
            if i == 0:
                df_out = df_reg_uni
            else:
                df_out = pd.concat([df_out, df_reg_uni], ignore_index=True)
        df_out['g_no_lot'] = df_out.index.astype(str)
        df_out['er-reg-key'] = df_out['id_reg_stat'].astype(str) +'-' + df_out['id_er'].astype(str)
        parking_inputs_out = PCI.ParkingCalculationInputs(df_out)
        #breakpoint()
        return parking_inputs_out
    elif ensembles_reglements!= ['0']:
        # ensembles_reglements is a list, so this line is not correct as-is.
        # If you want to get PRS.ParkingRegulationSet objects for each id in the list, you should iterate:
        n_er = len(ensembles_reglements)
        er_pert: list[PRS.ParkingRegulationSet]
        er_pert = PRS.from_sql([int(er) for er in ensembles_reglements])
        for i, id_er_pert in enumerate(ensembles_reglements):
            df_reg_uni = pd.DataFrame()
            df_reg_uni['valeur'] = parking_inputs
            df_reg_uni['id_er'] = int(id_er_pert)
            er_a_util:list[PRS.ParkingRegulationSet] = [er_fin for er_fin in er_pert if er_fin.ruleset_id == int(id_er_pert)]
            reg_a_util:int= int(er_a_util[0].get_unique_reg_ids_using_land_use([int(cubf)])[0])
            df_reg_uni['id_reg_stat'] = reg_a_util
            reglement:PR.ParkingRegulations = PR.from_postgis(reg_a_util)
            unites = reglement.reg_def[config_db.db_column_parking_unit_id].unique().tolist()
            if len(unites)>1 and unites[0]!= int(units):
                ValueError("L'option graphique ne supporte pas plus d'une unité à l'heure actuelle")
            df_reg_uni['unite'] = int(units)
            df_reg_uni['cubf'] = int(cubf)
            if i == 0:
                df_out = df_reg_uni
            else:
                df_out = pd.concat([df_out, df_reg_uni], ignore_index=True)
        df_out['g_no_lot'] = df_out.index.astype(str)
        df_out['er-reg-key'] = df_out['id_reg_stat'].astype(str) +'-' + df_out['id_er'].astype(str)
        parking_inputs_out = PCI.ParkingCalculationInputs(df_out)
        #breakpoint()
        return parking_inputs_out


def compute_valeur(row):
    # 1️⃣ Pull the three pieces we need
    zero   = row[config_db.db_column_tax_data_conversion_zero]
    slope  = row[config_db.db_column_tax_data_conversion_slope]
    col_to_use = row[config_db.db_column_tax_data_column_to_multiply]   # <-- this is the *name* of the column we want

    # 2️⃣ Does the column actually exist in this DataFrame?
    if col_to_use not in row.index:
        # Column name not found → decide what you want to do.
        # Here we return NaN so you can spot the problem later.
        return np.nan

    # 3️⃣ Grab the value from the dynamically‑chosen column
    factor = row[col_to_use]

    # 4️⃣ Coerce everything to numeric, turning bad values into NaN
    try:
        zero   = pd.to_numeric(zero,   errors='coerce')
        slope  = pd.to_numeric(slope,  errors='coerce')
        factor = pd.to_numeric(factor, errors='coerce')
    except Exception:
        return np.nan

    # 5️⃣ If any piece is NaN, decide on a fallback.
    #    Below we treat missing numbers as 0 (you could also return NaN).
    zero   = 0 if pd.isna(zero)   else zero
    slope  = 0 if pd.isna(slope)  else slope
    factor = 0 if pd.isna(factor) else factor

    # 6️⃣ Final calculation
    return zero + slope * factor


def generate_input_from_PRS_TD(prs: PRS.ParkingRegulationSet,td:TD.TaxDataset, scale:float=None)->PCI.ParkingCalculationInputs:
    ''' # generate_input_from_PRS_TD
            Fonction permettant de créer un ParkingCalculationInput. L'hyopthèse principale de la fonction est que le PRS est applicable à l'ensemble fourni aucune segmentation des données foncières n'est faite pour valider les intrants
            Entrées:
                - prs: PRS.ParkingRegulationSet qui nous permet d'indéxer un ensemble de règlements en vigueur à un moment
                - td: TD.TaxDataset qui est l'ensemble des données entrantes à partir desquels ont veut créer un intrant de calcul
                - scale: utilisé seulement pour faire de l'analyse de sensibilité au facteurs de conversion
            Sorties: 
                - ParkingCalculationsInput: Objet de la class ParkingCalculationsInputs (essentiellement un dataframe pandas) qui peut être utilisé pour le calcul de la capacité de stationnement
    '''
    try:
        if scale is None:
            units= prs.units_table
        else:
            units= prs.units_table
            units.loc[units[config_db.db_column_tax_data_conversion_slope]!=1,config_db.db_column_tax_data_conversion_slope] =  units.loc[units[config_db.db_column_tax_data_conversion_slope]!=1,config_db.db_column_tax_data_conversion_slope] * scale
        # relevant reg ids
        relevant_regulation_ids = prs.get_unique_reg_ids()
        # 
        units_used = prs.get_all_units_used()
        units_final = units.loc[units[config_db.db_column_units_id].isin(units_used)]
        relevant_columns:list[str] = units_final[config_db.db_column_tax_data_column_to_multiply].unique().tolist()
        relevant_columns.append(config_db.db_column_tax_id)
        relevant_columns.append(config_db.db_column_tax_land_use)
        combined_tax_table = td.lot_table[[config_db.db_column_lot_id,'g_va_suprf']].merge(td.lot_association,how='left',on=config_db.db_column_lot_id).merge(td.tax_table[relevant_columns],how='left',on=config_db.db_column_tax_id)
        tax_rule_table = combined_tax_table.merge(prs.expanded_table,how='left',left_on=config_db.db_column_tax_land_use,right_on=config_db.db_column_land_use_id)
        rule_units_association = prs.reg_def[[config_db.db_column_parking_regs_id, config_db.db_column_parking_unit_id]].drop_duplicates()
        # You can now use rule_units_association as needed, for example:
        tax_rule_units_merge= tax_rule_table.merge(rule_units_association,how='inner',on=config_db.db_column_parking_regs_id)
        conversion_factors_merge = tax_rule_units_merge.merge(units_final[[config_db.db_column_units_id,config_db.db_column_tax_data_conversion_slope,config_db.db_column_tax_data_conversion_zero,config_db.db_column_tax_data_column_to_multiply]],how='left',left_on=config_db.db_column_parking_unit_id,right_on=config_db.db_column_units_id)
        
        conversion_factors_merge['valeur'] = conversion_factors_merge.apply(compute_valeur,
            axis=1
        )
        conversion_factors_merge_out_start = conversion_factors_merge[[config_db.db_column_lot_id,config_db.db_column_parking_regs_id,config_db.db_column_parking_unit_id,config_db.db_column_land_use_id,'valeur']]
        final_out = conversion_factors_merge_out_start.groupby(
            [config_db.db_column_lot_id, config_db.db_column_parking_regs_id, config_db.db_column_parking_unit_id, config_db.db_column_land_use_id]
        ).agg({'valeur': 'sum'}).reset_index()
        #duplicates_for_fun = final_out.groupby(config_db.db_column_lot_id).agg(count=(config_db.db_column_lot_id, 'count')).reset_index()
        #duplicates_for_fun = duplicates_for_fun.loc[duplicates_for_fun['count']>1,config_db.db_column_lot_id].to_list()
        #complex_outs = final_out.loc[final_out[config_db.db_column_lot_id].isin(duplicates_for_fun)]
        #print(final_out)
        final_out[config_db.db_column_reg_sets_id] = int(prs.ruleset_id)
        final_out[config_db.db_column_parking_regs_id] = final_out[config_db.db_column_parking_regs_id].astype(int)
        PCI_to_Out = PCI.ParkingCalculationInputs(final_out)
        return PCI_to_Out
    except Exception as e:
        print('caught error in conversion from tax dataset to relevant calculation input')