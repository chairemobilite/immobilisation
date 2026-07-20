"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Datastore for various parking regulations which are used. Another file
handles cases that are supposed to throw an error
"""


# external libraries
import pandas as pd
# internal functions
from config import config_db as cf_db
from classes import parking_regs as PR


# Cache at module level
_ALL_REGS = None

def _generate_all_regs():
    global _ALL_REGS
    if _ALL_REGS is None:
        _ALL_REGS = generate_all_relevant_regs()
    return _ALL_REGS

def generate_simple_rule_straight_conversion()->PR.ParkingRegulations:
    """
        # get_simple_rule_straight_conversion
        Returns a simple linear rule for the relevant test cases
    """
    return _generate_all_regs().get_reg_by_id(1)

def generate_threshold_based_reg()->PR.ParkingRegulations:
    """
        # generate_threshold_based_reg
        Test case for a threshold based regulation. One of the most
        common cases, this filters the huge set of regulations which
        are generated in the big generator function. Returns a simple 
        threshold based regulation 
    """
    return _generate_all_regs().get_reg_by_id(2)

def generate_addition_based_reg()->PR.ParkingRegulations:
    """
        # generate_addition_based_reg
        Test case for a rule where the minimum number of parking
        spots is a function of a linear combination of multiple 
        quantities which is one of the most common implementations 
        which was found will browsing the rules in the Quebec city 
        area during my masters
    """
    return _generate_all_regs().get_reg_by_id(3)

def generate_floor_based_reg()->PR.ParkingRegulations:
    """
        # generate_floor_based_reg
        Generates a test case with a floor on the number of spots.
        This implementation uses 2 subsets, one fixed and one linear
        with a most constraining or operator between the two
    """
    return _generate_all_regs().get_reg_by_id(4)

def generate_ceil_or_based_reg()->PR.ParkingRegulations:
    """
        # generate_ceil_or_based_reg
        Returns a regulation that has a floor a linear region and a ceiling.
        This implementation uses subsets and operators rather than the 
        threshold formulation used in the other ceiling test. 
    """
    return _generate_all_regs().get_reg_by_id(5)

def generate_ceil_thresh_based_reg()->PR.ParkingRegulations:
    """
        # generate_ceil_thresh_based_reg
        Returns a regulation that has a floor and a ceiling with a linear range
        in the middle. This implementation uses a threshold based formulation 
        rather than the alternate with minimums and maximums combined. This 
        variant uses only the minimums formulation with everything in one subset
        rather than multiple subset with or constraints
    """
    return _generate_all_regs().get_reg_by_id(6)

def generate_all_relevant_regs()->PR.ParkingRegulations:
    """
        # generate_all_relevant_regs
        Returns all the rules used in the test cases for rule computation. 
        This is one big function which creates the rules which can then be 
        filtered using built-in filtering tools. The filtering function is 
        tested as the first item in the rule calculation test sequence 
        because it is regularly used. Six rules are currently generated
        ranging from a simple rule, mounting through addition and threshold
        rules then more complex, multi subset rules 

    """
    reg_header = pd.DataFrame({
        cf_db.db_column_parking_regs_id:[1,2,3,4,5,6],
        cf_db.db_column_parking_description:[
            'Règlement min une seule pente',
            'Règlement min base seuil',
            'Règlement min basé addition avec conversion',
            'Règlement min avec plancher',
            'Règlement min avec plafond max',
            'Règlement min avec plafond seuil'
        ],
        cf_db.db_column_reg_ident:[
            'Texte règlement une seule pente',
            'Texte règlement basé seuil',
            'Texte Règlement addition avec conversion',
            'Texte Règlement plancher',
            'Texte Règlement plafond max',
            'Texte Règlement plafond seuil' 
        ],
        cf_db.db_column_reg_start_year:[1990,1995,1990,1990, 1990,1990],
        cf_db.db_column_reg_end_year:[2000,2000,2000,2000,2000,2000],
        cf_db.db_column_reg_art:[
            'article règlement une seule pente',
            'article règlement seuil',
            'article règlement addition avec conversion',
            'article règlement plancher',
            'article règlement plafond max',
            'article règlement plafond seuil'
        ],
        cf_db.db_column_reg_para:[
            'Paragraph règlement une seule pente',
            'Paragraphe Règlement seuil',
            'Paragraphe Règlement addition avec conversion',
            'Paragraphe règlement plancher',
            'Paragraphe règlement plafond max',
            'Paragraphe règlement plafond seuil'],
        cf_db.db_column_reg_city:[
            'Ville règlement une seule pente',
            'Ville règlement seuil',
            'Ville règlement addition avec conversion',
            'Ville règlement plancher',
            'Ville règlement plafond max',
            'Ville règlement plafond seuil'
        ]
    })
    reg_def = pd.DataFrame({ 
        cf_db.db_column_stacked_parking_id:[
            1, # règlement 1: min une seule pente
            2, # Règlemetn 2: seuil
            3, 
            4, # Règlement 3: addition
            5,
            6, # Reg : plancher
            7,
            8,# plafond max
            9,
            10,
            11, # plafond seuil
            12,
            13
            ],
        cf_db.db_column_parking_regs_id:[
            1, # Reg 1: pente
            2, # reg 2: seuile
            2,
            3, # reg 3: addition
            3,
            4, # reg 4: plancher
            4,
            5, # reg 5: plafond max
            5, 
            5,
            6, # reg 6: plafond seuil
            6,
            6,
            ],
        cf_db.db_column_parking_subset_id:[
            1, # Reg 1 : 1 seul sous ensemble
            1, # Reg 2 : 1 seul sous ensemble
            1,
            1, # Reg 3: 1 seul sous ensemble
            1,
            1, # Reg 4: plancher 2 sous ensembles
            2,
            1, # reg 5: plancher et plafond max
            2,
            3,
            1, # reg 6: plancher et plafond seuil 1 seul sous ensemble
            1,
            1
            ],
        cf_db.db_column_threshold_value:[
            0, # reg 1
            0, # reg 2 seuil
            100, # seuil à 100m2
            0,# reg 3 addition
            0, # reg 3 addition
            0, # reg 4 plancher
            0, # reg 4 plancher
            0, # reg 5 plafond max,
            0, # reg 5 pladond max.
            0, # reg 5 plafond max
            0, # reg 6 plafond seuil
            200, # Reg 6 plafond seuil
            700 # reg 6 plafond seuil
            ],
        cf_db.db_column_parking_operation:[
            None,
            None, # Reg 1 seuil
            4,  # Seuil à 100m2 
            None, # reg 3
            1, # reg 3 1 signifie additoin 
            None,# reg 4 se 1
            3, # reg 4 ou plus contraignant
            None, # reg 5 plafond max
            3,
            3,
            None, # reg plafnd seuil
            4,
            4
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            0, # 
            0, # reg 2: 1 place par 20m2 jusqu 100m2 pui un place par 100m2 au dela
            4, # cases_fix_min_1 = cases_fix_min_0+ pente_min_0 * seuil_1 - pente_min_1 * seuil_1
            0, # reg 3: basé addition tout à zéro
            0, # reg 3: basé addtion 
            10, # reg 4: basé min max
            0,
            0, # reg 5
            10,
            None,
            10, # reg 6
            0,
            35
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None,# reg 1
            None,# ref 2
            None,
            None, #reg 3
            None,
            None, # reg 4
            None,
            None,# reg 5
            None, 
            35,
            None, # reg 6
            None,
            None
            ],
        cf_db.db_column_parking_slope_min:[
            0.05, # reg 1
            0.05, # reg 2
            0.01, 
            0.5, # reg 3 addition 0.5 par employe + 0.25 par salle
            0.25,
            None, # reg 4 10 places ou 1 place par 20m2 au plus contraignant
            0.05,
            0.05, # reg 5 10 places ou 1 place par 20m2 jusqu 'a concurrence de 35 places
            None,
            None,
            None, # reg 6
            0.05,
            None
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            None
            ],
        cf_db.db_column_parking_unit_id:[
            1,
            1,
            1,
            2,
            3,
            1,
            1,
            1,
            1,
            1, 
            1,
            1,
            1
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

def generate_simple_reg_still_valid()->PR.ParkingRegulations:
    """
    # generate_simple_reg_still_valid
    Generates a simple regulation which is still valid which is to be
    used in the reg_set validation routine tests
    """
    reg_header=pd.DataFrame({
        cf_db.db_column_parking_regs_id:[25],
        cf_db.db_column_parking_description:['Reglement Simple encore en vigueur'],
        cf_db.db_column_reg_ident:['Texte Règlement simple encore en vigueur'],
        cf_db.db_column_reg_start_year:[1990],
        cf_db.db_column_reg_end_year:[None],
        cf_db.db_column_reg_art:['Article reglement simple en vigueur'],
        cf_db.db_column_reg_para:['Paragraphe reglement simple en vigueur'],
        cf_db.db_column_reg_city:['Ville règlement simple encore en vigueur'],
    })
    reg_def=generate_simple_rule_straight_conversion().reg_def
    reg_def[cf_db.db_column_parking_regs_id]=25
    units_table=generate_simple_rule_straight_conversion().units_table
    return PR.ParkingRegulations(reg_header,reg_def,units_table)

def generate_simple_reg_eternal()->PR.ParkingRegulations:
    """
    # generate_simple_reg_eternal
    Generates a simple regulation which is represented as having no start date
    i.e. that spans back eternally for reg_set timeline validation testing
    """
    reg_header=pd.DataFrame({
        cf_db.db_column_parking_regs_id:[26],
        cf_db.db_column_parking_description:['Reglement Simple éternel'],
        cf_db.db_column_reg_ident:['Texte Règlement simple éternel'],
        cf_db.db_column_reg_start_year:[None],
        cf_db.db_column_reg_end_year:[2000],
        cf_db.db_column_reg_art:['Article reglement éternel'],
        cf_db.db_column_reg_para:['Paragraphe reglement éternel'],
        cf_db.db_column_reg_city:['Ville règlement simple éternel'],
    })
    reg_def=generate_simple_rule_straight_conversion().reg_def
    reg_def[cf_db.db_column_parking_regs_id]=26
    units_table=generate_simple_rule_straight_conversion().units_table
    return PR.ParkingRegulations(reg_header,reg_def,units_table)

def generate_subset_unit_check_reg():
    """
    # generate_subset_unit_check_reg
    Generates a regulation with multiple subsets using multiple units in order 
    to perform testing on the various methods which are used to access subset 
    data. Regulation attempts to have non overlapping outputs in order to make
    sure that the obtained data isn't just blind luck or a default
    """
    reg_head= pd.DataFrame({
        cf_db.db_column_parking_regs_id:[27],
        cf_db.db_column_parking_description:['Reglement complexe multi subset, multi unité'],
        cf_db.db_column_reg_ident:['Texte Reglement complexe multi subset, multi unité'],
        cf_db.db_column_reg_start_year:[1990],
        cf_db.db_column_reg_end_year:[None],
        cf_db.db_column_reg_art:['Article Reglement complexe multi subset, multi unité'],
        cf_db.db_column_reg_para:['Paragraphe Reglement complexe multi subset, multi unité'],
        cf_db.db_column_reg_city:['Ville Reglement complexe multi subset, multi unité'],
    })
    reg_def=pd.DataFrame({
        cf_db.db_column_stacked_parking_id:[
            30,
            31,
            32,
            33,
            34,
            35,
            36
            ],
        cf_db.db_column_parking_regs_id:[
            27,
            27,
            27,
            27,
            27,
            27,
            27
            ],
        cf_db.db_column_parking_subset_id:[
            1, 
            1, 
            2,
            2,
            3,
            3,
            3
            ],
        cf_db.db_column_threshold_value:[
            0, 
            0, 
            0,
            0, 
            0,
            200, # Reg 6 plafond seuil
            700 # reg 6 plafond seuil
            ],
        cf_db.db_column_parking_operation:[
            None,
            1,
            3,
            1,
            6,
            4, 
            4
            ],
        cf_db.db_column_parking_zero_crossing_min:[
            0,
            0,
            0,
            0,
            0,
            0,
            0
            ],
        cf_db.db_column_parking_zero_crossing_max:[
            None,# reg 1
            None,# ref 2
            None,
            None, #reg 3
            None,
            None,
            None
            ],
        cf_db.db_column_parking_slope_min:[
            1, 
            0.6, 
            0.7, 
            0.9, 
            0.5,
            0.33, 
            0.2,
            ],
        cf_db.db_column_parking_slope_max:[
            None,
            None,
            None,
            None,
            None,
            None,
            None,
            ],
        cf_db.db_column_parking_unit_id:[
            1,
            2,
            2,
            3,
            1,
            1,
            1
            ]
    })

    units = pd.DataFrame({
        cf_db.db_column_units_id:[1,2,3],
        cf_db.db_column_unit_description:['Aire plancher','Employé','Salle'],
        cf_db.db_column_tax_data_column_to_multiply:['rl0308a','rl0308a','rl0311a'],
        cf_db.db_column_tax_data_conversion_slope:[1,0.01,0.025], # 1 employé par 100m2 , 1 salle par 40m2
        cf_db.db_column_tax_data_conversion_zero:[0,0,0]
    })

    return PR.ParkingRegulations(reg_head,reg_def,units)

if __name__ == "__main__":
    generate_all_relevant_regs()