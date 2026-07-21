import { RepoResponse } from '@localTypes/database.types'
import * as repo from '../repositories/unites.repositories'
import { Pool } from 'pg'

export const obtiensUnites =async(pool:Pool):Promise<RepoResponse>=>{
    const query = repo.construitRequeteObtentionUnite()
    const data = await repo.rouleRequeteObtentionUnite(pool,query)
    return{success:true,data:data.data}
}

export const serviceCreeUnite = async(
    pool:Pool, 
    donnee:{
        desc_unite:string,
        facteur_correction:number,
        abscisse_correction:number,
        colonne_role_foncier:string}):Promise<RepoResponse>=>{
    const requete = repo.construitRequeteNouvelleUnite(donnee)
    const resultats = await repo.rouleRequeteInsertionUnite(pool,requete)
    return {success:true,data:resultats.data}
}

export const serviceModifiedUnite = async(
    pool:Pool, 
    id_unite: number,
    donnee:{
        desc_unite:string,
        facteur_correction:number,
        abscisse_correction:number,
        colonne_role_foncier:string
    }):Promise<RepoResponse>=>{
    const requete = repo.construitRequeteModifUnite(id_unite,donnee)
    const resultats = await repo.rouleRequeteInsertionUnite(pool,requete)
    return{success:true,data:resultats.data}
}

export const serviceSupprimeUnite = async(
    pool:Pool,
    id_unite:number
):Promise<boolean>=>{
    const requete = repo.construitRequeteSuppressionUnite(id_unite)
    const resultats = await repo.rouleRequeteInsertionUnite(pool,requete)
    if (resultats.data.length>0){
        return true
    }else{
        return false
    }
}