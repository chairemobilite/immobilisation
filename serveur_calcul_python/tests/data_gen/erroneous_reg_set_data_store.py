"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Datastore for erroneous reg sets that set off validation errors that are 
based on date incompatibilities in the input of the regulation set as well
as not having the required minimum amount of fill in the land use table
"""
# external libraries
import pandas as pd
# internal functions
import classes.parking_reg_sets as PRS
import config.config_db as cf_db
import tests.data_gen.regulation_data_store as RDS 
import tests.data_gen.land_use_table_data_store as LUTDS

def generate_reg_set_without_minimum_fill():
    """
    # generate_reg_set_without_minimum_fill
    Generates a parkingRegulationSet which should fail validation
    because the 9 land use code doesn't have a rule attached.

    Returns: 
        - a ParkingRegulationSet that will fail validation
    """
    all_regs = RDS.generate_all_relevant_regs()
    first_prs_regs = all_regs.get_reg_by_id([1,3,4,5])
    prs_1 = PRS.ParkingRegulationSet(
        first_prs_regs.reg_head,
        first_prs_regs.reg_def,
        first_prs_regs.units_table,
        1,
        1990,
        1995,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8],
            cf_db.db_column_parking_regs_id:[4,5,5,3,1,1,1,1]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1

def generate_reg_set_with_reg_2000_reg_set_2020():
    """
    # generate_reg_set_with_incompatible_dates
    Generates a ParkingRegulationSet that should fail validation because
    the regulation set end year (2020) exceeds the end year of the 
    regulations it contains (2000), violating date compatibility requirements.
    
    Returns:
        - a ParkingRegulationSet object that will fail validation
    """
    all_regs = RDS.generate_all_relevant_regs()
    first_prs_regs = all_regs.get_reg_by_id([1])
    prs_1 = PRS.ParkingRegulationSet(
        first_prs_regs.reg_head,
        first_prs_regs.reg_def,
        first_prs_regs.units_table,
        1,
        1990,
        2020,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[1,1,1,1,1,1,1,1,1]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1

def generate_reg_set_with_reg_ends_before_reg_set_still_valid():
    """
    # generate_reg_set_with_incompatible_dates
    Generates a ParkingRegulationSet that should fail validation because
    the regulation set end year (None) exceeds the end year of the 
    regulations it contains (2000), violating date compatibility requirements.
    
    Returns:
        - a ParkingRegulationSet object that will fail validation
    """
    all_regs = RDS.generate_all_relevant_regs()
    first_prs_regs = all_regs.get_reg_by_id([1])
    prs_1 = PRS.ParkingRegulationSet(
        first_prs_regs.reg_head,
        first_prs_regs.reg_def,
        first_prs_regs.units_table,
        1,
        1990,
        None,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[1,1,1,1,1,1,1,1,1]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1

def generate_reg_set_with_reg_still_valid_reg_set_still_valid():

    first_prs_regs = RDS.generate_simple_reg_still_valid()
    prs_1 = PRS.ParkingRegulationSet(
        first_prs_regs.reg_head,
        first_prs_regs.reg_def,
        first_prs_regs.units_table,
        1,
        1990,
        None,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[25,25,25,25,25,25,25,25,25]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1

def generate_reg_set_with_reg_still_valid_reg_set_ends():
    first_prs_regs = RDS.generate_simple_reg_still_valid()
    prs_1 = PRS.ParkingRegulationSet(
        first_prs_regs.reg_head,
        first_prs_regs.reg_def,
        first_prs_regs.units_table,
        1,
        1990,
        2020,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[25,25,25,25,25,25,25,25,25]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1

def generate_reg_set_with_reg_start_1990_reg_set_1989():
    """
    # generate_reg_set_with_incompatible_dates
    Generates a ParkingRegulationSet that should fail validation because
    the regulation set start year is before the start year of the regulation
    this means that the regulation would not have existed for a part of the
    regulation set which should be impossible
    
    Returns:
        - a ParkingRegulationSet object that will fail validation based on start 
        date and raise a ValueError
    """
    all_regs = RDS.generate_all_relevant_regs()
    first_prs_regs = all_regs.get_reg_by_id([1])
    prs_1 = PRS.ParkingRegulationSet(
        first_prs_regs.reg_head,
        first_prs_regs.reg_def,
        first_prs_regs.units_table,
        1,
        1989,
        1994,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[1,1,1,1,1,1,1,1,1]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1

def generate_reg_set_with_reg_start_1990_reg_set_1991():
    """
    # generate_reg_set_with_incompatible_dates
    Generates a ParkingRegulationSet that should pass validation 
    because the start year of the regulations is before the start year of 
    the regulation sets (i.e. the regulation covers the regulation set)
    
    Returns:
        - a ParkingRegulationSet object that will pass date validation
    """
    all_regs = RDS.generate_all_relevant_regs()
    first_prs_regs = all_regs.get_reg_by_id([1])
    prs_1 = PRS.ParkingRegulationSet(
        first_prs_regs.reg_head,
        first_prs_regs.reg_def,
        first_prs_regs.units_table,
        1,
        1991,
        1994,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[1,1,1,1,1,1,1,1,1]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1

def generate_reg_set_with_reg_start_big_bang_reg_set_big_bang()->PRS.ParkingRegulationSet:
    """
    # generate_reg_set_with_reg_start_big_bang_reg_set_big_bang
    Generates a reg set where both the regulation and reg_sets are valid 
    in perpetuity meaning that they cover anything before a certain date
    
    Returns:
        - a ParkingRegulationSet which should pass validation
    """
    relevant_reg = RDS.generate_simple_reg_eternal()
    prs_1 = PRS.ParkingRegulationSet(
        relevant_reg.reg_head,
        relevant_reg.reg_def,
        relevant_reg.units_table,
        1,
        None,
        1994,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[26,26,26,26,26,26,26,26,26]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1

def generate_reg_set_with_reg_start_1990_reg_set_big_bang()->PRS.ParkingRegulationSet:
    """
    # generate_reg_set_with_reg_start_1990_reg_set_big_bang
    Generate a parking regulation set which should fail validation
    based on the fact that the regulation set spans in perpetuity wheras
    the regulation which is used does not.this would mean that this rule
    which would be used as a filler doesn't have temporal overlap. 

    Returns:
        - a ParkingRegulationSet which should fail validation due to 
        incompatible start dates
    """
    all_regs = RDS.generate_all_relevant_regs()
    first_prs_regs = all_regs.get_reg_by_id([1])
    prs_1 = PRS.ParkingRegulationSet(
        first_prs_regs.reg_head,
        first_prs_regs.reg_def,
        first_prs_regs.units_table,
        1,
        None,
        1994,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[1,1,1,1,1,1,1,1,1]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1

def generate_reg_set_with_reg_start_big_bang_reg_set_1990()->PRS.ParkingRegulationSet:
    """
    # generate_reg_set_with_reg_start_big_bang_reg_set_1990
    Generates a parking regulation set whereby the parking regulation
    spans back in time but the parking regulation set has a limited timespan. This 
    should be fine although it's an unlikely scenario

    Returns:
        - a ParkingRegulationsSet which should pass validation
    """
    relevant_reg = RDS.generate_simple_reg_eternal()
    prs_1 = PRS.ParkingRegulationSet(
        relevant_reg.reg_head,
        relevant_reg.reg_def,
        relevant_reg.units_table,
        1,
        1990,
        1994,
        'Premier_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[26,26,26,26,26,26,26,26,26]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1
