import { Pool, PoolClient } from "pg"
import { RepoResponse } from "@localTypes/database.types"

export interface objetRequeteSQL{
    requete:string,
    donnee:any[]
}

export const construitRequeteObtentionUnite = ():string=>{
    return `
        SELECT *
        FROM public.multiplicateur_facteurs_colonnes
        order by id_unite
        `
}

export const construitRequeteSuppressionUnite = (id_unite:number):objetRequeteSQL=>{
    const query = 'DELETE FROM multiplicateur_facteurs_colonnes WHERE id_unite = $1 RETURNING *;'
    const donnee =[id_unite]
    return{requete:query,donnee:donnee}
}

export const construitRequeteNouvelleUnite= (donneeIn:{desc_unite:string,facteur_correction:number, colonne_role_foncier:string,abscisse_correction:number})=>{
    const query: string = `INSERT INTO multiplicateur_facteurs_colonnes (desc_unite,facteur_correction,colonne_role_foncier,abscisse_correction) 
    VALUES ($1,$2,$3,$4) 
    RETURNING id_unite,facteur_correction,abscisse_correction,colonne_role_foncier,desc_unite;`
    const donnee = [donneeIn.desc_unite,donneeIn.facteur_correction,donneeIn.colonne_role_foncier,donneeIn.abscisse_correction]
    return{requete:query,donnee:donnee}
}

export const construitRequeteModifUnite = (id_unite:number,donneeIn:{desc_unite:string,facteur_correction:number, colonne_role_foncier:string,abscisse_correction:number})=>{
    const query: string = `UPDATE multiplicateur_facteurs_colonnes 
    SET 
    desc_unite = $1,
    facteur_correction=$2,
    colonne_role_foncier=$3,
    abscisse_correction=$4
    WHERE id_unite = $5 
    RETURNING id_unite,facteur_correction,abscisse_correction,colonne_role_foncier,desc_unite;`
    const donnee = [donneeIn.desc_unite,donneeIn.facteur_correction,donneeIn.colonne_role_foncier,donneeIn.abscisse_correction,id_unite]
    return{requete:query,donnee:donnee}
}

export const rouleRequeteObtentionUnite = async(pool:Pool,requete:string):Promise<RepoResponse>=>{
    let client: PoolClient | undefined;
    try{
        client = await pool.connect()
        const result = await client.query(requete)          
        return{success:true,data:result.rows}
    }catch(err){
        return {success: false, data:[]}
    }finally{
        if (client){
            client.release()
        }
    }
}

export const rouleRequeteInsertionUnite = async(pool:Pool, requete: objetRequeteSQL):Promise<RepoResponse>=>{
    let client: PoolClient | undefined;
    try{
        client = await pool.connect()
        const result = await client.query(requete.requete,requete.donnee)          
        return{success:true,data:result.rows}
    }catch(err){
        return {success: false, data:[]}
    }finally{
        if (client){
            client.release()
        }
    }
}