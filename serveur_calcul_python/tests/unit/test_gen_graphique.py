"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Test suite for graphical representation of parking requirements. 
This approach takes a combination of inputs from land use to units
and land use codes as well as a range and step for the x value on 
the chart to compute minimum parking. This test suite will 
work through testing the various functions. Code was refactored on
the scripts themselves in order to generate more contained functions 
which can be tested individually without accessing the database.
In addition, the phase where the regulations and units are queried for 
a given set of parking regulation sets and land use are also tested with
various inputs
"""
# external libraries
import pandas as pd
import json
import pytest
# internal libraries
import config.config_db as cf_db
import classes.parking_inventory_inputs as PII
import classes.parking_inventory as PI
import classes.parking_reg_sets as PRS
import classes.parking_regs as PR
import config.config_db as cf_db
import tests.data_gen.regulation_set_data_store as RSDS
import tests.data_gen.graph_gen_inputs_data_store as GGIDS
import tests.data_gen.regulation_data_store as RDS
import utilitaires.frontend_chart_data_processing as FCDP

"""
Check the interpretation of incoming cases 
These two functions chekc that the interpretation of valid inputs is done according to expectations
Namely, when valid inputs are generated, the ouptuts of the input parsing function are correct
"""
def test_interpretation_inputs_reg_case():
    """
    # test_interpretation_inputs_reg_case
    Takes the raw dict which is generated from reading the 
    input parameters at the script input and then processes
    it to return inputs for the rest of the pipeline
    """
    input_dict= GGIDS.generate_input_reg_case()
    x_values_chart,regs,reg_sets,land_use,units,case = FCDP.parse_dict_for_graphs(input_dict)
    assert x_values_chart==list(range(0,1500,100))
    assert regs==[1,2]
    assert reg_sets==[0]
    assert land_use==1
    assert units==1
    assert case=='regs'

def test_interpretation_inputs_reg_sets_case():
    """
    # test_interpretation_inputs_reg_sets_case
    Takes a raw dict which is generated from reading the input parameters
    from when the script is launched from typescript back end and then 
    processes it to as an input for the rest of the pipeline     
    """
    input_dict= GGIDS.generate_input_reg_sets_case()
    x_values_chart,regs,reg_sets,land_use,units,case = FCDP.parse_dict_for_graphs(input_dict)
    assert x_values_chart==list(range(0,1500,100))
    assert regs==[0]
    assert reg_sets==[1,2]
    assert land_use==1
    assert units==1
    assert case=='reg_sets'


"""
Interpretation error checks
Checks that errors are raised when invalid inputs are used. 
"""
def test_raise_invalid_cubf_error():
    """
    # test_raise_invalid_cubf
    Tests whether the an error is raised when a land use code is 
     larger than the supported values
    """
    with pytest.raises(ValueError) as excinfo:
        input_dict=GGIDS.generate_invalid_cubf()
        x_values_chart,regs,reg_sets,land_use,units,case = FCDP.parse_dict_for_graphs(input_dict)
    assert "cubf" in str(excinfo.value)# 

def test_missing_cubf_w_regs():
    """
    # test_missing_cubf_w_regs
    checks that the conversion still works when a land use isn't present 
    when providing regulations which should still work function with regulations
    """
    input_dict=GGIDS.generate_missing_cubf()
    x_values_chart,regs,reg_sets,land_use,units,case = FCDP.parse_dict_for_graphs(input_dict)
    assert x_values_chart==list(range(0,1500,100))
    assert regs==[1,2]
    assert reg_sets==[0]
    assert land_use==0
    assert units==1
    assert case=='regs'

def test_raise_error_when_step_overlaps():
    """
    # test_raise_error_when_step_overlaps
    This test ensures that an error is raised when the step+min is larger than 
    the maximum. 
    """
    input_dict=GGIDS.generate_invalid_step_value()
    with pytest.raises(ValueError) as excinfo:
        x_values_chart,regs,reg_sets,land_use,units,case = FCDP.parse_dict_for_graphs(input_dict)
    assert 'mathématiquement incompatible' in str(excinfo.value)

def test_raise_error_when_min_step_larger_max():
    """
    # test_raise_error_when_min_step_larger_max
    Checks that an error is raised when a min+step is larger than max which means the data is 
    incompatible. 
    """
    input_dict= GGIDS.generate_invalid_min_max()
    with pytest.raises(ValueError) as excinfo:
        x_values_chart,regs,reg_sets,land_use,units,case = FCDP.parse_dict_for_graphs(input_dict)
    assert 'mathématiquement incompatible' in str(excinfo.value)
"""
Check that the function that generates x values for the chart returns the expected list given the inputs
This test is done for both the regs and reg_sets cases 
"""
def test_generation_input_reg_set():
    """
    # test_generation_input_reg_set
    Test to generate a graph based on inputs and regulation sets. 
    Here the regulation sets from the calculation tests are reused 
    A simple input which ranges from 1 to 15 is used in order 
    to generate a quite simple graph for a two regulation sets 
    which are used elsewhere in the various test cases.
    A separate data store was stood up in order to generate the inputs
    and a separate parking_inventory is setup in the data store to 
    check the calculation step.
    Here a subfunction is checked with pre prepped inputs rather 
    than using the raw query data which is transmitted
    """
    prs_1,prs_2,_,_ = RSDS.generate_parking_regulation_sets()
    inputs= GGIDS.generate_range_units()
    result = FCDP.generate_graph_values_reg_sets(
        inputs,
        [prs_1,prs_2],
        1,
        1
    )
    expected_result = GGIDS.generate_expected_calc_input()
    pd.testing.assert_frame_equal(result,expected_result)

def test_generation_inputs_regs():
    """
    # test_generation_inputs_regs
    Test to generate a graph when only the regulations are specified rather 
    than the regulation sets. Refer to test_generation_reg_sets for details
    about the general setup
    Here the subfunction that calculates the parking inventory when only the
    regulations are specified is used
    """
    reg_1 = RDS.generate_simple_rule_straight_conversion()
    reg_2 = RDS.generate_threshold_based_reg()
    reg_out=reg_1.concat_regs(reg_2)
    inputs = GGIDS.generate_range_units()
    input_data_res = FCDP.generate_graph_values_regs(
        inputs,
        reg_out,
        1,
        1
    )
    expected_input_data_res = GGIDS.generate_reg_case_expected_inputs_data()
    pd.testing.assert_frame_equal(input_data_res,expected_input_data_res)

"""
Next two function check that the calculation phase is going to plan. This is 
somewhat redundant with other test functions that check that the inventory 
but this is pertinent to ensure that graph calculation doesn't fail for this 
reason
"""
def test_compute_inventory_reg_set():
    """
    # test_compute_inventory_reg_set
    when taking the expected results from test_generation_input_reg_set
    and running it through the rest of the computation to check that the 
    output is according to expectation
    """
    # Obtain the input, parking regs and validate
    input_start_process = GGIDS.generate_expected_calc_input()
    prs_1,prs_2,_,_ = RSDS.generate_parking_regulation_sets()
    parking_regs_concat = PRS.concat_to_PR([prs_1,prs_2])
    parking_regs_concat.validate()
    # Run the calculation
    inventaire = PI.calculate_inventory_from_inputs_class(
        input_start_process,
        parking_regs_concat)
    # post processing so the result comes out ok
    frame_result = inventaire.parking_frame
    frame_result['sort_column']= frame_result[cf_db.db_column_lot_id].astype(int)
    frame_result = frame_result.sort_values(by=['sort_column']).reset_index()
    frame_result = frame_result.drop(columns=['sort_column','index'])
    expected_result = GGIDS.generate_reg_set_case_expected_calculation_result()
    pd.testing.assert_frame_equal(frame_result,expected_result)
    
def test_compute_inventory_regs():
    """
    # test_compute_inventory_regs
    This test function takes the inputs from the test_generation_inputs_regs
    and runs it through the parking calculation. This is somewhat redundant to
    simply running calculations themselves but it tests the wrapper
    """
    reg_1 = RDS.generate_simple_rule_straight_conversion()
    reg_2 = RDS.generate_threshold_based_reg()
    reg_out=reg_1.concat_regs(reg_2)
    inputs = GGIDS.generate_reg_case_expected_inputs_data()
    reg_out.validate()
    # Run the calculation
    inventaire = PI.calculate_inventory_from_inputs_class(
        inputs,
        reg_out)
    # post processing so the result comes out ok
    frame_result = inventaire.parking_frame
    frame_result['sort_column']= frame_result[cf_db.db_column_lot_id].astype(int)
    frame_result = frame_result.sort_values(by=['sort_column']).reset_index()
    frame_result = frame_result.drop(columns=['sort_column','index'])
    expected_inventory = GGIDS.generate_reg_case_expected_inventory()
    pd.testing.assert_frame_equal(frame_result,expected_inventory)


"""
To output the date into the chart format, the inventory is pivoted.this function 
checks that this pivot operation works as expected. Not super necessary per say
given this is a basic dataframe operation but avoids any screw ups
"""
def test_pivot_inventaire():
    """
    # test_pivot_inventaire
    In order to output the data into a format that can be repackaged into 
    a json for graphical display the parking inventory frame is pivoted. 
    This test simply checks that the pivot operation works as planned.
    """
    expected_input = GGIDS.generate_expected_calc_input()
    frame_calculation_result = GGIDS.generate_reg_set_case_expected_calculation_result()
    park_invent = PI.ParkingInventory(frame_calculation_result)
    pivot_inventaire,unique_er_reg_combos = FCDP.pivot_inventory(park_invent,expected_input)
    pivot_inventaire_expected,unique_combos_expected = GGIDS.generate_expected_pivot_results()
    pd.testing.assert_frame_equal(pivot_inventaire,pivot_inventaire_expected)
    assert unique_er_reg_combos==unique_combos_expected

def test_pivot_reg_case_inventaire():
    """
    # test_pivot_reg_case_inventaire
    Test the pivoting of the inventory for the regulation cases which is
    being tested. Somewhat redundant with reg_sets_case given that the pivot
    operation is the same between the two processing streams
    """
    expected_input = GGIDS.generate_reg_case_expected_inputs_data()
    frame_calculation_result = GGIDS.generate_reg_case_expected_inventory()
    park_invent = PI.ParkingInventory(frame_calculation_result)
    pivot_inventaire,unique_er_reg_combos = FCDP.pivot_inventory(park_invent,expected_input)
    pivot_inventaire_expected,unique_combos_expected = GGIDS.generate_reg_case_pivot_expected_result()
    pd.testing.assert_frame_equal(pivot_inventaire,pivot_inventaire_expected)
    assert unique_er_reg_combos==unique_combos_expected

"""
Next two functions ensure that the function processes the pivotted frame correctly
and outputs the desired json which can be used in react charts
"""
def test_process_reg_set_to_json():
    """
    test_process_reg_set_to_json
    Tests that the conversion to the required JSON format is done according 
    to expectations. The functions takes the inputs from the previous
    stages, runs them through the JSON conversion function and compares
    the profided json to a theoretical one
    """
    prs_1,prs_2,_,_ = RSDS.generate_parking_regulation_sets()
    parking_regs_concat = PRS.concat_to_PR([prs_1,prs_2])
    parking_regs_concat.validate()
    pivot_inventaire_expected,unique_combos_expected = GGIDS.generate_expected_pivot_results()
    json_result = json.loads(FCDP.process_reg_set_pivot_to_json(pivot_inventaire_expected,unique_combos_expected,parking_regs_concat,[prs_1,prs_2]))
    json_result_expected = GGIDS.generatee_expected_json_reg_set_result()
    assert json_result==json_result_expected

def test_processing_reg_to_json():
    """
    While not critical at this stage, there were issues while refactoring the
    code in order to make it more testable which raised concern about processing.
    the output of te calculations to the required format so this function was stood
    up to ensure that everything works to plan for the test cases devised
    """
    pivot_inventaire,unique_combos = GGIDS.generate_reg_case_pivot_expected_result()
    reg_1 = RDS.generate_simple_rule_straight_conversion()
    reg_2 = RDS.generate_threshold_based_reg()
    reg_out=reg_1.concat_regs(reg_2)
    reg_out.validate()
    json_result = json.loads(FCDP.process_regulation_pivot_to_json(pivot_inventaire,unique_combos,reg_out))
    json_result_expected=GGIDS.generate_expected_json_reg_case_result()
    assert json_result==json_result_expected

"""
Getting relevant regs and units
Before running queries for charting the web interface queries which rules to apply for a given
land use. Two separate cases are checked. The first is a case where one regulation requires 
multiple units which is imposible to chart at the moment, the second is a traditional case with a signle 
unit. Test suit starts by making sure the incoming variables are interpreted correctly, the second makes
sure the extraction works as expected
"""
def test_interpretation_inputs_unites_complex():
    """
    # test_interpretation_inputs_conversion_unites
    Tests how the dict parking function works for the function which obtains
    unit data from the back end prior to plotting, unlike the other function
    this data comes from the body rather than the message hence a slight 
    difference in format
    """
    input_dict= GGIDS.generate_complex_units_regs_query_dict()
    prs_ids_result,luc_result = FCDP.parse_input_data_for_graph_info(input_dict)
    prs_ids_expect,luc_expect = GGIDS.generate_expected_output_from_model_dict_for_complex_units_regs()
    assert prs_ids_result==prs_ids_expect
    assert luc_result== luc_expect

def test_unit_extraction_for_graphs_complex():
    """
    # test_unit_extraction_for_graphs
    tests that the result for the test cases returns the desired output according to what you would 
    expect i.e. the full listing of units
    Note that this combination could not be charted due to the presence of 2 units in the regulation
    specified for the land use
    """
    prs_1,prs_2,_,_= RSDS.generate_parking_regulation_sets()
    prs_ids,luc= GGIDS.generate_expected_output_from_model_dict_for_complex_units_regs()
    output= FCDP.run_extraction_regs_units_sets_for_graph([prs_1,prs_2],luc)
    expected_output=GGIDS.generate_expected_complex_result_units_query()
    pd.testing.assert_frame_equal(output,expected_output)
"""
Rerun the same two tests but with a tradfitonal case as opposed to an addition case which i can't plot at the moment
"""
def test_interpretation_inputs_unites_simple():
    """
    # test_interpretation_inputs_conversion_unites
    Tests how the dict parking function works for the function which obtains
    unit data from the back end prior to plotting, unlike the other function
    this data comes from the body rather than the message hence a slight 
    difference in format
    """
    input_dict= GGIDS.generate_simple_units_regs_query_dict()
    prs_ids_result,luc_result = FCDP.parse_input_data_for_graph_info(input_dict)
    prs_ids_expect,luc_expect = GGIDS.generate_expected_output_from_model_dict_for_simple_units_regs()
    assert prs_ids_result==prs_ids_expect
    assert luc_result== luc_expect

def test_unit_extraction_for_graphs_simple():
    """
    # test_unit_extraction_for_graphs
    tests that the result for the test cases returns the desired output according to what you would 
    expect i.e. the full listing of units
    """
    prs_1,prs_2,_,_= RSDS.generate_parking_regulation_sets()
    prs_ids,luc= GGIDS.generate_expected_output_from_model_dict_for_simple_units_regs()
    output= FCDP.run_extraction_regs_units_sets_for_graph([prs_1,prs_2],luc)
    expected_output=GGIDS.generate_expected_simple_result_units_query()
    pd.testing.assert_frame_equal(output,expected_output)