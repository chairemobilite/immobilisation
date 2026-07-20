"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Data store for inputs of regulation various cases. Outputs are
all PCI objects
"""

# external libraries
import pandas as pd
import numpy as np
# internal functions
import config.config_db as cf_db
import classes.parking_inventory_inputs as PCI

def generate_input_reg_case():
    """
    # generate_input_reg_case
    generates an example dict which can be used as 
    input to the pipeline for the case where  
    a regulation is specified rather than a regulation
    sets
    """
    output = {
        cf_db.db_column_parking_regs_id:'1,2',
        cf_db.db_column_land_use_id:'1',
        cf_db.db_column_units_id:'1',
        'min':'0',
        'max':'1500',
        'pas':'100'}
    return output

def generate_input_reg_sets_case():
    """
    # generate_input_reg_sets_case
    generate an example dict which can be used as 
    input to the pipeline for the case where the 
    regulation set is generated rather than reg
    ids
    """
    output = {
        cf_db.db_column_reg_sets_id:'1,2',
        cf_db.db_column_land_use_id:'1',
        cf_db.db_column_units_id:'1',
        'min':'0',
        'max':'1500',
        'pas':'100'}
    return output

def generate_invalid_cubf():
    """
    # generate_invalid_cubf
    generate an example dict which can be used as 
    input to the pipeline for the case where the 
    regulation set is generated rather than reg
    ids. In this case, an invalid land use code
    is being generated 
    """
    output = {
        cf_db.db_column_reg_sets_id:'1,2',
        cf_db.db_column_land_use_id:'10000',
        cf_db.db_column_units_id:'1',
        'min':'0',
        'max':'1500',
        'pas':'100'}
    return output

def generate_missing_cubf():
    """
    # generate_missing_cubf
    generate a case where you generate the parking regulations
    and do not generate a land use
    """
    output = {
        cf_db.db_column_parking_regs_id:'1,2',
        cf_db.db_column_units_id:'1',
        'min':'0',
        'max':'1500',
        'pas':'100'}
    return output

def generate_invalid_step_value():
    """
    # generate_invalid_step_value
    generates an input dict which has a step size which 
    is larger than the difference between min and max which
    should raise an error 
    """
    output = {
        cf_db.db_column_parking_regs_id:'1,2',
        cf_db.db_column_units_id:'1',
        'min':'0',
        'max':'1500',
        'pas':'1600'}
    return output

def generate_invalid_min_max():
    """
    # generate_invalid_min_max
    generates and input dict which has a minimum which is 
    larger than the max which should raise an error
    """
    output = {
        cf_db.db_column_parking_regs_id:'1,2',
        cf_db.db_column_units_id:'1',
        'min':'200',
        'max':'100',
        'pas':'10'}
    return output


def generate_range_units():
    """
    # generate_range_units
    generates a range spanning from 0 to 1400 in 
    100 increments.
    Returns:
        - list with items ranging from 0 to 1400 in 
        100 increments
    """
    return list(range(0,1500,100))  

def generate_expected_calc_input():
    """
    # generate_expected_calc_input
    generate the parking calculation result for the test case being set up
    with the ParkingRegSets which were developped as the test case
    
    Input:
        - None
    Output:
        - a ParkingCalculationsInput with the expected output for a calculation over 
        0 to 1400 square meters in 100 sqm increments
    """
    expected_output_1 = pd.DataFrame({
        cf_db.db_column_converted_value:list(range(0,1500,100)),
        cf_db.db_column_reg_sets_id: [1]*15,
        cf_db.db_column_parking_regs_id:[4]*15,
        cf_db.db_column_parking_unit_id:[1]*15,
        cf_db.db_column_land_use_id:[1]*15,
        cf_db.db_column_lot_id:map(lambda x :str(x),list(range(0,15,1))),
        'er-reg-key':['4-1']*15
    })
    expected_output_2 = pd.DataFrame({
        cf_db.db_column_converted_value:list(range(0,1500,100)),
        cf_db.db_column_reg_sets_id: [2]*15,
        cf_db.db_column_parking_regs_id:[4]*15,
        cf_db.db_column_parking_unit_id:[1]*15,
        cf_db.db_column_land_use_id:[1]*15,
        cf_db.db_column_lot_id:map(lambda x: str(x),list(range(15,30,1))),
        'er-reg-key':['4-2']*15
    })
    data_out = PCI.ParkingCalculationInputs(pd.concat([expected_output_1,expected_output_2]).reset_index().drop(columns='index'))
    return data_out

def generate_reg_case_expected_inputs_data():
    """
    # generate_reg_case_expected_inputs_data
    generates the ParkingCalculationInputs for the calculation that is 
    expected when the user specifies regulation rather than regulation sets
    
    Outputs:
        - a ParkingCalculationInputs dataset that is the expected value when the user
        generates only regulation ids(rather than regulation set ids) to the chart
        creation endpoint in the backend
    """
    expected_output_1 = pd.DataFrame({
        cf_db.db_column_converted_value:list(range(0,1500,100)),
        cf_db.db_column_parking_regs_id:[1]*15,
        cf_db.db_column_reg_sets_id: [0]*15,
        cf_db.db_column_parking_unit_id:[1]*15,
        cf_db.db_column_land_use_id:[1]*15,
        cf_db.db_column_lot_id:map(lambda x :str(x),list(range(0,15,1))),
        'er-reg-key':['1-0']*15
    })
    expected_output_2 = pd.DataFrame({
        cf_db.db_column_converted_value:list(range(0,1500,100)),
        cf_db.db_column_parking_regs_id:[2]*15,
        cf_db.db_column_reg_sets_id: [0]*15,
        cf_db.db_column_parking_unit_id:[1]*15,
        cf_db.db_column_land_use_id:[1]*15,
        cf_db.db_column_lot_id:map(lambda x: str(x),list(range(15,30,1))),
        'er-reg-key':['2-0']*15
    })
    data_out = PCI.ParkingCalculationInputs(pd.concat([expected_output_1,expected_output_2]).reset_index().drop(columns='index'))
    return data_out

def generate_reg_set_case_expected_calculation_result():
    """
    # generate_reg_set_case_expected_calculation_result
    return a parkingInventory which has the correct values of parking 
    supply for the test case that has been defined in the reg sets case
    """
    frame_0 = pd.DataFrame(
        {
            cf_db.db_column_lot_id:map(lambda x :str(x),list(range(0,15,1))),
            cf_db.db_column_land_use_id: [1]*15,
            cf_db.db_column_parking_regs_id:[4]*15,
            cf_db.db_column_reg_sets_id:[1]*15,
            cf_db.db_column_supply_comment: list(map(
                lambda x:f'Unite: 1 Val: {x:.0f} /Unite: 1 Val: {x:.0f} ',
                generate_range_units())),
            cf_db.db_column_supply_est_meth:[3]*15,
            cf_db.db_column_supply_meas:[None]*15,
            cf_db.db_column_supply_estimated:[None]*15,
            cf_db.db_column_supply_min: generate_calculation_result_list(),
            cf_db.db_column_supply_max:[None]*15
        }
    )
    frame_1 = pd.DataFrame(
        {
            cf_db.db_column_lot_id:map(lambda x :str(x),list(range(15,30,1))),
            cf_db.db_column_land_use_id: [1]*15,
            cf_db.db_column_parking_regs_id:[4]*15,
            cf_db.db_column_reg_sets_id:[2]*15,
            cf_db.db_column_supply_comment: list(map(
                lambda x:f'Unite: 1 Val: {x:.0f} /Unite: 1 Val: {x:.0f} ',
                generate_range_units())),
            cf_db.db_column_supply_est_meth:[3]*15,
            cf_db.db_column_supply_meas:[None]*15,
            cf_db.db_column_supply_estimated:[None]*15,
            cf_db.db_column_supply_min: generate_calculation_result_list(),
            cf_db.db_column_supply_max:[None]*15
        }
    )
    frame_out = pd.concat([frame_0,frame_1]).reset_index().drop(columns=['index'])
    frame_out[cf_db.db_column_supply_meas] = frame_out[cf_db.db_column_supply_meas].astype(float)
    frame_out[cf_db.db_column_supply_estimated] = frame_out[cf_db.db_column_supply_estimated].astype(float)
    frame_out[cf_db.db_column_supply_max] = frame_out[cf_db.db_column_supply_max].astype(float)

    frame_out['sort_column']= frame_out[cf_db.db_column_lot_id].astype(int)
    frame_out = frame_out.sort_values(by=['sort_column']).reset_index()
    frame_out = frame_out.drop(columns=['sort_column','index'])
    return frame_out

def generate_reg_case_expected_inventory():
    """
    # generate_reg_case_expected_inventory
    This function generates the expected result of the inventory calcuation 
    for the case where the user specified regulations rather than regulation 
    sets for the graphing of regulations 

    Outputs:
        - a ParkingInventory object with the expected outputs 
    """
    frame_0 = pd.DataFrame(
        {
            cf_db.db_column_lot_id:map(lambda x :str(x),list(range(0,15,1))),
            cf_db.db_column_land_use_id: [1]*15,
            cf_db.db_column_parking_regs_id:[1]*15,
            cf_db.db_column_reg_sets_id:[0]*15,
            cf_db.db_column_supply_comment: list(map(
                lambda x:f'Unite: 1 Val: {x:.0f} ',
                generate_range_units())),
            cf_db.db_column_supply_min: generate_reg_case_reg_one_result(),
            cf_db.db_column_supply_max:[np.nan]*15,
            cf_db.db_column_supply_est_meth:[3]*15,
            cf_db.db_column_supply_meas:[np.nan]*15,
            cf_db.db_column_supply_estimated:[np.nan]*15
        }
    )
    frame_1 = pd.DataFrame(
        {
            cf_db.db_column_lot_id:map(lambda x :str(x),list(range(15,30,1))),
            cf_db.db_column_land_use_id: [1]*15,
            cf_db.db_column_parking_regs_id:[2]*15,
            cf_db.db_column_reg_sets_id:[0]*15,
            cf_db.db_column_supply_comment: list(map(
                lambda x:f'Unite: 1 Val: {x:.0f} ',
                generate_range_units())),
            cf_db.db_column_supply_min: generate_reg_case_reg_two_result(),
            cf_db.db_column_supply_max:[None]*15,
            cf_db.db_column_supply_est_meth:[3]*15,
            cf_db.db_column_supply_meas:[None]*15,
            cf_db.db_column_supply_estimated:[None]*15
        }
    )
    frame_out = pd.concat([frame_0,frame_1]).reset_index().drop(columns=['index'])
    #frame_out[cf_db.db_column_supply_meas] = frame_out[cf_db.db_column_supply_meas].astype(float)
    #frame_out[cf_db.db_column_supply_estimated] = frame_out[cf_db.db_column_supply_estimated].astype(float)

    frame_out[cf_db.db_column_supply_max] = frame_out[cf_db.db_column_supply_max].astype(object)
    frame_out['sort_column']= frame_out[cf_db.db_column_lot_id].astype(int)
    frame_out = frame_out.sort_values(by=['sort_column']).reset_index()
    frame_out = frame_out.drop(columns=['sort_column','index'])
    return frame_out

def generate_expected_pivot_results():
    """
    # generate_expected_pivot_results
    Returns the expected results for the pivot operation including the 
    pivotted dataframe and the reg er combos
    """
    pivot_expected = pd.DataFrame({
        cf_db.db_column_converted_value:list(range(0,1500,100)),
        '4-1':generate_calculation_result_list(),
        '4-2':generate_calculation_result_list()
    })
    pivot_expected.columns.name = "er-reg-key"
    combos_expected = ['4-1','4-2']
    return pivot_expected,combos_expected

def generate_reg_case_pivot_expected_result():
    """
    # generate_reg_case_pivot_expected_result
    Returns the expected results for the pivot operation including the 
    pivotted dataframe and the reg er combos
    """
    pivot_expected = pd.DataFrame({
        cf_db.db_column_converted_value:list(range(0,1500,100)),
        '1-0':generate_reg_case_reg_one_result(),
        '2-0':generate_reg_case_reg_two_result()
    })
    pivot_expected.columns.name = "er-reg-key"
    combos_expected = ['1-0','2-0']
    return pivot_expected,combos_expected

def generatee_expected_json_reg_set_result():
    """
    # generate_expected_json_reg_set_result
    Returns the json that I'm expecting to generate at the end of the process 
    that I've created
    """
    json_out={
        'labels':generate_range_units(),
        'datasets':[
            {'data':generate_calculation_result_list(),
             'label':'Premier_ensemble_reglement',
             cf_db.db_column_parking_regs_id:4,
             cf_db.db_column_reg_sets_id:1,
             'desc_reg_stat':'Règlement min avec plancher',
             'desc_er':'Premier_ensemble_reglement',
             },
             {'data':generate_calculation_result_list(),
             'label':'Deuxième_ensemble_reglement',
             cf_db.db_column_parking_regs_id:4,
             cf_db.db_column_reg_sets_id:2,
             'desc_reg_stat':'Règlement min avec plancher',
             'desc_er':'Deuxième_ensemble_reglement',
             }
        ]
    }
    return json_out

def generate_expected_json_reg_case_result():
    """
    # generate_expected_json_reg_case_result
    generate the resulting json you expect for the 
    conversion of the computation results into the 
    json format you require for the output
    """

    json_out={
        'labels':generate_range_units(),
        'datasets':[
                {
                    'data':generate_reg_case_reg_one_result(),
                    'label':'Règlement min une seule pente',
                    cf_db.db_column_parking_regs_id: 1
                },
                {
                    'data':generate_reg_case_reg_two_result(),
                    'label':'Règlement min base seuil',
                    cf_db.db_column_parking_regs_id: 2
                }
            ]
        }
    return json_out

def generate_calculation_result_list(): 
    """
    # generate_calculation_result_list
    generates the results of the calcs for reg set case which ends 
    up being the same for both reg sets in that case
    Returns
        - a list of the outputs of the calculation for the input range of 
        0-1500 for regulation 4 for the case where reg_sets are specified
    """
    return [ 10.0,
                10.0,
                10.0,
                15.0,
                20.0,
                25.0,
                30.0,
                35.0,
                40.0,
                45.0,
                50.0,
                55.0,
                60.0,
                65.0,
                70.0,
                ]

def generate_reg_case_reg_one_result():
    """
    # generate_reg_case_reg_one_result
    generates a list of the expected minimum parking for the calculation 
    of regulation one which is used in the regulation case
    Returns:
        - a list of the floats representing the minimum required parking
        for the regulation of id one 
    """
    return [0.0,
            5.0,
            10.0,
            15.0,
            20.0,
            25.0,
            30.0,
            35.0,
            40.0,
            45.0,
            50.0,
            55.0,
            60.0,
            65.0,
            70.0]

def generate_reg_case_reg_two_result():
    """
    # generate_reg_case_reg_two_result
    generates a list of the expected minimum parking for the calculation 
    of regulation two which is used in the regulation case
    Returns:
        - a list of the floats representing the minimum required parking
        for the regulation of id two
    """
    return [0.0,
            5.0,
            6.0,
            7.0,
            8.0,
            9.0,
            10.0,
            11.0,
            12.0,
            13.0,
            14.0,
            15.0,
            16.0,
            17.0,
            18.0]

def generate_complex_units_regs_query_dict():
    """
    # generate_units_regs_query_dict
    generates a model of a dict for the retrieval of the units, regulation
    and regulation set based on input regulation set and land use
    
    Returns:
        - a model dict that can be used to test the data
    """
    dict_out=[{
        'id_er':[1,2],
        'cubf':4000
    }]
    return dict_out

def generate_expected_output_from_model_dict_for_complex_units_regs():
    """
    # generate_expected_output_from_model_dict_for_units_regs
    generates expected output for interpretation of the parking reg set ids
    and land use lists which are generated for the rest of the processing function

    Returns:
        - tuple:
            - prs_ids: a list of the expected prs_ids  
            - land_use_id: the land use code to obtain rules and units for
    """
    prs_ids=[1,2]
    luc=4000
    return prs_ids,luc

def generate_expected_complex_result_units_query():
    """
    # generate_expected_simple_result_units_query
    Generates the result for a query where there are multiple
    units output which should raise an error
    """
    output= pd.DataFrame(
        {
            cf_db.db_column_reg_sets_id:[1,2],
            cf_db.db_column_parking_regs_id:[3,3],
            cf_db.db_column_parking_unit_id:[[2,3],[2,3]]
        }
    )
    return output

def generate_simple_units_regs_query_dict():
    """
    # generate_units_regs_query_dict
    generates a model of a dict for the retrieval of the units, regulation
    and regulation set based on input regulation set and land use
    
    Returns:
        - a model dict that can be used to test the data
    """
    dict_out=[{
        'id_er':[1,2],
        'cubf':2000
    }]
    return dict_out

def generate_expected_output_from_model_dict_for_simple_units_regs():
    """
    # generate_expected_output_from_model_dict_for_units_regs
    generates expected output for interpretation of the parking reg set ids
    and land use lists which are generated for the rest of the processing function

    Returns:
        - tuple:
            - prs_ids: a list of the expected prs_ids  
            - land_use_id: the land use code to obtain rules and units for
    """
    prs_ids=[1,2]
    luc=2000
    return prs_ids,luc

def generate_expected_simple_result_units_query():
    """
    # generated_expected_simple_result_units_query
    """
    output= pd.DataFrame(
        {
            cf_db.db_column_reg_sets_id:[1,2],
            cf_db.db_column_parking_regs_id:[5,6],
            cf_db.db_column_parking_unit_id:[[1],[1]]
        }
    )
    return output