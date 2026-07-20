"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

These data represent the inputs to the parking calculation. Initially 
devised for semi manual calculations they now form the first step in the 
calculation chain where relevant units are computed based on tax data which 
is available
"""

import pandas as pd
import geopandas as gpd
from config import config_db
from typing import Union,Self
import classes.parking_reg_sets as PRS
import classes.parking_regs as PR
import classes.tax_dataset as TD
import numpy as np
class ParkingCalculationInputs(pd.DataFrame):
    """Class that inherits from pandas.DataFrame then customizes it with additonal methods."""
    def __init__(self,*args,**kwargs):
        super(ParkingCalculationInputs,self).__init__(*args,**kwargs)
        
    @property
    def _constructor(self):
        """
        Creates a self object that is basically a pandas.Dataframe.
        self is a dataframe-like object inherited from pandas.DataFrame
        self behaves like a dataframe + new custom attributes and methods.
        """
        return ParkingCalculationInputs
    
    def _repr_html_(self):
        # Ensure the DataFrame HTML representation is returned for Data Wrangler
        return pd.DataFrame(self).to_html()

    def check_columns(self):
        """
        # check_columns
        Checks whether the required columns are all in the dataframe used as input
        """
        if ((config_db.db_column_lot_id in self.columns) and 
            (config_db.db_column_land_use_id in self.columns) and 
            (config_db.db_column_parking_unit_id in self.columns) and
            (config_db.db_column_parking_regs_id) in self.columns and
            (config_db.db_column_converted_value in self.columns)):
            return True
        else:
            raise KeyError('Need lot id, land use, unit id, reg id and converted value in columns')
        
    def get_by_reg(self,reg_id:int)->Self:
        """
        # get_by_reg
        Returns the parking calculation inputs based on the parkingRegulation identifier

        Inputs: 
            - reg_id: integer representing the identifier of the parking id for which we want to 
            obtain a ParkingCalculationInput
        
        Outputs:
            - ParkingCaculationInput from the filterinf operation
        """
        return self.loc[self[config_db.db_column_parking_regs_id]==reg_id]
    
    def get_by_units(self,unit_ids:Union[int,list[int]])->Self:
        """
        # get_by_units
        Return a ParkingCalculationInputs with only items which have the
        required id. Id can be integer or list of integers
        
        Inputs:
            - units_ids: integer of list integers representing the entries 
            of the ParkingCalculationsInput which you want to filter based on 
            units
        
        Outputs:
            - ParkingCalculationInputs with only the demanded ids  
        """
        if isinstance(unit_ids,int):
            return self.loc[self[config_db.db_column_parking_unit_id]==unit_ids]
        else:
            return self.loc[self[config_db.db_column_parking_unit_id].isin(unit_ids)]
    
    def filter_by_threshold(self,lower_thresh:Union[float,None],upper_thresh:Union[float,None])->Self:
        """
        # filter_by_threshold
        Returns only the inputs of the ParkingCalculationsInput which fall within the
        required thresholds which are upper and lower threshold

        Inputs:
            - lower_thresh: Threshold above which you want to return values. Anything below is discarded
            - upper_thresh: Threshold below which you want to return values. Anything above is discarded
            If set to None, only the lower threshold is enforced

        Outputs
            - ParkingCalculationInputs items that fall within the two thresholds
        """
        if isinstance(lower_thresh,float) and upper_thresh is None:
            return self.loc[self[config_db.db_column_converted_value]>=lower_thresh]
        elif isinstance(lower_thresh,float) and isinstance(upper_thresh,float):
            return self.loc[(self[config_db.db_column_converted_value]>=lower_thresh)& (self[config_db.db_column_converted_value]<upper_thresh)]
        elif lower_thresh is None and isinstance(upper_thresh,float):
            return self.loc[(self[config_db.db_column_converted_value]<upper_thresh)]
        else:
            raise ValueError('At least one of the thresholds must be a float')
    
    def check_units_present(self,units:list[int])->bool:
        """
        # check_units_present
        Ensure that the units are present in the ParkingCalculationsInput
        
        Inputs:
            - units: a list of integers specifying the ids of the unit to look for
        Outputs
            - boolean: True if the units are present for every entry
            False otherwise
        """
        ## check that all the relevant units are present
        all_combinations = pd.MultiIndex.from_product(
            [self[config_db.db_column_lot_id].unique(), units],
            names=[config_db.db_column_lot_id, config_db.db_column_parking_unit_id]
        ).to_frame(index=False)

        # Merge with the existing relevant_data to see which combinations are present
        merged = all_combinations.merge(
            self[[config_db.db_column_lot_id, config_db.db_column_parking_unit_id]],
            on=[config_db.db_column_lot_id, config_db.db_column_parking_unit_id],
            how='left',
            indicator=True
        )

        # Filter for missing combinations
        missing_units = merged[merged['_merge'] == 'left_only'].drop('_merge', axis=1)

        # Display results
        if missing_units.empty:
            return True
        else:
            return False

def compute_valeur(row):
    """
    # compute_caleur
    Helper function used in  apply to return the relevant conversion for the line

    Input:
        - row: inputs a row of a dataframe with intercept, slope and name column to use as input
    Output: 
        - a float value of the converted unit
    """
    # 1️⃣ Pull the three pieces we need
    zero   = row[config_db.db_column_tax_data_conversion_zero]
    slope  = row[config_db.db_column_tax_data_conversion_slope]
    col_to_use = row[config_db.db_column_tax_data_column_to_multiply]   # <-- this is the *name* of the column we want

    # 2️⃣ Does the column actually exist in this DataFrame?
    if col_to_use not in row.index:
        # Column name not found → decide what you want to do.
        # Here we return NaN so you can spot the problem later.
        return np.nan

    # 3️⃣ Grab the value from the dynamically‑chosen column
    factor = row[col_to_use]

    # 4️⃣ Coerce everything to numeric, turning bad values into NaN
    try:
        zero   = pd.to_numeric(zero,   errors='coerce')
        slope  = pd.to_numeric(slope,  errors='coerce')
        factor = pd.to_numeric(factor, errors='coerce')
    except Exception:
        return np.nan

    # 5️⃣ If any piece is NaN, decide on a fallback.
    #    Below we treat missing numbers as 0 (you could also return NaN).
    zero   = 0 if pd.isna(zero)   else zero
    slope  = 0 if pd.isna(slope)  else slope
    factor = 0 if pd.isna(factor) else factor

    # 6️⃣ Final calculation
    return zero + slope * factor

def generate_input_from_PRS_TD(prs: PRS.ParkingRegulationSet,td:TD.TaxDataset, scale:float=None)->ParkingCalculationInputs:
    """ # generate_input_from_PRS_TD
        Fonction permettant de créer un ParkingCalculationInput. L'hyopthèse principale de la fonction est que le 
        PRS est applicable à l'ensemble fourni aucune segmentation des données foncières n'est faite pour valider 
        les intrants

        Entrées:
            - prs: PRS.ParkingRegulationSet qui nous permet d'indéxer 
            un ensemble de règlements en vigueur à un moment
            - td: TD.TaxDataset qui est l'ensemble des données entrantes 
            à partir desquels ont veut créer un intrant de calcul
            - scale: utilisé seulement pour faire de l'analyse de sensibilité 
            au facteurs de conversion
        Sorties: 
            - ParkingCalculationsInput: Objet de la class ParkingCalculationsInputs 
            (essentiellement un dataframe pandas) qui peut être utilisé pour le 
            calcul de la capacité de stationnement
    """
    try:
        if scale is None:
            units= prs.units_table
        else:
            units= prs.units_table
            units.loc[units[config_db.db_column_tax_data_conversion_slope]!=1,config_db.db_column_tax_data_conversion_slope] =  units.loc[units[config_db.db_column_tax_data_conversion_slope]!=1,config_db.db_column_tax_data_conversion_slope] * scale
        # relevant reg ids
        relevant_regulation_ids = prs.get_unique_reg_ids()
        # 
        units_used = prs.get_all_units_used()
        units_final = units.loc[units[config_db.db_column_units_id].isin(units_used)]
        relevant_columns:list[str] = units_final[config_db.db_column_tax_data_column_to_multiply].unique().tolist()
        relevant_columns.append(config_db.db_column_tax_id)
        relevant_columns.append(config_db.db_column_tax_land_use)
        combined_tax_table = td.lot_table[[config_db.db_column_lot_id,'g_va_suprf']].merge(td.lot_association,how='left',on=config_db.db_column_lot_id).merge(td.tax_table[relevant_columns],how='left',on=config_db.db_column_tax_id)
        tax_rule_table = combined_tax_table.merge(prs.expanded_table,how='left',left_on=config_db.db_column_tax_land_use,right_on=config_db.db_column_land_use_id)
        rule_units_association = prs.reg_def[[config_db.db_column_parking_regs_id, config_db.db_column_parking_unit_id]].drop_duplicates()
        # You can now use rule_units_association as needed, for example:
        tax_rule_units_merge= tax_rule_table.merge(rule_units_association,how='inner',on=config_db.db_column_parking_regs_id)
        conversion_factors_merge = tax_rule_units_merge.merge(units_final[[config_db.db_column_units_id,config_db.db_column_tax_data_conversion_slope,config_db.db_column_tax_data_conversion_zero,config_db.db_column_tax_data_column_to_multiply]],how='left',left_on=config_db.db_column_parking_unit_id,right_on=config_db.db_column_units_id)
        
        conversion_factors_merge[config_db.db_column_converted_value] = conversion_factors_merge.apply(compute_valeur,
            axis=1
        )
        conversion_factors_merge_out_start = conversion_factors_merge[
            [
                config_db.db_column_lot_id,
                config_db.db_column_parking_regs_id,
                config_db.db_column_parking_unit_id,
                config_db.db_column_land_use_id,
                config_db.db_column_converted_value
            ]
        ]
        final_out = conversion_factors_merge_out_start.groupby(
                [
                    config_db.db_column_lot_id, 
                    config_db.db_column_parking_regs_id, 
                    config_db.db_column_parking_unit_id, 
                    config_db.db_column_land_use_id
                ]).agg({
                    config_db.db_column_converted_value: lambda s: s.sum(min_count=1)
                    }).reset_index()
        #duplicates_for_fun = final_out.groupby(config_db.db_column_lot_id).agg(count=(config_db.db_column_lot_id, 'count')).reset_index()
        #duplicates_for_fun = duplicates_for_fun.loc[duplicates_for_fun['count']>1,config_db.db_column_lot_id].to_list()
        #complex_outs = final_out.loc[final_out[config_db.db_column_lot_id].isin(duplicates_for_fun)]
        #print(final_out)
        final_out[config_db.db_column_reg_sets_id] = int(prs.ruleset_id)
        final_out[config_db.db_column_parking_regs_id] = final_out[config_db.db_column_parking_regs_id].astype(int)
        PCI_to_Out = ParkingCalculationInputs(final_out)
        return PCI_to_Out
    except Exception as e:
        print('caught error in conversion from tax dataset to relevant calculation input')