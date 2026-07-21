import { Pool } from "pg";
import { handleTempUpload, importFile } from "./geojsonGest.services";
import { 
    creationRequeteObtention, 
    paramsRequeteLot, 
    rouleRequeteLots 
} from "../repositories/cadastre.repositories";
import { DbCadastre } from "@localTypes/cadastre.types";
import { ApiResponse } from "@localTypes/api.types";

// wrappers for each data type
export async function handleCadastreUpload(filePath: string) {
    const columns = await handleTempUpload(filePath);
    return { columns, dataType: "cadastre" };
}
export async function importFileCadastre(pool:Pool,fileId:string,Mapping:Record<string,string>){
    const insertCount = await importFile(pool,fileId,Mapping,'cadastre')
    return insertCount
}


export async function handleRoleFoncierUpload(filePath: string) {
    const columns = await handleTempUpload(filePath);
    return { columns, dataType: "role_foncier" };
}

export function processRequestConversions(req:any):paramsRequeteLot{
    const { g_no_lot, bbox, superf_plus_grand, inv_plus_grand, id_quartier, estime, inv_surf_plus_grand, id_strate } = req??{};
    let bboxLimitsNum = undefined;
    if (typeof bbox === 'string') {
        const bboxLimitsString = bbox.split(',')
         bboxLimitsNum = bboxLimitsString.map((item) => Number(item))
    }
    let decodedId=undefined
    if (typeof g_no_lot === 'string') {
         decodedId = g_no_lot.replace(/_/g, " ");
    }
    let superf_out=undefined;
    if (typeof superf_plus_grand === 'string') {
        superf_out = Number(superf_plus_grand)
    }
    let methode_estime= undefined
    if (typeof estime === 'string') {
        let methode_estime:number=Number(estime);
    } 
    let inv_plus_grand_out=undefined
    if (typeof inv_plus_grand === 'string') {
         inv_plus_grand_out= Number(inv_plus_grand)
    }
    let id_quartier_out=undefined
    if (typeof id_quartier === 'string') {
        id_quartier_out = Number(id_quartier)
    }
    let inv_surf_plus_grand_out=undefined
    if (typeof inv_surf_plus_grand === 'string') {
         inv_surf_plus_grand_out = Number(inv_surf_plus_grand)
    }
    let id_strate_out = undefined;
    if (typeof id_strate === 'string') {
        id_strate_out = Number(id_strate)
    }
    return {
        bbox:bboxLimitsNum,
        g_no_lot:decodedId,
        superf_plus_grand:superf_out,
        estime:methode_estime,
        inv_plus_grand:inv_plus_grand_out,
        id_quartier:id_quartier_out,
        inv_surf_plus_grand:inv_surf_plus_grand_out,
        id_strate: id_strate_out
    }
}

export async function obtiensLotRequete(pool:Pool,params:paramsRequeteLot):Promise<ApiResponse<DbCadastre[]>>{
    const {requete,values} = creationRequeteObtention(params)
    const resultat = await rouleRequeteLots(pool,requete,values)
    const resultat_out = resultat.map((row)=>{
        const out = {
            g_no_lot:row.g_no_lot,
            g_nb_coord:row.g_nb_coord,
            g_nb_coo_1: row.g_nb_coo_1,
            g_va_suprf:row.g_va_suprf,
            bool_inv: row.bool_inv,
            estime: row.estime,
            inv: row.inv,
            geometry:JSON.parse(row.geojson_geometry??"")} as unknown as DbCadastre
        return(out) })
    return{success:false,data:resultat_out}
}