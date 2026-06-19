"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Parking regulations are a mathematical and information pot pourri which 
are used to represent individual parking regulations. They can contain 
one or more depending on the need and some functions require a single 
regulation. Validation methods have been put in place to ensure that
the regulations follow the required format
"""


import pandas as pd
from functools import singledispatchmethod,singledispatch
import numpy as np
from sqlalchemy import create_engine,text
from typing import Union,Self

from config import config_db

class ParkingRegulations():
    def __init__(self,reg_head:pd.DataFrame,reg_def:pd.DataFrame,units_table:pd.DataFrame)->None:
        self.reg_head = reg_head
        self.reg_def = reg_def
        self.units_table = units_table
    
    def __repr__(self)->str:
        n_regs  = len(self.reg_head[config_db.db_column_parking_regs_id].unique())
        n_lines = len(self.reg_def[config_db.db_column_stacked_parking_id].unique())

        return f"{n_regs} règlements sur {n_lines} lignes"
    
    def get_reg_id(self)->int:
        """
        # get_reg_id
        Return the regulation id if there is only one
        
        Inputs:
            - None
        
        Returns:
            - integer identifier of regulation
        """
        if self.check_only_one_regulation():
            return self.reg_head[config_db.db_column_parking_regs_id].unique().tolist()[0]
        else:
            raise ValueError('Method get_reg_id should only be run if there is a single regulation in the object')

    def get_subset_def(self,subset_id:int)->pd.DataFrame:
        """
        # get_subset_def
        Returns the subset given in the intefer specifier if there is only 
        one regulation
        
        Inputs:
            - subset_id: Identifier for the subset to retrieve
        Returns:
            - a Dataframe with the required subset. 
        """
        if self.check_only_one_regulation():
            return self.reg_def.loc[self.reg_def[config_db.db_column_parking_subset_id]==subset_id]
        else:
            raise ValueError('Method get_subset_def only valid when there is a single regulation in the object')
        
    def get_subset_intra_operation_type(self,subset:int)->int:
        """
        # get_subset_intra_operation_type
        Returns the type of the operation within a subset. The expectation is that the first operator will
        be an inter subset operator and all subsequent ones will be the same

        Inputs:
            - subset: specifies the identifier of the subset
        Outputs:
            - an integer denoting the internal operation type. should be 1(addition) or 4(threshold based)
        """
        subset_def = self.get_subset_def(subset).copy()
        if len(subset_def)>1:
            subset_def.sort_values(by=config_db.db_column_stacked_parking_id,ascending=True,inplace=True)
            other_operators = subset_def[config_db.db_column_parking_operation].iloc[1:].unique().tolist()
            if len(other_operators)==1 and isinstance(other_operators[0],(int,float,np.number)):
                return other_operators[0]
            else:
                raise ValueError('Subset can only have one operator within it and it must be an number')
        else:
            return 1 # return addition as default for simple reg
        
    def concat_regs(self,right: Self):
        """
        # concat_regs
        concatenates two regulations into one, eliminating duplicate units if they exist
        and ensuring no overlap in stacked ids or main rule ids. Syntax is left.concat(right)
        and returns a new ParkingRegulations

        Inputs:
            - left: ParkingRegulation
            - right: ParkingRegulation
        """
        # Header definitions - duplicate IDs indicate corrupted data.
        new_header = pd.concat(
            [
                self.reg_head,
                right.reg_head,
            ],
            ignore_index=True,
        )

        if new_header.duplicated(
            subset=[config_db.db_column_parking_regs_id]
        ).any():
            raise ValueError("Duplicate parking regulation IDs detected while concatenating regulations.")

        # Stacked parking definitions - duplicate IDs indicate corrupted data.
        new_definition = pd.concat(
            [
                self.reg_def,
                right.reg_def,
            ],
            ignore_index=True,
        )

        if new_definition.duplicated(
            subset=[config_db.db_column_stacked_parking_id]
        ).any():
            raise ValueError("Duplicate stacked parking definition IDs detected while concatenating regulations.")

        # Units may legitimately appear in both tables. Ensure duplicate IDs
        # represent identical rows before removing the redundant copies.
        new_units = pd.concat(
            [
                self.units_table,
                right.units_table,
            ],
            ignore_index=True,
        )

        unit_id = config_db.db_column_units_id

        for _, group in new_units.groupby(unit_id):
            if len(group) > 1:
                # More than one distinct row for the same unit ID => conflict.
                if len(group.drop_duplicates()) > 1:
                    raise ValueError(
                        f"Conflicting definitions found for unit ID {group.iloc[0][unit_id]}."
            )

        new_units = new_units.drop_duplicates(subset=[unit_id])
        return ParkingRegulations(new_header,new_definition,new_units)
         
    def validate(self:Self):
        """
        # validate
        Runs validation error correction and raises error if there are any issues.
        """
        errors=[]
        errors=self.collect_validation_errors(errors)
        if errors:
            raise ValueError(errors)

    def collect_validation_errors(self,errors):
        """
        # collect_validation_errors
        Collects errors from following checks:
        
        checks:
            - All header ids are unique
            - All stacked ids are unique
            - All unit ids are unique(may need to change if unit conversion changes with land use)
            - All header ids have a least one line of definition    s
            - Every line in definition has at least one non na intercept or slope
            - First operator in every subset is 3 or 6 
            - Other operators in a subset are all the same and either 1 or 4

        designed into a collector so it can be used by inheriting classes namely parking regulation sets

        inputs:
            - self: a ParkingRegulations object
            - errors: list of validation errors which are returnd
        """
        errors=check_unique_helper(self.reg_head,config_db.db_column_parking_regs_id,'Header',errors)
        errors=check_unique_helper(self.reg_def,config_db.db_column_stacked_parking_id,'Definition',errors)
        errors=check_unique_helper(self.units_table,config_db.db_column_units_id,'Units',errors)
        errors=self.check_all_rules_have_definition(errors)
        errors=self.check_all_units_have_definition(errors)
        errors=self.check_math_def_valid_vectorized(errors)
        errors=self.check_inter_operators_correct(errors)
        errors=self.check_intra_operators_correct(errors)
        return errors
        
    def check_all_rules_have_definition(self, errors):
        """
        # check_all_rules_have_definition
        Checks whether all the rules have a mathematical definition attached
        which can be used to ensure that
        """
        missing_rules = self.reg_head.loc[
            ~self.reg_head[config_db.db_column_parking_regs_id]
            .isin(self.reg_def[config_db.db_column_parking_regs_id])
        ]

        if not missing_rules.empty:
            errors.append({
                "type": "missing_definition",
                "message": "Rules with no definition lines",
                "rule_ids": missing_rules[config_db.db_column_parking_regs_id].tolist()
            })

        return errors
    
    def check_all_units_have_definition(self, errors):
        """ 
        # check_all_units_have_definition
        Validates that the units which are used in the definition
        of the regulations are all specified
        Inputs:
            - self: to access relevant tables
            - errors: JSON like list where all the errors are appended
        Outputs
            - errors: errors list after having been updated
        """
        missing_rules = self.reg_def.loc[
            ~self.reg_def[config_db.db_column_parking_unit_id]
            .isin(self.units_table[config_db.db_column_units_id])
        ]

        if not missing_rules.empty:
            errors.append({
                "type": "missing_units",
                "message": "definitions with missing units",
                "rule_ids": missing_rules[config_db.db_column_parking_regs_id].tolist()
            })

        return errors

    def check_math_def_valid_vectorized(self,  errors):
        """
        # check_math_def_valid_vectorized
        Checks whether any of the mathematical definitions are completely wrong. This basically
        means that if all the intercepts and slopes are set to None, this regulation is
        invalid
        """
        cols = [
            config_db.db_column_parking_zero_crossing_min,
            config_db.db_column_parking_zero_crossing_max,
            config_db.db_column_parking_slope_min,
            config_db.db_column_parking_slope_max,
        ]

        id_cols = [
            config_db.db_column_parking_regs_id,
            config_db.db_column_stacked_parking_id,
        ]

        numeric = pd.DataFrame(index=self.reg_def.index)
        invalid_numeric = pd.DataFrame(index=self.reg_def.index)
        for c in cols:
            raw = self.reg_def[c]
            converted = pd.to_numeric(raw, errors="coerce")
            numeric[c] = converted
            invalid_numeric[c] = raw.notna() & converted.isna()

        invalid_values = self.reg_def.loc[invalid_numeric.any(axis=1)]
        if not invalid_values.empty:
            errors.extend(
                invalid_values[id_cols]
                .assign(
                    type="invalid_math_value",
                    message="Slope/intercept values must be numeric or empty",
                )
                .rename(columns={
                    id_cols[0]: "rule_id",
                    id_cols[1]: "stacked_id",
                })
                .to_dict("records")
            )

        valid_mask = numeric.notna() & np.isfinite(numeric)

        has_any_valid = valid_mask.to_numpy().any(axis=1)

        invalid = self.reg_def.loc[~has_any_valid]

        if invalid.empty:
            return errors

        errors.extend(
            invalid[id_cols]
            .assign(
                type="invalid_math_definition",
                message="No valid slope or intercept values"
            )
            .rename(columns={
                id_cols[0]: "rule_id",
                id_cols[1]: "stacked_id"
            })
            .to_dict("records")
        )

        return errors

    def check_inter_operators_correct(self, errors):
        """
        # check_inter_operators_correct
        function checks whether the first operator in every subset is either 3 or 6
        If it's the first subset, the first operator should be None
        """
        df = self.reg_def.sort_values(
            by=config_db.db_column_stacked_parking_id
        )

        grouped = df.groupby(
            [
                config_db.db_column_parking_regs_id,
                config_db.db_column_parking_subset_id
            ]
        )

        first_ops = grouped[config_db.db_column_parking_operation].first(skipna=False)

        subset_ids = first_ops.index.get_level_values(
            config_db.db_column_parking_subset_id
        )

        ops = first_ops

        valid = (
            (subset_ids == 1) & ops.isna()
        ) | (
            ((subset_ids != 1) & ops.isin([3, 6]))
        )

        invalid = ops.loc[~valid]

        if not invalid.empty:
            errors.append({
                "type": "invalid_inter_subset_operator",
                "message": "Subset 1 allows NaN; others require 3 or 6",
                "groups": [
                    {"rule_id": i[0], "subset_id": i[1]}
                    for i in invalid.index
                ]
            })

        return errors

    def check_intra_operators_correct(self, errors):
        """
        # check_intra_operators_correct
        Checks whether the operators within are subset are all the same and wheter
        they are set to either 1(addition) or 4(threshold based).
        """
        df = self.reg_def.sort_values(
            by=config_db.db_column_stacked_parking_id
        )

        group_cols = [
            config_db.db_column_parking_regs_id,
            config_db.db_column_parking_subset_id
        ]

        other = df[df.groupby(group_cols).cumcount().ne(0)]

        op_sets = other.groupby(group_cols)[
            config_db.db_column_parking_operation
        ].agg(lambda x: set(x))

        valid = op_sets.apply(
            lambda s: s.issubset({1, 4}) and len(s) == 1
        )

        invalid = op_sets.loc[~valid]

        if not invalid.empty:
            errors.append({
                "type": "invalid_intra_operator_rule",
                "message": "Only one operator per subset allowed: 1 or 4 (no mixing)",
                "invalid": [
                    {
                        "rule_id": idx[0],
                        "subset_id": idx[1],
                        "operators": list(vals)
                    }
                    for idx, vals in invalid.items()
                ]
            })

        return errors

    def get_subset_thresholds(self,subset:int):
        """
        # get_subset_tresholds
        Returns a list of thresholds within the specified subset. Should only run if there is 
        a single regulation in the object
        Inputs:
            - subset: the identifier of the subset you're trying to get subsets for
        Outputs
            - an ordered list of thresholds used in the subset
        """
        if self.check_only_one_regulation() and self.get_subset_intra_operation_type(subset)==4:
            return self.reg_def.sort_values(
                by=config_db.db_column_threshold_value,
                ascending=False).loc[
                    self.reg_def[
                        config_db.db_column_parking_subset_id]==subset
                        ,config_db.db_column_threshold_value].tolist()
        else:
            raise ValueError('this should only be run if there is a single regulation in the object')
        
    def get_line_item_by_subset_threshold(self,subset:int,threshold:float):
        """
        # get_line_item_by_subset_threshold
        Returns the mathematical definition to be used for a given subset and threshold

        Inputs:
            - subset: the identifier of the subset for which you're trying to get the item
            - threshold: the threshold for which you're trying to get data
        Outputs:
            - the row of a dataframe with the correct threshold and subset values
        """
        if self.check_only_one_regulation() and self.get_subset_intra_operation_type(subset)==4:
            return self.reg_def.loc[(self.reg_def[config_db.db_column_parking_subset_id]==subset) &(self.reg_def[config_db.db_column_threshold_value]==threshold)]
        else:
            raise ValueError('This function could lead to multiple results if there are multiple rule present')
        
    def get_units(self)->list[int]:
        """
        # get_units 
        renvoie une liste des unités utilisées dans le règlement
        
        Outputs
            - returns a list of unique unit identifiers within the object
        """
        units = self.reg_def[config_db.db_column_parking_unit_id].unique().tolist()
        return units
    
    def get_subset_numbers(self)->list[int]:
        """
        # get_subset_numbers
        Returns the identifiers of the available subsets
        """
        subsets = self.reg_def[config_db.db_column_parking_subset_id].unique().tolist()
        return subsets
    
    def check_only_one_regulation(self)->bool:
        """
        # check_only_one_regulation
        checks that there is only one regulation in the object
        
        Outputs
            True if there's only one regulation, False otherwise
        """
        n_regulations_head = len(self.reg_head[config_db.db_column_parking_regs_id].unique().tolist())
        n_regulations_def = len(self.reg_def[config_db.db_column_parking_regs_id].unique().tolist())
        if n_regulations_def==1 and n_regulations_head==1:
            return True
        else :
            return False

    def check_subset_exists(self,subset:int)->bool:
        """
        # check_subset_exists
        Checks whether the specified subset exists. This assumes that the object onto 
        which this is run has only one regulation in it
        """
        if self.check_only_one_regulation():
            if subset in self.reg_def[config_db.db_column_parking_subset_id].unique().tolist():
                return True
            else: 
                return False
        else:
            raise IndexError('Should only run this function if there is only one reg in object')
        
    def get_subset_units(self,subset:int)->list[int]:
        """
        # get_subset_units
        Returns the unique set of units used the specified subset

        Inputs:
            - subset: integer specifying the subset for which you're trying to get the units
        Outputs 
            - list of integers
        """
        #print('not yet implemented')
        if self.check_only_one_regulation() and self.check_subset_exists(subset):
            units = self.reg_def.loc[self.reg_def[config_db.db_column_parking_subset_id]==subset,config_db.db_column_parking_unit_id].unique().tolist()
            return units
        else:
            raise IndexError('Function only implemented for single regs and existing subsets')

    def get_subset_inter_operation_type(self,subset:int)->int:
        """
        # get_subset_inter_operation_type
        Gets the operator to use between the subset whose id was specified and previous subset

        Inputs:
            - subset: integer specifying the subset for which you want to obtain the operator 
        Outputs
            - integer of the specified operator should be 3 or 6 which gets checked at validation stage
        """
        try:
            subset_def = self.get_subset_def(subset).sort_values(by=config_db.db_column_stacked_parking_id,ascending=True)
            first_op = subset_def[config_db.db_column_parking_operation].iloc[0]
            if pd.isna(first_op):
                inter_operator_out = int(3)  # or any default value you prefer
            else:
                inter_operator_out = int(first_op)
            if subset == 1:
                inter_operator_out = int(3)
            return inter_operator_out
        except Exception as e:
            print(f'issue with the following rule: \n {self.get_subset_def(subset)}')
            return 3
        
    @singledispatchmethod
    def get_reg_by_id(self,id_to_get_)->Self:
        """
        # get_reg_by_id
        Returns the regulation or Regulations specified as inputs

        Inputs:
            - ids: int or list of ints specifying the ids of the regulations to retrieve

        Outputs:
            - ParkingRegulations object with the rule or rules whose ids were specified
        """
        raise NotImplementedError("Cannot retrieve this data type")

    @get_reg_by_id.register
    def _(self,id_to_get_:int):
        data = self.reg_head.loc[self.reg_head[config_db.db_column_parking_regs_id]==id_to_get_]
        long_regs = self.reg_def.loc[self.reg_def[config_db.db_column_parking_regs_id]==id_to_get_]
        units_out = self.units_table[self.units_table[config_db.db_column_units_id].isin(long_regs[config_db.db_column_parking_unit_id].unique().tolist())]
        object_out = ParkingRegulations(data,long_regs,units_out)
        return object_out


    @get_reg_by_id.register
    def _(self,id_to_get_:np.ndarray):
        data = self.reg_head.loc[self.reg_head[config_db.db_column_parking_regs_id].isin(id_to_get_)]
        long_regs = self.reg_def.loc[self.reg_def[config_db.db_column_parking_regs_id].isin(id_to_get_)]
        units_out = self.units_table[self.units_table[config_db.db_column_units_id].isin(long_regs[config_db.db_column_parking_unit_id].unique().tolist())]
        object_out = ParkingRegulations(data,long_regs,units_out)
        return object_out
    
    @get_reg_by_id.register
    def _(self,id_to_get_:list):
        data = self.reg_head.loc[self.reg_head[config_db.db_column_parking_regs_id].isin(id_to_get_)]
        long_regs = self.reg_def.loc[self.reg_def[config_db.db_column_parking_regs_id].isin(id_to_get_)]
        units_out = self.units_table[self.units_table[config_db.db_column_units_id].isin(long_regs[config_db.db_column_parking_unit_id].unique().tolist())]
        object_out = ParkingRegulations(data,long_regs,units_out)
        return object_out
    
@singledispatch
def from_postgis(indice_)->ParkingRegulations:
    """
    # from_postgis
    Returns regulations whose identifiers are specified

    Inputs:
        - indice_: an integer or list of integers that are the identifiers of the ParkingRegulations to obtain
    Output:
        - ParkingRegulations Object containing the definition of the desired regulations
    """
    raise NotImplementedError("Cannot retrieve this data type")

@from_postgis.register
def _(indice_:int):
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        command = f"SELECT * FROM public.entete_reg_stationnement WHERE {config_db.db_column_parking_regs_id} = {indice_}"
        reg_head = pd.read_sql(command,con,index_col = config_db.db_column_parking_regs_id).reset_index()
        command = f"SELECT * FROM public.reg_stationnement_empile WHERE {config_db.db_column_parking_regs_id} = {indice_}" 
        reg_def = pd.read_sql(command,con,index_col = config_db.db_column_parking_regs_id).reset_index()
        command = f"SELECT * FROM public.multiplicateur_facteurs_colonnes"
        units_table = pd.read_sql(command,con).reset_index()
    object_out = ParkingRegulations(reg_head,reg_def,units_table)
    return object_out

@from_postgis.register
def _(indice_:list):
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        command = f"SELECT * FROM public.entete_reg_stationnement WHERE {config_db.db_column_parking_regs_id} IN ({','.join(map(str, indice_))})"
        reg_head = pd.read_sql(command,con,index_col = config_db.db_column_parking_regs_id).reset_index()
        command = f"SELECT * FROM public.reg_stationnement_empile WHERE {config_db.db_column_parking_regs_id} IN ({','.join(map(str, indice_))})" 
        reg_def = pd.read_sql(command,con,index_col = config_db.db_column_parking_regs_id).reset_index()
        command = f"SELECT * FROM public.multiplicateur_facteurs_colonnes"
        units_table = pd.read_sql(command,con).reset_index()
    object_out = ParkingRegulations(reg_head,reg_def,units_table)
    return object_out

def get_units_for_regs(regs_units_for:Union[list[int],int])->pd.DataFrame:
    """
    # get_units_for_reg
    Helper function used to obtain the units used in a given regulation
    
    Inputs:
        - reg_units_for: integer or list of integers which specify the ids of the 
        rules for which one wants to get the rule ids
    outputs:
        - a dataframe with columns for the reg_id, reg_unit and unit description
    """
    # TODO: move all this into the utilities file with the function that calls it and move it to a single
    # SQL query to avoid running multiple queries across different methods and then joining them. this is 
    # a mess
    query = ''
    if isinstance(regs_units_for,list):
        query=f"""
            SELECT DISTINCT
                rse.id_reg_stat,
                rse.unite,
                mfc.desc_unite
            FROM
                public.reg_stationnement_empile as rse
            JOIN
                public.multiplicateur_facteurs_colonnes as mfc on mfc.id_unite = rse.unite 
            WHERE 
                rse.id_reg_stat IN ({','.join(map(str,regs_units_for))})
            """    
    else:
        query=f"""
            SELECT DISTINCT
                rse.id_reg_stat,
                rse.unite,
                mfc.desc_unite
            FROM
                public.reg_stationnement_empile as rse
            JOIN
                public.multiplicateur_facteurs_colonnes as mfc on mfc.id_unite = rse.unite 
            WHERE 
                rse.id_reg_stat = {regs_units_for}
            """    
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        units = pd.read_sql_query(query,con)
    return units

def check_unique_helper(df: pd.DataFrame, col: str, table_name: str, errors):
    """
    # check_unique_helper
    Checks whether the specified column in database has only unique values.
    Used to ensure that there are no duplicate identifiers on a number of different
    datatables within the definitions of the rules.

    Inputs:
        - df: Pandas dataframe which is being checked
        - col: column which is being checked for duplicates
        - table_name: display string describing the table
        - errors: list of errors which is being appended gets passed between differnt
        validation functions
    Outputs:
        - errors: returns the input errors plus the errors which were found while
        looking for duplicates
    
    """
    counts = df[col].value_counts(dropna=False)
    duplicates = counts[counts > 1]

    if not duplicates.empty:
        errors.append({
            "type": "duplicate_keys",
            "table": table_name,
            "column": col,
            "values": duplicates.to_dict(),
            "message": f"Duplicate values found in {table_name}.{col}"
        })

    return errors

def is_valid_slope_or_intercept(x) -> bool:
    """
    # is_valid_slope_or_intercept
    Checks the slopes are either numeric or none types. Numbers means  
    the value is specified and can be calculated, None means this isn't 
    specified, and any other value is invalid and triggers an error.  
    Used as a helper function in the prediction of number of spots
    
    output:
        - Returns True if x is a valid numeric value.
        - Returns False if x is None or NaN.
        - Raises ValueError if x is an unexpected type.
    """
    if x is None:
        return False

    # pandas / numpy safe NaN check
    if pd.isna(x):
        return False

    if isinstance(x, (int, float, np.number)) and np.isfinite(x):
        return True

    raise ValueError(f"Invalid slope/intercept type: {type(x)} ({x})")
    
if __name__ =="__main__":
    table = config_db.db_table_parking_reg_headers
    table_long_regs = config_db.db_table_parking_reg_stacked
    table_units = config_db.db_table_units
    id_column = config_db.db_column_parking_regs_id
    #data = retrieve_table(table,id_column)
    #long_regs = retrieve_table(table_long_regs,id_column)
    #units_table = retrieve_table(table_units,config_db.db_units_id)
    #instance_of_parking_regs = ParkingRegulations(data,long_regs,units_table)
    #print(instance_of_parking_regs)
    #reg_by_id = instance_of_parking_regs.get_reg_by_id(np.array([1,3,4]))
    #print(reg_by_id)
    test_postgis_retrieval = from_postgis([1,3,4])
    
    print(test_postgis_retrieval)

