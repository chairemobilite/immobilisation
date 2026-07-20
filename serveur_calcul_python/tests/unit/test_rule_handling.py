"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Tests of rule handling

This batch of tests checks that the various methods which are used to handle 
parking regulations work as expected. The following methods are checked:
    - get_reg_by_id with a single id
    - get_reg_by_id with multiple id
    - concat_regs with only 2 regs
    - check_subset_exists
    - get_subset_units
    - get_subset_intra_operation_type
    - get_subset_inter_operation_type 
Unique test cases were devised for the get function to try and minimize the odds that
the function is returning a random value
"""

# external libraries
import pandas as pd
# internal functions
from config import config_db as cf_db
from tests.data_gen import regulation_data_store as RDS



def test_get_reglement():
    """
    # test_get_reglement
    ensures that the get_rule function functions 
    when a single rule id is specified
    """
    all_regs= RDS.generate_all_relevant_regs()
    get_reg_res = all_regs.get_reg_by_id(1)
    header_res =  all_regs.reg_head.loc[
        all_regs.reg_head[cf_db.db_column_parking_regs_id]==1
        ]
    def_res = all_regs.reg_def.loc[
        all_regs.reg_def[cf_db.db_column_parking_regs_id]==1
        ]
    units_res = all_regs.units_table.loc[
        all_regs.units_table[cf_db.db_column_units_id].isin(
            def_res[cf_db.db_column_parking_unit_id].unique().tolist()
            )]
    pd.testing.assert_frame_equal(get_reg_res.reg_head,header_res)
    pd.testing.assert_frame_equal(get_reg_res.reg_def,def_res)
    pd.testing.assert_frame_equal(get_reg_res.units_table,units_res)


def test_get_reglements():
    """
    # test_get_reglements
    ensure that the get_by_id functions correctly when a list of 
    ids is specified rather than a single number
    """
    all_regs= RDS.generate_all_relevant_regs()
    get_reg_res = all_regs.get_reg_by_id([1,2])
    header_res =  all_regs.reg_head.loc[
        all_regs.reg_head[cf_db.db_column_parking_regs_id].isin([1,2])
        ]
    def_res = all_regs.reg_def.loc[
        all_regs.reg_def[cf_db.db_column_parking_regs_id].isin([1,2])
        ]
    units_res = all_regs.units_table.loc[
        all_regs.units_table[cf_db.db_column_units_id].isin(
            def_res[cf_db.db_column_parking_unit_id].unique().tolist()
            )]
    pd.testing.assert_frame_equal(get_reg_res.reg_head,header_res)
    pd.testing.assert_frame_equal(get_reg_res.reg_def,def_res)
    pd.testing.assert_frame_equal(get_reg_res.units_table,units_res)

def test_concat_reglements():
    """
    # test_concat_reglements
    checks whether the concatenation of 2 rules functions as expected
    """
    PR_1 = RDS.generate_simple_rule_straight_conversion()
    PR_2 = RDS.generate_threshold_based_reg()
    PR_result= PR_1.concat_regs(PR_2)
    PR_expect = RDS.generate_all_relevant_regs().get_reg_by_id([1,2])

    pd.testing.assert_frame_equal(PR_result.reg_head,PR_expect.reg_head)
    pd.testing.assert_frame_equal(PR_result.reg_def,PR_expect.reg_def)
    pd.testing.assert_frame_equal(PR_result.units_table,PR_expect.units_table)

def test_check_only_one_rule():
    """
    # test_check_only_one_rule
    This function checks that the validation function which verifies whether 
    the ParkingRegulations object has only one rule functions correctly
    """
    reg_unique = RDS.generate_simple_rule_straight_conversion()
    reg_multiple = RDS.generate_all_relevant_regs()

    assert reg_unique.check_only_one_regulation()
    assert not reg_multiple.check_only_one_regulation()

def test_check_subset_exists():
    """
    # test_check_subset_exists
    Tests the check subset_exists_function for the most complicated regulation
    available in the datastore that I created which frankly is more complicated 
    than anything which was done for Quebec city
    """
    reg_to_check= RDS.generate_ceil_or_based_reg()

    assert reg_to_check.check_subset_exists(1)==True
    assert reg_to_check.check_subset_exists(2)==True
    assert reg_to_check.check_subset_exists(3)==True
    assert reg_to_check.check_subset_exists(4)==False

def test_get_subset_units():
    """
    # test_get_subset_units 
    checks the functionality of the get subset units function for a 
    few of the more complex regulations in the data store to ensure
    this functions works as expected
    """
    crazy_reg = RDS.generate_subset_unit_check_reg()

    crazy_reg.validate()
    assert crazy_reg.get_subset_units(1)==[1,2]
    assert crazy_reg.get_subset_units(2)==[2,3]
    assert crazy_reg.get_subset_units(3)==[1]

def test_get_intra_operator():
    """
    # test_get_intra_operator
    Tests the get_subset_intra_operation_type on a complex 
    regulation which has non overlapping subsets
    """
    crazy_reg = RDS.generate_subset_unit_check_reg()

    crazy_reg.validate()

    assert crazy_reg.get_subset_intra_operation_type(1)==1
    assert crazy_reg.get_subset_intra_operation_type(2)==1
    assert crazy_reg.get_subset_intra_operation_type(3)==4

def test_get_inter_operator():
    """ 
    # test_get_inter_operator
    Tests the get_subset_inter_operation_type on the most 
    complex rule I could come up with
    """
    crazy_reg = RDS.generate_subset_unit_check_reg()

    crazy_reg.validate()

    assert crazy_reg.get_subset_inter_operation_type(1)==3
    assert crazy_reg.get_subset_inter_operation_type(2)==3
    assert crazy_reg.get_subset_inter_operation_type(3)==6
