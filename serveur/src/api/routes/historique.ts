import { Router, RequestHandler } from 'express';
import { Pool } from 'pg';
import { DbHistoriqueGeopol } from 'historique.types';
// Types pour les requêtes
import { Polygon,MultiPolygon } from 'geojson';
interface GeometryBody {
  geometry: Polygon|MultiPolygon;  
}

export const creationRouteurHistorique = (pool: Pool): Router => {
  const router = Router();
  // Get all lines
  // Get all lines
  const obtiensTousPeriodes: RequestHandler = async (_req, res): Promise<void> => {
    console.log('Serveur - Obtention toutes periodes')
    let client;
    try {

      client = await pool.connect();
      const query = `
        SELECT *
        FROM public.historique_geopol
        ORDER BY id_periode ASC
      `;

      const result = await client.query<DbHistoriqueGeopol>(query, );
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    }finally{
      if (client){
        client.release()
      }
    }
  };

  const nouvellePeriode: RequestHandler = async(req,res,next):Promise<void> =>{
    let client;
    try {
      const { nom_periode,date_debut_periode,date_fin_periode} = req.body;
      client = await pool.connect();
      const result = await client.query(
        `INSERT INTO public.historique_geopol(nom_periode,date_debut_periode,date_fin_periode)
          VALUES ($1, $2, $3)RETURNING *`,
        [nom_periode,date_debut_periode,date_fin_periode]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Entry not found' });
        return;
      }
      res.json({ success: true, data: result.rows });
      
    } catch (err) {
      next(err);
    } finally{
      if(client){
        client.release();
      }
    }
  };
  const majPeriode:RequestHandler = async(req,res,next):Promise<void> =>{
    let client;
    try {
      const { id } = req.params;
      const { nom_periode,date_debut_periode,date_fin_periode } = req.body;
      client = await pool.connect();
      const result = await client.query(
        `UPDATE public.historique_geopol SET 
            nom_periode = $1, 
            date_debut_periode = $2, 
            date_fin_periode = $3
          WHERE 
            id_periode = $4 
          RETURNING 
            *`,
        [nom_periode, date_debut_periode, date_fin_periode,id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Entry not found' });
        return;
      }
      res.json({ success: true, data: result.rows });
      
    } catch (err) {
      next(err);
    } finally{
      if(client){
        client.release();
      }
    }
  };
  const supprimePeriode:RequestHandler = async(req,res,next):Promise<void> =>{
    let client;
    try {
      const{id} = req.params
      client = await pool.connect();
      const result = await client.query(
        `DELETE FROM public.historique_geopol WHERE id_periode= $1;`,
        [id]
      );
      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: 'Entry not found' });
        return;
      }
      res.json({ success: true, data: [] });
      
    } catch (err) {
      next(err);
    } finally{
      if (client){
        client.release();
      }
    }
  };
  // Routes
  router.get('/', obtiensTousPeriodes);
  router.post('/',nouvellePeriode);
  router.put('/:id',majPeriode);
  router.delete('/:id',supprimePeriode);
  return router;
};