/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

This file is used to conduct business logic and is the start point for the various repositories which
actually query the database
*/


import { 
    DbAssociationReglementUtilSol, 
    DbEnteteEnsembleReglement 
} from '@localTypes/ensembleReglements.types'
import pool from '../../db/createPool'
import { RunChartsInfoPythonRepo, RunCreateNewRegSetHeaderRepo, RunCreateRegSetAssocRepo, RunDeleteRegSetAssocRepo, RunDeleteRegSetRepo, RunGetAssociatedInformationRepo, RunGetRegSetByTaxDataRepo, RunGetRegSetHeadersFromTerritoryRepo, RunJoinQueriesToPythonOutputRepo, RunModifyRegSetAssocRepo, parsePythonOuputJSONRepo, RunGetRegsForRegSetRepo, RunObtainRegSetHeadersQueriesRepo, RunObtainSpecificRegSetQueriesRepo, RunUpdateRegSetRepo } from '../repositories/ensembleReglements.repositories'


/**
 * returns regualtion set headers based on query parameters
 * @param param0 a list of paramters used for querying the data
 * @returns an array of regulation set headers
 */
export async function getRegulationSetsService({
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
}) {
    let client
    try {
        client = await pool.connect()
        const result = await RunObtainRegSetHeadersQueriesRepo(client, {
            date_debut_er_avant: date_debut_er_avant,
            date_debut_er_apres: date_debut_er_apres,
            date_fin_er_avant: date_fin_er_avant,
            date_fin_er_apres: date_fin_er_apres,
            description_like: description_like,
            id_er: id_er
        })
        return { success: true, data: result }
    } catch (err: any) {
        console.log(err)
        return { success: false, message: 'error during query' }
    } finally {
        if (client) {
            client.release()
        }
    }
}
/**
 * Returns a regulation set with the complete definition of land use regulation assignments and the full land use table
 * @param id regulation set identifier you're trying to retrieve
 * @returns a json output for the controller including the regulation set and a success flag
 */
export async function getFullRegulationSetById(id:number[]){
    let client 
    try{
        client =await pool.connect()
        const {entete_all,assoc_util_reg_all,table_util_sol}=await RunObtainSpecificRegSetQueriesRepo(client,id)
        const output = id.map((id: number) => {
                    const entete = entete_all.find((row: DbEnteteEnsembleReglement) => row.id_er === id);
                    const assoc_util_reg = assoc_util_reg_all.filter((row: DbAssociationReglementUtilSol) => row.id_er === id);
                    return {
                        entete,
                        assoc_util_reg,
                        table_util_sol: table_util_sol 
                    };
                });
        return {success:true, data:output}
    }catch(err:any){
        return{success:false,message:'error during retrieval'}
    }finally{
        if(client){
            client.release()
        }
    }
}

/**
 * 
 * @param id identifier of the reg set you're getting the regulation fos
 * @returns an array of regulation headers associated to a given reg set
 */
export async function getRegulationsForRegSetIdServ(id:number){
    let client
    try{
        client=await pool.connect()
        const result = await RunGetRegsForRegSetRepo(client,id)
        return {success:true,data:result}
    }catch(err:any){
        return{success:false,message:'error when running query'}
    }finally{
        if(client){
            await client.release()
        }
    }
}

/**
 * function to get regsets whichare associated to a given territory
 * @param id a territory id we're trying to get reg sets for
 * @returns an array of headers that meet the required territory id
 */
export async function getRegulationsByTerritoryServ(id:number){
    let client
    try {
        client = await pool.connect()
        const result = await RunGetRegSetHeadersFromTerritoryRepo(client,id)
        return {success:true,data:result}
    } catch (err:any) {
        return {success:false,message:'error retrieving the data'}
    }finally{
        if(client){
            await client.release()
        }
    }
}
/**
 * Service that returns the regulations sets based on a list of tax identifiers
 * @param listTaxIds list of tax identifiers for which you're trying to get regulation sets
 * @returns an array of regulation set headers and a success flag
 */
export async function getRegulationSetsByTaxIdServ(listTaxIds:string[]){
    let client
    try {
        client = await pool.connect()
        const data= await RunGetRegSetByTaxDataRepo(client,listTaxIds)
        return{success:true, data: data}
    } catch (error:any) {
        return {success:false,message:'error retrieving the data'}
    }finally{
        if(client){
            await client.release()
        }
    }
}
/**
 * Service to create a regulation set header 
 * @param param0 description start date and end date of the new reg set
 * @returns the new regset as defined with an identifier and a success flag
 */
export async function insertRegSetHeaderServ({description_er,date_debut_er,date_fin_er}:{description_er:string,date_debut_er:number|null,date_fin_er:number|null}){
    let client
    try {
        client = await pool.connect()
        const data = await RunCreateNewRegSetHeaderRepo(client,{description_er,date_debut_er,date_fin_er})
        return {success:true,data:data}
    } catch (error:any) {
        return {success:false,message:'Error inserting new reg set header'}
    }finally{
        if(client){
            await client.release()
        }
    }
}
/**
 * service to delete the required regulation set
 * @param id_er identifier of the regulation set you're trying to delet
 * @returns boolean signifying success or failure
 */
export async function deleteRegSetServ(id_er:number){
    let client
    try {
        client = await pool.connect();
        await client.query('BEGIN')
        const result= await RunDeleteRegSetRepo(client,id_er)

        await client.query('commit')
        if (result===true){
            return{success:true}
        }else{
            return{success:false}
        }
    } catch (error) {
        if (client){
            await client.query('rollback')
        }
        return {success:false}
    }finally{
        if (client){
            client.release();
        }
    }
}

/**
 * service function to update  a regulation set header
 * @param id_er identifier of the reg set to modify
 * @param description_er updated description
 * @param date_debut_er updated start year
 * @param date_fin_er updated end year
 * @returns the updated value and a success flag
 */
export async function modifyRegSetHeaderServ(id_er:number,description_er:string,date_debut_er:number|null,date_fin_er:number|null){
    let client 
    try {
        client= await pool.connect()
        const result= await RunUpdateRegSetRepo(client,id_er,description_er,date_debut_er,date_fin_er)
        return{success:true,data:result}
    } catch (error) {
        return{success:false,message:'error updating your regulation set'}
    } finally{
        if(client){
            await client.release()
        }
    }
}

/**
 * Service to create a new of assignement of regulation to land use for a given regulation set
 * @param id_er the identifier of the regulation set we're creating the assignment for
 * @param id_reg_stat the identifier of the parking regulation we're assigning
 * @param cubf the land use code we're assigning a regulation to
 * @returns the newly minted association gets returned as well as a success flag
 */
export async function newRegSetAssociationServ(id_er:number,id_reg_stat:number,cubf:number){
    let client
    try{
        client = await pool.connect()
        const results = await RunCreateRegSetAssocRepo(client,id_er,id_reg_stat,cubf)
        return {success:true,data:results}
    }catch(error:any){
        return {success:false, message:'Error upon creating new association'}
    }finally{
        if(client){
            await client.release()
        }
    }
}

/**
 * Service modifies an existing land use to regulation 
 * @param id_assoc the assignent id of the assignement we're modifying
 * @param id_er the regulation set identifier whose assigment we're modifying
 * @param id_reg_stat the regulation we're assigning to the land use
 * @param cubf the land use we
 * @returns the new assignement and a success flag
 */
export async function modifyRegSetAssocServ(id_assoc:number,id_er:number,id_reg_stat:number,cubf:number){
    let client 
    try {
        client = await pool.connect()
        const results = await RunModifyRegSetAssocRepo(client,id_assoc,id_er,id_reg_stat,cubf)
        return {success:true, data:results}
    } catch (error:any) {
        return {success:false, message:'Error in modifying assignment of regulation to land use'}
    }finally{
        if (client){
            await client.release()
        }
    }
}
/**
 * service to delete an association between a land use and a regulation. 
 * @param id_assoc id of the association you're trying to dlete
 * @returns a success flag saying whether deletion was successful
 */
export async function deleteRegSetAssocServ(id_assoc:number){
    let client 
    try {
        client= await pool.connect()
        const results = await RunDeleteRegSetAssocRepo(client,id_assoc)
        return {success:results}
    } catch (error:any) {
        return {success:false, message: 'Error in deleting the association'}        
    }finally{
        if(client){
            await client.release()
        }
    }
}



/**
 * Service coordinating retrieval of units, regulations and descriptions which are used to select regulations for charting
 * @param string_in String data which is fed in the body concerning the regulation sets and land use which we want to chart
 * @returns the relevant chart info including units, regulation ids, and descriptions and a success flag
 */
export async function getChartInfoServ(string_in:string){
    let client
    try {
        client = await pool.connect()
        const outPython = await RunChartsInfoPythonRepo(string_in)
        if(outPython.success===true&&outPython.data){
            const processedJson = parsePythonOuputJSONRepo(outPython.data)
            const {
                result_unit,
                result_regs,
                result_regSets
            }= await RunGetAssociatedInformationRepo(client,processedJson)
            const finalOut= RunJoinQueriesToPythonOutputRepo(processedJson,result_unit,result_regs,result_regSets)
            return {success:true,data:finalOut}
        }else{
            throw new Error(outPython.message)
        }
    }catch(error:any){
        return {success:false,message:error}
    }finally{
        if(client){
            await client.release()
        }
    }
}