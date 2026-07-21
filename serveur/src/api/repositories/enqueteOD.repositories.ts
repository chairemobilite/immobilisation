import { requestRespOut } from "@localTypes/enqueteOD.types"
import { Pool } from "pg"

export interface requeteObtenionSQL{
    requete:string,
    valeurs:any[]
}

export interface paramsRequeteMenageOD{
   bbox?:number[]
}
export interface paramsRequetePersOD{
   bbox?:number[]
}

export interface paramsRequeteDepOD{
   bbox?:number[]
   motif?:number[],
   mode?:number[],
   heure?:number[]
}

export function construitRequeteMenage(params:paramsRequeteMenageOD):requeteObtenionSQL{
    let conditions:string[]=[]
    let values:any[]=[]
    let replaceCount=1
    conditions.push('tlog=1')
    if (typeof params.bbox !== 'undefined') {
        conditions.push(`odd.geom_logis && ST_MakeEnvelope($${replaceCount}, $${replaceCount + 1},  $${replaceCount + 2}, $${replaceCount + 3}, 4326)`)
        values.push(params.bbox[0])
        values.push(params.bbox[1])
        values.push(params.bbox[2])
        values.push(params.bbox[3])
        replaceCount += 4
    }
    const base_query = 'SELECT nolog, tlog,nbper,nbveh,facmen,ST_AsGeoJSON(geom_logis) as geometry FROM od_data odd'
    let final_query=''
    if (conditions.length>0){
        final_query = base_query + ' WHERE ' + conditions.join(' AND ')
    } else{
        final_query=base_query
    }
    return{
        requete:final_query,
        valeurs:values
    }
}

export function construitRequetePers(params:paramsRequetePersOD):requeteObtenionSQL{
    let conditions:string[]=[]
    let values:any[]=[]
    let replaceCount=1
    conditions.push('tper=1')
    if (typeof params.bbox !== 'undefined') {
        conditions.push(`odd.geom_logis && ST_MakeEnvelope($${replaceCount}, $${replaceCount + 1},  $${replaceCount + 2}, $${replaceCount + 3}, 4326)`)
        values.push(params.bbox[0])
        values.push(params.bbox[1])
        values.push(params.bbox[2])
        values.push(params.bbox[3])
        replaceCount += 4
    }
    const base_query = 'SELECT clepersonne, tper, sexe, age, grpage, percond, occper,mobil,facper,facpermc,nolog, ST_AsGeoJSON(geom_logis) as geometry FROM od_data odd'
    let final_query=''
    if (conditions.length>0){
        final_query = base_query + ' WHERE ' + conditions.join(' AND ')
    } else{
        final_query=base_query
    }
    return{
        requete:final_query,
        valeurs:values
    }
}
export function construitRequeteDep(params:paramsRequeteDepOD):requeteObtenionSQL{
    let conditions:string[]=[]
    let values:any[]=[]
    let replaceCount=1
    if (typeof params.bbox !== 'undefined') {
        conditions.push(`((odd.geom_ori IS NOT NULL AND odd.geom_ori && ST_MakeEnvelope($${replaceCount}, $${replaceCount + 1},  $${replaceCount + 2}, $${replaceCount + 3}, 4326)) OR 
                        (odd.geom_des IS NOT NULL AND odd.geom_des   && ST_MakeEnvelope($${replaceCount}, $${replaceCount + 1},  $${replaceCount + 2}, $${replaceCount + 3}, 4326)) )`)
        values.push(params.bbox[0])
        values.push(params.bbox[1])
        values.push(params.bbox[2])
        values.push(params.bbox[3])
        replaceCount += 4
    }
    if (typeof params.heure!=='undefined'){
        let opt:string[]=[]
        params.heure.map((item)=>{
            opt.push(`$${replaceCount}`)
            values.push(item)
            replaceCount++
        })
        conditions.push(`heure IN (${opt.join(',')})`)
    }
    if (typeof params.mode!=='undefined'){
        let opt:string[]=[]
        params.mode.map((item)=>{
            opt.push(`$${replaceCount}`)
            values.push(item)
            replaceCount++
        })
        conditions.push(`(mode1 IN (${opt.join(',')}) OR mode2 IN (${opt.join(',')}) OR mode3 IN (${opt.join(',')}) OR mode4 IN (${opt.join(',')})) `)
    }
    if (typeof params.motif!=='undefined'){
        let opt:string[]=[]
        params.motif.map((item)=>{
            opt.push(`$${replaceCount}`)
            values.push(item)
            replaceCount++
        })
        conditions.push(`motif IN (${opt.join(',')})`)
    }
    const base_query = 'SELECT cledeplacement, nodep,hredep, heure,motif,motif_gr,mode1,mode2,mode3,mode4,stat,coutstat,termstat,clepersonne, ST_AsGeoJSON(trip_line) as geometry  FROM od_data odd'
    let final_query=''
    if (conditions.length>0){
        final_query = base_query + ' WHERE ' + conditions.join(' AND ')
    } else{
        final_query=base_query
    }
    return{
        requete:final_query,
        valeurs:values
    }
}

export async function rouleRequeteOD(pool:Pool,requete:requeteObtenionSQL):Promise<requestRespOut>{
    let client
    try{
        client = await pool.connect()
        const  data = await client. query(requete.requete,requete.valeurs)
        const out = data.rows.map((item)=>{return{...item,geometry:JSON.parse(item.geometry)}})
        return out
    }catch(err:any){
        console.log(err)
        throw err
    }finally{
        if(client){
            client.release()
        }
    }
}