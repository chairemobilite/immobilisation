
"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Testing the higher level computation fucntions
This function tests the higher level computation funcstions which cover multiple rules 
and that are called based on tax data to parking regulation set assignment. The assignemen
is checked in another test file (test_affectation_prs_td)

"""

# external libraries
import pandas as pd
# internal functions
import config.config_db as cf_db
import classes.parking_inventory as PI
import classes.parking_reg_sets as PRS
import tests.data_gen.calcs_input_data_store as CIDS
import tests.data_gen.regulation_set_data_store as RSDS
import tests.data_gen.inventory_data_store  as IDS
import tests.data_gen.reg_set_terr_data_store as RSTDS
import tests.data_gen.tax_data_store as TDS

def test_calculate_inventory_from_inputs_class():
    """
    # test_run_calc_invent
    Runs calculate_inventory from inputs class which is the main entry point for 
    calculation of minimums for both manual entry and automatic calculation of the 
    required parking
    """
    input_data= CIDS.generate_prs_1_inputs()
    prs_1,_,_,_= RSDS.generate_parking_regulation_sets()
    regs=PRS.concat_to_PR([prs_1])
    regs.validate()
    result= PI.calculate_inventory_from_inputs_class(
        input_data,
        regs,2).parking_frame.sort_values(
            by=cf_db.db_column_lot_id
            ).reset_index(drop=True).drop(columns=[cf_db.db_column_supply_comment])
    expected_raw = IDS.generate_rst_1_result()
    expected = expected_raw.parking_frame.drop(columns=[cf_db.db_column_supply_comment])
    pd.testing.assert_frame_equal(result,expected)

def test_calculate_parking_for_reg_set_territories():
    """
    # test_calculate_parking_for_reg_set_territories
    Tests the function that loops through the reg set territories 
    at the highest level possible
    """
    rst_1,rst_2,rst_3=RSTDS.generate_reg_set_terr()
    tds_1_theo = TDS.generate_tax_dataset(1)
    tds_2_theo = TDS.generate_tax_dataset(2)
    tds_3_theo = TDS.generate_tax_dataset(3)
    inventories = PI.calculate_parking_for_reg_set_territories([rst_1,rst_2,rst_3],[tds_1_theo,tds_2_theo,tds_3_theo])
    rst_1_result_exp = IDS.generate_rst_1_result()
    rst_2_result_exp = IDS.generate_rst_2_result()
    rst_3_result_exp = IDS.generate_rst_3_result()

    expected_1 = rst_1_result_exp.parking_frame.drop(columns=[cf_db.db_column_supply_comment])
    expected_2 = rst_2_result_exp.parking_frame.drop(columns=[cf_db.db_column_supply_comment])
    expected_3 = rst_3_result_exp.parking_frame.drop(columns=[cf_db.db_column_supply_comment])
    result_1= inventories[0].parking_frame.drop(columns=[cf_db.db_column_supply_comment]).sort_values(by=[cf_db.db_column_lot_id]).reset_index(drop=True)
    result_2= inventories[1].parking_frame.drop(columns=[cf_db.db_column_supply_comment]).sort_values(by=[cf_db.db_column_lot_id]).reset_index(drop=True)
    result_3= inventories[2].parking_frame.drop(columns=[cf_db.db_column_supply_comment]).sort_values(by=[cf_db.db_column_lot_id]).reset_index(drop=True)
    assert len(inventories)==3
    pd.testing.assert_frame_equal(result_1,expected_1,check_like=True)
    pd.testing.assert_frame_equal(result_2,expected_2,check_like=True)
    pd.testing.assert_frame_equal(result_3,expected_3,check_like=True)
