import { Request } from 'express'
import * as repo from '../repositories/territoire.repositories'
import { Pool } from 'pg'
import { RepoResponse } from '../../types/database.types'
import { DbTerritoire } from '@localTypes/historique.types'

export const serviceMetAJourTerritoiresPeriodes = async (
    pool:Pool,
    id_periode:number,
    data:Omit<DbTerritoire,'id_periode_geo'>[] 
):Promise<RepoResponse> =>{
    const objetRequete = repo.ConstruitRequeteMAJTerritoiresPeriode(id_periode,data);
    const result = await repo.rouleRequeteSQLMAJTerritoiresPeriode(pool,objetRequete);
    return result
}

export const serviceSupprimeTerritoire = async (
    pool: Pool,
    id_periode: number | undefined,
    id_periode_geo: number | undefined,
):Promise<RepoResponse> =>{
    const objetRequete = repo.construitRequeteSuppressionTerritoire(id_periode,id_periode_geo)
    const resultat  = await repo.rouletRequeteSuppressionTerritoire (pool,objetRequete)
    return resultat
}

export const serviceModifieTerritoire = async (
    pool:Pool,
    id_periode_geo: number|undefined,
    data:any
):Promise<RepoResponse> =>{
    const objetRequete = repo.construitRequeteModif(Number(id_periode_geo),data)
    const resultat = await repo.rouleRequeteModifTerritoire(pool,objetRequete)
    return resultat
}