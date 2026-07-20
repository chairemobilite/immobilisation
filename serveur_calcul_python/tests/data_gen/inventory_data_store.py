"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Datastore for various Parking Inventory objects which are used in the 
test suite. These cover regular and failure cases
"""

# external libraries
import pandas as pd
# internal components
from config import config_db as cf_db
from classes import parking_inventory as PI

def generate_min_only_small_PI():
    """
        # generate_min_only_small_PI
        Returns an inventory with only mins that are the low values created in the helper functions. this serves in the subset operations tests
    """
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:generate_commentaire_small(),
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:generate_low_inventory(),
        cf_db.db_column_supply_max:generate_none_inventory()}
    ))

def generate_min_only_large_PI():
    """
        # generate_min_only_large_PI
        Returns an inventory containing only mins which are larger than the small one. Used for subset operations tests
     """
    return PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:generate_commentaire_large(),
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:generate_high_inventory(),
        cf_db.db_column_supply_max:generate_none_inventory()}
    ))  

def generate_max_only_small_PI():
    """
        # generate_max_only_small_PI
        Returns an inventory with small values and only max values. Min values are set to none. This is used in the subset operations tests
    """
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:generate_commentaire_small(),
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:generate_none_inventory(),
        cf_db.db_column_supply_max:generate_low_inventory()}
    ))

def generate_max_only_large_PI():
    """
        # generate_max_only_large_PI
        Returns an inventory with large values in the maxes only. Min Values are set to None. This is used in the subset operations tests
    """
    return PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:generate_commentaire_large(),
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:generate_none_inventory(),
        cf_db.db_column_supply_max:generate_high_inventory()}
    ))  

def generate_simple_reg_calc_result():
    """ # generate_simple_reg_calc_result
        returns the result of the simple regulation calculation set out in the test_rule_calc
    """
    parking_frame = pd.DataFrame({
            cf_db.db_column_lot_id:['a','b'],
            cf_db.db_column_land_use_id:[5000,5000],
            cf_db.db_column_parking_regs_id:[1,1],
            cf_db.db_column_reg_sets_id:[1,1],
            cf_db.db_column_supply_comment:['Unite: 1 Val: 100.0 ','Unite: 1 Val: 1000.0 '],
            cf_db.db_column_supply_min:[5.0,50.0],
            cf_db.db_column_supply_max:[None,None],
            cf_db.db_column_supply_est_meth:[2,2],
            cf_db.db_column_supply_meas:[None,None],
            cf_db.db_column_supply_estimated:[None,None]
        }
    )
    parking_frame[cf_db.db_column_supply_max]=parking_frame[cf_db.db_column_supply_max].astype(float)
    parking_frame[cf_db.db_column_supply_meas]=parking_frame[cf_db.db_column_supply_meas].astype(float)
    parking_frame[cf_db.db_column_supply_estimated]=parking_frame[cf_db.db_column_supply_estimated].astype(float)
    return PI.ParkingInventory(parking_frame)

def generate_thresh_reg_calc_result():
    """ # generate_thresh_reg_calc_result
        returns the result of the threshold based calculation test case
    """
    parking_frame = pd.DataFrame(
        {
            cf_db.db_column_lot_id:['c','d','e','f','g'],
            cf_db.db_column_supply_min:[0.0,2.5,5.0,5.5,6.0],
            cf_db.db_column_supply_max:[None,None,None,None,None],
            cf_db.db_column_supply_meas:[None,None,None,None,None],
            cf_db.db_column_supply_estimated:[None,None,None,None,None],
            cf_db.db_column_supply_est_meth:[2,2,2,2,2],
            cf_db.db_column_parking_regs_id:[2,2,2,2,2],
            cf_db.db_column_reg_sets_id:[3,3,3,3,3],
            cf_db.db_column_land_use_id:[6000,6000,6000,6000,6000],
            cf_db.db_column_supply_comment:['Unite: 1 Val: 0.0 ','Unite: 1 Val: 50.0 ','Unite: 1 Val: 100.0 ','Unite: 1 Val: 150.0 ','Unite: 1 Val: 200.0 ']
        }
    )
    parking_frame[cf_db.db_column_supply_max]=parking_frame[cf_db.db_column_supply_max].astype(object)
    parking_frame[cf_db.db_column_supply_meas]=parking_frame[cf_db.db_column_supply_meas].astype(object)
    parking_frame[cf_db.db_column_supply_estimated]=parking_frame[cf_db.db_column_supply_estimated].astype(object)
    return PI.ParkingInventory(parking_frame)

def generate_add_reg_calc_result():
    """ # generate_add_reg_calc_result
        returns the result of the addition based calculation test case
    """
    parking_frame = pd.DataFrame(
        {
            cf_db.db_column_lot_id:['h','i','j','k'],
            cf_db.db_column_land_use_id:[4000,4000,4000,4000],
            cf_db.db_column_parking_regs_id:[3,3,3,3],
            cf_db.db_column_reg_sets_id:[1,1,1,1],
            cf_db.db_column_supply_comment:['Unite: 2 Val: 0.0 /Unite: 3 Val: 0.0 ',
                                            'Unite: 2 Val: 100.0 /Unite: 3 Val: 0.0 ',
                                            'Unite: 2 Val: 0.0 /Unite: 3 Val: 100.0 ',
                                            'Unite: 2 Val: 100.0 /Unite: 3 Val: 100.0 '],
            cf_db.db_column_supply_min:[0.0,50.0,25.0,75.0],
            cf_db.db_column_supply_max:[None,None,None,None],
            cf_db.db_column_supply_est_meth:[2,2,2,2],
            cf_db.db_column_supply_meas:[None,None,None,None],
            cf_db.db_column_supply_estimated:[None,None,None,None]
        }
    )
    parking_frame[cf_db.db_column_supply_max]=parking_frame[cf_db.db_column_supply_max].astype(float)
    parking_frame[cf_db.db_column_supply_meas]=parking_frame[cf_db.db_column_supply_meas].astype(float)
    parking_frame[cf_db.db_column_supply_estimated]=parking_frame[cf_db.db_column_supply_estimated].astype(float)
    return PI.ParkingInventory(parking_frame)

def generate_floor_reg_calc_result():
    """ # generate_floor_reg_calc_result
        returns the result of the floor based calculation test case
    """
    parking_frame = pd.DataFrame(
        {
            cf_db.db_column_lot_id:['l','m','n','o'],
            cf_db.db_column_land_use_id:[1000,1000,1000,1000],
            cf_db.db_column_parking_regs_id:[4,4,4,4],
            cf_db.db_column_reg_sets_id:[1,1,1,1],
            cf_db.db_column_supply_comment:['Unite: 1 Val: 100.0 /Unite: 1 Val: 100.0 ',
                                            'Unite: 1 Val: 200.0 /Unite: 1 Val: 200.0 ',
                                            'Unite: 1 Val: 500.0 /Unite: 1 Val: 500.0 ',
                                            'Unite: 1 Val: 1000.0 /Unite: 1 Val: 1000.0 '],
            cf_db.db_column_supply_est_meth:[2,2,2,2],
            cf_db.db_column_supply_meas:[None,None,None,None],
            cf_db.db_column_supply_estimated:[None,None,None,None],
            cf_db.db_column_supply_min:[10.0,10.0,25.0,50.0],
            cf_db.db_column_supply_max:[None,None,None,None]
        }
    )
    parking_frame[cf_db.db_column_supply_max]=parking_frame[cf_db.db_column_supply_max].astype(float)
    parking_frame[cf_db.db_column_supply_meas]=parking_frame[cf_db.db_column_supply_meas].astype(float)
    parking_frame[cf_db.db_column_supply_estimated]=parking_frame[cf_db.db_column_supply_estimated].astype(float)
    return PI.ParkingInventory(parking_frame)

def generate_ceil_max_reg_calc_result():
    """ # generate_ceil_max_reg_calc_result
        returns the result of the ceiling based calculations that uses maxes rather 
        than thresholds to create the regulation. 
    """
    parking_frame = pd.DataFrame(
        {
            cf_db.db_column_lot_id:             ['p'    ,'q'    ,'r'    ,'s'    ,'t'],
            cf_db.db_column_land_use_id:        [2000   ,2000   ,2000   ,2000   ,2000],
            cf_db.db_column_parking_regs_id:    [5      ,5      ,5      ,5      ,5],
            cf_db.db_column_reg_sets_id:        [1      ,1      ,1      ,1      ,1],
            cf_db.db_column_supply_comment:[
                'Unite: 1 Val: 100.0 /Unite: 1 Val: 100.0 ',
                'Unite: 1 Val: 200.0 /Unite: 1 Val: 200.0 ',
                'Unite: 1 Val: 500.0 /Unite: 1 Val: 500.0 ',
                'Unite: 1 Val: 675.0 /Unite: 1 Val: 675.0 ',
                'Unite: 1 Val: 1000.0 /Unite: 1 Val: 1000.0 '
            ],
            cf_db.db_column_supply_est_meth:    [2      ,2      ,2      ,2      ,2],
            cf_db.db_column_supply_meas:        [None   ,None   ,None   ,None   ,None],
            cf_db.db_column_supply_estimated:   [None   ,None   ,None   ,None   ,None],
            cf_db.db_column_supply_min:         [10.0   ,10.0   ,25.0   ,33.75  ,35.0],
            cf_db.db_column_supply_max:         [35.0   ,35.0   ,35.0   ,35.0   ,35.0]
        }
    )
    parking_frame[cf_db.db_column_supply_max]=parking_frame[cf_db.db_column_supply_max].astype(float)
    parking_frame[cf_db.db_column_supply_meas]=parking_frame[cf_db.db_column_supply_meas].astype(float)
    parking_frame[cf_db.db_column_supply_estimated]=parking_frame[cf_db.db_column_supply_estimated].astype(float)
    return PI.ParkingInventory(parking_frame)

def generate_thresh_max_reg_calc_result():
    """ # generate_thresh_max_reg_calc_result
        returns the result of the ceiling based calculations that uses thresholds
        rather than maxes to create the regulation. 
    """
    parking_frame = pd.DataFrame(
        {
            cf_db.db_column_lot_id:             ['u'    ,'v'    ,'w'    ,'x'    ,'y'],
            cf_db.db_column_land_use_id:        [2000   ,2000   ,2000   ,2000   ,2000],
            cf_db.db_column_parking_regs_id:    [6      ,6      ,6      ,6      ,6],
            cf_db.db_column_reg_sets_id:        [2      ,2      ,2      ,2      ,2],
            cf_db.db_column_supply_comment:[
                'Unite: 1 Val: 100.0 ',
                'Unite: 1 Val: 200.0 ',
                'Unite: 1 Val: 500.0 ',
                'Unite: 1 Val: 675.0 ',
                'Unite: 1 Val: 1000.0 '
            ],
            cf_db.db_column_supply_est_meth:    [2      ,2      ,2      ,2      ,2],
            cf_db.db_column_supply_meas:        [None   ,None   ,None   ,None   ,None],
            cf_db.db_column_supply_estimated:   [None   ,None   ,None   ,None   ,None],
            cf_db.db_column_supply_min:         [10.0   ,10.0   ,25.0   ,33.75  ,35.0],
            cf_db.db_column_supply_max:         [None   ,None   ,None   ,None   ,None]
        }
    )
    parking_frame[cf_db.db_column_supply_max]=parking_frame[cf_db.db_column_supply_max].astype(object)
    parking_frame[cf_db.db_column_supply_meas]=parking_frame[cf_db.db_column_supply_meas].astype(object)
    parking_frame[cf_db.db_column_supply_estimated]=parking_frame[cf_db.db_column_supply_estimated].astype(object)
    return PI.ParkingInventory(parking_frame)

def generate_merge_mins_only_input():
    """
        # generate_merge_mins_only_input
        Returns input for merging two predictions for one lot with only mins. 
        Prediction should be the sum of the predictions for the lot
    """
    frame_0 = pd.DataFrame({
        cf_db.db_column_lot_id:['1','1','2'],
        cf_db.db_column_supply_min:[10,5,15],
        cf_db.db_column_supply_max:[None,None,None],
        cf_db.db_column_supply_estimated:[None,None,None],
        cf_db.db_column_supply_meas:[None,None,None],
        cf_db.db_column_supply_est_meth:[2,2,2],
        cf_db.db_column_land_use_id:['1000','5000','5000'],
        cf_db.db_column_parking_regs_id:[1,2,2],
        cf_db.db_column_reg_sets_id:[1,1,1],
        cf_db.db_column_supply_comment:['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000']
    })
    inventaire = PI.ParkingInventory(frame_0)
    return inventaire

def generate_merge_mins_only_result():
    """
    # generate_merge_mins_only_result
    Returns the expected parking inventory after the two entries for lot one have 
    been summed 
    """
    expected_result = pd.DataFrame({
        cf_db.db_column_lot_id:['2','1'],
        cf_db.db_column_supply_min:[15,15],
        cf_db.db_column_supply_max:[None,None],
        cf_db.db_column_supply_estimated:[None,None],
        cf_db.db_column_supply_meas:[None,None],
        cf_db.db_column_supply_est_meth:[2,2],
        cf_db.db_column_land_use_id:['5000','1000/5000'],
        cf_db.db_column_parking_regs_id:["2","1/2"],
        cf_db.db_column_reg_sets_id:['1','1/1'],
        cf_db.db_column_supply_comment:['Unite:2 val:3000','Unite:1 val:1, Unite:2 val:1000']
    }) 
    return PI.ParkingInventory(expected_result)

def generate_merge_mins_and_compatible_maxes_input():
    """
    # generate_merge_mins_and_compatible_maxes_input
    generates input for a merge where there are mins and maxes.
    In this instance, the mins and maxes are compatible i.e. 
    the maxes are larger than the mins. There can be cases where
    this is an issue when one of the tax entries has a maximum assigned
    but not the other
    """
    frame_0 = pd.DataFrame({
        cf_db.db_column_lot_id:['1','1','2'],
        cf_db.db_column_supply_min:[10,5,15],
        cf_db.db_column_supply_max:[15,8,25],
        cf_db.db_column_supply_estimated:[None,None,None],
        cf_db.db_column_supply_meas:[None,None,None],
        cf_db.db_column_supply_est_meth:[2,2,2],
        cf_db.db_column_land_use_id:['1000','5000','5000'],
        cf_db.db_column_parking_regs_id:[1,2,2],
        cf_db.db_column_reg_sets_id:[1,1,1],
        cf_db.db_column_supply_comment:['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000']
    })
    inventaire = PI.ParkingInventory(frame_0)
    return inventaire

def generate_merge_mins_and_compatible_maxes_expected_result():
    """
    # generate_merge_mins_and_compatible_maxes_expected_result
    Returns a ParkingInventory which contains the result of what should occur 
    when runnung a merge operation where a lot has multiple land uses and thus
    requires that the inventory estimates be summed and cleaned up
    """
    expected_result = pd.DataFrame({
        cf_db.db_column_lot_id:['2','1'],
        cf_db.db_column_supply_min:[15,15],
        cf_db.db_column_supply_max:[25,23],
        cf_db.db_column_supply_estimated:[None,None],
        cf_db.db_column_supply_meas:[None,None],
        cf_db.db_column_supply_est_meth:[2,2],
        cf_db.db_column_land_use_id:['5000','1000/5000'],
        cf_db.db_column_parking_regs_id:["2","1/2"],
        cf_db.db_column_reg_sets_id:['1','1/1'],
        cf_db.db_column_supply_comment:['Unite:2 val:3000','Unite:1 val:1, Unite:2 val:1000']
    })
    inventaire=PI.ParkingInventory(expected_result)
    return inventaire

def generate_merge_mins_and_incompatible_maxes_input():
    """
    # generate_merge_mins_and_incompatible_maxes_input
    Returns a ParkingInventory where a lot has two estimates for a same lot and one of the estimates
    has a max and the other doesn't. This invalidates the max estimate and should yield a case 
    whereby the maxes are eliminated for this property
    """
    frame_0 = pd.DataFrame({
        cf_db.db_column_lot_id:['1','1','2'],
        cf_db.db_column_supply_min:[10,5,15],
        cf_db.db_column_supply_max:[12,None,25],
        cf_db.db_column_supply_estimated:[None,None,None],
        cf_db.db_column_supply_meas:[None,None,None],
        cf_db.db_column_supply_est_meth:[2,2,2],
        cf_db.db_column_land_use_id:['1000','5000','5000'],
        cf_db.db_column_parking_regs_id:[1,2,2],
        cf_db.db_column_reg_sets_id:[1,1,1],
        cf_db.db_column_supply_comment:['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000']
    })
    inventaire = PI.ParkingInventory(frame_0)
    return inventaire

def generate_merge_mins_and_incompatible_maxes_expected_result():
    """
    # generate_merge_mins_and_incompatible_maxes_expected_result
    Returnns the result of the merge operation where the max is eliminated
    because lot 1 has one estimate with a max and the other doesn't making 
    the computation invalid
    """
    expected_result = pd.DataFrame({
        cf_db.db_column_lot_id:['2','1'],
        cf_db.db_column_supply_min:[15,15],
        cf_db.db_column_supply_max:[25,None],
        cf_db.db_column_supply_estimated:[None,None],
        cf_db.db_column_supply_meas:[None,None],
        cf_db.db_column_supply_est_meth:[2,2],
        cf_db.db_column_land_use_id:['5000','1000/5000'],
        cf_db.db_column_parking_regs_id:["2","1/2"],
        cf_db.db_column_reg_sets_id:['1','1/1'],
        cf_db.db_column_supply_comment:['Unite:2 val:3000','Unite:1 val:1, Unite:2 val:1000']
    })
    inventaire = PI.ParkingInventory(expected_result)
    return inventaire

def generate_list_of_inventory_dissolution_input():
    """
    # generate_list_of_inventory_dissolution_input
    generates a list of inventories which will be used as an input for a list dissolution
    Dissolution is the process of concatenating the items of a list of ParkingInventories
    into a single ParkingInventory. Operation is typically followed by a merge operation
    which are tested above
    """
    frame_0 = pd.DataFrame({
        cf_db.db_column_lot_id:['1','1','2'],
        cf_db.db_column_supply_min:[10,5,15],
        cf_db.db_column_supply_max:[None,None,None],
        cf_db.db_column_supply_estimated:[None,None,None],
        cf_db.db_column_supply_meas:[None,None,None],
        cf_db.db_column_supply_est_meth:[2,2,2],
        cf_db.db_column_land_use_id:['1000','5000','5000'],
        cf_db.db_column_parking_regs_id:[1,2,2],
        cf_db.db_column_reg_sets_id:[1,1,1],
        cf_db.db_column_supply_comment:['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000']
    })
    inventaire_1 = PI.ParkingInventory(frame_0)
    frame_1 = pd.DataFrame({
        cf_db.db_column_lot_id:['2','3'],
        cf_db.db_column_supply_min:[15,15],
        cf_db.db_column_supply_max:[None,None],
        cf_db.db_column_supply_estimated:[None,None],
        cf_db.db_column_supply_meas:[None,None],
        cf_db.db_column_supply_est_meth:[2,2],
        cf_db.db_column_land_use_id:['6501','5000'],
        cf_db.db_column_parking_regs_id:[3,4],
        cf_db.db_column_reg_sets_id:[2,2],
        cf_db.db_column_supply_comment:['Unite:2 val:1500','Unite:2 val:1000']
    })
    inventaire_2 = PI.ParkingInventory(frame_1)
    invent_list = [inventaire_1,inventaire_2]
    return invent_list

def generate_dissolution_expected_result():
    """
    # generate_dissolution_expected_result
    Function that returns the expected result for the dissolution step of a 
    list of parking inventories to a single parking inventory

    Returns:
        - the expected ParkingInventory post dissolution
    """
    expected_result = pd.DataFrame({
        cf_db.db_column_lot_id:['1','1','2','2','3'],
        cf_db.db_column_supply_min:[10,5,15,15,15],
        cf_db.db_column_supply_max:[None,None,None,None,None],
        cf_db.db_column_supply_estimated:[None,None,None,None,None],
        cf_db.db_column_supply_meas:[None,None,None,None,None],
        cf_db.db_column_supply_est_meth:[2,2,2,2,2],
        cf_db.db_column_land_use_id:['1000','5000','5000','6501','5000'],
        cf_db.db_column_parking_regs_id:[1,2,2,3,4],
        cf_db.db_column_reg_sets_id:[1,1,1,2,2],
        cf_db.db_column_supply_comment:['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000','Unite:2 val:1500','Unite:2 val:1000']
    })
    expected_inventory = PI.ParkingInventory(expected_result)
    return expected_inventory

def generate_low_inventory():
    """# generate_low_inventory
        Helper function for subset operation test:  Returns smaller of 2 inventories
    """
    return [1,4]

def generate_high_inventory():
    """
        # generate_high_inventory
        Helper function for subset operations : returns larger of 2 inventories
    """
    return [2,5]

def generate_none_inventory():
    """
    # generate_none_inventory
    Helper function for subset operations tests: returns none inventories
    """
    return[None,None]

def generate_lot_numbers():
    """
    # generate_lot_numbers
    Helper function for subset operation tests: returns lot numbers
    """
    return['a','b']

def generate_cubf():
    """
    # generate_cubf
    Helper function to return land use codes for subset operations: returns land use codes
    """
    return ['1000','1000']

def generate_id_reg_stat():
    """
    # generate_id_reg_stat
    Helper function for subset operations tests: returns dummy regulation ids
    """
    return['1','2']

def generate_id_er():
    """
    # generate_id_er
    Helper function for subset operations tests: returns dummy regulation set ids
    """
    return['3','4']

def generate_methode_estime():
    """
        # generate_methode_estime
        Helper function for subset operations tests: returns dummy estimate methodd. In this instance it returns 2 which means it's automatically generated from tax data
    """
    return [2,2]

def generate_commentaire_small():
    """
        # generate_commentaire_small
        Helper function for subset operations tests: returns dummy comments
    """
    return ['Comm_small_1','Comm_small_2']

def generate_commentaire_large():
    """
        # generate_commentaire_large
        Helper function for subset operation : returns dummy comments
    """
    return ['Comm_large_1','Comm_large_2']

def generate_rst_1_result():
    """
    # generate_rst_1_result
    Returns the expected result of the rst 1 calculation phase
    """
    expected = pd.concat([
        generate_simple_reg_calc_result().parking_frame,
        generate_add_reg_calc_result().parking_frame,
        generate_floor_reg_calc_result().parking_frame,
        generate_ceil_max_reg_calc_result().parking_frame
        ]).sort_values(by=cf_db.db_column_lot_id).reset_index().drop(columns=['index'])
    
    return PI.ParkingInventory(expected)
    
def generate_rst_2_result():
    """
    # generate_rst_2_result
    Returns the expected result for the rst 2 calculation phase
    """
    return generate_thresh_max_reg_calc_result()

def generate_rst_3_result():
    """
    # generate_rst_3_result
    Returns the expected result for the rst 3 calculation phase
    """
    return generate_thresh_reg_calc_result()

def generate_so_left_small_expected_output():
    """
    # generate_so_left_small_expected_output
    Helper function to return the correct outcome for the simple or tests
    with the left ParkingInventory with the smaller min

    Returns:
        - a ParkingInventory 
    """
    comment=[]
    for out in zip(generate_commentaire_small(),generate_commentaire_large()):
        comment.append(f'{out[0]}/{out[1]}') 
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:comment,
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:list(map(lambda x: float(x),generate_low_inventory())),
        cf_db.db_column_supply_max:generate_none_inventory()}
    ))

def generate_so_right_small_expected_output():
    """
    # generate_so_right_small_expected_output
    Helper function to return the correct outcome for the simple or tests
    with the left ParkingInventory with the larger min

    Returns:
        - a ParkingInventory 
    """
    comment=[]
    for out in zip(generate_commentaire_large(),generate_commentaire_small()):
        comment.append(f'{out[0]}/{out[1]}') 
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:comment,
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:list(map(lambda x: float(x),generate_low_inventory())),
        cf_db.db_column_supply_max:generate_none_inventory()}
    ))

def generate_mco_left_small_min_expected_result():
    """
    # generate_mco_left_small_min_expected_result
    Returns the expected result for the most constraining or case when there is nothing
    but the min and the left dataframe is smaller

    Returns:
        - expected parking inventory
    """
    comment=[]
    for out in zip(generate_commentaire_small(),generate_commentaire_large()):
        comment.append(f'{out[0]}/{out[1]}') 
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:comment,
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:list(map(lambda x: int(x),generate_high_inventory())),
        cf_db.db_column_supply_max:generate_none_inventory()}
    ))

def generate_mco_right_small_min_expected_result():
    """
    # generate_mco_right_small_min_expected_result
    Returns the expected result for the most constraining or case with there are only 
    mins and the right dataframe is smaller

    Returns:
        - expected ParkingInventory
    """
    comment=[]
    for out in zip(generate_commentaire_large(),generate_commentaire_small()):
        comment.append(f'{out[0]}/{out[1]}') 
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:comment,
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:list(map(lambda x: int(x),generate_high_inventory())),
        cf_db.db_column_supply_max:generate_none_inventory()}
    ))

def generate_mco_left_small_max_w_min_expected_result():
    """
    # generate_mco_left_small_max_w_min_expected_result
    Returns the expected for the parking inventory in the case where the left PI is a
    a maximum which is smaller than the minimum specified on the right, 
    """
    comment=[]
    for out in zip(generate_commentaire_small(),generate_commentaire_large()):
        comment.append(f'{out[0]}/{out[1]}') 
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:generate_commentaire_small(),
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:list(map(lambda x: float(x), generate_low_inventory())),
        cf_db.db_column_supply_max:list(map(lambda x: float(x), generate_low_inventory()))}
    ))

def generate_mco_right_small_min_w_large_max_expected_result():
    """
    # generate_mco_right_small_min_w_large_max_expected_result
    Returns the expected for the parking inventory in the case where the left PI is a
    a maximum which is larger than the minimum specified on the right, 
    """
    comment=[]
    for out in zip(generate_commentaire_small(),generate_commentaire_large()):
        comment.append(f'{out[0]}/{out[1]}') 
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:generate_commentaire_large(),
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:list(map(lambda x: float(x), generate_low_inventory())),
        cf_db.db_column_supply_max:list(map(lambda x: float(x), generate_high_inventory()))}
    ))

def generate_mco_left_small_min_w_max_expected_result():
    """
    # generate_mco_left_small_min_w_max_expected_result
    Returns the expected for the parking inventory in the case where the left PI is a
    a maximum which is smaller than the minimum specified on the right, 
    """
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:generate_commentaire_small(),
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:list(map(lambda x: float(x), generate_low_inventory())),
        cf_db.db_column_supply_max:list(map(lambda x: float(x), generate_high_inventory()))}
    ))

def generate_mco_left_large_min_w_max_expected_result():
    """
    # generate_mco_left_large_min_w_max_expected_result
    Returns the expected for the parking inventory in the case where the left PI is a
    a maximum which is smaller than the minimum specified on the right, thus capping the min
    """
    return  PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        cf_db.db_column_lot_id:generate_lot_numbers(),
        cf_db.db_column_land_use_id:generate_cubf(),
        cf_db.db_column_parking_regs_id:generate_id_reg_stat(),
        cf_db.db_column_reg_sets_id:generate_id_er(),
        cf_db.db_column_supply_comment:generate_commentaire_large(),
        cf_db.db_column_supply_est_meth:generate_methode_estime(),
        cf_db.db_column_supply_min:list(map(lambda x: float(x), generate_low_inventory())),
        cf_db.db_column_supply_max:list(map(lambda x: float(x), generate_low_inventory()))}
    ))    