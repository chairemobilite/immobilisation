"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Test for unit conversion 

This has three tests baked in
The first tests high level functions which verify that the conversion functions for 
the various test tax datasets which have been defined
The two other tests check that the low level helper function that is used actually 
converts data as expected.

"""



# external libraries
import pandas as pd
# internal development
from classes import parking_inventory_inputs as PCI
from tests.data_gen.tax_data_store import generate_tax_dataset
from tests.data_gen.regulation_set_data_store import generate_parking_regulation_sets
from tests.data_gen.calcs_input_data_store import generate_prs_1_inputs,generate_prs_2_inputs,generate_prs_3_inputs
import tests.data_gen.calcs_input_data_store as CIDS

def test_conversion_unite():
    """
    # test_conversion_unite
    Test validates unit conversion. It lays out the expected output of 
    conversion for both straight one-to-one conversion of floor area
    as well as more complex cases where there are non unity conversion 
    factors.
    """
    # Generate tax datasets as inputs
    tax_dataset_prs_1 = generate_tax_dataset(1)
    tax_dataset_prs_2 = generate_tax_dataset(2)
    tax_dataset_prs_3 = generate_tax_dataset(3)
    # generate parking regulation sets which will contain unit conversion info
    prs_1,prs_2,prs_3,_prs_4 = generate_parking_regulation_sets()
    # Use required function to obtain the 3 parking regulation sets
    prs_1.expand_land_use_table()
    prs_2.expand_land_use_table()
    prs_3.expand_land_use_table()
    inputs_data_prs_1 = PCI.generate_input_from_PRS_TD(prs_1,tax_dataset_prs_1)
    inputs_data_prs_2 = PCI.generate_input_from_PRS_TD (prs_2,tax_dataset_prs_2)
    inputs_data_prs_3 = PCI.generate_input_from_PRS_TD(prs_3,tax_dataset_prs_3)
    # get the expected results
    inputs_theoretical_1 = generate_prs_1_inputs()
    inputs_theoretical_2 = generate_prs_2_inputs()
    inputs_theoretical_3 = generate_prs_3_inputs()
    # Run frame equal tests
    pd.testing.assert_frame_equal(inputs_data_prs_1,inputs_theoretical_1)
    pd.testing.assert_frame_equal(inputs_data_prs_2,inputs_theoretical_2)
    pd.testing.assert_frame_equal(inputs_data_prs_3,inputs_theoretical_3)
    #m1 = tax_dataset_prs_1.explore()
    #m1.save('check.html')
    
def test_compute_valeur_straight_conversion():
    """
    # test_compute_valeur_straight_conversion
    compute_valeur is the heart of the unit conversion routine. It applies 
    the conversion to every row in the input dataframe which is a combination
    of different inputs from the TaxDatasets which are an input to 
    generate_input_from_prs_td. this particular case is only a straight pass
    through version where the tax data is a direct transfer to the input
    """
    input_row=CIDS.generate_merged_input_for_compute_valeur_straight()
    output = PCI.compute_valeur(input_row)
    expected_output= CIDS.generate_output_conversion_valeur_straight()
    assert expected_output == output

def test_compute_valeur_change_value():
    """
    # test_compute_valeur_change_value
    repeats test_compute_valeur_straight_conversion with a case where there's an
    actual conversion going on
    """
    input_row=CIDS.generate_merged_input_for_compute_valeur_convert()
    output = PCI.compute_valeur(input_row)
    expected_output= CIDS.generate_output_conversion_valeur_convert()
    assert expected_output == output

