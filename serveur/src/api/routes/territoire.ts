import { Router, Request, Response, RequestHandler } from 'express';
import { Pool } from 'pg';
import { DbTerritoire,ParamsPeriode } from '@localTypes/historique.types';
// Types pour les requêtes
import { Polygon, MultiPolygon } from 'geojson';
import { serviceMetAJourTerritoiresPeriodes,
    serviceSupprimeTerritoire,serviceModifieTerritoire } from '../services/territoire.service';
interface GeometryBody {
    geometry: Polygon | MultiPolygon;
}

export const creationRouteurTerritoires = (pool: Pool): Router => {
    const router = Router();
    // Get all lines
    // Get all lines
    const obtiensTerritoiresParPeriode: RequestHandler<ParamsPeriode> = async (req, res): Promise<void> => {
        console.log('obtention territoire')
        let client;
        try {
            const { id } = req.params;
            client = await pool.connect();
            const query = `
        SELECT 
          id_periode_geo,
          ville,
          secteur,
          id_periode,
          ST_AsGeoJSON(geometry) AS geometry
        FROM public.cartographie_secteurs
        WHERE id_periode = $1
        order by id_periode_geo
      `;
            const result = await client.query(query, [id]);
            const clean_output = result.rows.map((item)=>{
                return{
                    ...item,
                    geometry:JSON.parse(item.geometry)
                }
            })
            res.json({ success: true, data: clean_output});
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    };

    const obtiensTerritoiresParId: RequestHandler<ParamsPeriode> = async (req, res): Promise<void> => {
        console.log('obtention territoire')
        let client;
        try {
            const { id } = req.params;
            client = await pool.connect();
            const query = `
        SELECT 
          id_periode_geo,
          ville,
          secteur,
          id_periode,
          ST_AsGeoJSON(geometry) AS geometry
        FROM public.cartographie_secteurs
        WHERE id_periode_geo = $1
        order by id_periode_geo
      `;

            const result = await client.query(query, [id]);
            const clean_output = result.rows.map((item)=>{
                return {
                    ...item,
                    geometry: JSON.parse(item.geometry)
                }
            })
            res.json({ success: true, data: clean_output});
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    };
    const metAJourTerritoiresPeriode: RequestHandler<ParamsPeriode> = async (req, res): Promise<void> => {
        console.log('Mise a jour territoires pour une période')
        let client;
        try{
            const {id_periode} = req.params
            const territoire: Omit<DbTerritoire,'id_periode_geo'>[] = req.body
            const result = await serviceMetAJourTerritoiresPeriodes(pool,Number(id_periode),territoire)
            if (result.success === true){
                res.status(200).json({success:true, data: result.data})
            }else{
                throw Error('Erreur dans la mise à jour des territoire')
            }
        }catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } 
    }

    const supprimeTerritoires: RequestHandler = async(req:any,res:any) : Promise<void> =>{
        try{
            const {id_periode, id_periode_geo} = req.query
            const results = await serviceSupprimeTerritoire(pool,Number(id_periode),Number(id_periode_geo))
            if (results.success === true){
                res.status(200).json({success:true})
            }else{
                throw Error('Erreur dans la suppression')
            }
        }catch(err:any){
            if (err.message === 'Need to provide either id_periode or id_periode_geo'){
                res.status(404).json({success:false,message: 'Need to provide either id_periode or id_periode_geo'})
            }else{
                res.status(500).json({success:false, message:'Erreur interne serveur'})
            }
        }
    }

    const modifieTerritoire: RequestHandler = async(req:any,res:any) : Promise<void>=>{
        try{
            const {id_periode_geo} = req.params;
            const data = req.body;
            const results = await serviceModifieTerritoire(pool,Number(id_periode_geo),data)
            
            res.status(200).json({success:true,data:results.data})
        }catch(err:any){
            if (err.message === 'Invalid id_periode_geo'){
                res.status(404).json({success:false,message: 'Need to provide either id_periode or id_periode_geo'})
            }else{
                res.status(500).json({success:false, message:'Erreur interne serveur'})
            }
        }
    }
    // Routes
    router.get('/periode/:id', obtiensTerritoiresParPeriode)
    router.get('/periode-geo/:id', obtiensTerritoiresParId)
    router.post('/bulk-replace/:id_periode',metAJourTerritoiresPeriode)
    router.delete('/',supprimeTerritoires)
    router.put('/:id_periode_geo',modifieTerritoire)
    return router;
};