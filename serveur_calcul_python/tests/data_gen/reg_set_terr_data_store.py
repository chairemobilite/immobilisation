"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Datastore for the 4 reg set territories being used as part of the test suite.
There are 4 rsts, 3 are used and they cover 2 periods with 2 territories each
"""


# outside libraries
import geopandas as gpd
from shapely import Polygon
# internal functions 
from config import config_db as cf_db
from classes import reg_set_territory as RST
from tests.data_gen import regulation_set_data_store as RSDS
from tests.data_gen import tax_data_store as TDS

def generate_reg_set_terr():
    """
        # generate_reg_set_terr
        Returns a tuple of reg_set_territories used for testing the assignment of different tax datasets to the relevant regulation sets
    """
    tax_data_set = TDS.generate_tax_dataset()
    top_polygon_lat = [46.5+.006,46.5+.005,46.45-.005,46.45-.005,46.5+.006]
    polygon_lon = [-71.5-.006,-71.44+.006,-71.44+.006,-71.5-.006,-71.5-.006]
    bottom_polygon_lat = [46.44+.005,46.44+.005,46.44-.006,46.44-.006,46.44+.005]
    prs_1,prs_2,prs_3,_ = RSDS.generate_parking_regulation_sets()
    top_territory_old = gpd.GeoDataFrame(
        data={
            cf_db.db_column_territory_id:[1],
            cf_db.db_column_territory_city:["perio 1"],
            cf_db.db_column_territory_zone:["top"],
            cf_db.db_column_territory_name: ['perio_1 - top'],
            cf_db.db_column_history_id :[1]
        },
        geometry = [Polygon(zip(polygon_lon, top_polygon_lat))],
        crs='EPSG:4326'
    )
    bottom_territory_old = gpd.GeoDataFrame(
        data={
            cf_db.db_column_territory_id:[2],
            cf_db.db_column_territory_city:["perio 1"],
            cf_db.db_column_territory_zone:["bottom"],
            cf_db.db_column_territory_name: ['perio_1 - bottom'],
            cf_db.db_column_history_id :[1]
        },
        geometry = [Polygon(zip(polygon_lon, bottom_polygon_lat))],
        crs='EPSG:4326' 
    )
    top_territory_new=gpd.GeoDataFrame(
        data={
            cf_db.db_column_territory_id:[3],
            cf_db.db_column_territory_city:["perio 2"],
            cf_db.db_column_territory_zone:["top"],
            cf_db.db_column_territory_name: ['perio_2 - top'],
            cf_db.db_column_history_id :[2]
        },
        geometry = [Polygon(zip(polygon_lon, top_polygon_lat))],
        crs='EPSG:4326'
    )
    reg_set_terr_1 = RST.RegSetTerritory(
        top_territory_old,
        prs_1,
        1990,
        1995,
        1
    )
    reg_set_terr_2 = RST.RegSetTerritory(
        bottom_territory_old,
        prs_2,
        1990,
        1995,
        2
    )
    reg_set_terr_3 = RST.RegSetTerritory(
        top_territory_new,
        prs_3,
        1995,
        2000,
        3
    )
    return reg_set_terr_1,reg_set_terr_2,reg_set_terr_3