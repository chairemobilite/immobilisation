"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Various tests which are used to check that the aggregation of outputs from multiple differnt
calcualtion are done correctly. These functions are used after the calculation has been completed
for each combination of parking regulation set and tax data set. If multiple estimates exist 
because there are multiple tax entries built at different times on the same lot, you need to compile
the estimates. This test file ensures that the operations which are used in this phase are done
according to the framework laid out in the thesis
"""


# external libraries 
import pandas as pd
# internal libaries
from config import config_db as cf_db
from classes import parking_inventory as PI
from tests.data_gen import inventory_data_store as IDS

def normalize(df:pd.DataFrame)->pd.DataFrame:
    """
    # normalize
    Helper function to clean up dtypes. was initially having issues around compatibility on 
    string vs ints. This could be resolved in an another manner by ensuring the inputs are
    clean as part of dissolution and merging. This should be pursued for better error catching

    Returns:
        - a dataframe where the parking reg id and the reg set id have been converted to str
        formats
    """
    # TODO: this should be eliminated in a future version. While typing isn't super critical
    # given the fact that this all gets converted to string when it gets pushed to database the
    # fact that this was needed probably reveals these functions aren't super deterministic in
    # their output
    df = df.copy()
    df[cf_db.db_column_parking_regs_id] = df[cf_db.db_column_parking_regs_id].astype(str)
    df[cf_db.db_column_reg_sets_id] = df[cf_db.db_column_reg_sets_id].astype(str)
    return df.convert_dtypes().reset_index(drop=True)

def test_merge_lot_data_mins_only():
    """
    # test_merge_lot_data_mins_only
    Merge operation allows the consolidation of estimates from different land use codes and
    potentially different dates associated to a same lot to be consolidated to one estimate.
    Parking estimates are summed for mins. This function test what happens when there are 
    only mins specified. The result should be the sum of the predictions. Check datastore
    to understand the math behind this
    """
    inventaire = IDS.generate_merge_mins_only_input()
    inventaire.merge_lot_data()
    expected_inventory = IDS.generate_merge_mins_only_result()
    pd.testing.assert_frame_equal(
        normalize(inventaire.parking_frame),
        normalize(expected_inventory.parking_frame),
        check_dtype=False
    )

def test_merge_lot_data_mins_and_compatible_maxes():
    """
    # test_merge_lot_data_mins_and_compatible_maxes
    Merge operation allows the consolidation of estimates from different land use codes and
    potentially different dates associated to a same lot to be consolidated to one estimate.
    Parking estimates are summed for mins and maxes. This function tests what happens when there are 
     mins and maxes specified. The result should be the sum of the predictions. Check datastore
    to understand the math behind this. In this case, the sum of the maxes is larger than
    the sum of the mins leading to keeping the estimate
    """
    inventaire = IDS.generate_merge_mins_and_compatible_maxes_input()
    inventaire.merge_lot_data()
    expected_result = IDS.generate_merge_mins_and_compatible_maxes_expected_result()
    pd.testing.assert_frame_equal(
        normalize(inventaire.parking_frame),
        normalize(expected_result.parking_frame),
        check_dtype=False
    )

def test_merge_lot_data_mins_and_incompatible_maxes():
    """
    # test_merge_lot_data_mins_and_incompatible_maxes
     Merge operation allows the consolidation of estimates from different land use codes and
    potentially different dates associated to a same lot to be consolidated to one estimate.
    Parking estimates are summed for mins and maxes. This function test what happens when there are 
     mins and maxes specified. The result should be the sum of the predictions. Check datastore
    to understand the math behind this. In this case, the sum of the maxes is smaller than
    the sum of the mins leading to discarding the max estimate
    """
    actual_result = IDS.generate_merge_mins_and_incompatible_maxes_input()
    actual_result.merge_lot_data()
    expected_result = IDS.generate_merge_mins_and_incompatible_maxes_expected_result()
    pd.testing.assert_frame_equal(
        normalize(actual_result.parking_frame),
        normalize(expected_result.parking_frame),
        check_dtype=False
    )


def test_list_dissolution():
    """
    # test_list_dissolution
    When iterating through the different reg set territories, the resulting inventiories
    are appeneded to a list. The items of the list need to be concatenated into a single
    ParkingInventory object. The dissolve list function performs that function
    and this test checks that the concatenation operates as expected.
    """
    invent_list = IDS.generate_list_of_inventory_dissolution_input()
    inventaire_concat = PI.dissolve_list(invent_list)
    expected_result = IDS.generate_dissolution_expected_result()
    pd.testing.assert_frame_equal(
        normalize(inventaire_concat.parking_frame),
        normalize(expected_result.parking_frame),
        check_dtype=False
    )


if __name__ == "__main__":
    test_merge_lot_data_mins_only()
    test_merge_lot_data_mins_and_compatible_maxes()
    test_merge_lot_data_mins_and_incompatible_maxes()
    test_list_dissolution()