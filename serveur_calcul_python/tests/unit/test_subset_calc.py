"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Testing the 3 types of subsets

Three types of subsets are defined:
    - single line subsets i.e. 1 spot per 10 sqm
    - addition based subsets i.e. 1 spot per doctor plus 0.5 spot per nurse
    - threshold based subsets i.e. 1 spot per 40 sqm up to 500 sqm then 1 spot per 50sqm for any sqm meter above 500

There are thus three test functions which are computed for example input files. The results are pre compiled in 
the inventory data store for comparison. Note that in some cases, issues with deterministic outputs of comments led
to dropping the commment column
"""
# external libraries
import pandas as pd
# internal functions
from config import config_db as cf_db
import classes.parking_inventory as PI
import tests.data_gen.regulation_data_store as RDS
import tests.data_gen.calcs_input_data_store as CIDS 
import tests.data_gen.inventory_data_store as IDS



def test_subset_simple_min():
    """
    # test_subset_simple_min
    Tests whether the calculation of a very simple linear rule
    performs as expected. 
    """

    simple_park_reg = RDS.generate_simple_rule_straight_conversion()

    input_data = CIDS.generate_inputs_simple()
    inventaire = PI.calculate_parking_subset_from_inputs_class(simple_park_reg,1,input_data,2)
    expected_result = IDS.generate_simple_reg_calc_result()
    pd.testing.assert_frame_equal(
        inventaire.parking_frame,
        expected_result.parking_frame
        )

def test_subset_seuil_min():
    """
    # test_subset_seuil_min
    Tests whether simple threshold based rules are calculated correctly.
    """
    simple_park_reg = RDS.generate_threshold_based_reg()

    input_data = CIDS.generate_thresh_data()

    inventaire = PI.calculate_parking_subset_from_inputs_class(simple_park_reg,1,input_data,2)
    expected_result = IDS.generate_thresh_reg_calc_result()
    pd.testing.assert_frame_equal(
        inventaire.parking_frame.sort_values(by=cf_db.db_column_lot_id),
        expected_result.parking_frame.sort_values(by=cf_db.db_column_lot_id)
        )

def test_subset_addition_min():
    """
    # test_subset_addition_min
    Tests whether addition based rules are calculated correctly. To do so, a 
    two variable linear combination is set up and the corner cases are tested 
    to check how it all comes out
    """
    simple_park_reg = RDS.generate_addition_based_reg()

    input_data = CIDS.generate_addition_based_data()

    inventaire = PI.calculate_parking_subset_from_inputs_class(simple_park_reg,1,input_data,2)
    expected_result = IDS.generate_add_reg_calc_result()
    pd.testing.assert_frame_equal(
        inventaire.parking_frame,
        expected_result.parking_frame
        )

if __name__=="__main__":
    test_subset_simple_min()
    test_subset_seuil_min()
    test_subset_addition_min()