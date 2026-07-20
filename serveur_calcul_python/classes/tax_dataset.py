"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Tax datasets are a collage of cadastral data and tax roll data which associate the two
so that you have a spatial representation that makes more sense for visualisation and 
aggregation (lots) but have fine grained building data form assessment rolls. This uses
a lot table, a tax table and an association table
"""

import pandas as pd
import geopandas as gpd
import numpy as np
from shapely import wkt
import matplotlib.pyplot as plt
from sqlalchemy import create_engine,text
import sqlalchemy
from config import config_db
from typing import Optional, Union, Self, Tuple
from folium import Map

aggregate_def_dict:dict = {'rl0308a':'sum','rl0311a':'sum','rl0312a':'sum','rl0313a':'sum','rl0307a':'max'}

class TaxDataset():
    """# TaxDataset: \n
    contient le rôle foncier, le cadastre et la table associant les deux avec une table. Des propriétés agrégées sont aussi fournies
    ## Attributs:
        - tax_table: role foncier
        - lot_table: cadastrer
        - lot_association: table d'association cadastre rôle
        - aggregate_data: données du rôle agrégées par lot
    """
    def __init__(self,data_table:gpd.GeoDataFrame,lot_association:pd.DataFrame,lot_data:gpd.GeoDataFrame):
        self.tax_table = data_table
        self.lot_association = lot_association
        self.lot_table = lot_data
        self.aggregate_data = pd.DataFrame()
        constr_year_int = self.tax_table[config_db.db_column_tax_constr_year].fillna(0).astype('int32')
        self.tax_table[config_db.db_column_tax_constr_year] = constr_year_int
        land_use_int = self.tax_table[config_db.db_column_tax_land_use].astype('int32')
        self.tax_table[config_db.db_column_tax_land_use] = land_use_int
        self.aggregate_data_create(aggregate_def_dict)
    
    def aggregate_data_create(self, aggregate_dict:dict)->None:
        """# aggregate_data_create
            Utilisé pour créé des données agrégées par lot pour chaque 
            ## Inputs
                - aggregate_dict: dictionnaire sous format colonne:fonction qui donne les colonnes à agréger et selon quelle fonction
            ## Sortie
                - Mise à jour de la table aggregate_data
        """
        tax_table_ammended = self.tax_table.merge(self.lot_association,on=config_db.db_column_tax_id,how='left')
        columns = list(aggregate_dict)
        columns.append(config_db.db_column_lot_id)
        columns.reverse()
        aggregate_table_base = tax_table_ammended[columns]
        aggregate_table_final = aggregate_table_base.groupby(by=config_db.db_column_lot_id).aggregate(aggregate_dict)
        self.aggregate_data = aggregate_table_final

    def plot(self,ax:plt.axis=None,arguments=None):
        """ # plot\n 
        Permet de créer un graphe très simple de du cadastre et du rôle foncier pour pouvoir faire de la visualisation
        ## Inputs
            - Aucun
        ## Outputs
            - ax L un ax matplotlib"""
        if ax:
            ax = self.lot_table.plot(ax=ax)
            self.tax_table.plot(ax=ax,color="r")
        else:
            ax=self.lot_table.plot()
            self.tax_table.plot(ax=ax,color="r")
        return ax
    
    def explore(self,m:Map=None,arguments=None):
        """# explore\n
            utilise leaflet pour envoyer les données vers un fichier html
            ## Inputs
                - file: nom du fichier
        """
        if m is None:
            m1 = self.lot_table.explore()
        else:
            m1 = self.lot_table.explore(m=m)
        tax_table = self.tax_table
        tax_table.explore(m=m1,color='red')
        return m1

    def year_filter(self,start_year=None,end_year=None):
        """# year_filter
        Returns a tax dataset within a year set
        ## Inputs
            - start_year: start year of filter
            - end_year : end year of filter
        ## Outputs
            - TaxDataSet"""
        if start_year is None and end_year is None:
            new_tax_table=self.tax_table.copy()
        elif start_year is None:
            new_tax_table:gpd.GeoDataFrame = self.tax_table.loc[((self.tax_table[config_db.db_column_tax_constr_year]<= end_year))]
        elif end_year is None:
            new_tax_table:gpd.GeoDataFrame = self.tax_table.loc[((self.tax_table[config_db.db_column_tax_constr_year]>= start_year))]
        else:
            new_tax_table:gpd.GeoDataFrame = self.tax_table.loc[((self.tax_table[config_db.db_column_tax_constr_year]>= start_year) & (self.tax_table[config_db.db_column_tax_constr_year]<= end_year))].copy()
        tax_ids = new_tax_table[config_db.db_column_tax_id].unique().tolist()
        new_association_table:pd.DataFrame = self.lot_association.loc[self.lot_association[config_db.db_column_tax_id].isin(tax_ids)].copy()
        lot_ids = new_association_table[config_db.db_column_lot_id].unique().tolist()
        new_lot_table:gpd.GeoDataFrame = self.lot_table.loc[self.lot_table[config_db.db_column_lot_id].isin(lot_ids)].copy()
        new_tax_data = TaxDataset(new_tax_table,new_association_table,new_lot_table)
        return new_tax_data

    def territory_filter(self,territory:gpd.GeoDataFrame):
        new_tax_table = self.tax_table.clip(territory).copy()
        tax_ids = new_tax_table[config_db.db_column_tax_id].unique().tolist()
        new_association_table = self.lot_association.loc[self.lot_association[config_db.db_column_tax_id].isin(tax_ids)].copy()
        lot_ids = new_association_table[config_db.db_column_lot_id].unique().tolist()
        new_lot_table = self.lot_table.loc[self.lot_table[config_db.db_column_lot_id].isin(lot_ids)].copy()
        tax_data_to_out = TaxDataset(new_tax_table,new_association_table,new_lot_table)
        return tax_data_to_out

    def __repr__(self):
        """# __repr__ \n
         donne la représentation de l'ensemble de données. Il faudra faire un ménage parce que la jointure va prendre trop longtemps. Ce n'est pas particulièrement brillant en ce moment"""
        repr = f'Tax Dataset: N accounts = {self.tax_table[config_db.db_column_tax_id].count()} - N lots = {self.lot_table[config_db.db_column_lot_id].count()}'
        return repr
    
    def filter_by_id(self:Self,list:list[str])->list[int]:
        relevant_lots = self.lot_table.loc[self.lot_table[config_db.db_column_lot_id].isin(list)].copy()
        relevant_association = self.lot_association.loc[self.lot_association[config_db.db_column_lot_id].isin(list)].copy()
        relevant_provincial_tax_list = relevant_association[config_db.db_column_tax_id].unique().tolist()
        relevant_tax = self.tax_table.loc[self.tax_table[config_db.db_column_tax_id].isin(relevant_provincial_tax_list)].copy()
        new_tax_dataset = TaxDataset(relevant_tax,relevant_association,relevant_lots)
        return new_tax_dataset
    
def tax_database_points_from_date_territory(id_territory:Union[int,list[int]],start_year:int,end_year:int)->TaxDataset:
    """# tax_database_points_from_polygon \n
        Permet de tirer les données du rôle, du cadastre et l\'association qui permet de sortir un objet TaxDataset
        ## Inputs:+
            - id_polygon: identifiant du/des secteur(s) municipal/aux pour lequel on veut aller chercher les données
            - start_year: borne inferieure de construction du bâtiment
            - end_year: borne supérieure de construction du bâtiment
        ## Output
            - TaxDataset: returns a tax_dataset"""
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        # pull tax data
        if isinstance(id_territory,int):
            command_points = f"SELECT * FROM {config_db.db_table_tax_data_points} as p WHERE ST_Within(p.geometry::geometry, (SELECT geometry FROM public.{config_db.db_table_territory} WHERE {config_db.db_column_territory_id} = {id_territory})::geometry) AND CAST({config_db.db_column_tax_constr_year} AS int) >= {start_year} AND CAST({config_db.db_column_tax_constr_year} AS int) <= {end_year};"
        elif isinstance(id_territory,list):
            command_points = f"SELECT * FROM {config_db.db_table_tax_data_points} as p WHERE ST_Within(p.geometry::geometry, (SELECT ST_Union(geometry) FROM public.{config_db.db_table_territory} WHERE {config_db.db_column_territory_id} IN ({",".join(map(str,id_territory))}))::geometry) AND CAST({config_db.db_column_tax_constr_year} AS int) >= {start_year} AND CAST({config_db.db_column_tax_constr_year} AS int) <= {end_year};"
        data = gpd.read_postgis(command_points,con=con,geom_col="geometry")
        # find the unique tax accounts and find the associated lot ids
        id_role = data[config_db.db_column_tax_id].unique().tolist()
        command_rel_assoc = f"SELECT * FROM public.{config_db.db_table_match_tax_lots} WHERE {config_db.db_column_tax_id} IN ('{"','".join(map(str,id_role))}');"
        association_table = pd.read_sql(command_rel_assoc,con=con)
        # find unique lot numbers and pull the relevant lots
        id_cadastre = association_table[config_db.db_column_lot_id].unique().tolist()
        command_lots = f"SELECT * FROM public.{config_db.db_table_lots} WHERE {config_db.db_column_lot_id} in ('{"','".join(map(str,id_cadastre))}');"
        lot_table = gpd.read_postgis(command_lots,con=con,geom_col="geometry")
    # create the tax dataset
    data_to_out = TaxDataset(data_table=data,lot_association=association_table,lot_data=lot_table)
    return data_to_out
    
def tax_database_for_analysis_territory(id_analysis_territory:int)->TaxDataset:
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        # commande pour aller chercher les points de rôle foncier à l'intérieur du territoire d'analuse
        command = f'SELECT points.* FROM {config_db.db_table_tax_data_points} AS points, {config_db.db_table_analysis_territory} AS polygons WHERE ST_Within(points.{config_db.db_geom_tax}, (SELECT polygons.{config_db.db_geom_analysis} WHERE polygons."{config_db.db_column_analysis_territory_id}" = {id_analysis_territory}))'
        tax_base_data = gpd.read_postgis(command,con=engine,geom_col=config_db.db_geom_tax)
        # list les identifiants provinciaux
        unique_tax_ids = tax_base_data[config_db.db_column_tax_id].unique().tolist()
        # va chercher la table d'association pour tous les points trouvés ci-haut
        command_association = f"SELECT * FROM {config_db.db_table_match_tax_lots} WHERE {config_db.db_column_tax_id} IN ('{"','".join(map(str,unique_tax_ids))}')"
        association_database = pd.read_sql(command_association,con=con)
        # liste les lots qu'on vient d'aller chercher
        unique_lot_ids = association_database[config_db.db_column_lot_id].unique().tolist()
        # va chercher les lots qu'on vient de lister
        command_lots = f"SELECT * FROM {config_db.db_table_lots} WHERE {config_db.db_column_lot_id} IN ('{"','".join(map(str,unique_lot_ids))}')"
        lot_database = gpd.read_postgis(command_lots,con=engine,geom_col=config_db.db_geom_lots)
        # Crée un tax_dataset à retourner
        tax_data_set_to_return = TaxDataset(tax_base_data,association_database,lot_database)
    return tax_data_set_to_return

def tax_database_from_lot_id(lot_id:Union[str,list[str]],engine:sqlalchemy.Engine = None):
    """
        # tax_database_from_lot_id
        Retrieves tax_data from lot 
    """
    if engine is None:
        engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        # va chercher le lot à analyser
        if isinstance(lot_id, str):
            lot_query = f"SELECT * FROM {config_db.db_table_lots} WHERE {config_db.db_column_lot_id} = '{lot_id}'"
        if isinstance(lot_id, list):
            lot_query = f"SELECT * FROM {config_db.db_table_lots} WHERE {config_db.db_column_lot_id} IN ('{"','".join(lot_id)}')"
        lot_database = gpd.read_postgis(lot_query,con=engine,geom_col=config_db.db_geom_lots)
        # va chercher la table d'association pour tous les points trouvés ci-haut
        if isinstance(lot_id, str):
            command_association = f"SELECT * FROM {config_db.db_table_match_tax_lots} WHERE {config_db.db_column_lot_id} = '{lot_id}'"
        if isinstance(lot_id, list):
            command_association = f"SELECT * FROM {config_db.db_table_match_tax_lots} WHERE {config_db.db_column_lot_id} IN ('{"','".join(lot_id)}')"
        association_database:pd.DataFrame = pd.read_sql(command_association,con=con)
        unique_tax_ids = association_database[config_db.db_column_tax_id].unique().tolist()
        
        # va chercher les lots qu'on vient de lister
        command_lots = f"SELECT * FROM {config_db.db_table_tax_data_points} WHERE {config_db.db_column_tax_id} IN ('{"','".join(map(str,unique_tax_ids))}')"
        tax_base_data = gpd.read_postgis(command_lots,con=engine,geom_col=config_db.db_geom_lots)
        # Crée un tax_dataset à retourner
        tax_data_set_to_return = TaxDataset(tax_base_data,association_database,lot_database)
    return tax_data_set_to_return


def get_all_lots_with_valid_data(engine:sqlalchemy.Engine=None) -> Tuple[TaxDataset, pd.DataFrame]:
    """
        # get_all_lots_with_valid_data
        Retrieves all tax_data in the city which have supposedly valid input. Assuming that's number of dwellings in housing and GFA otherwise

        input:
            - Engine: sqlalchemy engine à utiliser pour la connection à la BD

        Output 
            - TaxDataset: ensemble de données foncier 
    """
    if engine is None:
        engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        query=  f"""WITH tax_data AS (
                        SELECT
                            acr.{config_db.db_column_tax_id},
                            acr.{config_db.db_column_lot_id},
                            rf.{config_db.db_column_tax_land_use}::int AS cubf,
                            rf.{config_db.db_column_tax_gross_floor_area} AS gfa,
                            rf.{config_db.db_column_tax_number_dwellings} AS n_dwellings,
                            (rf.{config_db.db_column_tax_land_use}::int < 2000 AND rf.{config_db.db_column_tax_number_dwellings} IS NOT NULL) 
                                OR (rf.{config_db.db_column_tax_land_use}::int >= 2000 AND rf.{config_db.db_column_tax_gross_floor_area}  IS NOT NULL) AS condition
                        FROM association_cadastre_role acr
                        LEFT JOIN role_foncier rf ON rf.{config_db.db_column_tax_id} = acr.{config_db.db_column_tax_id}
                        LEFT JOIN cadastre cad ON cad.{config_db.db_column_lot_id} = acr.{config_db.db_column_lot_id}
                    )
                    SELECT 
                        td.{config_db.db_column_lot_id},
                        bool_and(td.condition) AS lot_condition,
                        array_agg(DISTINCT td.cubf ORDER BY td.cubf) AS cubf_list,
                        cardinality(array_agg(DISTINCT td.cubf ORDER BY td.cubf)) AS n_cubf,
                        -- Single cubf if there's only one
                        CASE 
                            WHEN cardinality(array_agg(DISTINCT td.cubf ORDER BY td.cubf)) = 1
                            THEN (array_agg(DISTINCT td.cubf ORDER BY td.cubf))[1]
                        END AS single_cubf,
                        -- Hierarchy extraction if only one cubf
                        CASE 
                            WHEN cardinality(array_agg(DISTINCT td.cubf ORDER BY td.cubf)) = 1
                            THEN left((array_agg(DISTINCT td.cubf ORDER BY td.cubf))[1]::text, 1)::int
                        END AS cubf_lvl1,
                        CASE 
                            WHEN cardinality(array_agg(DISTINCT td.cubf ORDER BY td.cubf)) = 1
                            THEN left((array_agg(DISTINCT td.cubf ORDER BY td.cubf))[1]::text, 2)::int
                        END AS cubf_lvl2,
                        CASE 
                            WHEN cardinality(array_agg(DISTINCT td.cubf ORDER BY td.cubf)) = 1
                            THEN left((array_agg(DISTINCT td.cubf ORDER BY td.cubf))[1]::text, 3)::int
                        END AS cubf_lvl3
                    FROM tax_data td
                    GROUP BY td.{config_db.db_column_lot_id}
                    HAVING bool_and(td.condition) = true;
                """
        valid_lots = pd.read_sql(query,con=con)
        valid_tax_lots = valid_lots[config_db.db_column_lot_id].unique().tolist()
        tax_dataset_to_out = tax_database_from_lot_id(valid_tax_lots)
    return [tax_dataset_to_out,valid_lots]
    

if __name__=="__main__":
    #datatax=np.array([["23027258894478510000000",125,0,"POINT(0.5 0.5)"],["23027258968770010000000",181,1,"POINT(1.5 1.5)"]])
    #tax_table = gpd.GeoDataFrame(data=datatax,columns=["id_provinc","rl_0308a","rl0311a","geometry"])
    #tax_table["geometry"] = tax_table["geometry"].apply(wkt.loads)
    #tax_table = tax_table.set_geometry("geometry")
    #tax_table =tax_table.set_crs(4326)
    #datalot = np.array([["1 000 000","dude 1","POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))"],
    #                    ["1 000 001","dude 2","POLYGON((1 1, 1 2, 2 2, 2 1, 1 1))"]])
    #lot_table = gpd.GeoDataFrame(data=datalot, columns = ["g_no_lot","dude","geometry"])
    #lot_table["geometry"] = lot_table["geometry"].apply(wkt.loads)
    #lot_table = lot_table.set_geometry("geometry")
    #lot_table = lot_table.set_crs(4326)
    #assocation_table = pd.DataFrame(data=np.array([["23027258894478510000000","1 000 000"],
     #                                ["23027258968770010000000","1 000 001"]]),columns=["id_provinc","g_no_lot"])
    #tax_dataset = TaxDataset(tax_table,assocation_table,lot_table)
    #tax_dataset.plot()
    #plt.show()
    #print(tax_dataset)
    #tax_data = from_postgis()
    #print(tax_data)
    #tax_data.plot()
    #plt.show()
    tax_dataset = tax_database_points_from_date_territory([64,65],1995,1996)
    tax_dataset.plot()
    plt.show()