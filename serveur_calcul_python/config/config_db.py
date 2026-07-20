#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Jul 22 2024

@author: paul charbonneau
"""

import os


# ce fichier contient l'ensemble des variables de connexion a la base de donnees pg
# la version de la base de donnees est 

#variables a modifier:
pg_host = os.environ.get('DB_HOST', 'host.docker.internal') #defaut localhost host.docker.internal
pg_port = os.environ.get('DB_PORT', '5432') #defaut 5432
pg_dbname = os.environ.get('DB_NAME', 'parking_regs_test')# specifique a l'application
pg_username = os.environ.get('DB_USER', 'postgres') # defaut postgres
pg_password = os.environ.get('DB_PASSWORD', 'admin') # specifique a l'application
pg_schemaname = 'public' #defaut public
pg_bin_path = '/Applications/Postgres.app/Contents/Versions/13/bin/' # specifique a l'application
pg_srid = '32187' #defaut 32188
#variables derivees
pg_string = 'postgresql://' + pg_username + ':'  + pg_password + '@'  + pg_host + ':'  + pg_port + '/'  + pg_dbname

# structure de base de données
# tables
db_table_tax_data_points='role_foncier'
db_table_match_tax_lots='association_cadastre_role'
db_table_lots='cadastre'
db_table_territory='cartographie_secteurs'
db_table_history='historique_geopol'
db_table_parking_reg_headers = 'entete_reg_stationnement'
db_table_parking_reg_stacked = 'reg_stationnement_empile'
db_table_units="multiplicateur_facteurs_colonnes"
db_table_reg_sets_header = "ensembles_reglements_stat"
db_table_reg_sets_match = "association_er_reg_stat"
db_table_land_use = "cubf"
db_table_match_regsets_territory = 'association_er_territoire'
db_table_analysis_territory = 'sec_analyse'
db_table_parking_inventory = 'inventaire_stationnement'
# colonnes
# reg set Terrirtory:
db_column_RST_id = 'id_asso_er_ter'

# role foncier
db_column_tax_id = 'id_provinc'
db_column_tax_constr_year = 'rl0307a'
db_column_tax_land_use = 'rl0105a'
db_column_tax_gross_floor_area ='rl0308a'
db_column_tax_number_dwellings = 'rl0311a'
db_column_tax_n_rooms_rentals = 'rl0312a'
db_column_tax_n_other_rooms = 'rl0313a'
# cadastre
db_column_lot_id = 'g_no_lot'
# cartographie_secteurs
db_column_territory_id = 'id_periode_geo'
db_column_territory_name = 'ville_sec'
db_column_territory_city = 'ville'
db_column_territory_zone = 'secteur'
# historique
db_column_history_id = "id_periode"
db_column_history_start_year = 'date_debut_periode'
db_column_history_end_year = 'date_fin_periode'
# règlementation stationnement
db_column_parking_regs_id = 'id_reg_stat'
db_column_reg_start_year = 'annee_debut_reg'
db_column_reg_end_year ='annee_fin_reg'
db_column_reg_ident= 'texte_loi'
db_column_reg_art = 'article_loi'
db_column_reg_para = 'paragraphe_loi'
db_column_reg_city = 'ville'
db_column_parking_subset_id = 'ss_ensemble'
db_column_stacked_parking_id = 'id_reg_stat_emp'
db_column_threshold_value = 'seuil'
db_column_parking_operation = 'oper'
db_column_parking_unit_id = 'unite'
db_column_parking_zero_crossing_min = 'cases_fix_min'
db_column_parking_zero_crossing_max = 'cases_fix_max'
db_column_parking_slope_min = 'pente_min'
db_column_parking_slope_max = 'pente_max'
db_column_parking_description = 'description'
# unite stationnement
db_column_units_id = 'id_unite'
db_column_unit_description='desc_unite'
db_column_tax_data_column_to_multiply = 'colonne_role_foncier'
db_column_tax_data_conversion_slope = 'facteur_correction'
db_column_tax_data_conversion_zero = 'abscisse_correction'
# ensembles de règlements
db_column_reg_sets_id = 'id_er'
db_column_reg_sets_start_year = 'date_debut_er'
db_column_reg_sets_end_year = 'date_fin_er'
db_column_reg_sets_desc = 'description_er'
# utilsiation du territoire
db_column_land_use_id = 'cubf'
db_column_land_use_desc = 'description'
#territoire d'analyse
db_column_analysis_territory_id = 'id_quartier'
db_column_analysis_territory_name = 'nom_quartier'
#Intrants calculs
db_column_converted_value='valeur'
# Résultats calculs
db_column_supply_comment='commentaire'
db_column_supply_est_meth='methode_estime'
db_column_supply_min='n_places_min'
db_column_supply_max='n_places_max'
db_column_supply_meas='n_places_mesure'
db_column_supply_estimated='n_places_estime'
# colonnes de géométrie
db_geom_analysis ='geometry'
db_geom_tax = 'geometry'
db_geom_lots = 'geometry'
db_geom_territory = 'geometry'