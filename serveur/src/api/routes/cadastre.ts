import { Router,  RequestHandler } from 'express';
import { Pool } from 'pg';
import { DbCadastre,ParamsCadastre } from '@localTypes/cadastre.types'
import { ParamsQuartier } from '@localTypes/secteursAnalyse.types';
import { DbRole } from '@localTypes/role.types';
// Types pour les requêtes
import { Polygon, MultiPolygon } from 'geojson';
import { validateBboxQuery } from '../validators/cadastreValidator';
import { obtiensLotRequete, processRequestConversions } from '../services/cadastre.services';

interface GeometryBody {
    geometry: Polygon | MultiPolygon;
}

export const creationRouteurCadastre = (pool: Pool): Router => {
    const router = Router();
    // Get all lines
    // Get all lines
    const obtiensLotParId: RequestHandler<ParamsCadastre> = async (req, res): Promise<void> => {

        let client;
        try {
            const { id } = req.params;
            const decodedId = id.replace(/_/g, " ");
            console.log('obtention lot cadastral');
            client = await pool.connect();
            const query = `
        SELECT 
          cad.g_no_lot,
          cad.g_nb_coord,
          cad.g_nb_coo_1,
          cad.g_va_suprf,
          ST_AsGeoJSON(cad.geometry) AS geojson_geometry,
          EXISTS (
                SELECT 1
                FROM inventaire_stationnement AS inv
                WHERE inv.g_no_lot = cad.g_no_lot
            ) AS bool_inv
        FROM public.cadastre cad
        WHERE g_no_lot = $1
      `;

            const result = await client.query<DbCadastre>(query, [decodedId]);
            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    };

    const obtiensRoleParIdLot: RequestHandler<ParamsCadastre> = async (req, res): Promise<void> => {
        let client;
        try {
            const { id } = req.params;
            const decodedId = id.replace(/_/g, " ");
            console.log('obtention lot cadastral');
            client = await pool.connect();
            const query = `
        WITH table_assoc AS (
            SELECT 
                id_provinc,
                g_no_lot
            FROM public.association_cadastre_role
            WHERE g_no_lot = $1
        )
        SELECT 
            rf.id_provinc,
            rf.rl0105a,
            rf.rl0306a,
            rf.rl0307a,
            rf.rl0307b,
            rf.rl0308a,
            rf.rl0311a,
            rf.rl0312a,
            rf.rl0404a,
            rf.rl0101a,
            rf.rl0101e,
            rf.rl0101g,
            ST_AsGeoJSON(rf.geometry) AS geojson_geometry
        FROM public.role_foncier AS rf
        RIGHT JOIN table_assoc AS ta ON rf.id_provinc = ta.id_provinc;
      `;

            const result = await client.query<DbRole>(query, [decodedId]);
            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }

    const obtiensLotsParIdQuartier: RequestHandler<ParamsQuartier> = async (req, res): Promise<void> => {
        let client;
        try {
            const { id } = req.params;
            console.log(`obtention lots pour quartier: ${id}`);
            client = await pool.connect();
            const query = `
        SELECT 
          cad.g_no_lot,
          cad.g_va_suprf,
          cad.g_nb_coo_1,
          cad.g_nb_coord,
          EXISTS (
                SELECT 1
                FROM inventaire_stationnement AS inv
                WHERE inv.g_no_lot = cad.g_no_lot
            ) AS bool_inv,
          ST_AsGeoJSON(cad.geometry) AS geojson_geometry
        FROM
          public.cadastre AS cad
        JOIN 
          public.sec_analyse AS polygons
          ON ST_Intersects(cad.geometry, polygons.geometry)
          AND polygons.id_quartier = $1
        `;

            const result = await client.query(query, [id]);
            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }

    const obtiensLots: RequestHandler<{}> = async (req, res, next): Promise<void> => {
        
        try {
            const params = processRequestConversions(req.query)
            const response = await obtiensLotRequete(pool,params)
            res.json({ success: true, data: response.data});
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        }
    }

    
    // Routes
    router.get('/lot/quartier-ana/:id', obtiensLotsParIdQuartier)
    router.get('/lot-query', validateBboxQuery, obtiensLots)
    router.get('/lot/:id', obtiensLotParId)
    router.get('/role-associe/:id', obtiensRoleParIdLot)
    return router;
};