"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Datastore for the tax data sets which are used throughout the test batteries.
lots and tax entries are generated on a grid and assigned dates to split up 
between the various territoirs
"""

# External libraries
import pandas as pd
import geopandas as gpd
import numpy as np
# internal functions
from config import config_db as cf_db
from classes import parking_inventory as PI
from classes import parking_inventory_inputs as PCI
from classes import tax_dataset as TD
from shapely.geometry import Polygon,Point


def generate_tax_dataset(parking_regulation_set=None):
    """
        # generate_tax_dataset
        Returns a simplified tax dataset on an ortholinear grid
        each line in the grid represents one of the rules and the columns
        represent a level of the different variables. Each of the lots is 
        a simple rectangle. All the datasetsa are sent out on 4326 CRS
        Inputs:
        
            - parking_regulation_set: default:None can be either 1,2 or 3
        Outputs:

            - TaxDataset: set of 3 dataframes combined into a single object
                - lot table: contains the information about cadastral lots
                - tax table: contains assessment roll information. the spatial information
                is only a point for each entry in the roll not necessarily the lot to which 
                it is associated
                - association table: a table which associates roll entries to cadastral lots
    """
    lons = np.linspace(-71.5,-71.44,num=6)
    lats = np.linspace(46.5,46.44,num=6)
    s_tax_t,s_lot_t,s_ass_t,next_letter = generate_basic_rule_dataset(lats[0],lons,'a')
    t_tax_t,t_lot_t,t_ass_t,next_letter = generate_thresh_rule_dataset(lats[1],lons,next_letter)
    a_tax_t,a_lot_t,a_ass_t,next_letter = generate_addition_rule_dataset(lats[2],lons,next_letter)
    f_tax_t,f_lot_t,f_ass_t,next_letter = generate_floor_rule_dataset(lats[3],lons,next_letter)
    oc_tax_t,oc_lot_t,oc_ass_t,next_letter = generate_or_based_ceil_dataset(lats[4],lons,next_letter)
    tc_tax_t,tc_lot_t,tc_ass_t,next_letter = generate_thresh_based_ceil_dataset(lats[5],lons,next_letter)
    if (parking_regulation_set ==1):
        t_tax_t= pd.DataFrame()
        t_lot_t= pd.DataFrame()
        t_ass_t= pd.DataFrame()
        tc_tax_t= pd.DataFrame()
        tc_lot_t=pd.DataFrame()
        tc_ass_t=pd.DataFrame()
        tax_table = pd.concat([s_tax_t,a_tax_t,f_tax_t,oc_tax_t])
        lot_table = pd.concat([s_lot_t,a_lot_t,f_lot_t,oc_lot_t])
        ass_table = pd.concat([s_ass_t,a_ass_t,f_ass_t,oc_ass_t])
        tax_dataset = TD.TaxDataset(tax_table,ass_table,lot_table)
        return tax_dataset
    elif(parking_regulation_set ==2):
        oc_tax_t = pd.DataFrame()
        oc_lot_t = pd.DataFrame()
        oc_ass_t = pd.DataFrame()
        tax_table = pd.concat([tc_tax_t])
        lot_table = pd.concat([tc_lot_t])
        ass_table = pd.concat([tc_ass_t])
        tax_dataset = TD.TaxDataset(tax_table,ass_table,lot_table)
        return tax_dataset
    elif(parking_regulation_set ==3):
        tax_table = pd.concat([t_tax_t])
        lot_table = pd.concat([t_lot_t])
        ass_table = pd.concat([t_ass_t])
        tax_dataset = TD.TaxDataset(tax_table,ass_table,lot_table)
        return tax_dataset
    else:
        tax_table = pd.concat([s_tax_t,t_tax_t,a_tax_t,f_tax_t,oc_tax_t,tc_tax_t])
        lot_table = pd.concat([s_lot_t,t_lot_t,a_lot_t,f_lot_t,oc_lot_t,tc_lot_t])
        ass_table = pd.concat([s_ass_t,t_ass_t,a_ass_t,f_ass_t,oc_ass_t,tc_ass_t])
        tax_dataset = TD.TaxDataset(tax_table,ass_table,lot_table)
        return tax_dataset

    

def generate_basic_rule_dataset(lat,lons,letter):
    """
        # generate_basic_rule_data
        Returns relevant tax, lot and association tables for 2 lots using the simple 
        linear rule. There are two square footage values to test that the linear 
        relationship is respected. The date values are set up assignment to the first
        ParkingRegulationSet.
        Inputs:
            - lat: 4326 latitude where all the lots will be centered
            - lons: list of available longitudes which can be used for lots
            - letter : start letter to use for the lots. Used to ensure no overlap between test cases
        Outputs: 
            - Tuple of 3 dataframes and a letter: 
                - tax_table: DataFrame containing assessment roll entries
                - lot_table: DataFrame containing lot data including geometry and an id
                - association_table: correspondance between tax entries and lot entries
                - next_letter: next letter to use for the following set of tax entries
    """
    basic_inputs = pd.DataFrame(data=[
                ['1',100,1992,5000,None,None,None],
                ['2',1000,1992,5000,None,None,None]
        ],
        columns=[cf_db.db_column_tax_id,
            cf_db.db_column_tax_gross_floor_area,
            cf_db.db_column_tax_constr_year,
            cf_db.db_column_tax_land_use,
            cf_db.db_column_tax_number_dwellings,
            cf_db.db_column_tax_n_rooms_rentals,
            cf_db.db_column_tax_n_other_rooms]
    )
    tax_table,lot_table,association_table,next_letter = generate_geo_dataframes(lat,lons,basic_inputs,letter)
    
    return tax_table,lot_table,association_table,next_letter

def generate_thresh_rule_dataset(lat,lons,letter):
    """
        # generate_thresh_rule_dataset
        Returns relevant tax, lot and association tables for 5 lots using the threshold 
        rule. There are five square footage values to test that the threshold 
        relationship is respected. The date values are set up assignment to the second
        ParkingRegulationSet.
        Inputs:
            - lat: 4326 latitude where all the lots will be centered
            - lons: list of available longitudes which can be used for lots
            - letter : start letter to use for the lots. Used to ensure no overlap between test cases
        Outputs: 
            - Tuple of 3 dataframes and a letter: 
                - tax_table: DataFrame containing assessment roll entries
                - lot_table: DataFrame containing lot data including geometry and an id
                - association_table: correspondance between tax entries and lot entries
                - next_letter: next letter to use for the following set of tax entries
    """
    basic_inputs = pd.DataFrame(
        data=[
                ['3',0,1997,6000,None,None,None],
                ['4',50,1997,6000,None,None,None],
                ['5',100,1997,6000,None,None,None],
                ['6',150,1997,6000,None,None,None],
                ['7',200,1997,6000,None,None,None]
        ],
        columns=[cf_db.db_column_tax_id,
            cf_db.db_column_tax_gross_floor_area,
            cf_db.db_column_tax_constr_year,
            cf_db.db_column_tax_land_use,
            cf_db.db_column_tax_number_dwellings,
            cf_db.db_column_tax_n_rooms_rentals,
            cf_db.db_column_tax_n_other_rooms])
    tax_table,lot_table,association_table,next_letter = generate_geo_dataframes(lat,lons,basic_inputs,letter)
    
    return tax_table,lot_table,association_table,next_letter

def generate_addition_rule_dataset(lat,lons,letter):   
    """
        # def generate_addition_rule_dataset(lat,lons,letter):   
        Returns relevant tax, lot and association tables for 5 lots using the addition 
        rule. There are 4 entries on a grid to test that the relationsips are respected.
        The date values are set up assignment to the first ParkingRegulationSet.
        Inputs:
            - lat: 4326 latitude where all the lots will be centered
            - lons: list of available longitudes which can be used for lots
            - letter : start letter to use for the lots. Used to ensure no overlap between test cases
        Outputs: 
            - Tuple of 3 dataframes and a letter: 
                - tax_table: DataFrame containing assessment roll entries
                - lot_table: DataFrame containing lot data including geometry and an id
                - association_table: correspondance between tax entries and lot entries
                - next_letter: next letter to use for the following set of tax entries
    """
    basic_inputs = pd.DataFrame(
        data=[

                ['8',0,1992,4000,0,None,None],
                ['9',10000,1992,4000,0,None,None],
                ['10',0,1992,4000,4000,None,None],
                ['11',10000,1992,4000,4000,None,None],
            ]
        ,
        columns=[cf_db.db_column_tax_id,
            cf_db.db_column_tax_gross_floor_area,
            cf_db.db_column_tax_constr_year,
            cf_db.db_column_tax_land_use,
            cf_db.db_column_tax_number_dwellings,
            cf_db.db_column_tax_n_rooms_rentals,
            cf_db.db_column_tax_n_other_rooms]
    )
    tax_table,lot_table,association_table,next_letter = generate_geo_dataframes(lat,lons,basic_inputs,letter)
    
    return tax_table,lot_table,association_table,next_letter

def generate_floor_rule_dataset(lat,lons,letter):
    """
        # generate_floor_rule_dataset
        Returns relevant tax, lot and association tables for 5 lots using the threshold 
        rule. There are four square footage values to test that the floor  
        relationship is respected. The date values are set up for assignment to the first
        ParkingRegulationSet.
        Inputs:
            - lat: 4326 latitude where all the lots will be centered
            - lons: list of available longitudes which can be used for lots
            - letter : start letter to use for the lots. Used to ensure no overlap between test cases
        Outputs: 
            - Tuple of 3 dataframes and a letter: 
                - tax_table: DataFrame containing assessment roll entries
                - lot_table: DataFrame containing lot data including geometry and an id
                - association_table: correspondance between tax entries and lot entries
                - next_letter: next letter to use for the following set of tax entries
    """
    basic_inputs = pd.DataFrame(
        data=[
            ['12',100,1992,1000,None,None,None],
            ['13',200,1992,1000,None,None,None],
            ['14',500,1992,1000,None,None,None],
            ['15',1000,1992,1000,None,None,None],
        ],
        columns=[cf_db.db_column_tax_id,
            cf_db.db_column_tax_gross_floor_area,
            cf_db.db_column_tax_constr_year,
            cf_db.db_column_tax_land_use,
            cf_db.db_column_tax_number_dwellings,
            cf_db.db_column_tax_n_rooms_rentals,
            cf_db.db_column_tax_n_other_rooms]
    )
    tax_table,lot_table,association_table,next_letter = generate_geo_dataframes(lat,lons,basic_inputs,letter)
    
    return tax_table,lot_table,association_table, next_letter

def generate_or_based_ceil_dataset(lat,lons,letter):
    """
        # generate_or_based_ceil_dataset
        Returns relevant tax, lot and association tables for 5 lots using the threshold 
        rule. There are five square footage values to test that the floor  
        relationship is respected. The date values are set up for assignment to the first
        ParkingRegulationSet.
        Inputs:
            - lat: 4326 latitude where all the lots will be centered
            - lons: list of available longitudes which can be used for lots
            - letter : start letter to use for the lots. Used to ensure no overlap between test cases
        Outputs: 
            - Tuple of 3 dataframes and a letter: 
                - tax_table: DataFrame containing assessment roll entries
                - lot_table: DataFrame containing lot data including geometry and an id
                - association_table: correspondance between tax entries and lot entries
                - next_letter: next letter to use for the following set of tax entries
    """
    basic_input = pd.DataFrame(
        data=[
                ['16',100,1992,2000,None,None,None],
                ['17',200,1992,2000,None,None,None],
                ['18',500,1992,2000,None,None,None],
                ['19',675,1992,2000,None,None,None],
                ['20',1000,1992,2000,None,None,None],
            ],
        columns=[cf_db.db_column_tax_id,
            cf_db.db_column_tax_gross_floor_area,
            cf_db.db_column_tax_constr_year,
            cf_db.db_column_tax_land_use,
            cf_db.db_column_tax_number_dwellings,
            cf_db.db_column_tax_n_rooms_rentals,
            cf_db.db_column_tax_n_other_rooms],
    )
    tax_table,lot_table,association_table,next_letter = generate_geo_dataframes(lat,lons,basic_input,letter)
    
    return tax_table,lot_table,association_table, next_letter

def generate_thresh_based_ceil_dataset(lat,lons,letter):
    """
        # generate_or_based_ceil_dataset
        Returns relevant tax, lot and association tables for 5 lots using the threshold 
        rule. There are five square footage values to test that the floor  
        relationship is respected. The geography values are set up for assignment to the third
        ParkingRegulationSet.
        Inputs:
            - lat: 4326 latitude where all the lots will be centered
            - lons: list of available longitudes which can be used for lots
            - letter : start letter to use for the lots. Used to ensure no overlap between test cases
        Outputs: 
            - Tuple of 3 dataframes and a letter: 
                - tax_table: DataFrame containing assessment roll entries
                - lot_table: DataFrame containing lot data including geometry and an id
                - association_table: correspondance between tax entries and lot entries
                - next_letter: next letter to use for the following set of tax entries
    """
    basic_inputs = pd.DataFrame(
        data =[                
                ['21',100,1992,2000,None,None,None],
                ['22',200,1992,2000,None,None,None],
                ['23',500,1992,2000,None,None,None],
                ['24',675,1992,2000,None,None,None],
                ['25',1000,1992,2000,None,None,None]
            ]
        ,
        columns=[cf_db.db_column_tax_id,
            cf_db.db_column_tax_gross_floor_area,
            cf_db.db_column_tax_constr_year,
            cf_db.db_column_tax_land_use,
            cf_db.db_column_tax_number_dwellings,
            cf_db.db_column_tax_n_rooms_rentals,
            cf_db.db_column_tax_n_other_rooms],
    )

    tax_table,lot_table,association_table,next_letter = generate_geo_dataframes(lat,lons,basic_inputs,letter)
    
    return tax_table,lot_table,association_table, next_letter

def generate_geo_dataframes(lat,lons,basic_data,start_lot):
    """
        # generate_geo_dataframes
        Helper function for the creation of the tax data points and cadastral data 
        rectangles to represent the tax dataset. the functions merges the basic data
        with the geoemetryy and creates the geometry. 
        Inputs:
            - lat: latitude of the row of lot and tax data to create
            - lons: list of available longitudes at which I can center the lot
            - basic_data: the tax data which is generated in the parent helper function
            - start_lot: letter to be used as index for the first lot
        Outputs
            - Tuple of 3 dataframes and letter
                - tax_table : geodataframe containing the relevant tax data and a lotcenter point
                - lot_table : geodataframe containing the relevant lot data which contain the tax data
                - association_table: dataframe which matches the lot table and tax table 
                - next_letter: string containing the next letter to use for the generation of lots

    """
    points = []
    polygon_set = []
    g_no_lot = []
    g_no_lot_start = start_lot
    i = ord(g_no_lot_start)
    for index, lon in enumerate(lons[0:len(basic_data)]):
        lon_point_list = [lon-.005,lon+.005,lon+.005,lon-.005,lon-.005]
        lat_point_list = [lat-.005,lat-.005,lat+.005,lat+.005,lat-.005]
        polygon_geom = Polygon(zip(lon_point_list, lat_point_list))
        polygon_set.append(polygon_geom)
        points.append(Point(lon, lat))
        g_no_lot.append(chr(i))
        i=i+1
    tax_table = gpd.GeoDataFrame(data = basic_data,geometry=points,
        crs='EPSG:4326')
    lot_table = gpd.GeoDataFrame(
        data={
            cf_db.db_column_lot_id:g_no_lot,
            'g_va_suprf':np.ones(len(g_no_lot)),
            'g_nb_coord': [point.x for point in points] ,
            'g_nb_coo_1':[point.y for point in points]
        },
        geometry=polygon_set,
        crs='EPSG:4326'
    )
    association_table = pd.DataFrame(
        data={
            cf_db.db_column_lot_id:g_no_lot,
            cf_db.db_column_tax_id:tax_table[cf_db.db_column_tax_id]
        }
    )
    next_letter = chr(i)
    return tax_table,lot_table,association_table,next_letter