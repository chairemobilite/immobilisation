"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Datastore for various parking regulations sets which are used. Again,
this covers the regular ones a separate store is setup for ones which
break validation
"""

# outside libraries
import pandas as pd
# internal data
from config import config_db as cf_db
from classes import parking_reg_sets as PRS
from tests.data_gen import regulation_data_store as RDS
from tests.data_gen import land_use_table_data_store as LUTDS


def generate_parking_regulation_sets():
    """
        # generate_parking_regulation_sets
        Returns the rules generated in the regulation data store 
        in order to organize them into parking regulation sets, 
        Here 4 regulation sets are created, three of which are
        used in the test cases to check assignment and computation
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
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[4,5,5,3,1,1,1,1,1]
        }),
        LUTDS.generate_land_use_table()
    )

    second_prs_regs = all_regs.get_reg_by_id([1,3,4,6])
    prs_2 = PRS.ParkingRegulationSet(
        second_prs_regs.reg_head,
        second_prs_regs.reg_def,
        second_prs_regs.units_table,
        2,
        1990,
        1995,
        'Deuxième_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[4,6,6,3,1,1,1,1,1]
        }),
        LUTDS.generate_land_use_table()
    )
    third_prs_regs = all_regs.get_reg_by_id([1,2,3,4,5])
    prs_3 = PRS.ParkingRegulationSet(
        third_prs_regs.reg_head,
        third_prs_regs.reg_def,
        third_prs_regs.units_table,
        3,
        1995,
        2000,
        'Troisième_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:    [1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[4,5,5,3,1,2,2,2,2]
        }),
        LUTDS.generate_land_use_table()
    )
    fourth_prs_regs = all_regs.get_reg_by_id([1,2,3,4,6])
    prs_4 = PRS.ParkingRegulationSet(
        fourth_prs_regs.reg_head,
        fourth_prs_regs.reg_def,
        fourth_prs_regs.units_table,
        4,
        1995,
        2000,
        'Quatrième_ensemble_reglement',
        pd.DataFrame(data={
            cf_db.db_column_land_use_id:[1,2,3,4,5,6,7,8,9],
            cf_db.db_column_parking_regs_id:[4,6,6,3,1,2,2,2,2]
        }),
        LUTDS.generate_land_use_table()
    )
    return prs_1,prs_2,prs_3,prs_4