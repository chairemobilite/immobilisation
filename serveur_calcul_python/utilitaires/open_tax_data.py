import pandas as pd
import logging
import matplotlib.pyplot as plt
import numpy as np
from osgeo import gdal,ogr
import fiona as f
import geopandas as gpd
import pandas as pd
import os

logger = logging.getLogger(__name__)

formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(funcName)20s() : %(message)s')
console_handler = logging.StreamHandler()
# Create a file handler to write logs to a file
#file_handler = logging.FileHandler('myapp.log')
#file_handler.setLevel(logging.DEBUG)
#file_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)  # You can set the desired log level for console output
console_handler.setFormatter(formatter)
## Add the handlers to the logger
#logger.addHandler(file_handler)
logger.addHandler(console_handler)
logger.propagate = False



def ouverture_role_xml(path_xml,usage_code_column_name_xml,dictionnaire_renommer,**kwargs):
    """ouverture_role_xml ouvre le xml du role foncier, renomme les colonnes pour rendre le code plus lisible et joint les utilisations du territoire à la base de donnée
            Input:
                - path_xml: chemin du xml du role foncier pour la ville à analyser
                - usage_code_column_name_xml: colonne indicant l'usage prédominant(utiliser la version renommée)
                - dictionnaire_renommage: dictionnaire pour renommer les colonnes
            Kwargs
                - usage_spec_path: chemin pour le fichier excel qui contient les utilisations prédominantes codifiées
                - usage_spec_code_column_name: nom de la colonne à utiliser
                - approx_usage_code_divisor: utiliser ceci pour réduire le degré de nuance des utilisations du territoire
            output:
                - tax_database_XML: jeux de données xml sous forme de dataframe
    """
    usage_spec_path = kwargs.get("usage_spec_loc",None)
    usage_spec_code_column_name = kwargs.get("usage_spec_code_column_name",None)
    approx_usage_code_divisor = kwargs.get("code_simplification_divisor",None)
    tax_database_XML_data = pd.read_xml(path_xml)
    # enlever la tête de fichier ne contenant pas d'information pertinente
    tax_database_XML_data.drop(tax_database_XML_data.head(3).index, inplace=True)
    tax_database_XML_data.drop(columns=["VERSION","RLM01A","RLM02A","RL0504"], inplace=True)
    tax_database_XML_data = tax_database_XML_data.rename(columns = dictionnaire_renommer)
    return tax_database_XML_data

def conversion_FGDB_GeoJSON(fgdb_path,municipality_code,outFolder):
    #layer_names = f.listlayers(fgdb_path)
    #layer_names = ['rol_unite_p']
    #print(f"Layers in FGDB: {layer_names}")

    # Ouverture de la couche rol_unite_p
    logger.info("Starting conversion from FGDB to GeoJSON")
    with f.open(fgdb_path, layer='rol_unite_p') as flayer:
        filtered = filter(lambda f: f['properties']['code_mun'] == municipality_code, flayer)
        gdf1 = gpd.GeoDataFrame.from_features(filtered, crs=flayer.crs)
        print(gdf1.head())
    # Ouverture de la couche B05EX1_B05V_ADR_UNITE_EVALN
    with f.open(fgdb_path, layer='B05EX1_B05V_ADR_UNITE_EVALN') as flayer:
        filtered = filter(lambda f: f['properties']['code_mun'] == municipality_code, flayer)
        gdf2 = gpd.GeoDataFrame.from_features(filtered, crs=flayer.crs)
        print(gdf2.head()) 
    # Ouverture de la couche B05EX1_B05V_UNITE_EVALN
    with f.open(fgdb_path, layer='B05EX1_B05V_UNITE_EVALN') as flayer:
        filtered = filter(lambda f: f['properties']['code_mun'] == municipality_code, flayer)
        gdf3 = gpd.GeoDataFrame.from_features(filtered, crs=flayer.crs)
        print(gdf3.head())  
    gdf2.drop(columns=["geometry","code_mun","mat18","rl0102a"],inplace=True)
    gdf3.drop(columns=["geometry","anrole","code_mun","mat18","rl0102a"],inplace=True)
    gdf_inter = pd.merge(gdf1,gdf2,on="id_provinc",how="left")
    gdf_out = pd.merge(gdf_inter,gdf3,on="id_provinc",how="left")
    cwd_check = os.getcwd()
    titre = f'{outFolder}/role-foncier-concat-{municipality_code}.geojson'
    gdf_out.to_file(titre, driver='GeoJSON')  
    logger.info("completed conversion from FGDB to GeoJSON")

def ouverture_role_GeoJSON(geojson_path,municipality_code,dictionnaire_renommer,crs):
    logger.info("Ouverture du fichier interprété")
    dataframe_to_out = gpd.read_file(geojson_path).to_crs(epsg=crs)
    dataframe_to_out = dataframe_to_out.rename(columns=dictionnaire_renommer)
    dataframe_to_out.drop(dataframe_to_out[dataframe_to_out["code_mun"] != municipality_code].index, inplace=True)
    return dataframe_to_out


    