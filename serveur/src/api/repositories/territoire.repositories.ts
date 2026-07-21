import { DbTerritoire } from "@localTypes/historique.types"
import { Pool,PoolClient } from 'pg'
import { RepoResponse } from "@localTypes/database.types"

export interface objetRequeteMAJTotaleSecteursPeriode{
    requeteCommence: string,
    requeteSuppression: string,
    donneeSuppression: number[]
    requeteInsertion: string,
    donneesInsertion: any[],
    requeteConfirmation: string
}

export interface objetRequeteSuppressionTerritoire{
    requete: string,
    identifiantsRemp: any[]
}

export interface objetRequeteModifieTerritoire{
    requeteModifie:string,
    donneesModif: any[]
}

export const ConstruitRequeteMAJTerritoiresPeriode = (id_periode:number,data: Omit<DbTerritoire,'id_periode_geo'>[]):objetRequeteMAJTotaleSecteursPeriode=> {
    const requete1 = 'BEGIN;'
    const requeteSuppression = 'DELETE FROM cartographie_secteurs WHERE id_periode = $1'
    const idSuppression = [id_periode]
    const valueData: any[] = []
    const placeholders = data.map((item:any, idx:number) => {
                const startIdx = idx * 5 + 1;
                valueData.push(
                    id_periode,
                    item.ville,
                    item.secteur,
                    `${item.ville} - ${item.secteur}`,
                    item.geometry
                );
                return `($${startIdx}, $${startIdx + 1}, $${startIdx + 2}, $${startIdx + 3}, ST_SetSRID(ST_GeomFromGeoJSON($${startIdx + 4}), 4326))`;
            }).join(', \n');
    const requeteAddition = `INSERT INTO cartographie_secteurs (id_periode,ville,secteur,ville_sec,geometry) 
    VALUES ${placeholders} 
    RETURNING id_periode_geo,ville,secteur,ville_sec,id_periode,ST_AsGeoJSON(geometry)as geometry;`;
    const output: objetRequeteMAJTotaleSecteursPeriode = {
        requeteCommence: requete1,
        requeteSuppression: requeteSuppression,
        donneeSuppression: idSuppression,
        requeteInsertion: requeteAddition,
        donneesInsertion: valueData,
        requeteConfirmation: 'COMMIT;'}
    return output
}

export const construitRequeteSuppressionTerritoire = (id_periode:number|undefined,id_periode_geo:number|undefined):objetRequeteSuppressionTerritoire=>{
    let conditions: string[] = []
    let index: number = 1;
    let values: number[]=[]
    if (typeof id_periode === 'number'&& !Number.isNaN(id_periode)){
        conditions.push(`id_periode = $${index}`)
        values.push(id_periode)
        index++
    }
    if (typeof id_periode_geo === 'number' && !Number.isNaN(id_periode_geo)){
        conditions.push(`id_periode_geo = $${index}`)
        values.push(id_periode_geo)
        index++
    }
    let requete:string;
    if (conditions.length >0){
        requete = `DELETE FROM cartographie_secteurs WHERE ${conditions.join(' AND ')}`
    }else{
        throw ReferenceError('Need to provide either id_periode or id_periode_geo')
    }
    return {requete:requete,identifiantsRemp:values}
}
export const rouleRequeteSQLMAJTerritoiresPeriode = async (
    pool:Pool,
    objetsRequetes:objetRequeteMAJTotaleSecteursPeriode
):Promise<RepoResponse> =>{
    let client: PoolClient | undefined;
    try{
        client = await pool.connect()
        await client.query(objetsRequetes.requeteCommence)
        await client.query(objetsRequetes.requeteSuppression,objetsRequetes.donneeSuppression)
        const result = await client.query(objetsRequetes.requeteInsertion,objetsRequetes.donneesInsertion)
        await client.query(objetsRequetes.requeteConfirmation)
        const output = result.rows.map((item:any)=>({
            ...item,
            geometry: JSON.parse(item.geometry)
        }
        ))
        return {
            success:true,
            data:output
        }
    }catch(err){
        if (client){
            await client.query('ROLLBACK')
        }
        return {success: false, data:[]}
    }finally{
        
        if (client){

            client.release()
        }
    }
}

export const rouletRequeteSuppressionTerritoire = async(pool:Pool,objetRequete:objetRequeteSuppressionTerritoire):Promise<RepoResponse> =>{
    let client: PoolClient | undefined;
    try{
        client = await pool.connect()
        const result = await client.query(objetRequete.requete,objetRequete.identifiantsRemp)
        return {
            success:true,
            data:[]
        }
    }catch(err){
        return {success: false, data:[]}
    }finally{
        if (client){
            client.release()
        }
    }
}

export const construitRequeteModif = (id_periode_geo:number,data:any):objetRequeteModifieTerritoire=>{
    const query = `UPDATE cartographie_secteurs 
    SET
        id_periode = $1,
        ville = $2,
        secteur = $3,
        ville_sec = $4,
        geometry = ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)
    WHERE 
        id_periode_geo = $6 
    RETURNING id_periode_geo,ville,secteur,ville_sec,id_periode,ST_AsGeoJSON(geometry)as geometry`
    const donnees: any[] = [data.id_periode,data.ville,data.secteur,`${data.ville} - ${data.secteur}`,data.geometry,id_periode_geo]
    return {requeteModifie:query,donneesModif:donnees}
}

export const rouleRequeteModifTerritoire = async(
    pool:Pool,
    objet: objetRequeteModifieTerritoire
):Promise<RepoResponse>=>{
    let client: PoolClient | undefined;
    try{
        client = await pool.connect()
        const result = await client.query(objet.requeteModifie,objet.donneesModif)
        const output = result.rows.map((item:any)=>({
            ...item,
            geometry: JSON.parse(item.geometry)
        }
        ))
        return {
            success:true,
            data:output
        }
    }catch(err){
        return {success: false, data:[]}
    }finally{
        if (client){

            client.release()
        }
    }
}