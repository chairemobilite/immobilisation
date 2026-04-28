import { Router, Request, Response, RequestHandler } from 'express';
import { Pool } from 'pg';
import { DbQuartierAnalyse } from 'secteursAnalyse.types';
// Types pour les requêtes
import { Polygon, MultiPolygon } from 'geojson';
interface GeometryBody {
    geometry: Polygon | MultiPolygon;
}

export const creationRouteurQuartiersAnalyse = (pool: Pool): Router => {
    const router = Router();
    // Get all lines
    // Get all lines
    const obtiensTousQuartiers: RequestHandler = async (_req, res): Promise<void> => {
        console.log('Serveur - obtentions tous quartiers analyse')
        let client;
        try {

            client = await pool.connect();
            const query = `
        SELECT 
          id_quartier::int,
          nom_quartier,
          superf_quartier,
          acro,
          ST_AsGeoJSON(geometry) AS geojson_geometry
        FROM public.sec_analyse
        order by id_quartier;
      `;

            const result = await client.query<DbQuartierAnalyse>(query,);
            const out = result.rows.map((row: any) => ({
                id_quartier: row.id_quartier,
                nom_quartier: row.nom_quartier,
                superf_quartier: row.superf_quartier,
                acro: row.acro,
                geometry: JSON.parse(row.geojson_geometry)
            }));
            res.json({ success: true, data: out });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally{
            if (client){
                client.release()
            }
        }
    };


    const ecraseSecteursAnalyse: RequestHandler = async (req, res): Promise<void> => {
        console.log('Serveur - écrasement secteurs analyse')
        let client;
        try{
            const data  = req.body ;
            const queryValues: any[] = [];
            const placeholders = data.map((item:any, idx:number) => {
                const startIdx = idx * 5 + 1;
                queryValues.push(
                    item.id_quartier,
                    item.nom_quartier,
                    item.superf_quartier,
                    item.acro,
                    item.geometry
                );
                return `($${startIdx}, $${startIdx + 1}, $${startIdx + 2}, $${startIdx + 3}, ST_SetSRID(ST_GeomFromGeoJSON($${startIdx + 4}), 4326))`;
            }).join(', ');
            client = await pool.connect();
            await client.query('BEGIN');

            // DELETE d'abord
            await client.query('DELETE FROM public.sec_analyse');

            // INSERT ensuite
            const query = `
                INSERT INTO public.sec_analyse (id_quartier, nom_quartier, superf_quartier, acro, geometry)
                VALUES ${placeholders}
                RETURNING id_quartier, nom_quartier, superf_quartier, acro, ST_AsGeoJSON(geometry) as geometry;
            `;
            const result = await client.query(query, queryValues);

            await client.query('COMMIT');
            const out = result.rows.map((row: any) => ({
                ...row,
                geometry: JSON.parse(row.geometry)
            }));
            res.json({ success: true, data: out });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const modifieQuartierAnalyse: RequestHandler = async (req, res): Promise<void> => {
        console.log('Serveur - modification quartier analyse')
        let client;
        try{
            const { id_quartier } = req.params;
            const { nom_quartier, superf_quartier, acro, geometry} = req.body;
            const queryValues = [
                id_quartier,
                nom_quartier,
                superf_quartier,
                acro,
                geometry
            ];
            client = await pool.connect();
            await client.query('BEGIN');

            // INSERT ensuite
            const query = `
                UPDATE public.sec_analyse
                SET nom_quartier = $2, superf_quartier = $3, acro = $4, geometry = ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)
                WHERE id_quartier = $1  
                RETURNING id_quartier, nom_quartier, superf_quartier, acro, ST_AsGeoJSON(geometry) as geometry;
            `;
            const result = await client.query(query, queryValues);

            await client.query('COMMIT');
            const out = result.rows.map((row: any) => ({
                ...row,
                geometry: JSON.parse(row.geometry)
            }));
            res.json({ success: true, data: out });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }

    // Routes
    router.get('/', obtiensTousQuartiers);
    router.post('/bulk-replace', ecraseSecteursAnalyse);
    router.put('/:id_quartier', modifieQuartierAnalyse);
    return router;
};