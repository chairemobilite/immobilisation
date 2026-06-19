"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Testing assignment of tax data to specific reg set territories

A key step in calculating parking minimum parking is assigning the the tax entries 
to the relevant set of regulations. This function ensures that the assignments are done
accordign to plan 

A helper function is created to make the test function more legible
"""


# external libraries
import pandas as pd
# internal tools
from config import config_db as cf_db
from classes import parking_inventory as PI
from classes import reg_set_territory as RST
from tests.data_gen import reg_set_terr_data_store as RSTDS
from tests.data_gen import tax_data_store as TDS

def test_affectation_TD_RST():
    """
        # test_affectation_TD_RST
        Test function that checks that the tax dataset assignment is done according to 
        expectations. Three reg set territories are created. RST 1 and RST 2 cover the 
        same temporal period(1990-1995) but different geographical spans(a top territory 
        and a bottom territory) whereas RST 3 covers a different temporal span. This 
        allows the validation of the two features which define assignment of tax data 
        to reg set territories:space and time. 
        
        The first reg set territory capture the tax datasets for the rules 1,3,4,5. It
        covers the period from 1990 to 1995 and the top half of the territory. 

        The second reg set territory captures the tax dataset for the threshold based 
        ceiling regulation (id 6), which is on the bottom row of lots, thus verifying
        spatial allocation for the period 1990 to 1995

        The third regulation set captures the tax dataset for the threshold based 
        regulation (id 2) which is on the row of lots between rules 1 and 3 and thus
        checks that temporal allocation is done correctly. These lots have a construction
        date of 1997. The third regulation covers the top half of the territory and the 
        period from 1995 to 2000.

        The test suite uses three frame equal asserts to check that each tax dataset 
        assignment is done correctly. In total 9 asserts need to be run, three for each
        of the three reg set territories

    """
    # create the reg set territories
    rst_1,rst_2,rst_3 = RSTDS.generate_reg_set_terr()
    # grab all the tax data in the test region
    whole_tax_data_set = TDS.generate_tax_dataset()
    # run the function that we're testing
    split_tax_data_sets = RST.split_td_by_rst(whole_tax_data_set,[rst_1,rst_2,rst_3])
    # obtain the tax datasets that we're supposed to obtain from the data store
    tds_1_theo = TDS.generate_tax_dataset(1)
    tds_2_theo = TDS.generate_tax_dataset(2)
    tds_3_theo = TDS.generate_tax_dataset(3)

    asserts_to_run = [
        [split_tax_data_sets[0],tds_1_theo,'tax_table',cf_db.db_column_tax_id],
        [split_tax_data_sets[0],tds_1_theo,'lot_table',cf_db.db_column_lot_id],
        [split_tax_data_sets[0],tds_1_theo,'lot_association',cf_db.db_column_tax_id],
        [split_tax_data_sets[1],tds_2_theo,'tax_table',cf_db.db_column_tax_id],
        [split_tax_data_sets[1],tds_2_theo,'lot_table',cf_db.db_column_lot_id],
        [split_tax_data_sets[1],tds_2_theo,'lot_association',cf_db.db_column_tax_id],
        [split_tax_data_sets[2],tds_3_theo,'tax_table',cf_db.db_column_tax_id],
        [split_tax_data_sets[2],tds_3_theo,'lot_table',cf_db.db_column_lot_id],
        [split_tax_data_sets[2],tds_3_theo,'lot_association',cf_db.db_column_tax_id],
        ]
    # cycle through the combinations above of lot tax and association table and assert that these are the same. 
    # Trying to avoid 9 long assertions which are difficult to read
    assert len(split_tax_data_sets)==3
    for assert_line in asserts_to_run:
        assert_tax_dataset_equal_helper(assert_line[0],assert_line[1],assert_line[2],assert_line[3])

def assert_tax_dataset_equal_helper(actual, expected, table_name, sort_column):
    """
    # assert_tax_data_set_equal
    Helper to compare tax dataset tables with sorting.
    Comparing the table with the specified name between actual and expected
    Both are sorted along the sort column in order to ensure that something
    isn't out of order due to spatial selection and indices are reset because
    original TD contains all the tax data in the sector
    """
    actual_table = getattr(actual, table_name)
    expected_table = getattr(expected, table_name)
    pd.testing.assert_frame_equal(
        actual_table.sort_values(by=sort_column).reset_index(drop=True),
        expected_table.sort_values(by=sort_column).reset_index(drop=True)
    )