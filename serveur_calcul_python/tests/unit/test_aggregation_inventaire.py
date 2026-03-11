import pandas as pd
import numpy as np
import sys
from pathlib import Path
#sys.path.append(str(Path(__file__).resolve().parents[2]))
#print(sys.path)
from classes import parking_inventory as PI
from aggregation import agg_inventaire as AI

def normalize(df:pd.DataFrame)->pd.DataFrame:
    df = df.copy()
    df["id_reg_stat"] = df["id_reg_stat"].astype(str)
    df["id_er"] = df["id_er"].astype(str)
    return df.convert_dtypes().reset_index(drop=True)

def test_merge_lot_data_mins_only():
    frame_0 = pd.DataFrame({
        'g_no_lot':['1','1','2'],
        'n_places_min':[10,5,15],
        'n_places_max':[None,None,None],
        'n_places_estime':[None,None,None],
        'n_places_mesure':[None,None,None],
        'methode_estime':[2,2,2],
        'cubf':['1000','5000','5000'],
        'id_reg_stat':[1,2,2],
        'id_er':[1,1,1],
        'commentaire':['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000']
    })
    inventaire = PI.ParkingInventory(frame_0)
    inventaire_merge:PI.ParkingInventory  = AI.merge_lot_data(inventaire)
    expected_result = pd.DataFrame({
        'g_no_lot':['2','1'],
        'n_places_min':[15,15],
        'n_places_max':[None,None],
        'n_places_estime':[None,None],
        'n_places_mesure':[None,None],
        'methode_estime':[2,2],
        'cubf':['5000','1000/5000'],
        'id_reg_stat':["2","1/2"],
        'id_er':['1','1/1'],
        'commentaire':['Unite:2 val:3000','Unite:1 val:1, Unite:2 val:1000']
    })
    actual_result:pd.DataFrame = inventaire_merge.parking_frame
    pd.testing.assert_frame_equal(
        normalize(actual_result),
        normalize(expected_result),
        check_dtype=False
    )

def test_merge_lot_data_mins_and_compatible_maxes():
    frame_0 = pd.DataFrame({
        'g_no_lot':['1','1','2'],
        'n_places_min':[10,5,15],
        'n_places_max':[15,8,25],
        'n_places_estime':[None,None,None],
        'n_places_mesure':[None,None,None],
        'methode_estime':[2,2,2],
        'cubf':['1000','5000','5000'],
        'id_reg_stat':[1,2,2],
        'id_er':[1,1,1],
        'commentaire':['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000']
    })
    inventaire = PI.ParkingInventory(frame_0)
    inventaire_merge:PI.ParkingInventory  = AI.merge_lot_data(inventaire)
    expected_result = pd.DataFrame({
        'g_no_lot':['2','1'],
        'n_places_min':[15,15],
        'n_places_max':[25,23],
        'n_places_estime':[None,None],
        'n_places_mesure':[None,None],
        'methode_estime':[2,2],
        'cubf':['5000','1000/5000'],
        'id_reg_stat':["2","1/2"],
        'id_er':['1','1/1'],
        'commentaire':['Unite:2 val:3000','Unite:1 val:1, Unite:2 val:1000']
    })
    actual_result:pd.DataFrame = inventaire_merge.parking_frame
    pd.testing.assert_frame_equal(
        normalize(actual_result),
        normalize(expected_result),
        check_dtype=False
    )

def test_merge_lot_data_mins_and_incompatible_maxes():
    frame_0 = pd.DataFrame({
        'g_no_lot':['1','1','2'],
        'n_places_min':[10,5,15],
        'n_places_max':[12,None,25],
        'n_places_estime':[None,None,None],
        'n_places_mesure':[None,None,None],
        'methode_estime':[2,2,2],
        'cubf':['1000','5000','5000'],
        'id_reg_stat':[1,2,2],
        'id_er':[1,1,1],
        'commentaire':['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000']
    })
    inventaire = PI.ParkingInventory(frame_0)
    inventaire_merge:PI.ParkingInventory  = AI.merge_lot_data(inventaire)
    expected_result = pd.DataFrame({
        'g_no_lot':['2','1'],
        'n_places_min':[15,15],
        'n_places_max':[25,None],
        'n_places_estime':[None,None],
        'n_places_mesure':[None,None],
        'methode_estime':[2,2],
        'cubf':['5000','1000/5000'],
        'id_reg_stat':["2","1/2"],
        'id_er':['1','1/1'],
        'commentaire':['Unite:2 val:3000','Unite:1 val:1, Unite:2 val:1000']
    })
    actual_result:pd.DataFrame = inventaire_merge.parking_frame
    pd.testing.assert_frame_equal(
        normalize(actual_result),
        normalize(expected_result),
        check_dtype=False
    )


def test_list_dissolution():
    frame_0 = pd.DataFrame({
        'g_no_lot':['1','1','2'],
        'n_places_min':[10,5,15],
        'n_places_max':[None,None,None],
        'n_places_estime':[None,None,None],
        'n_places_mesure':[None,None,None],
        'methode_estime':[2,2,2],
        'cubf':['1000','5000','5000'],
        'id_reg_stat':[1,2,2],
        'id_er':[1,1,1],
        'commentaire':['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000']
    })
    inventaire_1 = PI.ParkingInventory(frame_0)
    frame_1 = pd.DataFrame({
        'g_no_lot':['2','3'],
        'n_places_min':[15,15],
        'n_places_max':[None,None],
        'n_places_estime':[None,None],
        'n_places_mesure':[None,None],
        'methode_estime':[2,2],
        'cubf':['6501','5000'],
        'id_reg_stat':[3,4],
        'id_er':[2,2],
        'commentaire':['Unite:2 val:1500','Unite:2 val:1000']
    })
    inventaire_2 = PI.ParkingInventory(frame_1)
    invent_list = [inventaire_1,inventaire_2]
    inventaire_concat = AI.dissolve_list(invent_list)
    expected_result = pd.DataFrame({
        'g_no_lot':['1','1','2','2','3'],
        'n_places_min':[10,5,15,15,15],
        'n_places_max':[None,None,None,None,None],
        'n_places_estime':[None,None,None,None,None],
        'n_places_mesure':[None,None,None,None,None],
        'methode_estime':[2,2,2,2,2],
        'cubf':['1000','5000','5000','6501','5000'],
        'id_reg_stat':[1,2,2,3,4],
        'id_er':[1,1,1,2,2],
        'commentaire':['Unite:1 val:1','Unite:2 val:1000','Unite:2 val:3000','Unite:2 val:1500','Unite:2 val:1000']
    })
    actual_result:pd.DataFrame = inventaire_concat.parking_frame
    pd.testing.assert_frame_equal(
        normalize(actual_result),
        normalize(expected_result),
        check_dtype=False
    )


if __name__ == "__main__":
    test_merge_lot_data_mins_only()
    test_merge_lot_data_mins_and_compatible_maxes()
    test_merge_lot_data_mins_and_incompatible_maxes()
    test_list_dissolution()