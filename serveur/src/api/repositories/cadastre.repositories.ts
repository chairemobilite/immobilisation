import { Pool } from "pg";
import { DbCadastre } from "@localTypes/cadastre.types";

export interface paramsRequeteLot{
    g_no_lot?:string, 
    bbox?:number[], 
    superf_plus_grand?:number, 
    inv_plus_grand?:number, 
    id_quartier?:number, 
    estime?:number, 
    inv_surf_plus_grand?:number, 
    id_strate?:number}

export const creationRequeteObtention=(params:paramsRequeteLot):{requete:string,values:any[]}=>{
    let query: string = '';
        let ctePot = [];
        let conditions = [];
        let extraVariables = []
        let values = [];
        let joins = [];
        let replaceCount = 1;
    if (typeof params.bbox !== 'undefined') {
        conditions.push(`cad.geometry && ST_MakeEnvelope($${replaceCount}, $${replaceCount + 1},  $${replaceCount + 2}, $${replaceCount + 3}, 4326)`)
        values.push(params.bbox[0])
        values.push(params.bbox[1])
        values.push(params.bbox[2])
        values.push(params.bbox[3])
        replaceCount += 4
    }
    if (typeof params.g_no_lot !== 'undefined') {
        conditions.push(`cad.g_no_lot = $${replaceCount} `)
        values.push(params.g_no_lot )
        replaceCount++
    }
    if (typeof params.superf_plus_grand !== 'undefined') {
        conditions.push(`cad.g_va_suprf>$${replaceCount}`)
        values.push(params.superf_plus_grand)
        replaceCount++
    }
    if (typeof params.estime  !== 'undefined') {
        if ([2,3].includes(Number(params.estime))){
            ctePot.push(`inventory AS (
            SELECT
                g_no_lot,
                n_places_min as inv,
                methode_estime as estime
            FROM
                public.inventaire_stationnement
            )`)
            }else {
                ctePot.push(`inventory AS (
                    SELECT
                        g_no_lot,
                        n_places_mesure::int as inv,
                        methode_estime as estime
                    FROM
                        public.inventaire_stationnement
                    )`)
            }
        values.push(params.estime)
        extraVariables.push('inventory.inv')
        extraVariables.push('inventory.estime')
        conditions.push(`inventory.estime = $${replaceCount}`)
        joins.push('LEFT JOIN inventory ON inventory.g_no_lot=cad.g_no_lot')
        replaceCount++
    } else {
        ctePot.push(`inventory AS (
            SELECT
            g_no_lot,
            n_places_min as inv,
            methode_estime as estime
            FROM
            public.inventaire_stationnement
            where methode_estime =2
        )`)
        extraVariables.push('inventory.inv')
        extraVariables.push('inventory.estime')
        joins.push('LEFT JOIN inventory ON inventory.g_no_lot=cad.g_no_lot')
    }
    if (typeof params.inv_plus_grand !== 'undefined') {
        conditions.push(`inventory.inv>$${replaceCount}`)
        extraVariables.push('inventory.inv as valeur_affich')
        values.push(params.inv_plus_grand)
        replaceCount++
    }
    if (typeof params.id_quartier !== 'undefined') {
        joins.push(`JOIN 
            public.sec_analyse AS polygons
            ON ST_Intersects(cad.geometry, polygons.geometry)
            AND polygons.id_quartier = $${replaceCount}`)
        values.push(params.id_quartier )
        conditions.push(`polygons.id_quartier = $${replaceCount}`)
        replaceCount++
    }
    if (typeof params.inv_surf_plus_grand !== 'undefined') {
        conditions.push(`inventory.inv/cad.g_va_suprf>$${replaceCount}`)
        extraVariables.push('inventory.inv/cad.g_va_suprf as valeur_affich')
        values.push(params.inv_surf_plus_grand)
        replaceCount++
    }
    if (typeof params.id_strate !== 'undefined') {
        conditions.push(`ast.id_strate = $${replaceCount}`)
        joins.push('RIGHT JOIN assignation_strates ast ON ast.g_no_lot=cad.g_no_lot')
        values.push(params.id_strate)
        replaceCount++
    }
    if (ctePot.length > 0) {
        const cteQuery = 'WITH ' + ctePot.join(',') + '\n'
        query += cteQuery
    }
    const baseQuerySelect = `
        SELECT 
        cad.g_no_lot,
        cad.g_nb_coord,
        cad.g_nb_coo_1,
        cad.g_va_suprf,
        EXISTS (
                SELECT 1
                FROM inventaire_stationnement AS inv
                WHERE inv.g_no_lot = cad.g_no_lot
            ) AS bool_inv,
        ST_AsGeoJSON(cad.geometry) AS geojson_geometry`
    query += baseQuerySelect
    if (extraVariables.length > 0) {
        query += ',\n' + extraVariables.join(',') + '\n'
    } else {
        query += '\n'
    }
    const baseQueryFrom = ` FROM public.cadastre cad \n`;
    query += baseQueryFrom
    if (joins.length > 0) {
        query += joins.join('\n')
    }
    if (conditions.length > 0) {
        query += ' \n WHERE ' + conditions.join(' AND ')
    }
    query += ';'    
    return {requete:query,values:values}
}

export const rouleRequeteLots=async(pool:Pool,requete:string,values:any[]):Promise<DbCadastre[]>=>{
    let client
    try {
        client = await pool.connect()
        const repnse = await client.query(requete,values)
        const out = repnse.rows as unknown as DbCadastre[];
        return out
    }finally{
        if (client){
            client.release()
        }
    }
}