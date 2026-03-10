import pandas as pd
import numpy as np
import os
import sys
from pathlib import Path
import classes.parking_regs as PR
import calcs.calcs_inventaire as IC
import classes.parking_inventory_inputs as PCI

def test_subset_simple_min():
    reg_header = pd.DataFrame({
        'id_reg_stat':[1],
        'description':['Test Simple'],
        'texte_loi':['Test Simple'],
        'annee_debut_reg':[1990],
        'annne_fin_reg':[1995],
        'article_loi':['Test Simple'],
        'texte_loi':['Test Simple'],
        'paragraphe_loi':['test simple'],
        'ville':['Test Simple']
    })
    reg_def = pd.DataFrame({
        'id_reg_stat_emp':[1],
        'id_reg_stat':[1],
        'ss_ensemble':[1],
        'seuil':[0],
        'oper':[None],
        'cases_fix_min':[0],
        'cases_fix_max':[None],
        'pente_min':[0.05],
        'pente_max':[None],
        'unite':[1]
    })
    units = pd.DataFrame({
        'id_unite':[1],
        'desc_unite':['Test Simple'],
        'colonne_role_foncier':['rl0308a'],
        'facteur_correction':[1],
        'abscisse_correction':[0]
    })

    simple_park_reg = PR.ParkingRegulations(reg_header,reg_def,units)

    input_data = PCI.ParkingCalculationInputs({
        'g_no_lot':['a','b'],
        'cubf':['1000','1000'],
        'id_reg_stat':[1,1],
        'id_er':[1,1],
        'unite':[1,1],
        'valeur':[100,1000]
    })

    inventaire = IC.calculate_parking_subset_from_inputs_class(simple_park_reg,1,input_data,2)
    assert inventaire.parking_frame.iloc[0]['n_places_min'] == 5
    assert inventaire.parking_frame.iloc[1]['n_places_min'] == 50

def test_subset_seuil_min():
    reg_header = pd.DataFrame({
        'id_reg_stat':[1],
        'description':['Test Simple'],
        'texte_loi':['Test Simple'],
        'annee_debut_reg':[1990],
        'annne_fin_reg':[1995],
        'article_loi':['Test Simple'],
        'texte_loi':['Test Simple'],
        'paragraphe_loi':['test simple'],
        'ville':['Test Simple']
    })
    reg_def = pd.DataFrame({
        'id_reg_stat_emp':[1,2],
        'id_reg_stat':[1,1],
        'ss_ensemble':[1,1],
        'seuil':[0,100],
        'oper':[None,4],
        'cases_fix_min':[0,4],
        'cases_fix_max':[None,None],
        'pente_min':[0.05,0.01],
        'pente_max':[None,None],
        'unite':[1,1]
    })
    units = pd.DataFrame({
        'id_unite':[1],
        'desc_unite':['Test Simple'],
        'colonne_role_foncier':['rl0308a'],
        'facteur_correction':[1],
        'abscisse_correction':[0]
    })

    simple_park_reg = PR.ParkingRegulations(reg_header,reg_def,units)

    input_data = PCI.ParkingCalculationInputs({
        'g_no_lot':['a','b','c','d','e'],
        'cubf':['1000','1000','1000','1000','1000'],
        'id_reg_stat':[1,1,1,1,1],
        'id_er':[1,1,1,1,1],
        'unite':[1,1,1,1,1],
        'valeur':[0,50,100,150,200]
    })

    inventaire = IC.calculate_parking_subset_from_inputs_class(simple_park_reg,1,input_data,2)
    assert inventaire.parking_frame.loc[inventaire.parking_frame['g_no_lot']=='a','n_places_min'].values[0] == 0
    assert inventaire.parking_frame.loc[inventaire.parking_frame['g_no_lot']=='b','n_places_min'].values[0] == 2.5
    assert inventaire.parking_frame.loc[inventaire.parking_frame['g_no_lot']=='c','n_places_min'].values[0] == 5
    assert inventaire.parking_frame.loc[inventaire.parking_frame['g_no_lot']=='d','n_places_min'].values[0] == 5.5
    assert inventaire.parking_frame.loc[inventaire.parking_frame['g_no_lot']=='e','n_places_min'].values[0] == 6

def test_subset_addition_min():
    reg_header = pd.DataFrame({
        'id_reg_stat':[1],
        'description':['Test Simple'],
        'texte_loi':['Test Simple'],
        'annee_debut_reg':[1990],
        'annne_fin_reg':[1995],
        'article_loi':['Test Simple'],
        'texte_loi':['Test Simple'],
        'paragraphe_loi':['test simple'],
        'ville':['Test Simple']
    })
    reg_def = pd.DataFrame({
        'id_reg_stat_emp':[1,2],
        'id_reg_stat':[1,1],
        'ss_ensemble':[1,1],
        'seuil':[0,100],
        'oper':[None,1],
        'cases_fix_min':[0,0],
        'cases_fix_max':[None,None],
        'pente_min':[0.5,0.25],
        'pente_max':[None,None],
        'unite':[1,2]
    })
    units = pd.DataFrame({
        'id_unite':[1,2],
        'desc_unite':['Employe','Salle'],
        'colonne_role_foncier':['rl0308a','rl0308a'],
        'facteur_correction':[1,0.05],
        'abscisse_correction':[0,0]
    })

    simple_park_reg = PR.ParkingRegulations(reg_header,reg_def,units)

    input_data = PCI.ParkingCalculationInputs({
        'g_no_lot':['a','a','b','b','c','c','d','d'],
        'cubf':['1000','1000','2000','2000','3000','3000','4000','4000'],
        'id_reg_stat':[1,1,1,1,1,1,1,1],
        'id_er':[1,1,1,1,1,1,1,1],
        'unite':[1,2,1,2,1,2,1,2],
        'valeur':[0,0,100,0,0,100,100,100]
    })

    inventaire = IC.calculate_parking_subset_from_inputs_class(simple_park_reg,1,input_data,2)
    assert inventaire.parking_frame.loc[inventaire.parking_frame['g_no_lot']=='a','n_places_min'].values[0] == 0
    assert inventaire.parking_frame.loc[inventaire.parking_frame['g_no_lot']=='b','n_places_min'].values[0] == 50
    assert inventaire.parking_frame.loc[inventaire.parking_frame['g_no_lot']=='c','n_places_min'].values[0] == 25
    assert inventaire.parking_frame.loc[inventaire.parking_frame['g_no_lot']=='d','n_places_min'].values[0] == 75

if __name__=="__main__":
    test_subset_simple_min()
    test_subset_seuil_min()