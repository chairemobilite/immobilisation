import { Pool } from "pg";
import { DbRole } from "@localTypes/role.types";

export interface paramsRequeteRole{
    g_no_lot?:string, 
    bbox?:number[], 
    id_provinc?:string|string[],
    cubf?:number
}

export const creationRequeteObtentionRole=(params:paramsRequeteRole):{requete:string,values:any[]}=>{
    let query: string = '';
    let ctePot = [];
    let conditions = [];
    let extraVariables:string[] = []
    let values = [];
    let joins:string[] = [];
    let replaceCount = 1;
    if (typeof params.bbox !== 'undefined') {
        conditions.push(`rf.geometry && ST_MakeEnvelope($${replaceCount}, $${replaceCount + 1},  $${replaceCount + 2}, $${replaceCount + 3}, 4326)`)
        values.push(params.bbox[0])
        values.push(params.bbox[1])
        values.push(params.bbox[2])
        values.push(params.bbox[3])
        replaceCount += 4
    }
    if (typeof params.g_no_lot !== 'undefined') {
        ctePot.push(`cad_assoc as(
            SELECT
                g_no_lot,
                id_provinc
            FROM association_cadastre_role)`)
        joins.push(`LEFT JOIN cad_assoc acr on acr.id_provinc=rf.id_provinc`)
        conditions.push(`acr.g_no_lot = $${replaceCount} `)
        values.push(params.g_no_lot )
        replaceCount++
    }
     if (typeof params.id_provinc !== 'undefined') {
        if (Array.isArray(params.id_provinc)){
            const placeholdersloc:string[]=[]
            params.id_provinc.map((id)=>{
                values.push(id)
                placeholdersloc.push(`$${replaceCount}`)
                replaceCount++
            })
            conditions.push(`rf.id_provinc IN (${placeholdersloc.join(' , ')})`)
        }else{
            conditions.push(`rf.id_provinc = $${replaceCount} `)
            values.push(params.id_provinc)
            replaceCount++
        }
    }
    if (typeof params.cubf !== 'undefined') {
        conditions.push(`rf.rl0105a::int = $${replaceCount} `)
        values.push(params.cubf)
        replaceCount++
    }
    
    
    if (ctePot.length > 0) {
        const cteQuery = 'WITH ' + ctePot.join(',') + '\n'
        query += cteQuery
    }
    const baseQuerySelect = `
        SELECT 
        rf.id_provinc,
        rf.rl0101a,
        rf.rl0101e,
        rf.rl0101g,
        rf.rl0105a,
        rf.rl0301a,
        rf.rl0306a,
        rf.rl0307a,
        rf.rl0308a,
        rf.rl0311a,
        rf.rl0312a,
        rf.rl0313a,
        rf.rl0402a,
        rf.rl0404a,
        ST_AsGeoJSON(rf.geometry) AS geometry`
    query += baseQuerySelect
    if (extraVariables.length > 0) {
        query += ',\n' + extraVariables.join(',') + '\n'
    } else {
        query += '\n'
    }
    const baseQueryFrom = ` FROM public.role_foncier rf \n`;
    query += baseQueryFrom
    if (joins.length > 0) {
        query += joins.join('\n')
    }
    if (conditions.length > 0) {
        query += ' \n WHERE ' + conditions.join(' AND ')
    }
    query += 'ORDER BY rf.id_provinc ASC;'    
    return {requete:query,values:values}
}

export const rouleRequeteRole=async(pool:Pool,requete:string,values:any[]):Promise<DbRole[]>=>{
    let client
    try {
        client = await pool.connect()
        const repnse = await client.query(requete,values)
        const out = repnse.rows as unknown as DbRole[];
        return out
    }finally{
        if (client){
            client.release()
        }
    }
}