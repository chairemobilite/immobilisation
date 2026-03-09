from classes.parking_regs import ParkingRegulations 
from classes.parking_regs import get_units_for_regs
import pandas as pd
import numpy as np
from typing import Optional, Union,Self
from sqlalchemy import create_engine,text
import sqlalchemy
from config import config_db
import copy
import logging

class ParkingRegulationSet(ParkingRegulations):
    '''# ParkingRegulationSet
    Inherits from parking regulations, adds on an association table between land uses and parking regulations. 
    ## Inputs:
            - name: description of regulationset
            - reg_head: herité de ParkingRegulations
            - reg_def: hérité de ParkingRegulations
            - start_date: date de début de l'ensemble de règlements. À valider contre les dates de validité des règlements individuels
            - end_date: date de fin de validité. À valider contre les dates de validité des règlements individuels
            - description: description de l'ensemble de règlements
            - association_table: association entre les règlements et les codes d'utilisations du bien-fonds
        '''
    def __init__(self,reg_head:pd.DataFrame,reg_def:pd.DataFrame,start_date:int,end_date:int,description:str,association_table:pd.DataFrame,ruleset_id:int,units_table:pd.DataFrame,all_land_uses_table:pd.DataFrame):
        super().__init__(reg_head,reg_def,units_table)
        self.start_date:int = start_date
        self.end_date:int = end_date
        self.description:str = description
        self.association_table:pd.DataFrame = association_table
        self.expanded_table:pd.DataFrame = pd.DataFrame(columns=[config_db.db_column_land_use_id,config_db.db_column_parking_regs_id])
        self.ruleset_id:int =ruleset_id
        self.land_use_table:pd.DataFrame = all_land_uses_table
        self.expand_land_use_table()
    
    def __repr__(self)->str:
        #joined_rules = self.association_table.merge(self.reg_head,how="left",on=self.id_column)
        #joined_rules = joined_rules.merge(self.reg_def,how="right",on=self.id_column)
        #joined_rules = joined_rules.sort_values(by=["cubf","ss_ensemble","seuil"])
        if self.end_date is None or (isinstance(self.end_date,float) and np.isnan(self.end_date)):
            out =   f'''Ruleset id:{self.ruleset_id:03} - Valide: {self.start_date:04.0f}-Présent - Description: {self.description}'''
        elif self.start_date is None or (isinstance(self.start_date,float) and np.isnan(self.start_date)):
            out =   f'''Ruleset id:{self.ruleset_id:03} - Valide: Sans début-{self.end_date:04.0f} - Description: {self.description}'''
        else:
            out =   f'''Ruleset id:{self.ruleset_id:03} - Valide: {self.start_date:04.0f}-{self.end_date:04.0f} - Description: {self.description}'''
        return out

    def validate_dates(self)-> tuple[bool,np.array]:
        '''
            Validates dates . ensures rules are valid at least as long as the regulation set
        '''
        max_date_regs = self.reg_head["annee_debut_reg"].max()
        min_date_regs = self.reg_head["annee_fin_reg"].min()
        if (max_date_regs>=self.start_date) and ((min_date_regs <= self.end_date) or not np.isnan(min_date_regs)):
            valid_date_bool = True
            invalid_regs_array = np.empty([1,1])
        else:
            valid_date_bool = False
            invalid_regs_array = self.reg_head.loc[
                (self.reg_head["annee_debut_reg"]>self.start_date) | 
                ((self.reg_head["annee_fin_reg"]<self.end_date)&(~self.reg_head["annee_fin_reg"].isna())),config_db.db_column_parking_regs_id].to_numpy()
        return valid_date_bool,invalid_regs_array

    def unique_parking_reg_ids(self)->list:
        return self.reg_head[config_db.db_column_parking_regs_id].unique().tolist()
    
    def verify_minimum_fill(self)->bool:
        '''# verify_minimum_fill 
            fonction qui assure que l'on ait au moins les codes d'utilisation du bien fonds 1 à 9 dans la table de définition initiale pour pouvoir faire l'expansion
        '''
        minimum_cubfs_present = self.association_table.loc[self.association_table[config_db.db_column_land_use_id].isin(list(range(1,10))),config_db.db_column_land_use_id]
        if len(minimum_cubfs_present)==9:
            minimum_fill_bool=True
        else:
            minimum_fill_bool=False
        return minimum_fill_bool

    def expand_land_use_table(self):
        '''# expand_land_use_table
                prend la table d'association fournie par l'utilisateur et l'étend de manière à ce que tous les cubf soient associés à un règlement de stationnement. De cette manière, on peut itérer au travers des règlement de stationnement qui sont moins nombreux que les CUBF. D'autre part, l'utilisation d'une table précompilée permet d'avoir à ne faire les assocations qu'une fois pour tirer l'information.'''
        land_uses = self.land_use_table
        # start with highest level
        if self.verify_minimum_fill():
            #initialize une table étendue pour avoir la liste de CUBF complète
            expanded_table:pd.DataFrame = copy.deepcopy(self.expanded_table).drop(columns=config_db.db_column_parking_regs_id)
            expanded_table[config_db.db_column_land_use_id] = copy.deepcopy(self.land_use_table[config_db.db_column_land_use_id])
            #expanded_table = expanded_table.loc[expanded_table[config_db.db_column_land_use_id]>=1000]
            expanded_table = expanded_table.sort_values(by=config_db.db_column_land_use_id)

            # au minimum on doit avoir les 10 grandes classes qu'on doit setter
            level_zero_land_uses = list(range(1,10))
            for land_use in level_zero_land_uses:
                # Pour 1 on set de 1000 à 1999, pour 2 de 2000 à 2999
                expanded_table.loc[(expanded_table[config_db.db_column_land_use_id]>= land_use * 1000) & (expanded_table[config_db.db_column_land_use_id]<= ((land_use * 1000)+999)),config_db.db_column_parking_regs_id] = self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
                # Pour 1 on set de 100 à 199, pour 2 on set de 200 à 299
                expanded_table.loc[(expanded_table[config_db.db_column_land_use_id]>= land_use * 100) & (expanded_table[config_db.db_column_land_use_id]<= ((land_use * 100)+99)),config_db.db_column_parking_regs_id] = self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
                # Pour 1 on set de 10 à 19, pour 2 on set de 20 à 29
                expanded_table.loc[(expanded_table[config_db.db_column_land_use_id]>= land_use * 10) & (expanded_table[config_db.db_column_land_use_id]<= ((land_use * 10)+99)),config_db.db_column_parking_regs_id] = self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
                # Pour 1 on set 1, pour 2 on set 2
                expanded_table.loc[expanded_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id] =self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
            # si on a des specification qui set des cubf entre 10 et 99 i.e. les sous categories, on les mets dans une listes 
            one_level_land_use = self.association_table.loc[(self.association_table[config_db.db_column_land_use_id]>=10) & (self.association_table[config_db.db_column_land_use_id]<=99),config_db.db_column_land_use_id].tolist()
            for land_use in one_level_land_use:
                # Pour 10 on set de 1000 à 1099, 11 on set de 1100 à 1199, 20 on set de 2000 à 2099,21 on set de 2100 à 2199
                expanded_table.loc[(expanded_table[config_db.db_column_land_use_id]>= land_use * 100) & (expanded_table[config_db.db_column_land_use_id]<= ((land_use * 100)+99)),config_db.db_column_parking_regs_id] = self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
                # pour 10 on set de 100 à 109, pour 11 on set 110 à 119
                expanded_table.loc[(expanded_table[config_db.db_column_land_use_id]>= land_use * 10) & (expanded_table[config_db.db_column_land_use_id]<= ((land_use * 10)+99)),config_db.db_column_parking_regs_id] = self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
                # Pour 10 on set 10, pour 11 on set 11
                expanded_table.loc[expanded_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id] =self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
             # si on a des specification qui set des cubf entre 100 et 999 i.e. les sous-sous categories
            two_level_land_use = self.association_table.loc[(self.association_table[config_db.db_column_land_use_id]>=100) & (self.association_table[config_db.db_column_land_use_id]<=999),config_db.db_column_land_use_id].tolist()
            for land_use in two_level_land_use:
                # Pour 100 on set de 1000 à 1009, 110 on set de 1100 à 1109, 111 on set de 1110 à 1119, 20 on set de 2000 à 2099,21 on set de 2100 à 2199
                expanded_table.loc[(expanded_table[config_db.db_column_land_use_id]>= land_use * 10) & (expanded_table[config_db.db_column_land_use_id]<= ((land_use * 10)+9)),config_db.db_column_parking_regs_id] = self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
                # Pour 100 on set 100, pour 110 on set 110
                expanded_table.loc[expanded_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id] =self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
            # si on dispose des specifications pour un CUBF spécifique
            three_level_land_use =self.association_table.loc[(self.association_table[config_db.db_column_land_use_id]>=1000),config_db.db_column_land_use_id].tolist()
            for land_use in three_level_land_use:
                expanded_table.loc[expanded_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id] =self.association_table.loc[self.association_table[config_db.db_column_land_use_id]==land_use,config_db.db_column_parking_regs_id].values[0]
            #expanded_table = expanded_table.loc[expanded_table[config_db.db_column_land_use_id]>=1000]
            expanded_table = expanded_table.sort_values(by=config_db.db_column_land_use_id,ascending=True)
            self.expanded_table = expanded_table
        else:
            raise ValueError("Missing land uses 1-9 which are necessary at a minimum")

    def get_unique_reg_ids(self)->list:
        unique_ids = self.reg_head[config_db.db_column_parking_regs_id].unique().tolist()
        return unique_ids

    def get_unique_reg_ids_using_land_use(self,land_uses:list[int])->list:
        '''
            # get_unique_reg_ids_using_land_use
                permet de retourner les règlements qui sont associés aux usage du sole dans la liste land_uses
        '''
        int_land_uses = list(map(int, land_uses))
        unique_ids = self.expanded_table.loc[ self.expanded_table[config_db.db_column_land_use_id].isin(int_land_uses),config_db.db_column_parking_regs_id].unique().tolist()
        return unique_ids
    
    def get_parking_reg_by_id(self,reg_id:int)->ParkingRegulations:
        new_reg_head = self.reg_head.loc[self.reg_head[config_db.db_column_parking_regs_id]==reg_id]
        new_reg_def = self.reg_def.loc[self.reg_def[config_db.db_column_parking_regs_id]==reg_id]
        new_units_table = self.units_table
        return ParkingRegulations(new_reg_head,new_reg_def,new_units_table)

    def get_all_units_used(self:Self)->list[int]:
        relevant_units = self.reg_def[config_db.db_column_parking_unit_id].unique().tolist()
        return relevant_units

def from_sql(ruleset_id:Union[int,list],con:sqlalchemy.Connection=None)->list[ParkingRegulationSet]:
    '''
    from_sql generates a ParkingRegulationSetObject from the PostgreSQL database
        - inputs: 
            - ruleset_id: can be integer or list of integer that point to the relevant ruleset(ensemble de règlements) that you want to pull
            - con: sqlalchemy connection
        - output:
            - list_to_out: list of ParkingRegulationSet with the relevant id'''
    # if no connection was provided create one
    if con==None:
        # create the sqlalchemy connection
        engine=create_engine(config_db.pg_string)
        # connect to database and start requests
        with engine.connect() as con:
            rulesets_header_table,rules_association_table,relevant_rules_def,relevant_rules_heads,units_table,land_use_table= run_sql_requests(ruleset_id,con)
    #otherwise, use what was provided
    else:
        rulesets_header_table,rules_association_table,relevant_rules_def,relevant_rules_heads,units_table,land_use_table= run_sql_requests(ruleset_id,con)
    # create empty list to append to
    list_to_out = []
    # if it's an integer, just pull the outputs and stick em in there
    if isinstance(ruleset_id,int):
        parking_set_to_out = ParkingRegulationSet(relevant_rules_heads,relevant_rules_def,rulesets_header_table.loc[0,"date_debut_er"],rulesets_header_table.loc[0,"date_fin_er"],rulesets_header_table.loc[0,"description_er"],rules_association_table,rulesets_header_table.loc[0,"id_er"],units_table,land_use_table)
        list_to_out.append(parking_set_to_out)
    # else break it down by the outputs
    elif isinstance(ruleset_id,list):
        for ruleset in ruleset_id:
            rules_to_out = rules_association_table.loc[rules_association_table["id_er"]==ruleset,"id_reg_stat"].unique()
            association_table_out = rules_association_table.loc[rules_association_table["id_er"]==ruleset]
            rules_to_out_head = relevant_rules_heads.loc[relevant_rules_heads["id_reg_stat"].isin(rules_to_out)]
            rules_to_out_stacks = relevant_rules_def.loc[relevant_rules_def["id_reg_stat"].isin(rules_to_out)]
            ruleset_to_out_header = rulesets_header_table.loc[rulesets_header_table["id_er"]==ruleset]
            parking_set_to_out = ParkingRegulationSet(rules_to_out_head,rules_to_out_stacks,ruleset_to_out_header["date_debut_er"].values[0],ruleset_to_out_header["date_fin_er"].values[0],ruleset_to_out_header["description_er"].values[0], association_table_out,ruleset_to_out_header["id_er"].values[0],units_table,land_use_table)
            #print(parking_set_to_out)
            list_to_out.append(parking_set_to_out)
    return list_to_out

def run_sql_requests(ruleset_id,con:sqlalchemy.Connection):
    # create the sqlalchemy connection
    engine=create_engine(config_db.pg_string)
    # connect to database and start requests
    with engine.connect() as con:
        # convert rulesets to retrieve to string for SQL request
        if isinstance(ruleset_id,int):
            list_of_rulesets=str(ruleset_id)
        else:
            list_of_rulesets = ",".join(map(str,ruleset_id))
        # pull the relevant rulesets headers
        command = f"SELECT * FROM public.{config_db.db_table_reg_sets_header} WHERE {config_db.db_column_reg_sets_id} IN ({list_of_rulesets})"
        rulesets_header_table = pd.read_sql(command,con=con)
        # go get the association table to have all the rules relevant to the rulesets you're trying to pull
        command = f"SELECT * FROM public.{config_db.db_table_reg_sets_match} WHERE {config_db.db_column_reg_sets_id} IN ({list_of_rulesets}) ORDER BY id_assoc_er_reg ASC"
        rules_association_table = pd.read_sql(command,con=con)
        # convert the relevant rules to string to pull the requests in the rules tables
        list_rules_to_retrieve = ",".join(rules_association_table[config_db.db_column_parking_regs_id].unique().astype(str))
        # pull the rules headers
        command = f"SELECT * FROM public.{config_db.db_table_parking_reg_headers} WHERE {config_db.db_column_parking_regs_id} IN ({list_rules_to_retrieve}) ORDER BY {config_db.db_column_parking_regs_id} ASC"
        relevant_rules_heads = pd.read_sql(command,con=con)
        # pull the stacked rules
        command = f"SELECT * FROM public.{config_db.db_table_parking_reg_stacked} WHERE {config_db.db_column_parking_regs_id} IN ({list_rules_to_retrieve}) ORDER BY {config_db.db_column_parking_regs_id},{config_db.db_column_stacked_parking_id} ASC"
        relevant_rules_def = pd.read_sql(command,con=con)
        # pull the units
        command = f"SELECT * FROM public.{config_db.db_table_units}"
        units_table = pd.read_sql(command,con=con)
        # pull all the available land uses
        command = f"select * from public.cubf"
        land_use_table= pd.read_sql(command,con=con)
    return rulesets_header_table,rules_association_table,relevant_rules_def,relevant_rules_heads,units_table,land_use_table


def get_parking_reg_for_lot(lot_id:str)->pd.DataFrame:
    NotImplementedError('Not Yet Implemented')
    query = f"""SELECT 
                    rf.RL0105A::int,
                    luc.description as description_cubf,
                    coalesce(rf.rl0307A::int,0) as rl0307a,
                    PRS.id_er,
                    PRS.description_er,
                    cs.id_periode_geo,
                    cs.ville_sec,
                    STRING_AGG(rf.id_provinc::text, ',') AS id_provinc_list,
                    SUM(rf.RL0308A) as rl0308a_somme,
                    SUM(rf.rl0311a) as rl0311a_somme,
                    SUM(rf.rl0312a) as rl0312a_somme,
                    SUM(rf.rl0404a) as rl0404a_somme
                FROM
                    public.association_cadastre_role AS cad
                JOIN
                    public.role_foncier AS rf ON cad.id_provinc = rf.id_provinc
                JOIN
                    public.cartographie_secteurs AS cs ON ST_Intersects(rf.geometry, cs.geometry)
                JOIN
                    public.historique_geopol AS hg ON cs.id_periode = hg.id_periode
                JOIN
                    public.association_er_territoire AS ass ON ass.id_periode_geo = cs.id_periode_geo
                JOIN
                    public.ensembles_reglements_stat AS PRS ON ass.id_er = PRS.id_er
                JOIN public.cubf luc on luc.cubf::int=rf.RL0105A::int
                WHERE
                    cad.g_no_lot = '{lot_id}' AND
                    (hg.date_debut_periode <= COALESCE(rf.RL0307A::int, 0) OR hg.date_debut_periode IS NULL) AND
                    (hg.date_fin_periode >= COALESCE(rf.RL0307A::int, 0) OR hg.date_fin_periode IS NULL) AND
                    (PRS.date_debut_er <= COALESCE(rf.RL0307A::int, 0) OR PRS.date_debut_er IS NULL) AND
                    (PRS.date_fin_er >= COALESCE(rf.RL0307A::int, 0) OR PRS.date_fin_er IS NULL)
                GROUP BY
                    rf.RL0105A,
                    PRS.id_er,
                    PRS.description_er,
                    cs.id_periode_geo,
                    cs.ville_sec,
                    rf.rl0307a,
                    luc.description;
            """
    engine = create_engine(config_db.pg_string)
    with engine.connect() as con:
        rulesets_association_data = pd.read_sql_query(query,con)
    rulesets_to_obtain = rulesets_association_data[config_db.db_column_reg_sets_id].unique().tolist()
    relevant_rulesets = from_sql(rulesets_to_obtain)
    association_with_rule = pd.DataFrame()
    for ruleset in relevant_rulesets:
        relevant_associations = rulesets_association_data.loc[rulesets_association_data[config_db.db_column_reg_sets_id]==ruleset.ruleset_id].copy()
        association_final = relevant_associations.merge(ruleset.expanded_table, left_on=config_db.db_column_tax_land_use,right_on=config_db.db_column_land_use_id,how="left")
        association_final = association_final.merge(ruleset.reg_head[[config_db.db_column_parking_regs_id,config_db.db_column_parking_description]],on=config_db.db_column_parking_regs_id,how="inner")
        association_final.rename(columns={'description':'description_reg_stat'},inplace=True)
        association_final = association_final.merge(ruleset.land_use_table,how='left', on=config_db.db_column_land_use_id)
        if association_with_rule.empty:
            association_with_rule = association_final
        else:
            association_with_rule = pd.concat(association_with_rule,association_final)
    units = get_units_for_regs(association_with_rule[config_db.db_column_parking_regs_id].to_list())
    association_with_rule= association_with_rule.merge(units,how='left',on=config_db.db_column_parking_regs_id)
    return association_with_rule

def get_all_reg_sets_from_database(engine:sqlalchemy.Engine=None)->list[ParkingRegulationSet]:
    '''
        # get_all_reg_sets_from_database
        Renvoie tous les ensembles de règlements dans une liste
            Intrants:
                - engine: Engine sqlalchemy de la connection
            Extrants:
                - liste[ParkingRegulationSet]: list des ensembles de règlements
    '''
    query = f'''
        SELECT
            {config_db.db_column_reg_sets_id}
        FROM {config_db.db_table_reg_sets_header}

    '''
    if engine is None:
        engine = sqlalchemy.create_engine(config_db.pg_string)
    with engine.connect() as con:
        reg_sets_ids:pd.DataFrame = pd.read_sql(query,con=con)
        rsi_list:list[int] = reg_sets_ids[config_db.db_column_reg_sets_id].unique().tolist()
        reg_sets = from_sql(rsi_list)
    return reg_sets

if __name__=="__main__":
    #entete_reglement = pd.DataFrame([[100,"test",1995,2009,"VQZ3","Annexe D","3.1-st-sacrement","CUQ"],
    #                                 [101,"test",1995,2009,"VQZ3","Annexe D","6.1-st-sacrement","CUQ"]],
    #                                 columns=["id_reg_stat","description","annee_debut_reg","annee_fin_reg","texte_loi","article_loi","paragraphe_loi","ville"])
    #reg_def = pd.DataFrame([[100,1,0,None,0,None,0.60,None,2],
    #                        [101,1,0,None,0,None,0.05,None,4]
    #                        ],columns=["id_reg_stat","ss_ensemble","seuil","oper","cases_fix_min","cases_fix_max","pente_min","pente_max","unite"])
    #association_table = pd.DataFrame([[1,1,100],
    #                                  [1,2,101],
    #                                  [1,3,101],
    #                                  [1,4,101],
    #                                  [1,5,101],
    #                                  [1,6,101],
    #                                  [1,7,101],
    #                                  [1,8,101],
    #                                  [1,9,101]],columns=["id_er","cubf","id_reg_stat"])
    #print(entete_reglement)
    #print(reg_def)
    #test_reg = ParkingRegulationSet(entete_reglement,reg_def,"id_reg_stat",1995,None,"Test",#association_table)
    #is_valid,invalid_values = test_reg.validate_dates()
    #print(is_valid)
    #parking_reg_test = from_sql(1)[0]
    #print("testing baseline")
    #print(parking_reg_test.verify_minimum_fill())
    #parking_reg_test.expand_land_use_table()
    #print("dropping cubf 9")
    #parking_reg_test_dropped:ParkingRegulationSet = copy.deepcopy(parking_reg_test)
    #parking_reg_test_dropped.association_table.drop(parking_reg_test.association_table.loc[parking_reg_test.association_table["cubf"]==9].index,inplace=True)
    #print(parking_reg_test_dropped.verify_minimum_fill())
    #print(parking_reg_test)
    values = get_parking_reg_for_lot('PC-32889')
    print(values)
