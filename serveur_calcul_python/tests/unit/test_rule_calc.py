"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Testing individual rule calculation

This file tests that each of the example regulations which are defined in the 
datastore compute as expected. The tests are devised in such as way as to have two
points for each line and may have only one point in cases where there's a constant
ceiling or floor. Seven regulations were devised for this and were combined in
Parking regulation sets and such to ensure that computation is coherent as you go up
in the abstraction chain
"""

# external libraries
import pandas as pd
# internal functions
from config import config_db as cf_db
from classes import parking_inventory as PI
from tests.data_gen import regulation_data_store as RDS
from tests.data_gen import calcs_input_data_store as CIDS
from tests.data_gen import inventory_data_store as IDS

def test_reglement_simple_min():
    """
    # test_reglement_simple_min
    verifie que le règlement simple mis en place renvoie la réponse prévue
    """
    simple_park_reg = RDS.generate_simple_rule_straight_conversion()
    input_data = CIDS.generate_inputs_simple() 
    inventaire = PI.calculate_parking_specific_reg_from_inputs_class(simple_park_reg,input_data,2)
    expected_supply = IDS.generate_simple_reg_calc_result()
    pd.testing.assert_frame_equal(
        inventaire.parking_frame,
        expected_supply.parking_frame)

def test_reglement_seuil_min():
    """
    # test_reglement_seuil_min
    Vérifie que le calcul d'un règlement basé sur les seuils renvoie la valeur voulue. 
    """
    simple_park_reg = RDS.generate_threshold_based_reg()
    input_data = CIDS.generate_thresh_data()
    inventaire = PI.calculate_parking_specific_reg_from_inputs_class(simple_park_reg,input_data,2).parking_frame.sort_values(by=cf_db.db_column_lot_id)
    expected_supply = IDS.generate_thresh_reg_calc_result()
    pd.testing.assert_frame_equal(
        inventaire,
        expected_supply.parking_frame)

def test_reglement_addition_min():
    """
    # test_reglement_addition_min
    Vérifie que le calcul d'un règlement basé sur l'addition renvoie la valeur voulue. 
    """
    simple_park_reg = RDS.generate_addition_based_reg()
    input_data = CIDS.generate_addition_based_data()
    # struggling to get deterministic result on comment so dropping for now
    inventaire = PI.calculate_parking_specific_reg_from_inputs_class(simple_park_reg,input_data,2).parking_frame
    expected_result=IDS.generate_add_reg_calc_result().parking_frame
    pd.testing.assert_frame_equal(
        inventaire,
        expected_result)

def test_reglement_plancher_min():
    """
    # test_reglement_plancher_min
    Vérifie que le calcul d'un règlement basé sur un plancher renvoie la valeur voulue. 
    """
    simple_park_reg = RDS.generate_floor_based_reg()
    input_data = CIDS.generate_floor_data()
    inventaire = PI.calculate_parking_specific_reg_from_inputs_class(simple_park_reg,input_data,2)
    expected_result = IDS.generate_floor_reg_calc_result()
    pd.testing.assert_frame_equal(
        inventaire.parking_frame,
        expected_result.parking_frame)

def test_reglement_plafond_max():
    """
    # test_reglement_plafond_max
    Tests whether the calculation of a rule with a floor and a ceiling 
    on the minimum number of spots which is imposed through setting a max and a min
    outputs the expected value
    """
    simple_park_reg = RDS.generate_ceil_or_based_reg()
    input_data = CIDS.generate_ceil_data_or()
    inventaire = PI.calculate_parking_specific_reg_from_inputs_class(simple_park_reg,input_data,2)
    expected_result = IDS.generate_ceil_max_reg_calc_result()
    pd.testing.assert_frame_equal(
        inventaire.parking_frame,
        expected_result.parking_frame)

def test_reglement_plafond_seuil():
    """
    # test_reglement_plafond_seuil
    Tests whether the calculation of a rule with a floor and a ceiling
    on the minimum number of spots which is imposed through a number of different
    threshold calculations
    """
    simple_park_reg = RDS.generate_ceil_thresh_based_reg()
    input_data = CIDS.generate_ceil_data_thresh()
    inventaire = PI.calculate_parking_specific_reg_from_inputs_class(simple_park_reg,input_data,2)
    expected_result = IDS.generate_thresh_max_reg_calc_result()
    pd.testing.assert_frame_equal(
        inventaire.parking_frame.sort_values(by=cf_db.db_column_lot_id),
        expected_result.parking_frame.sort_values(by=cf_db.db_column_lot_id),
        check_like=True)

if __name__=="__main__":
    #test_reglement_simple_min()
    #test_reglement_seuil_min()
    #test_reglement_addition_min()
    #test_reglement_plancher_min()
    #test_reglement_plafond_max()
    test_reglement_plafond_seuil()