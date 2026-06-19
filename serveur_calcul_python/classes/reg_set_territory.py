"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Regulation Set Territories are the icing on an abstraction mille feuilles. They associate
parking regulation sets(what rules are associated to what land use) and associate them
to a territory which itself is part of an era where geopolitical limits were stable. This 
could be used to represent zones of a zoning code although this has not yet been attempted
"""

import numpy as np
import geopandas as gpd
import pandas as pd
from typing import Optional, Union,Tuple
from datetime import datetime
from sqlalchemy import create_engine,text,Engine
from config import config_db
from classes import parking_reg_sets as PRS
from classes import tax_dataset as TD
import matplotlib.pyplot as plt
from copy import deepcopy
from folium import Map
import logging

class RegSetTerritory():
    """
        # reg_set_territory 
         This is an object that represents the combination of a territory and a ruleset
         ## Attributes:
            Assoc_id: Identifier of the association which matches the regulationSet to the territory
            Territory: GeoDataFrame of length 1 representing the territory of a municipality, the end and start date of it's existence
            ruleset: a ParkingRegulationSet as defined in the classes document See that file for more details
            start_year: a year where the association starts based on the validity period of the territory or the reg_set
            end_year: a year where the association ends based on the validity of the territory or the reg_set
         ## Methods:

    """
    def __init__(self, territory: gpd.GeoSeries, parking_regulation_set:PRS.ParkingRegulationSet,period_start_year:int,period_end_year:int,assoc_id:int):
        self.assoc_id = assoc_id
        self.territory_info = territory
        self.parking_regulation_set = parking_regulation_set
        self.start_year = period_start_year
        self.end_year = period_end_year
    
    def __repr__(self):
        if self.end_year is None:
            return_string = f"RST ID: {self.assoc_id:03} - Territory: {self.territory_info[config_db.db_column_territory_name].values[0]} - {self.start_year:.0f}-Présent - Ruleset: {self.parking_regulation_set.description}"
        elif self.end_year is None:
            return_string = f"RST ID: {self.assoc_id:03} - Territory: {self.territory_info[config_db.db_column_territory_name].values[0]} - Big Bang -{self.end_year:.0f} - Ruleset: {self.parking_regulation_set.description}"
        else:
            return_string = f"RST ID: {self.assoc_id:03} - Territory: {self.territory_info[config_db.db_column_territory_name].values[0]} - {self.start_year:.0f}-{self.end_year:.0f} - Ruleset: {self.parking_regulation_set.description}"
        return return_string

def get_postgis_rst_by_terr_id(territory_id:Union[int,list[int]])->list[RegSetTerritory]:
    """# get_postgis_rst_by_terr_id
    Function return a list of RegSetTerritory objects which represent the combination of a municipal territory, a time span and a regulation set that applies to the properties in the zone built in the time period. 
    ## Inputs
        - territory_id:int or list of ints that indicate the territory ids to query for data
    ## Outputs:
        - list of RegSetTerritory: RegSetTerritory(combination of a territory, validity dates based on either ruleset or validity of territory) which identifies geographic boundaries, and relevant parking rules for a given time span.
    """
    # build queries for association table and territory table where the input territories are included
    if isinstance(territory_id,int):
        query_assoc = f'SELECT * FROM public.{config_db.db_table_match_regsets_territory} WHERE {config_db.db_column_territory_id} = {territory_id}'
        query_terr = f'SELECT * FROM public.{config_db.db_table_territory} WHERE {config_db.db_column_territory_id} = {territory_id}'
    else:
        query_assoc = f"SELECT * FROM public.{config_db.db_table_match_regsets_territory} WHERE {config_db.db_column_territory_id} in ({",".join(map(str,territory_id))})"
        query_terr = f"SELECT * FROM public.{config_db.db_table_territory} WHERE {config_db.db_column_territory_id} in ({",".join(map(str,territory_id))})"
    # build query for 
    query_hist = f"SELECT * FROM public.{config_db.db_table_history}"
    eng = create_engine(config_db.pg_string)
    territories = gpd.read_postgis(query_terr,con=eng,geom_col=config_db.db_geom_territory)
    
    with eng.connect() as con:
        history:pd.DataFrame = pd.read_sql(query_hist,con=con)
        associations = pd.read_sql(query_assoc,con=con)

        RST_list_to_return =[]
        for _,association in associations.iterrows():
            # get the regset id to pull
            reg_set_to_get = association[config_db.db_column_reg_sets_id]
            # get the relevant territory id
            relevant_territory_id = association[config_db.db_column_territory_id]
            # get actual territory in full
            relevant_territory = territories.loc[territories[config_db.db_column_territory_id]==relevant_territory_id]
            # pull territory start and end year
            start_year_terr = history.loc[history[config_db.db_column_history_id] == relevant_territory[config_db.db_column_history_id].values[0],config_db.db_column_history_start_year].values[0]
            end_year_terr = history.loc[history[config_db.db_column_history_id] == relevant_territory[config_db.db_column_history_id].values[0],config_db.db_column_history_end_year].values[0]
            # get the reg set and years
            reg_set:PRS.ParkingRegulationSet = PRS.from_sql(int(reg_set_to_get),con=con)[0]
            start_year_regset = reg_set.start_date
            end_year_regset = reg_set.end_date
            # put the dates into coherence
            if start_year_terr is None and start_year_regset is None:
                start_year_RST = None
            elif start_year_terr is None:
                start_year_RST = start_year_regset
            elif start_year_regset is None:
                start_year_RST = start_year_terr
            else:
                start_year_RST = max(start_year_terr,start_year_regset)
            
            if (end_year_terr is None or np.isnan(end_year_terr)) and (end_year_regset is None or np.isnan(end_year_regset)):
                end_year_RST = None
            elif (end_year_terr is None or np.isnan(end_year_terr)):
                end_year_RST = end_year_regset
            elif  (end_year_regset is None or np.isnan(end_year_regset)) :
                end_year_RST = end_year_terr
            else:
                end_year_RST = min(end_year_terr,end_year_regset)
            RST_to_append = RegSetTerritory(relevant_territory,reg_set,start_year_RST,end_year_RST,association[config_db.db_column_RST_id])
            RST_list_to_return.append(RST_to_append)
    return RST_list_to_return  

def get_rst_by_tax_data(tax_data:TD.TaxDataset,db_eng:Engine=None)->Tuple[list[RegSetTerritory],list[TD.TaxDataset]]:
    """
    # get_rst_by_tax_data
    Returns the RegSetTerritories which intersect with the tax data which is provided. This function queries 
    the database to obtain this data

    Inputs:
        - tax_data: a TaxDataset from which you want to obtain the relevant RegSetTerritories
        - db_eng: the sqlalchemy Engine to use for retriebing the data

    Outputs:
        A tuple containing two lists of equal length
            - first lsit contains the regulation set territories retrieved
            - second list contains the tax data set which was initally pvoded split based on which 
            RegSetTerritory should apply to it
    """
    if db_eng is None:
        db_eng = create_engine(config_db.pg_string)
    # trouver les id provinciaux uniques à aller chercher
    unique_tax_ids = tax_data.tax_table[config_db.db_column_tax_id].unique().tolist()
    # trouve les secteurs municipaux historiques qui interceptent l'ensemble de données
    command_tax = f"WITH unioned_geometry AS (SELECT ST_Union(geometry) AS geom  FROM {config_db.db_table_tax_data_points} WHERE ({config_db.db_column_tax_id}  IN ('{"','".join(map(str,unique_tax_ids))}'))) SELECT territories.* FROM public.{config_db.db_table_territory} AS territories, unioned_geometry WHERE (ST_Intersects(territories.{config_db.db_geom_territory},unioned_geometry.geom))"
    relevant_territories = gpd.read_postgis(command_tax,con=db_eng,geom_col=config_db.db_geom_territory)
    # list des identifiants de territoire pertinents
    relevant_territory_ids = relevant_territories[config_db.db_column_territory_id].unique().tolist()
    # va chercher les associations territoire règlements pour l'ensemble de ces territoires
    relevant_rsts = get_postgis_rst_by_terr_id(relevant_territory_ids)
    # pour chaque RST, va chercher les points correspondants
    tax_dataset_match = split_td_by_rst(tax_data,relevant_rsts)
    return relevant_rsts,tax_dataset_match

def split_td_by_rst(td: TD.TaxDataset,rst:list[RegSetTerritory])->list[TD.TaxDataset]:
    """
    # split_td_by_rst
    Function that taxes the input TaxDataset and splits it to match the RegSetTerritory in the output
    list
    
    Inputs
        - td: the original complete tax dataset
        - rst: a list of the RegSetTerritories which intersect with the tax dataset

    Outputs
        - a lsit of TaxData which should be assigned to the input RegSetTerritory
    """
    tax_dataset_match = []
    for rst_to_filter_by in rst:
        filtered_tax_dataset = td.year_filter(rst_to_filter_by.start_year,rst_to_filter_by.end_year).territory_filter(rst_to_filter_by.territory_info)
        tax_dataset_match.append(filtered_tax_dataset)
    return tax_dataset_match

def explore_RST_TD(reg_sets:Union[RegSetTerritory,list[RegSetTerritory]],tax_data:Union[TD.TaxDataset,list[TD.TaxDataset]])->Union[Map,list[Map]]:
    """# explore_RST
        permet d'aller regarder les données  
        
        Inputs:
            - reg_sets: a list of regulation sets or a regset
            - tax_data: a list of tax data or a tax data object corresponding to the corresponding
            reg_set in reg_sets
        Outputs
            - A folium map item if the inputs are single items or a list of Folium maps otherwise
    """
    if isinstance(reg_sets,list) and isinstance(tax_data,list):
        if not (len(reg_sets)==len(tax_data)):
            raise KeyError('reg_sets and tax_data must have same length')
        reg_tax_foliums = []
        for reg,tax in zip(reg_sets,tax_data):
            m1 = reg.territory_info.explore(color="orange")
            m1 = tax.explore(m=m1)
            reg_tax_foliums.append(m1)
        return reg_tax_foliums
    elif isinstance(reg_sets,RegSetTerritory) and isinstance(tax_data,TD.TaxDataset):
        m1 = reg_sets.territory_info.explore(color="orange")
        m1 = tax.explore(m=m1)
        return m1
    else:
        raise TypeError('reg_set and tax_data must be both list or both individual')
    

