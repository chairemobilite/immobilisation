import { Pool } from "pg";
import { 
    construitRequeteDep,
    construitRequeteMenage,
    construitRequetePers,
    paramsRequeteDepOD, 
    paramsRequeteMenageOD, 
    paramsRequetePersOD,
    rouleRequeteOD
} from "../repositories/enqueteOD.repositories";
import { ApiResponse } from "@localTypes/api.types";
import { depODOut, menageODOut, persODOut } from "@localTypes/enqueteOD.types";


export function nettoyageParametresRequeteMenageOD(query:any):paramsRequeteMenageOD{ 
    const{bbox} = query
    let bboxLimitsNum = undefined;
    if (typeof bbox === 'string') {
        const bboxLimitsString = bbox.split(',')
        bboxLimitsNum = bboxLimitsString.map((item) => Number(item))
    }
    return{
        bbox:bboxLimitsNum
    }
}

export function nettoyageParametresRequetePersOD(query:any):paramsRequetePersOD{
    const{bbox} = query
    let bboxLimitsNum = undefined;
    if (typeof bbox === 'string') {
        const bboxLimitsString = bbox.split(',')
        bboxLimitsNum = bboxLimitsString.map((item) => Number(item))
    }
    return{
        bbox:bboxLimitsNum
    }
}


export function nettoyageParametresRequeteDepOD(query:any):paramsRequeteDepOD{
    const{bbox,mode,motif,heure} = query
    let bboxLimitsNum = undefined;
    if (typeof bbox === 'string') {
        const bboxLimitsString = bbox.split(',')
        bboxLimitsNum = bboxLimitsString.map((item) => Number(item))
    }
    let ModeNum:number[]=[]
    if (typeof mode ==='string'){
        const modestring = mode.split(',')
        ModeNum = modestring.map(item=> Number(item))
    }
    let MotifNum:number[]=[]
    if (typeof motif ==='string'){
        const motstring = motif.split(',')
        MotifNum = motstring.map(item=> Number(item))
    }
    let HeureNum:number[]=[]
    if(typeof heure==='string'){
        const heurestring = heure.split(',');
        HeureNum = heurestring.map(item=>Number(item))
    }
    return{
        bbox:bboxLimitsNum,
        mode: ModeNum.length>0?ModeNum:undefined,
        motif: MotifNum.length>0?MotifNum:undefined,
        heure: HeureNum.length>0?HeureNum:undefined
    }
}

export async function RequeteObtiensMenagesOd(pool:Pool,params:paramsRequeteMenageOD):Promise<ApiResponse<menageODOut>>{
    const requete = construitRequeteMenage(params)
    const resultat = await rouleRequeteOD(pool,requete) 
    return{success:true,data: resultat as unknown as menageODOut}
}

export async function RequeteObtiensPersOd(pool:Pool,params:paramsRequetePersOD):Promise<ApiResponse<persODOut>>{
    const requete = construitRequetePers(params)
    const resultat = await rouleRequeteOD(pool,requete) 
    return{success:true,data: resultat as unknown as persODOut}
}

export async function RequeteObtiensDepOd(pool:Pool,params:paramsRequeteDepOD):Promise<ApiResponse<depODOut>>{
    const requete = construitRequeteDep(params)
    const resultat = await rouleRequeteOD(pool,requete) 
    return{success:true,data: resultat as unknown as depODOut}
}