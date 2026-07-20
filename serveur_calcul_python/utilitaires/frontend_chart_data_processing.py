"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

This utility file was devised in preparation to the creation of a test suite for this
project. The algorithms in this function used to be called in the main entry files for 
charting and obtaining rules. They were moved to another file in an effort to make them 
testable. In the previous state, it was hard to make sure that every step worked as 
expected because it was all in one big script which made things hairy
"""

import pandas as pd
import numpy as np
import json

import config.config_db as cf_db
import classes.parking_regs as PR
from classes.parking_inventory_inputs import ParkingCalculationInputs
import classes.parking_reg_sets as PRS 
import classes.parking_inventory as PI
from typing import Union

def process_chart_creation(entree:dict)->str:
    """
    # process_chart_creation
    Entry point into the creation of chart. Array form of API parameters is provided 
    as input in order to parse the data. Function figures out whether regulations
    or reg sets have been specified then chooses the correct pipeline to use and return
    Note that the output is formatted in such a way as to be directly usable by chartjs. 
    This was done because the information is already beging pulled from the database so
    it made more sense to create labels and attach regulation and reg_set information 
    here.

    Inputs:
        - entree: a raw dict from the query parameters from the input

    Returns:   
        - json_out: a string formatted in json which is compatible with 
        chartjs to directly create the charts in the frontend 
    """
    # Start by parsing the input array into something which can sort which processing stream to use
    x_values_chart,regs,reg_sets,land_use,units,case=parse_dict_for_graphs(entree)
    # once 
    if case == 'regs':
        json_out=process_regulation_case(x_values_chart,regs,land_use,units)
    else:
        json_out=process_regulation_set_case(x_values_chart,reg_sets,land_use,units)
    return json_out


def parse_dict_for_graphs(entree:dict)->tuple[list[np.number],list[int],list[int],int,int,str]:
    """
    # parse_dict_for_graphs
    Parseinput that was sent to API, converts it to the correct type and acts as a validator
    which raises errors if the user misspecified the API call
    
    Returns:
        - tuple containing:
            - parking_inputs: list of x values for the chart,
            - reglements: list of regulations to chart, if none specified returns [0]
            - ensembles_reglements: list of regulation sets to chart. If none specified
            returns [0]
            - cubf: land use code to use, if none specified (i.e.rules are specified)
            then 0 is outputed
            - units: the unit specified for the parking inputs which were given
            - case_out: a string either 'regs' or 'reg_sets'

    """
    units = int(entree.get('id_unite','0'))
    # following lambdas obtain the entry from the dict if it exists, splits it using 
    # a comma separation, then the map iterates through the subsequent list. Each element
    # is then typecast to integer and the map is turned back to a list
    reglements = list(map(lambda x: int(x),entree.get('id_reg_stat','0').split(',')))
    ensembles_reglements = list(map(lambda x:int(x),entree.get('id_er', '0').split(',')))
    valeur_min = int(entree.get('min','0'))
    valeur_max = int(entree.get('max','100'))
    pas = int(entree.get('pas','10'))
    cubf = int(entree.get('cubf','0'))
    if pas<=0:
        raise ValueError('Le pas doit être strictement positif')
    if int(units)==0:
        raise ValueError('Vous devez spécifier une unité pour le graphique')
    if valeur_min<= valeur_max and valeur_min+pas<=valeur_max:
        parking_inputs = list(range(valeur_min,valeur_max,pas))
    else:
        raise ValueError('Votre combinaison de min, max et pas est mathématiquement incompatible')

    
    if reglements != [0] and ensembles_reglements != [0]:
        raise KeyError('Il ne faut pas fournir les ensembles de règlements et les règlements en même temps')
    if reglements ==[0] and ensembles_reglements == [0]:
        raise KeyError("Il faut au moins fournir un identifiant de règlement ou un identifiant d'ensemble de règlements")
    if ensembles_reglements != [0] and cubf ==0:
        raise KeyError('Pour fournir les ensembles de règlements, il faut aussi fournir un CUBF')
    if int(cubf)<0 or int(cubf)>9999:
        raise ValueError('cubf doit être en 1 et 9999')
    if reglements!=[0]:
        case_out = 'regs'
    else :
        case_out = 'reg_sets'
    return parking_inputs,reglements,ensembles_reglements,cubf,units,case_out

def process_regulation_case(x_values_chart,reglements,land_use,units)->str:
    """
    # process_regulation_case
    In this case, user provided a regulation to compute and some x values and a unit. land
    use code is somewhat surplus to requirements here given that the rules are specified
    but it's a required column in calculation_inputs due to merge requirements. This function
    obtains the regulations form the database, generates a fake parking calculation inputs
    runs the calculations for parking supply then processes it so it's ready for the frontend

    Returns:
        - a string formatted as a json for the output
    """
    reglementsPR= PR.from_postgis(reglements)
    reglementsPR.validate()
    PCIout = generate_graph_values_regs(x_values_chart,reglementsPR,units,land_use)
    inventaire = PI.calculate_inventory_from_inputs_class(PCIout,reglementsPR)
    inventaire_pivot,unique_er_reg_combos=pivot_inventory(inventaire, PCIout)
    json_out = process_regulation_pivot_to_json(inventaire_pivot,unique_er_reg_combos,reglementsPR)
    return json_out

def process_regulation_set_case(x_values_chart,regulation_sets,cubf,units)->str:
    """
    # process_regulation_set_case
    In this case, user specified regulations sets. This functon pulls them form the 
    database then creates a parking calculation inputs, runs the calculations
    and then processes the ouput to be fully legible by the charting tool on the frontend
    
    Returns:
        - a string in json format containing the answer
    """
    reg_sets= PRS.from_sql(regulation_sets)
    PCIout = generate_graph_values_reg_sets(x_values_chart,reg_sets,units,cubf)
    parking_regs=PRS.concat_to_PR(reg_sets)
    parking_regs.validate()
    inventaire = PI.calculate_inventory_from_inputs_class(PCIout,parking_regs)
    inventaire_pivot,unique_er_reg_combos=pivot_inventory(inventaire,PCIout)
    json_out= process_reg_set_pivot_to_json(inventaire_pivot,unique_er_reg_combos,parking_regs,reg_sets)
    return json_out
    
def generate_graph_values_regs(x_values_chart:list[Union[float,int,np.number]],regulations:PR.ParkingRegulations,units:list,cubf:list)->ParkingCalculationInputs:
    """
    # generate graph_calues_regs
    routine which generates the ParkingCalculationInputs from user provided values 
    and returns it

    Returns:
        - a ParkingCalculationInputs that respects the parameters listed in the x_values_chart and the various 
        regulations and units that have been specified
    """
    df_out = pd.DataFrame()
    for i, reglement in regulations.reg_head.iterrows():
        df_reg_uni = pd.DataFrame()
        df_reg_uni[cf_db.db_column_converted_value] = x_values_chart
        df_reg_uni[cf_db.db_column_parking_regs_id] = reglement[cf_db.db_column_parking_regs_id]
        df_reg_uni[cf_db.db_column_reg_sets_id] = 0
        unites = regulations.get_reg_by_id(reglement[cf_db.db_column_parking_regs_id]).reg_def[cf_db.db_column_parking_unit_id].unique().tolist()
        if len(unites)>1:
            raise ValueError("L'option graphique ne supporte pas plus d'une unité à l'heure actuelle")
        if unites and int(unites[0])!=int(units):
            raise ValueError("L'unité spécifiée ne correspond pas à l'unité du règlement")
        df_reg_uni[cf_db.db_column_parking_unit_id] = units
        df_reg_uni[cf_db.db_column_land_use_id] = cubf
        if i == 0:
            df_out = df_reg_uni
        else:
            df_out = pd.concat([df_out, df_reg_uni], ignore_index=True)
    df_out[cf_db.db_column_lot_id] = df_out.index.astype(str)
    df_out['er-reg-key'] = df_out[cf_db.db_column_parking_regs_id].astype(str) +'-' + df_out[cf_db.db_column_reg_sets_id].astype(str)
    parking_inputs_out = ParkingCalculationInputs(df_out)
    #breakpoint()
    return parking_inputs_out

def generate_graph_values_reg_sets(x_values_chart,parking_reg_sets:list[PRS.ParkingRegulationSet],units,cubf)->ParkingCalculationInputs:
    """
    # generate_graph_values_reg_sets
    Generates parking calculation output based on a range of values, a unit and a land use code and regulation
    
    Returns:
        - A parking calculation input based on specified values that can be run through supply calcuations
    """
    df_out=pd.DataFrame()
    for er_pert in parking_reg_sets:
        er_pert.expand_land_use_table()
        df_reg_uni = pd.DataFrame()
        df_reg_uni[cf_db.db_column_converted_value] = x_values_chart
        df_reg_uni[cf_db.db_column_reg_sets_id] = int(er_pert.ruleset_id)
        reg_ids=er_pert.get_unique_reg_ids_using_land_use([cubf])
        if len(reg_ids)!=1:
            raise ValueError(f"Le CUBF {cubf} doit correspondre à un seul règlement")
        reg_a_util:int= int(reg_ids[0])
        df_reg_uni[cf_db.db_column_parking_regs_id] = reg_a_util
        reglement:PR.ParkingRegulations = er_pert.get_reg_by_id(reg_a_util)
        unites = reglement.reg_def[cf_db.db_column_parking_unit_id].unique().tolist()
        if len(unites)>1:
            raise ValueError("L'option graphique ne supporte pas plus d'une unité à l'heure actuelle")
        if unites and int(unites[0]) != int(units):
            raise ValueError("L'unité spécifiée ne correspond pas à l'unité du règlement")
        df_reg_uni[cf_db.db_column_parking_unit_id] = units
        df_reg_uni[cf_db.db_column_land_use_id] = cubf
        if df_out.empty:
            df_out = df_reg_uni
        else:
            df_out = pd.concat([df_out, df_reg_uni], ignore_index=True)
    df_out[cf_db.db_column_lot_id] = df_out.index.astype(str)
    df_out['er-reg-key'] = df_out[cf_db.db_column_parking_regs_id].astype(str) +'-' + df_out[cf_db.db_column_reg_sets_id].astype(str)
    parking_inputs_out = ParkingCalculationInputs(df_out)
    #breakpoint()
    return parking_inputs_out

def pivot_inventory(inventaire:PI.ParkingInventory,calculation_inputs:ParkingCalculationInputs)->tuple[pd.DataFrame,list[str]]: 
    """
    # pivot_inventory
    Transforms the parking calculation result in order to be a dataframe with the minimums 
    in the columns and the x_chart_value as the index
    
    Inputs:
        - inventaire: ParkingInventory which contains the results of the calculations
        - calculation_inputs: ParkingCalculationInputs which contans the inputs used
    Returns:
        - a tuple containing
            - inventaire_pivot, the result pivoted so the minimums are in columns named after
            the reg and reg set used, the minimum parking is in the values and the x coordinate 
            is a function of the lines
            - unique_er_reg_combos: a list of the combination of regulations and regulation sets
            which is used to loop over outputs and format them
    """
    # cleaning up the data set in order to output it
    inventaire_frame = inventaire.parking_frame.drop(columns=cf_db.db_column_parking_regs_id)
    inventaire_merge = inventaire_frame.merge(calculation_inputs,on=cf_db.db_column_lot_id,how='left')
    unique_er_reg_combos = inventaire_merge['er-reg-key'].unique().tolist()
    inventaire_pivot = inventaire_merge.pivot(columns='er-reg-key',index=cf_db.db_column_converted_value,values=cf_db.db_column_supply_min)
    inventaire_pivot.fillna(0,inplace=True)
    #print(inventaire_pivot)
    reglements = calculation_inputs[cf_db.db_column_parking_regs_id].unique().tolist()
    inventaire_pivot.reset_index(inplace=True)
    return inventaire_pivot,unique_er_reg_combos

def process_regulation_pivot_to_json(
        inventaire_pivot:pd.DataFrame,
        unique_er_reg_combos:list[str],
        regulations:PR.ParkingRegulations)-> str:
    """
    # process_regulation_pivot_to_json
    Takes the pivotted data frame and turns it into a json which works for the creation of the chart

    Inputs: 
        - inventaire_pivot: dataframe created above
        - unique_er_reg_combos: list of combinations to process
        - regulations: the  parking regulations used to add the descriptions to the output
    Returns:
        - a string formatted as a json which is easily converted to the format which is used for chartjs
    """
    json_out = '{'
    json_out += f'"labels": [{','.join(inventaire_pivot[cf_db.db_column_converted_value].astype(str).to_list())}], "datasets":['
    dataset_list = []
    for reglement in unique_er_reg_combos:
        reg_er = reglement.split('-')
        reg = int(reg_er[0])
        rule: PR.ParkingRegulations = regulations.get_reg_by_id(reg)
        unique_rule: PR.ParkingRegulations = rule.get_reg_by_id(reg)
        description: str = unique_rule.reg_head.iloc[0].description
        dataset_list.append({
            "data":inventaire_pivot[reglement].tolist(),
            "label":description,
            "id_reg_stat":reg
        })
    return json.dumps({
        "labels":inventaire_pivot[cf_db.db_column_converted_value].tolist(),
        "datasets":dataset_list
    })

def process_reg_set_pivot_to_json(
        inventaire_pivot:pd.DataFrame,
        unique_er_reg_combos:list[str],
        parking_regs:PR.ParkingRegulations,
        reg_sets:list[PRS.ParkingRegulationSet]):
    """
    # process_reg_set_pivot_to_json
    Takes the pivotted inventory which is previously calculated and puts into a format which is legible for 
    chartjs with additional fields for the regulation data

    Inputs:
        - inventaire_pivot: the dataframe generated with the inventory in columns and x values as rows
        - unique_er_reg_combos: combination of reg and reg set ids in string format
        - parking_regs: the parking regulations used to add the description to the output
        - reg_sets: the parking reg_sets which are used. this is to add the description to the output

    Returns:
        - a str formatted as a json which is easily legible for chartjs
    """
    dataset_list = []
    for reglement in unique_er_reg_combos:
        reg_er = reglement.split('-')
        reg = int(reg_er[0])
        er = int(reg_er[1])

        rule = parking_regs.get_reg_by_id(reg)
        unique_rule: PR.ParkingRegulations = rule.get_reg_by_id(reg)
        description: str = unique_rule.reg_head.iloc[0].description

        reg_set= [er_loc for er_loc in reg_sets if er_loc.ruleset_id==er]
        reg_set:PRS.ParkingRegulationSet = reg_set[0]

        dataset_list.append({
            "data":inventaire_pivot[reglement].tolist(),
            "label":reg_set.description,
            "id_reg_stat":reg,
            "id_er":er,
            "desc_reg_stat":description,
            "desc_er":reg_set.description
        })
    return json.dumps({
        "labels":inventaire_pivot[cf_db.db_column_converted_value].tolist(),
        "datasets":dataset_list
    })

def obtain_parking_regulations_info_for_graph(entree:dict)->pd.DataFrame:
    """
    # obtain_parkin_regulations_info_for_graph
    Takes the reg set id and land use code to obtain the regulation id and the 
    units which need to be specified and converts them to a json so that can 
    be processed for user to select which regulations not to plot if there are 
    multiple units specified
    
    Inputs:
        - entree: dict containing two fields: 
            - id_er: comma separated list of reg set ids
            - cubf: the land use code for which we"re trying to see the output for
    
    Returns:
        - pandas dataframe containing reg set id, parking ids and a list of 
        units used in the parking regulation
    """
    prs_ids,land_use_id = parse_input_data_for_graph_info(entree)
    #breakpoint()
    reg_sets = PRS.from_sql(prs_ids)
    df_out= run_extraction_regs_units_sets_for_graph(reg_sets,land_use_id)
    
    return df_out

def parse_input_data_for_graph_info(entree:dict):
    """
    # parse_input_data_for_graph_info
    takes the raw inputs that the backend send to the script as arguments
    and converts them to useful data
    
    Inputs:
    - entree : a dict containing the fields which are required: cubf and id_er
    
    Returns:
        - a tuple containing:
            - prs_ids: a list of integers denoting the reg sets to use
            - land_use_id: the land use id which you're trying to plot
    """
    array_entry = entree[0]
    land_use_id = int(array_entry.get('cubf',0))
    if land_use_id==0 or land_use_id>9999:
        raise ValueError('cubf mal spécifié doit être entre 1 et 9999')
    prs_ids = list(map(lambda x:int(x),array_entry.get('id_er',[0])))
    if len(prs_ids)==1 and prs_ids[0]==0:
        raise ValueError('identifiants ensembles des règlements mal spécifiés')
    return prs_ids,land_use_id

def run_extraction_regs_units_sets_for_graph(reg_sets:list[PRS.ParkingRegulationSet],land_use_id:int)->pd.DataFrame:
    """
    # run_extraction_regs_units_sets_for_graph
    function goes through the extracted reg sets, finds the rule used for the specified 
    land use code and the associated units and returns it into a dataframe

    Inputs
        - reg_sets: the list of reg_sets that you want to process. Here you're providing the 
        actual objects
        - land_use_id: a pre validated land use code that you're using to extract the
        relevant regulation and unit ids which are associated
    
    Returns:
        - a data frame with 3 columns:
            - id_er: the regulations set which are being requested
            - id_reg_stat: the regulation number associated with the specified land use
            - unite: a list of unit ids specifying what units are used in the regs
    """
    reg_set_list =[]
    reg_list = []
    unit_list = []
    for reg_set in reg_sets:
        reg_set.validate()
        reg_set.expand_land_use_table()
        reg_id = reg_set.get_unique_reg_ids_using_land_use([land_use_id])
        reg_out:PR.ParkingRegulations = reg_set.get_reg_by_id(reg_id)
        unit_out = reg_out.get_units()
        reg_set_list.append(reg_set.ruleset_id)
        reg_list.append(reg_out.get_reg_id())
        unit_list.append(unit_out)
    dict_out = {cf_db.db_column_reg_sets_id:reg_set_list,
                cf_db.db_column_parking_regs_id:reg_list,
                cf_db.db_column_parking_unit_id:unit_list}
    df_out = pd.DataFrame(dict_out)
    return df_out
