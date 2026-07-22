/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Lowest level file for querying the dabased and the required python scripts to extract regulation 
set information. 
*/



import { DbAssociationReglementUtilSol, DbEnteteEnsembleReglement } from "ensembleReglements.types";
import { unit_reg_reg_set_land_use_output, unit_reg_reg_set_land_use_query } from "inventaire.types";
import {
    PoolClient
} from "pg";
import { DbEnteteReglement, DbReglementComplet } from "reglements.types";
import { DbUtilisationSol } from "utilisationDuSol.types";
import { spawn } from "child_process";
import path from "path";

/**
 * runs the queries to search regulation sets
 * @param client a pg pool client on which to run the queries
 * @param param1 the items that are parsed from query
 * @returns an array of regulation set set headers for consumption
 */
export async function RunObtainRegSetHeadersQueriesRepo(
    client: PoolClient,
    {
        date_debut_er_avant,
        date_debut_er_apres,
        date_fin_er_avant,
        date_fin_er_apres,
        description_like,
        id_er,

    }: {
        date_debut_er_avant?: string,
        date_debut_er_apres?: string,
        date_fin_er_avant?: string,
        date_fin_er_apres?: string,
        description_like?: string,
        id_er?: string | string[]
    }
) {
    let queryConds = [];
    let queryVals = [];
    let countquery = 1;
    let query = `
        SELECT *
        FROM public.ensembles_reglements_stat
      `
    if (typeof (date_debut_er_avant) !== 'undefined') {
        console.log('ajout condition date_debut_er_avant')
        if (date_debut_er_avant !== 'null') {
            queryConds.push(`(date_debut_er <= $${countquery} OR date_debut_er IS NULL)`);
            queryVals.push(date_debut_er_avant);
            countquery++;
        } else {
            queryConds.push(`date_debut_er IS NULL`);
        }
    }
    if (typeof (date_debut_er_apres) !== 'undefined') {
        console.log('ajout condition date_debut_er_apres')
        if (date_debut_er_apres !== 'null') {
            queryConds.push(`date_debut_er >= $${countquery}`);
            queryVals.push(date_debut_er_apres);
            countquery++;
        } else {
            queryConds.push(`date_debut_er IS NULL`);
        }
    }
    if (typeof (date_fin_er_avant) !== 'undefined') {
        console.log('ajout condition date_fin_er_avant')
        if (date_fin_er_avant !== 'null') {
            queryConds.push(`date_fin_er <= $${countquery}`);
            queryVals.push(date_fin_er_avant);
            countquery++;
        } else {
            queryConds.push(`date_fin_er IS NULL`);
        }
    }
    if (typeof (date_fin_er_apres) !== 'undefined') {
        console.log('ajout condition date_fin_er_apres')
        if (date_fin_er_apres !== 'null') {
            queryConds.push(`(date_fin_er >= $${countquery} OR date_fin_er IS null)`);
            queryVals.push(date_fin_er_apres);
            countquery++;
        } else {
            queryConds.push(`date_fin_er IS NULL`);
        }
    }
    if (typeof (description_like) !== 'undefined') {
        console.log('ajout condition description')
        queryConds.push(`to_tsvector('french', description_er) @@ plainto_tsquery('french', $${countquery})`)
        queryVals.push(description_like as string)
        countquery++;
    }
    if (typeof (id_er) !== 'undefined') {
        let id_er_list: string[] = [];
        if (typeof id_er === 'string') {
            id_er_list = id_er.split(',');
        } else if (Array.isArray(id_er)) {
            id_er_list = id_er.flatMap(item => typeof item === 'string' ? item.split(',') : []);
        }
        if (id_er_list.length === 1) {
            queryConds.push(`id_er = $${countquery}`);
            queryVals.push(id_er_list[0]);
            countquery++;
        } else if (id_er_list.length > 1) {
            // Generate placeholders for each id_er
            const placeholders = id_er_list.map((_, idx) => `$${countquery + idx}`).join(',');
            queryConds.push(`id_er IN (${placeholders})`);
            queryVals.push(...id_er_list);
            countquery += id_er_list.length;
        }
    }
    if (queryConds.length > 0) {
        query += '\n WHERE ' + queryConds.join(' \n AND ')
    }
    query += `\n ORDER BY id_er ASC`
    let result;
    if (queryConds.length > 0) {
        result = await client.query<DbEnteteEnsembleReglement>(query, queryVals);
    } else {
        result = await client.query<DbEnteteEnsembleReglement>(query);
    }
    return result.rows
}
/**
 * runs the requiered regulations sets with complete definition based on the required ids
 * @param client a pg pool client on which to run the queries
 * @param id an array of regulation set ids on which to get the data
 * @returns an object with the restult head, the associated regulations and the land use table
 */
export async function RunObtainSpecificRegSetQueriesRepo(client: PoolClient, id: number[]) {
    // Dynamically create placeholders for the query (e.g., $1, $2, $3, ...)
    if (id.length>0){
        const placeholders = id.map((_: number, index: number) => `$${index + 1}`).join(',');
        // Obtain the headers for the identified parking regulation set
        const query_1 = `
                SELECT *
                FROM public.ensembles_reglements_stat
                WHERE id_er IN (${placeholders})
                ORDER BY id_er ASC
            `;
        // Obtain the assignments of parking regulations to land use and sort by land use code

    const result_header = await client.query<DbEnteteEnsembleReglement>(query_1, id);
    const query2 = `
            SELECT id_assoc_er_reg, id_reg_stat,cubf,id_er
            FROM public.association_er_reg_stat
            WHERE id_er IN (${placeholders})
            ORDER BY cubf::text ASC
          `
    const result_rules = await client.query<DbAssociationReglementUtilSol>(query2, id);
        
        // obtain all the land use code ids and descriptions
        const query_3 = `
                SELECT *
                FROM public.cubf
                ORDER BY cubf ASC
            `
        const resulUtilSol = await client.query<DbUtilisationSol>(query_3);
        // package the result in the correct format
        return {
            entete_all: result_header.rows,
            assoc_util_reg_all: result_rules.rows,
            table_util_sol: resulUtilSol.rows
        }
    }else{
        throw new Error('must specify at least one complete reg set to obtain')
    }
}

/**
 * allows the user to query what regs are used in a given reg set
 * @param client a pool client to use for the query
 * @param id the id of the regulation set you're obtaining the rules for
 * @returns an array of regualtion headers which are linked to the specified regulation set
 */
export async function RunGetRegsForRegSetRepo(client: PoolClient, id: number) {
    const query_1 = `
            WITH reg_pert AS(
              SELECT DISTINCT id_reg_stat
              from public.association_er_reg_stat
              where id_er = $1
            )
    
            SELECT * 
            FROM public.entete_reg_stationnement
            where id_reg_stat in (SELECT id_reg_stat from reg_pert)
          `;

    const result_header = await client.query(query_1, [id]);
    return result_header.rows

}
/**
 * Query runner to obtain the required regsfor a given territory
 * @param client a pool client used to run the queries
 * @param id identifier of the territory you're pulling reg sets for
 * @returns an array of reg set headers which are associated with the territory
 */
export async function RunGetRegSetHeadersFromTerritoryRepo(client: PoolClient, id: number) {

    const query = `
      WITH associations AS (
        SELECT 
          id_asso_er_ter,
          id_periode_geo,
          id_er
        FROM 
          public.association_er_territoire
        WHERE
          id_periode_geo = $1
      )
        SELECT
              ers.id_er,
              ers.description_er,
              ers.date_debut_er,
              ers.date_fin_er
        FROM public.ensembles_reglements_stat ers
        JOIN 
          associations ON associations.id_er = ers.id_er
        ORDER BY 
          date_debut_er ASC
      `;
    const result = await client.query<DbEnteteEnsembleReglement>(query, [id]);
    return result.rows
}
/**
 * 
 * @param client a pool client on which to run the queries
 * @param taxIds the tax identifiers for which we're trying to 
 * @returns an array of regulation sets which overlap with the tax identifiers
 */
export async function RunGetRegSetByTaxDataRepo(client: PoolClient, taxIds: string[]) {
    const query = `
        WITH role AS (
          SELECT 
          rf.id_provinc,
          rf.geometry,
          COALESCE(rf.rl0307a::int, 0) as annee_constr,
          hg.id_periode
          FROM
          public.role_foncier rf
          left join historique_geopol hg on (hg.date_debut_periode <= COALESCE(rf.rl0307a::int, 0) OR hg.date_debut_periode is null) AND (hg.date_fin_periode >= COALESCE(rf.rl0307a::int, 0) OR hg.date_fin_periode is null)
          WHERE id_provinc = ANY($1::text[])
        ), territoire_avec_annee as(
          SELECT
            cs.id_periode_geo,
            cs.geometry,
            cs.id_periode,
            hg.date_debut_periode,
            hg.date_fin_periode,
            ers.id_er,
            ers.description_er,
            ers.date_debut_er,
            ers.date_fin_er
          FROM
            cartographie_secteurs cs
          LEFT JOIN historique_geopol hg on hg.id_periode = cs.id_periode 
          left join association_er_territoire aet on aet.id_periode_geo = cs.id_periode_geo
          left join ensembles_reglements_stat ers on ers.id_er = aet.id_er
        )
        SELECT
          role.id_provinc,
          --role.annee_constr,
          --role.id_periode,
          --taa.id_periode_geo,
          --taa.date_debut_periode,
          --taa.date_fin_periode,
          --
          --role.geometry as geometry_role,
          --taa.geometry as geometry_sector,
          taa.id_er,
          taa.description_er,
          taa.date_debut_er,
          taa.date_fin_er
        FROM 
          role
        left join territoire_avec_annee taa 
          on taa.id_periode = role.id_periode 
          AND ST_Intersects(role.geometry,taa.geometry) 
          AND (role.annee_constr >= taa.date_debut_er or taa.date_debut_er is null) 
          AND (role.annee_constr <= taa.date_fin_er or taa.date_fin_er is null)
      `;
    const result = await client.query(query, [taxIds]);
    return result.rows
}

/**
 * Repository function to insert the required data into the database
 * @param client a pool client to use to inser teh data
 * @param param1 a parameter containing description start an end dates for the new regulation set header
 * @returns the create regulation set header
 */
export async function RunCreateNewRegSetHeaderRepo(
    client: PoolClient,
    {
        description_er,
        date_debut_er,
        date_fin_er
    }: {
        description_er: string,
        date_debut_er: number | null,
        date_fin_er: number | null
    }
) {
    const query = `
        INSERT INTO public.ensembles_reglements_stat(description_er,date_debut_er,date_fin_er)
        VALUES ($1,$2,$3)
        RETURNING *;
      `;
    const result = await client.query<DbEnteteEnsembleReglement>(query, [description_er, date_debut_er, date_fin_er]);
    return result.rows[0]
}

/**
 * Puts in place the queries required to delete a regulation set and its children
 * @param client a pg PoolClient used for the operation
 * @param id_er the identifier of the regulation set to delete
 * @returns a boolean indicating whether the relevant entries were deleted
 */
export async function RunDeleteRegSetRepo(
    client:PoolClient,
    id_er:number
){
    const queryCountAssoc = `
            SELECT
              COUNT(*) as count_assoc_lines
            FROM
              public.association_er_reg_stat
            WHERE 
              id_er = $1;
          `;
            const resultCount = await client.query(queryCountAssoc, [id_er]);
            let queryHeader: string;
            let queryAssoc: string;
            let resultHeader: any;
            let resultAssoc: any;
            if (resultCount.rows[0].count_assoc_lines > 0) {
                queryHeader =
                    ` DELETE FROM public.ensembles_reglements_stat
                WHERE id_er = $1; `
                queryAssoc =
                    ` DELETE FROM public.association_er_reg_stat
                WHERE id_er = $1`
                resultAssoc = await client.query(queryAssoc, [id_er]);
                resultHeader = await client.query(queryHeader, [id_er]);
            } else {
                queryHeader =
                    ` DELETE FROM public.ensembles_reglements_stat
                WHERE id_er = $1; `
                resultHeader = await client.query(queryHeader, [id_er]);
                resultAssoc = { rowCount: 1 }
            }
            const successHeader = resultHeader && resultAssoc.rowCount >= 0 ? true : false;
            const successAssoc = resultAssoc && resultAssoc.rowCount >= 0 ? true : false;
        return successHeader && successAssoc
}


/**
 * Puts in place the sql query required to update a reg set header
 * @param client a pg PoolClient used to run the operation
 * @param id_er the identifier of the reg set to update
 * @param description_er the updated desciption of the regulation set
 * @param date_debut_er the updated start year of the regulation set
 * @param date_fin_er the updated end year of the regulation set
 * @returns the updated line in the table
 */
export async function RunUpdateRegSetRepo(
    client:PoolClient,
    id_er:number,
    description_er:string,
    date_debut_er:number|null,
    date_fin_er:number|null
){
    const query = `
        UPDATE public.ensembles_reglements_stat
        SET 
          description_er = $1,
          date_debut_er = $2,
          date_fin_er = $3
        WHERE id_er = $4
        RETURNING *;
      `;
        const result = await client.query<DbEnteteEnsembleReglement>(query, [description_er, date_debut_er, date_fin_er, id_er]);
        return result.rows[0]
}

/**
 * Creates an assignment of regulation to land use
 * @param client a pg Poolclient used to run the queries
 * @param id_er the identifier of the regulation set we're creating an assignment for
 * @param id_reg_stat the identifier of the parking regulation we're creating
 * @param cubf the identifier of the land use we're assigning the data to
 * @returns the new assignement
 */
export async function RunCreateRegSetAssocRepo(client:PoolClient,id_er:number,id_reg_stat:number,cubf:number){
    const query = `
        INSERT INTO public.association_er_reg_stat(id_er,cubf,id_reg_stat)
        VALUES ($1,$2,$3)
        RETURNING *;
      `;
    const result = await client.query<DbAssociationReglementUtilSol>(query, [id_er, cubf, id_reg_stat]);
    return result.rows[0]
}

/**
 * runs the queries to modify a reg set association
 * @param client the pg poolclient being used to run thing
 * @param id_assoc the id of the assignment you want to modify
 * @param id_er the id of the regulation set which the assignment is used in
 * @param id_reg_stat the id of the regulation being assigend
 * @param cubf the id of the land use being assigned
 * @returns the updated assignement of data
 */
export async function RunModifyRegSetAssocRepo(client:PoolClient,id_assoc:number,id_er:number,id_reg_stat:number,cubf:number){
     const query = `
        UPDATE public.association_er_reg_stat
        SET 
          id_er = $1,
          cubf= $2,
          id_reg_stat= $3
        WHERE id_assoc_er_reg = $4
        RETURNING *;
      `;
        const result = await client.query<DbAssociationReglementUtilSol>(query, [id_er, cubf, id_reg_stat, id_assoc]);
        return result.rows[0]
}

/**
 * runs the queries required to delete a land use to regulation assignment
 * @param client the pg poolclient to use for the transaction
 * @param id_assoc the id of the assignment you're trying to delete
 * @returns a boolean flag denoting success or faillure
 */
export async function RunDeleteRegSetAssocRepo(client:PoolClient,id_assoc:number){
    const queryAssoc =
            ` DELETE FROM public.association_er_reg_stat
          WHERE id_assoc_er_reg = $1`
        const resultAssoc: any = await client.query(queryAssoc, [id_assoc]);

        const successAssoc = resultAssoc && resultAssoc.rowCount >= 0 ? true : false;
        return successAssoc
}

/**
 * Part of the sequence of operations to get the required units and regulation for a chart based on 
 * the land use and the regulation sets which have been selected
 * @param json_in the body json which has been stringified in order to be fed to python
 * @returns a string reprensenting the output of the python script which will need to be parsed
 */
export async function RunChartsInfoPythonRepo(json_in:string){
    return new Promise<{
        success: boolean;
        data?: string;
        message?: string;
    }>((resolve) => {

        const scriptPath = path.resolve(
            __dirname,
            "../../../../serveur_calcul_python/obtention_information_graphiques.py"
        );

        const pythonExecutable =
            "/opt/conda/envs/serveur_calcul_python/bin/python3";

        const pythonProcess = spawn(pythonExecutable, [scriptPath]);

        pythonProcess.stdin.write(json_in);
        pythonProcess.stdin.end();

        let outputData = "";
        let errorData = "";

        pythonProcess.stdout.on("data", (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            errorData += data.toString();
        });

        pythonProcess.on("close", (code) => {
            if (code === 0) {
                resolve({
                    success: true,
                    data: outputData,
                });
            } else {
                resolve({
                    success: false,
                    message: errorData,
                });
            }
        });

        pythonProcess.on("error", (err) => {
            resolve({
                success: false,
                message: err.message,
            });
        });
    });
}
 
/**
 * parse the python output into an array 
 * @param string_in the raw output string of the python script which is run in the RunChartsInfoPython
 * @returns an array with the  reg set and reg and units used in the reg for the spcified land use and reg sets
 */
export function parsePythonOuputJSONRepo(string_in:string){
    const jsonStartIndex = string_in.indexOf('[');
    if (jsonStartIndex !== -1) {
        const jsonString = string_in.slice(jsonStartIndex).trim();
        const jsonData: unit_reg_reg_set_land_use_query[] = JSON.parse(jsonString);
        return jsonData
    }else{
        throw new Error("Could not find the start of the ouput array check script")
    }

}

/**
 * takes the raw output of the python scripts and adds description
 * @param client the pg pool client used for the queries
 * @param jsonData the array output of parsePythonOuputJSONRepo
 * @returns 3 arrays conting the desctiptions of the units, the description of the regulations and the descrtiptions of the regulation sets
 */
export async function RunGetAssociatedInformationRepo(client: PoolClient, jsonData: unit_reg_reg_set_land_use_query[]) {
    const regsToGet = jsonData.map(e => e.id_reg_stat);
    const unitsToGet = jsonData.flatMap(e => e.unite);
    const RegSetsToGet = jsonData.flatMap(e => e.id_er);
    const uniqueUnits = Array.from(new Set(unitsToGet)).filter(u => typeof u === 'number' || typeof u === 'string');
    const uniqueRegs = Array.from(new Set(regsToGet)).filter(u => typeof u === 'number' || typeof u === 'string');
    const uniqueRegSets = Array.from(new Set(RegSetsToGet)).filter(u => typeof u === 'number' || typeof u === 'string');
    let output: unit_reg_reg_set_land_use_output[];
    output = []
    if (uniqueUnits.length > 0 && uniqueRegs.length > 0 && uniqueRegSets.length > 0) {
        const placeholders = uniqueUnits.map((_, i) => `$${i + 1}`).join(',');
        const placeHolderRegs = uniqueRegs.map((_, i) => `$${i + 1}`).join(',');
        const placeHolderRegSets = uniqueRegSets.map((_, i) => `$${i + 1}`).join(',');
        const unitDescsQuery = `
              SELECT id_unite, desc_unite
              FROM public.multiplicateur_facteurs_colonnes
              WHERE id_unite IN (${placeholders})
              `;
        const regDescQuery = `
                SELECT 
                  id_reg_stat, 
                  description 
                FROM public.entete_reg_stationnement
                WHERE id_reg_stat IN (${placeHolderRegs})
              `
        const regSetDescQuery = `
                SELECT id_er,description_er
                FROM public.ensembles_reglements_stat
                WHERE id_er IN (${placeHolderRegSets})
              `
        const [result_unit, result_regs, result_regSets] = await Promise.all([client.query(unitDescsQuery, uniqueUnits), client.query(regDescQuery, uniqueRegs), client.query(regSetDescQuery, uniqueRegSets)]);
        return {
            result_unit:result_unit.rows,
            result_regs:result_regs.rows,
            result_regSets:result_regSets.rows
        }
    }else{
        throw new Error('Error in retrieving pertinent information to match with python output')
    }
}  
/**
 * 
 * @param jsonData the raw output of parse parsePythonOuputJSONRepo
 * @param result_unit the list of unit ids and descriptions from RunGetAssociatedInformationRepo
 * @param result_regs the list of regulation ids and descriptiosn from RunGetAssociatedInformationRepo
 * @param result_regSets the lisf of reg set ids and descriptions from RunGetAssociatedInformationRepo
 * @returns a large array with the units used for each reg/reg set
 */
export function RunJoinQueriesToPythonOutputRepo(
    jsonData:unit_reg_reg_set_land_use_query[],
    result_unit:{id_unite:number,desc_unite:string}[],
    result_regs:{id_reg_stat:number,description:string}[],
    result_regSets:{id_er:number,description_er:string}[]
){
    const output = jsonData.map(e => ({
        id_er: e.id_er,
        desc_er: result_regSets.find((o) => o.id_er === e.id_er)?.description_er ?? 'N/A',
        id_reg_stat: e.id_reg_stat,
        desc_reg_stat: result_regs.find((p) => p.id_reg_stat === e.id_reg_stat)?.description ?? 'N/A',
        unite: e.unite,
        desc_unite: e.unite.map((uniteOut) => result_unit.find((unitRet) => unitRet.id_unite === uniteOut)?.desc_unite ?? 'N/A')
    }));
    return output
}