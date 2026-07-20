"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Data store for regulations that set off validation errors along the way
"""
# external libraries
import pandas as pd
# internal functions
from config import config_db as cf_db
from classes import parking_regs as PR


def generate_none_simple_regulation():
    """
    # generate_none_simple_regulation
    generate a simple one line regulation where the definition
    contains only nones in the mathematical definition

    Returns:
        - a ParkingRegulationsObject which will fail validation
    """
    reg_header = pd.DataFrame({
        cf_db.db_column_parking_regs_id:[7],
        cf_db.db_column_parking_description:[
            'Règlement simple avec données toutes none',
        ],
        cf_db.db_column_reg_ident:[
            'Règlement simple avec données toutes none',
        ],
        cf_db.db_column_reg_start_year:[1990],
        cf_db.db_column_reg_end_year:[2000],
        cf_db.db_column_reg_art:[
            'Articles toutes valeurs none'
        ],
        cf_db.db_column_reg_para:[
            'Paragraphe règlement toutes none'
            ],
        cf_db.db_column_reg_city:[
            'Ville toutes valeurs none'
        ]
    })
    reg_def = pd.DataFrame({ 
        cf_db.db_column_stacked_parking_id:[
            14, # Règlement 7 qui a des valeurs de slope et d'intercept toutes nulles
            ],
        cf_db.db_column_parking_regs_id:[
            7, # Règlement 7 simple qui n'a que des valeurs none
            ],
        cf_db.db_column_parking_subset_id:[
            1, # Règlement 7 avec des valeurs none 
            ],
        cf_db.db_column_threshold_value:[
            0, # Reg 7 avec des valeurs None
            ],
        cf_db.db_column_parking_operation:[
            None, # reg avec des valeurs none
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            None, # reg 7
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None, # reg 7
            ],
        cf_db.db_column_parking_slope_min:[
            None, # reg 7
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            ],
        cf_db.db_column_parking_unit_id:[
            1,
            ]
    })
    units = pd.DataFrame({
        cf_db.db_column_units_id:[1,2,3],
        cf_db.db_column_unit_description:['Aire plancher','Employé','Salle'],
        cf_db.db_column_tax_data_column_to_multiply:['rl0308a','rl0308a','rl0311a'],
        cf_db.db_column_tax_data_conversion_slope:[1,0.01,0.025], # 1 employé par 100m2 , 1 salle par 40m2
        cf_db.db_column_tax_data_conversion_zero:[0,0,0]
    })
    big_pr = PR.ParkingRegulations(reg_header,reg_def,units)
    return big_pr

def generate_none_thresh_regulation():
    """
    # generate_none_thresh_regulation
    generate a threshold based regulation which should fail validations
    based on the fact that all the slopes and intercepts on one of the lines
    are none

    Returns:
        - a ParkingRegulationsObject which will fail validation
    """
    reg_header = pd.DataFrame({
        cf_db.db_column_parking_regs_id:[8],
        cf_db.db_column_parking_description:[
            'Règlement seuil avec une ligne toutes none',
        ],
        cf_db.db_column_reg_ident:[
            'Règlement seuil avec une ligne def toutes none',
        ],
        cf_db.db_column_reg_start_year:[1990,],
        cf_db.db_column_reg_end_year:[2000,],
        cf_db.db_column_reg_art:[
            'Article règlement avec une ligne none',
        ],
        cf_db.db_column_reg_para:[
            'Paragraphe règlement seuil une ligne none',
            ],
        cf_db.db_column_reg_city:[
            'Ville règlement seuil une ligne none',
        ]
    })
    reg_def = pd.DataFrame({ 
        cf_db.db_column_stacked_parking_id:[
            15, # Règlement 8 une ligne avec toutes des none pour valider que les règlements a seuil lancent l'erreur 
            16,
            ],
        cf_db.db_column_parking_regs_id:[
            8, # reg 8 all none thresh
            8,
            ],
        cf_db.db_column_parking_subset_id:[
            1, # Règlement 8 à seuil avec valeurs none
            1,
            ],
        cf_db.db_column_threshold_value:[
            0, # reg 8 a seuil avec valeurs none
            1000
            ],
        cf_db.db_column_parking_operation:[
            None, # reg seuil avec des valeurs none
            4,
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            0, # reg 8
            None 
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None, # reg 8
            None,
            ],
        cf_db.db_column_parking_slope_min:[
            0.05, # reg 8
            None,
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            None,
            ],
        cf_db.db_column_parking_unit_id:[
            1,
            1,
            ]
    })
    units = pd.DataFrame({
        cf_db.db_column_units_id:[1,2,3],
        cf_db.db_column_unit_description:['Aire plancher','Employé','Salle'],
        cf_db.db_column_tax_data_column_to_multiply:['rl0308a','rl0308a','rl0311a'],
        cf_db.db_column_tax_data_conversion_slope:[1,0.01,0.025], # 1 employé par 100m2 , 1 salle par 40m2
        cf_db.db_column_tax_data_conversion_zero:[0,0,0]
    })
    big_pr = PR.ParkingRegulations(reg_header,reg_def,units)
    return big_pr

def generate_none_add_regulation():
    """
    # generate_none_add_regulation
    Generate and addition based regulation where one of the lines is entirely 
    filled with none slopes and intercepts which should lead to error

    Returns: 
        - a ParkingRegulations object which will fail validation
    """
    reg_header = pd.DataFrame({
        cf_db.db_column_parking_regs_id:[9],
        cf_db.db_column_parking_description:[
            'Règlement addition avec une ligne toutes none'
        ],
        cf_db.db_column_reg_ident:[
            'Règlement addition avec une ligne avec une ligne toutes none'
        ],
        cf_db.db_column_reg_start_year:[1990],
        cf_db.db_column_reg_end_year:[2000],
        cf_db.db_column_reg_art:[
            'Article reg add avec une ligne def toutes none'
        ],
        cf_db.db_column_reg_para:[
            'Paragraphe règlement add une ligne def none'
            ],
        cf_db.db_column_reg_city:[
            'Ville règlement add avec une ligne def toutes none'
        ]
    })
    reg_def = pd.DataFrame({ 
        cf_db.db_column_stacked_parking_id:[
            17, # reg 9 règlement d'addition avec une ligne ou toutes les pentes et intercepts sont none
            18
            ],
        cf_db.db_column_parking_regs_id:[
            9,
            9
            ],
        cf_db.db_column_parking_subset_id:[
            1,# reg 9 addition avec une definition none
            1
            ],
        cf_db.db_column_threshold_value:[
            0,
            0
            ],
        cf_db.db_column_parking_operation:[
            None, # reg add avec des valeurs none
            1
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            0, # reg 9 
            None
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None, # reg 9
            None
            ],
        cf_db.db_column_parking_slope_min:[
            0.05, # reg 9
            None
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            None
            ],
        cf_db.db_column_parking_unit_id:[
            2,
            3
            ]
    })
    units = pd.DataFrame({
        cf_db.db_column_units_id:[1,2,3],
        cf_db.db_column_unit_description:['Aire plancher','Employé','Salle'],
        cf_db.db_column_tax_data_column_to_multiply:['rl0308a','rl0308a','rl0311a'],
        cf_db.db_column_tax_data_conversion_slope:[1,0.01,0.025], # 1 employé par 100m2 , 1 salle par 40m2
        cf_db.db_column_tax_data_conversion_zero:[0,0,0]
    })
    big_pr = PR.ParkingRegulations(reg_header,reg_def,units)
    return big_pr
    
def generate_incorrect_inter_oper_simple():
    """
    # generate_incorrect_inter_oper_simple
    generate a ParkingRegulations object which will validation
    based on the fact taht there's and operator in a oneline rule
    this value should be None.

    Returns: 
        - a ParkingRegulations which will fail validation
    """
    reg_header = pd.DataFrame({
        cf_db.db_column_parking_regs_id:[10],
        cf_db.db_column_parking_description:[
            'Règlement simple avec operateur invalide'
        ],
        cf_db.db_column_reg_ident:[
            'Règlement simple avec operateur invalide'
        ],
        cf_db.db_column_reg_start_year:[1990],
        cf_db.db_column_reg_end_year:[2000],
        cf_db.db_column_reg_art:[
            'Article Règlement simple avec operateur invalide'
        ],
        cf_db.db_column_reg_para:[
            'Paragraphe Règlement simple avec operateur invalide'
            ],
        cf_db.db_column_reg_city:[
            'Ville Règlement simple avec operateur invalide'
        ]
    })
    reg_def = pd.DataFrame({ 
        cf_db.db_column_stacked_parking_id:[
            19,
            ],
        cf_db.db_column_parking_regs_id:[
            10,
            ],
        cf_db.db_column_parking_subset_id:[
            1,
            ],
        cf_db.db_column_threshold_value:[
            0,  
            ],
        cf_db.db_column_parking_operation:[
            5,
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            0, # reg 9 
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None, 
            ],
        cf_db.db_column_parking_slope_min:[
            0.05, 
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            ],
        cf_db.db_column_parking_unit_id:[
            2,
            ]
    })
    units = pd.DataFrame({
        cf_db.db_column_units_id:[1,2,3],
        cf_db.db_column_unit_description:['Aire plancher','Employé','Salle'],
        cf_db.db_column_tax_data_column_to_multiply:['rl0308a','rl0308a','rl0311a'],
        cf_db.db_column_tax_data_conversion_slope:[1,0.01,0.025], # 1 employé par 100m2 , 1 salle par 40m2
        cf_db.db_column_tax_data_conversion_zero:[0,0,0]
    })
    big_pr = PR.ParkingRegulations(reg_header,reg_def,units)
    return big_pr

def generate_incorrect_inter_oper_comp():
    """
    # generate_incorrect_inter_oper_comp
    Generates a ParkingRegulations object which will fail validation 
    based on the fact that the operator between subsets isn't 3 or 6

    Returns:
        - a ParkingRegulations object which should fail validation
    """
    reg_header = pd.DataFrame({
        cf_db.db_column_parking_regs_id:[11],
        cf_db.db_column_parking_description:[
            'Règlement comp avec operateur invalide'
        ],
        cf_db.db_column_reg_ident:[
            'Règlement comp avec operateur invalide'
        ],
        cf_db.db_column_reg_start_year:[1990],
        cf_db.db_column_reg_end_year:[2000],
        cf_db.db_column_reg_art:[
            'Article Règlement comp avec operateur invalide'
        ],
        cf_db.db_column_reg_para:[
            'Paragraphe Règlement comp avec operateur invalide'
            ],
        cf_db.db_column_reg_city:[
            'Ville Règlement comp avec operateur invalide'
        ]
    })
    reg_def = pd.DataFrame({ 
        cf_db.db_column_stacked_parking_id:[
            20,
            21
            ],
        cf_db.db_column_parking_regs_id:[
            11,
            11
            ],
        cf_db.db_column_parking_subset_id:[
            1,
            2
            ],
        cf_db.db_column_threshold_value:[
            0,
            0 
            ],
        cf_db.db_column_parking_operation:[
            None,
            'test'
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            0, # reg 9 b
            0
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None, 
            None
            ],
        cf_db.db_column_parking_slope_min:[
            0.05,
            0.25
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            None
            ],
        cf_db.db_column_parking_unit_id:[
            2,
            3
            ]
    })
    units = pd.DataFrame({
        cf_db.db_column_units_id:[1,2,3],
        cf_db.db_column_unit_description:['Aire plancher','Employé','Salle'],
        cf_db.db_column_tax_data_column_to_multiply:['rl0308a','rl0308a','rl0311a'],
        cf_db.db_column_tax_data_conversion_slope:[1,0.01,0.025], # 1 employé par 100m2 , 1 salle par 40m2
        cf_db.db_column_tax_data_conversion_zero:[0,0,0]
    })
    big_pr = PR.ParkingRegulations(reg_header,reg_def,units)
    return big_pr
    
def generate_incorrect_intra_ops_multiple():
    """
    # generate_incorrect_intra_ops_multiple
    Generates a ParkingRegulationsObject which should fail validation based on the fact that there are multiple
    operators defined for the type of subset whereas there should only be one.

    Returns: 
        - a ParkingRegulations that should fail validation
    """
    reg_header = pd.DataFrame({
        cf_db.db_column_parking_regs_id:[12],
        cf_db.db_column_parking_description:[
            'Règlement multi intra avec operateur multiple'
        ],
        cf_db.db_column_reg_ident:[
            'Règlement multi intra avec operateur multiple'
        ],
        cf_db.db_column_reg_start_year:[1990],
        cf_db.db_column_reg_end_year:[2000],
        cf_db.db_column_reg_art:[
            'Article Règlement multi intra avec operateur multiple'
        ],
        cf_db.db_column_reg_para:[
            'Paragraphe Règlement multi intra avec operateur multiple'
            ],
        cf_db.db_column_reg_city:[
            'Ville Règlement multi intra avec operateur multiple'
        ]
    })
    reg_def = pd.DataFrame({ 
        cf_db.db_column_stacked_parking_id:[
            22,
            23,
            24
            ],
        cf_db.db_column_parking_regs_id:[
            12,
            12,
            12
            ],
        cf_db.db_column_parking_subset_id:[
            1,
            1,
            1
            ],
        cf_db.db_column_threshold_value:[
            0,
            100,
            200 
            ],
        cf_db.db_column_parking_operation:[
            None,
            4,
            1
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            0, # reg 9 b
            0,
            0
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None, 
            None,
            None
            ],
        cf_db.db_column_parking_slope_min:[
            0.05,
            0.25,
            0.4
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            None,
            None
            ],
        cf_db.db_column_parking_unit_id:[
            2,
            2,
            2
            ]
    })
    units = pd.DataFrame({
        cf_db.db_column_units_id:[1,2,3],
        cf_db.db_column_unit_description:['Aire plancher','Employé','Salle'],
        cf_db.db_column_tax_data_column_to_multiply:['rl0308a','rl0308a','rl0311a'],
        cf_db.db_column_tax_data_conversion_slope:[1,0.01,0.025], # 1 employé par 100m2 , 1 salle par 40m2
        cf_db.db_column_tax_data_conversion_zero:[0,0,0]
    })
    big_pr = PR.ParkingRegulations(reg_header,reg_def,units)
    return big_pr
    
def generate_incorrect_intra_ops_invalid():
    """
    # generate_incorrect_intr_ops_invalid
    Returns a ParkingRegulations object which should fail validation based on the fact that there are 2 types
    of subset definitions created for the same subset which will fail validation

    Returns: 
        - a ParkingRegulations object which will fail validation
    """
    reg_header = pd.DataFrame({
        cf_db.db_column_parking_regs_id:[13],
        cf_db.db_column_parking_description:[
            'Règlement multi intra avec operateur invalide'
        ],
        cf_db.db_column_reg_ident:[
            'Règlement multi intra avec operateur invalide'
        ],
        cf_db.db_column_reg_start_year:[1990],
        cf_db.db_column_reg_end_year:[2000],
        cf_db.db_column_reg_art:[
            'Article Règlement multi intra avec operateur invalide'
        ],
        cf_db.db_column_reg_para:[
            'Paragraphe Règlement multi intra avec operateur invalide'
            ],
        cf_db.db_column_reg_city:[
            'Ville Règlement multi intra avec operateur invalide'
        ]
    })
    reg_def = pd.DataFrame({ 
        cf_db.db_column_stacked_parking_id:[
            25,
            26,
            27
            ],
        cf_db.db_column_parking_regs_id:[
            13,
            13,
            13
            ],
        cf_db.db_column_parking_subset_id:[
            1,
            1,
            1
            ],
        cf_db.db_column_threshold_value:[
            0,
            100,
            200 
            ],
        cf_db.db_column_parking_operation:[
            None,
            5,
            5
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            0, # reg 9 b
            0,
            0
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None, 
            None,
            None
            ],
        cf_db.db_column_parking_slope_min:[
            0.05,
            0.25,
            0.4
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            None,
            None
            ],
        cf_db.db_column_parking_unit_id:[
            2,
            2,
            2
            ]
    })
    units = pd.DataFrame({
        cf_db.db_column_units_id:[1,2,3],
        cf_db.db_column_unit_description:['Aire plancher','Employé','Salle'],
        cf_db.db_column_tax_data_column_to_multiply:['rl0308a','rl0308a','rl0311a'],
        cf_db.db_column_tax_data_conversion_slope:[1,0.01,0.025], # 1 employé par 100m2 , 1 salle par 40m2
        cf_db.db_column_tax_data_conversion_zero:[0,0,0]
    })
    big_pr = PR.ParkingRegulations(reg_header,reg_def,units)
    return big_pr

def generate_missing_units():
    """
    # generate_missing_units
    Generates a ParkingRegulations object which should fail based on the fact
    that one of the units is not correctly defined 
    """
    reg_header = pd.DataFrame({
        cf_db.db_column_parking_regs_id:[14],
        cf_db.db_column_parking_description:[
            'Règlement comp avec unite manquante'
        ],
        cf_db.db_column_reg_ident:[
            'Règlement comp avec unite manquante'
        ],
        cf_db.db_column_reg_start_year:[1990],
        cf_db.db_column_reg_end_year:[2000],
        cf_db.db_column_reg_art:[
            'Article Règlement comp avec unite manquante'
        ],
        cf_db.db_column_reg_para:[
            'Paragraphe Règlement comp avec unite manquante'
            ],
        cf_db.db_column_reg_city:[
            'Ville Règlement comp avec unite manquante'
        ]
    })
    reg_def = pd.DataFrame({ 
        cf_db.db_column_stacked_parking_id:[
            28,
            29
            ],
        cf_db.db_column_parking_regs_id:[
            14,
            14
            ],
        cf_db.db_column_parking_subset_id:[
            1,
            2
            ],
        cf_db.db_column_threshold_value:[
            0,
            0 
            ],
        cf_db.db_column_parking_operation:[
            None,
            3
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            0, # reg 9 b
            0
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None, 
            None
            ],
        cf_db.db_column_parking_slope_min:[
            0.05,
            0.25
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            None
            ],
        cf_db.db_column_parking_unit_id:[
            2,
            3
            ]
    })
    units = pd.DataFrame({
        cf_db.db_column_units_id:[1,2],
        cf_db.db_column_unit_description:['Aire plancher','Employé'],
        cf_db.db_column_tax_data_column_to_multiply:['rl0308a','rl0308a'],
        cf_db.db_column_tax_data_conversion_slope:[1,0.01], # 1 employé par 100m2 , 1 salle par 40m2
        cf_db.db_column_tax_data_conversion_zero:[0,0]
    })
    big_pr = PR.ParkingRegulations(reg_header,reg_def,units)
    return big_pr