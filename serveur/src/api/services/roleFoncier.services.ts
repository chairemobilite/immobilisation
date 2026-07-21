import { ApiResponse } from "@localTypes/api.types";
import {  creationRequeteObtentionRole, paramsRequeteRole, rouleRequeteRole } from "../repositories/roleFoncier.repositories";
import { handleTempUpload } from "./geojsonGest.services";
import { DbRole } from "../../types";
import { Pool } from "pg";

export async function handleRoleFoncierUpload(filePath: string) {
    const columns = await handleTempUpload(filePath);
    return { columns, dataType: "role_foncier" };
}

export function processRequestConversions(req:any):paramsRequeteRole{
    const { g_no_lot, bbox, cubf,id_provinc} = req??{};
    let bboxLimitsNum = undefined;
    if (typeof bbox === 'string') {
        const bboxLimitsString = bbox.split(',')
         bboxLimitsNum = bboxLimitsString.map((item) => Number(item))
    }
    let decodedId=undefined
    if (typeof g_no_lot === 'string') {
         decodedId = g_no_lot.replace(/_/g, " ");
    }
    let cubf_out=undefined;
    if (typeof cubf === 'string') {
        cubf_out = Number(cubf)
    }
    let id_provinc_out= undefined
    if (typeof id_provinc === 'string') {
        const split = id_provinc.split(',')
        if (split.length>1){
            id_provinc_out = split
        }else{
            id_provinc_out  =id_provinc;
        }
    } 

    return {
        bbox:bboxLimitsNum,
        g_no_lot:decodedId,
        cubf:cubf_out,
        id_provinc:id_provinc_out
    }
}

export async function obtiensLotRequete(pool:Pool,params:paramsRequeteRole):Promise<ApiResponse<DbRole[]>>{
    const {requete,values} = creationRequeteObtentionRole(params)
    const resultat = await rouleRequeteRole(pool,requete,values)
    const resultat_out = resultat.map((row)=>{
        const out = {
            id_provinc:row.id_provinc,
            rl0101a:row.rl0101a,
            rl0101e:row.rl0101e,
            rl0101g:row.rl0101g,
            rl0105a:row.rl0105a,
            rl0301a:row.rl0301a,
            rl0306a:row.rl0306a,
            rl0307a:row.rl0307a,
            rl0307b:row.rl0307b,
            rl0308a:row.rl0308a,
            rl0311a:row.rl0311a,
            rl0312a:row.rl0312a,
            rl0313a:row.rl0313a,
            rl0402a:row.rl0402a,
            rl0404a:row.rl0404a,
            geometry:JSON.parse(typeof row.geometry=== 'string'?row.geometry:"")
        } as unknown as DbRole
        return(out) })
    return{success:false,data:resultat_out}
}