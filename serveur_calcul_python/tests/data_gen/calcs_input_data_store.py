"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Data store providing parking calculation inputs for the general calculation cases
and the graph generation 
"""

# external libraries
import pandas as pd
# internal functions
from config import config_db as cf_db
from classes import parking_inventory_inputs as PCI

def generate_all_required_inputs():
    """
    # generate_all_required_inputs
    renvoie un ParkingCalculationInput avec l'ensemble des données requises pour tous les règlements construits
    """
    simple_inputs= generate_inputs_simple()
    thresh_data = generate_thresh_data()
    add_data = generate_addition_based_data()
    floor_data = generate_floor_data()
    ceil_data_or = generate_ceil_data_or()
    ceil_data_thresh = generate_ceil_data_thresh()
    output = PCI.ParkingCalculationInputs(pd.concat([
        simple_inputs,
        thresh_data,
        add_data,
        floor_data,
        ceil_data_or,
        ceil_data_thresh]).reset_index(drop=True))
    return output

def generate_prs_1_inputs():
    """
    # generate_prs_1_inputs
    renvoie un parkingCalculationsInputs pour les lots associés au parkingRegulationSet 1
    """
    simple_inputs= generate_inputs_simple()
    add_data = generate_addition_based_data()
    floor_data = generate_floor_data()
    ceil_data_or = generate_ceil_data_or()
    output = PCI.ParkingCalculationInputs(pd.concat([simple_inputs,add_data,floor_data,ceil_data_or]).reset_index(drop=True))
    return output

def generate_prs_2_inputs():
    """
    # generate_prs_2_inputs
    renvoie un parkingCalculationsInputs pour les lots associés au parkingRegulationSet 2
    """
    ceil_data_thresh = generate_ceil_data_thresh()
    return ceil_data_thresh

def generate_prs_3_inputs():
    """
    # generate_prs_3_inputs
    renvoie un parkingCalculationsInputs pour les lots associés au parkingRegulationSet 3
    """
    thresh_data = generate_thresh_data()
    return thresh_data

def generate_inputs_simple():
    """
    # generate_inputs_simple
    Generate calculation inputs for the very simple linear regulation devised
    """
    return PCI.ParkingCalculationInputs({
        cf_db.db_column_lot_id:['a','b'],
        cf_db.db_column_parking_regs_id:[1,1],
        cf_db.db_column_parking_unit_id:[1,1],
        cf_db.db_column_land_use_id:[5000,5000],
        cf_db.db_column_converted_value:[100.0,1000.0],
        cf_db.db_column_reg_sets_id:[1,1]
    })

def generate_thresh_data():
    """
    # generate_thresh_data
    Generate inputs for the threshold based test case which has been devised
    """
    return PCI.ParkingCalculationInputs({
        cf_db.db_column_lot_id:['c','d','e','f','g'],
        cf_db.db_column_parking_regs_id:[2,2,2,2,2],
        cf_db.db_column_parking_unit_id:[1,1,1,1,1],
        cf_db.db_column_land_use_id:[6000,6000,6000,6000,6000],
        cf_db.db_column_converted_value:[0.0,50.0,100.0,150.0,200.0],
        cf_db.db_column_reg_sets_id:[3,3,3,3,3]
    })

def generate_addition_based_data():
    """
    # generate_addition_based_data
    generate input data required for the addition based test case which has been devised
    """
    return PCI.ParkingCalculationInputs({
        cf_db.db_column_lot_id:['h','h','i','i','j','j','k','k'],
        cf_db.db_column_parking_regs_id:[3,3,3,3,3,3,3,3],
        cf_db.db_column_parking_unit_id:[2,3,2,3,2,3,2,3],
        cf_db.db_column_land_use_id:[4000,4000,4000,4000,4000,4000,4000,4000],
        cf_db.db_column_converted_value:[0.0,0.0,100.0,0.0,0.0,100.0,100.0,100.0],
        cf_db.db_column_reg_sets_id:[1,1,1,1,1,1,1,1]
    })

def generate_floor_data():
    """
    # generate_floor_data
    generate calculation inputs required for the floor case. here there is an absolute minimum number of spots which are required
    """
    return  PCI.ParkingCalculationInputs({
        cf_db.db_column_lot_id:['l','m','n','o'],
        cf_db.db_column_parking_regs_id:[4,4,4,4],
        cf_db.db_column_parking_unit_id:[1,1,1,1],
        cf_db.db_column_land_use_id:[1000,1000,1000,1000],
        cf_db.db_column_converted_value:[100.0,200.0,500.0,1000.0],
        cf_db.db_column_reg_sets_id:[1,1,1,1]
    })

def generate_ceil_data_or():
    """
    # generate_ceil_data_or
    This generates the first of 2 cases for a floor and a ceiling. In this case, a maximum value is formulated. 
    This and generate_ceil_data_thresh should have the same number of inputs and values but different ids for regs and regsets
    """
    return PCI.ParkingCalculationInputs({
        cf_db.db_column_lot_id:['p','q','r','s','t'],
        cf_db.db_column_parking_regs_id:[5,5,5,5,5],
        cf_db.db_column_parking_unit_id:[1,1,1,1,1],
        cf_db.db_column_land_use_id:[2000,2000,2000,2000,2000],
        cf_db.db_column_converted_value:[100.0,200.0,500.0,675.0,1000.0],
        cf_db.db_column_reg_sets_id:[1,1,1,1,1]
    })

def generate_ceil_data_thresh():
    """
    # generate_ceil_data_thresh
    This generates the second of 2 cases for a floor and a ceiling. In this case, the thresholds set up the three regimes
    This and generate_ceil_data_thresh should have the same number of inputs and values but different ids for regs and regsets
    """
    return PCI.ParkingCalculationInputs({
        cf_db.db_column_lot_id:['u','v','w','x','y'],
        cf_db.db_column_parking_regs_id:[6,6,6,6,6],
        cf_db.db_column_parking_unit_id:[1,1,1,1,1],
        cf_db.db_column_land_use_id:[2000,2000,2000,2000,2000],
        cf_db.db_column_converted_value:[100.0,200.0,500.0,675.0,1000.0],
        cf_db.db_column_reg_sets_id:[2,2,2,2,2]
    })

def generate_all_none_input_data():
    """
    # generate_all_none_input_data
    generates an input for an case where all the definition is set to none. The intent is to check whether an error is set off
    when the rule is invalid
    """
    return PCI.ParkingCalculationInputs({
        cf_db.db_column_lot_id:['aa'],
        cf_db.db_column_parking_regs_id:[7],
        cf_db.db_column_parking_unit_id:[1],
        cf_db.db_column_land_use_id:[2000],
        cf_db.db_column_converted_value:[100.0],
        cf_db.db_column_reg_sets_id:[2]
    })

def generate_all_none_thresh():
    """
    # generate_all_none_thresh
    generates datasets for checking that an all none line raises error
    """
    return PCI.ParkingCalculationInputs({
        cf_db.db_column_lot_id:['ba','bb'],
        cf_db.db_column_parking_regs_id:[8,8],
        cf_db.db_column_parking_unit_id:[1,1],
        cf_db.db_column_land_use_id:[2000,2000],
        cf_db.db_column_converted_value:[100.0,1100.0],
        cf_db.db_column_reg_sets_id:[2,2]
    })

def generate_all_none_add():
    """
    # generate_all_none_add
    generates datasets for checking that an all none line raises error
    """
    return PCI.ParkingCalculationInputs({
        cf_db.db_column_lot_id:['ba','ba','bb','bb'],
        cf_db.db_column_parking_regs_id:[9,9,9,9],
        cf_db.db_column_parking_unit_id:[2,3,2,3],
        cf_db.db_column_land_use_id:[2000,2000,2000,2000],
        cf_db.db_column_converted_value:[100.0,100.0,100.0,100.0],
        cf_db.db_column_reg_sets_id:[2,2,2,2]
    })

def generate_merged_input_for_compute_valeur_straight():
    """
    # generate_merged_input_for_compute_valeur
    This generates the data required of data conversion of 
    compute_valeur which is a combination of different merges 
    from tax data, parking regulation sets, units definitions 
    and parking regulation definitions
    """
    output= pd.Series(
        {
            cf_db.db_column_lot_id:'a',
            cf_db.db_column_tax_id:'1',
            cf_db.db_column_tax_gross_floor_area:100.0,
            cf_db.db_column_tax_constr_year:1992,
            cf_db.db_column_tax_land_use:5000,
            cf_db.db_column_tax_number_dwellings:None,
            cf_db.db_column_tax_n_rooms_rentals:None,
            cf_db.db_column_tax_n_other_rooms:None,
            cf_db.db_column_parking_regs_id:1,
            cf_db.db_column_parking_unit_id:1,
            cf_db.db_column_tax_data_conversion_slope:1,
            cf_db.db_column_tax_data_conversion_zero:0,
            cf_db.db_column_tax_data_column_to_multiply: 'rl0308a'
        }
    )
    return output

def generate_output_conversion_valeur_straight():
    """
    # generate_output_conversion_valeur_straight
    Returns the value from the tax data conversion direct as 
    a pass through
    """
    return 100.0

def generate_merged_input_for_compute_valeur_convert():
    """
    # generate_merged_input_for_compute_valeur
    This generates the data required of data conversion of 
    compute_valeur which is a combination of different merges 
    from tax data, parking regulation sets, units definitions 
    and parking regulation definitions
    """
    output= pd.Series(
        {
            cf_db.db_column_lot_id:'k',
            cf_db.db_column_tax_id:'11',
            cf_db.db_column_tax_gross_floor_area:10000.0,
            cf_db.db_column_tax_constr_year:1992,
            cf_db.db_column_tax_land_use:4000,
            cf_db.db_column_tax_number_dwellings:4000,
            cf_db.db_column_tax_n_rooms_rentals:None,
            cf_db.db_column_tax_n_other_rooms:None,
            cf_db.db_column_parking_regs_id:3,
            cf_db.db_column_parking_unit_id:2,
            cf_db.db_column_tax_data_conversion_slope:0.01,
            cf_db.db_column_tax_data_conversion_zero:0,
            cf_db.db_column_tax_data_column_to_multiply: 'rl0308a'
        }
    )
    return output

def generate_output_conversion_valeur_convert():
    """
    # generate_output_conversion_valeur_convert
    generates the conversion of the requested value
    """
    return 100.0