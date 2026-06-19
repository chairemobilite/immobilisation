"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Datastore for various the land use table used in the tests which is much simpler than
what the actual thing is for conciseness sake
"""


# external libraries
import pandas as pd
# internal development
from config import config_db as cf_db

def generate_land_use_table():
    """
        # get_land_use_table
        Returns a simplified land use table for use in the various tools
    """
    cubf  = [
            1,
            1000,
            2,
            2000,
            3,
            3000,
            4,
            4000,
            5,
            5000,
            6,
            6000,
            7,
            7000,
            8,
            8000,
            9,
            9000
        ]
    desc = [
            'RÉSIDENTIEL',
            'résidentiel',
            'INDUSTRIE',
            'Industrie 1',
            'INDUSTRIE',
            'Industrie 2',
            'TRANSPORT',
            'Transport',
            'COMMERCIAL',
            'Commercial',
            'SERVICES',
            'Services',
            'LOISIR',
            'Loisir',
            'RESS NAT',
            'Ressources Naturelles',
            'INOCCUPÉ',
            'Inoccupé']
    return pd.DataFrame({
        cf_db.db_column_land_use_id:cubf,
        cf_db.db_column_land_use_desc:desc
    })