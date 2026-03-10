# import des librairies
import pandas as pd
import sys, pathlib
import numpy as np
import os
import sys
from pathlib import Path
# ajoute le dossier serveur_calcul_python (qui contient classes, calcs, etc.) au sys.path
sys.path.append(str(Path(__file__).resolve().parents[2]))
# import des classes et fonctions à tester
from classes import parking_inventory as PI
import calcs.calcs_inventaire as IC


def test_or_simple():
    '''
    Test de la fonction simple_or de inventory_calcs
    '''
    min_left_smaller_min_right_simple_or()
    min_left_larger_min_right_simple_or()
    
def test_or_plus_contraignant():
    '''
        test de la fonction most_constraining_or de inventory_calcs
    '''
    min_left_larger_min_right_most_const_or()
    min_left_smaller_min_right_most_const_or()
    max_left_smaller_min_right_most_const_or()
    max_left_larger_min_right_most_const_or()
    min_left_smaller_max_right_most_const_or()
    min_left_larger_max_right_most_const_or()

def min_left_smaller_min_right_simple_or():
    parking_frame_petit = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a', 'b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[1,4],
        'n_places_max':[None,None]}
    ))
    parking_frame_grand = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a','b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[2,5],
        'n_places_max':[None,None]}
    ))
    test_subject_1 = IC.simple_or_operation(parking_frame_petit,parking_frame_grand)
    assert test_subject_1.parking_frame.iloc[0]['n_places_min'] == 1
    assert test_subject_1.parking_frame.iloc[1]['n_places_min'] == 4

def min_left_larger_min_right_simple_or():
    parking_frame_petit = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a', 'b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[2,5],
        'n_places_max':[None,None]}
    ))
    parking_frame_grand = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a','b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[1,4],
        'n_places_max':[None,None]}
    ))
    test_subject_1 = IC.simple_or_operation(parking_frame_petit,parking_frame_grand)
    assert test_subject_1.parking_frame.iloc[0]['n_places_min'] == 1
    assert test_subject_1.parking_frame.iloc[1]['n_places_min'] == 4

def min_left_smaller_min_right_most_const_or():
    parking_frame_petit = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a', 'b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[1,4],
        'n_places_max':[None,None]}
    ))
    parking_frame_grand = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a','b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[2,5],
        'n_places_max':[None,None]}
    ))
    test_subject_1 = IC.most_constraining_or_operation(parking_frame_petit,parking_frame_grand)
    assert test_subject_1.parking_frame.iloc[0]['n_places_min'] == 2
    assert test_subject_1.parking_frame.iloc[1]['n_places_min'] == 5

def min_left_larger_min_right_most_const_or():
    parking_frame_petit = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a', 'b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[2,5],
        'n_places_max':[None,None]}
    ))
    parking_frame_grand = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a','b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[1,4],
        'n_places_max':[None,None]}
    ))
    test_subject_1 = IC.most_constraining_or_operation(parking_frame_petit,parking_frame_grand)
    assert test_subject_1.parking_frame.iloc[0]['n_places_min'] == 2
    assert test_subject_1.parking_frame.iloc[1]['n_places_min'] == 5

def max_left_smaller_min_right_most_const_or():
    parking_frame_petit = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a', 'b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[None,None],
        'n_places_max':[2,5]}
    ))
    parking_frame_grand = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a','b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[3,6],
        'n_places_max':[None,None]}
    ))
    test_subject_1 = IC.most_constraining_or_operation(parking_frame_petit,parking_frame_grand)
    assert test_subject_1.parking_frame.iloc[0]['n_places_min'] == 2
    assert test_subject_1.parking_frame.iloc[1]['n_places_min'] == 5

def max_left_larger_min_right_most_const_or():
    parking_frame_petit = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a', 'b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[None,None],
        'n_places_max':[4,7]}
    ))
    parking_frame_grand = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a','b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[3,6],
        'n_places_max':[None,None]}
    ))
    test_subject_1 = IC.most_constraining_or_operation(parking_frame_petit,parking_frame_grand)
    assert test_subject_1.parking_frame.iloc[0]['n_places_min'] == 3
    assert test_subject_1.parking_frame.iloc[1]['n_places_min'] == 6

def min_left_smaller_max_right_most_const_or():
    parking_frame_petit = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a', 'b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[3,6],
        'n_places_max':[None,None]}
    ))
    parking_frame_grand = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a','b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[None,None],
        'n_places_max':[4,7]}
    ))
    test_subject_1 = IC.most_constraining_or_operation(parking_frame_petit,parking_frame_grand)
    assert test_subject_1.parking_frame.iloc[0]['n_places_min'] == 3
    assert test_subject_1.parking_frame.iloc[1]['n_places_min'] == 6

def min_left_larger_max_right_most_const_or():
    parking_frame_petit = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a', 'b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[3,6],
        'n_places_max':[None,None]}
    ))
    parking_frame_grand = PI.ParkingInventory(parking_inventory_frame = pd.DataFrame({
        'g_no_lot':['a','b'],
        'cubf':['1000','1000'],
        'id_reg_stat':['1','2'],
        'id_er':['1','2'],
        'commentaire':['Test Left','Test Right'],
        'methode_estime':[2,2],
        'n_places_min':[None,None],
        'n_places_max':[2,5]}
    ))
    test_subject_1 = IC.most_constraining_or_operation(parking_frame_petit,parking_frame_grand)
    assert test_subject_1.parking_frame.iloc[0]['n_places_min'] == 2
    assert test_subject_1.parking_frame.iloc[1]['n_places_min'] == 5

if __name__ == "__main__":
    #sys.path.append(str(pathlib.Path(__file__).resolve().parents[2]))
    test_or_simple()
    test_or_plus_contraignant()
    print('All Tests passed')