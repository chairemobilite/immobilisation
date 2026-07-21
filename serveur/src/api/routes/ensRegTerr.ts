import { Router,  RequestHandler } from 'express';
import { Pool } from 'pg';
import { ParamsAssocEnsRegTerr, } from '@localTypes/ensembleReglements.types';
import { ParamsTerritoire } from '@localTypes/historique.types'


export const creationRouteurEnsRegTerr = (pool: Pool): Router => {
    const router = Router();

    const obtiensAssociations: RequestHandler<ParamsTerritoire> = async (req, res): Promise<void> => {
        console.log('Serveur - obtention ens-reg-terr par territoire')
        let client;
        try {
            client = await pool.connect();
            const { id } = req.params;
            const query = `
      WITH associations AS (
        SELECT 
          id_asso_er_ter,
          id_periode_geo,
          id_er
        FROM 
          public.association_er_territoire
        WHERE
          id_periode_geo = $1
      )
        SELECT
            associations.id_asso_er_ter,
            associations.id_periode_geo,
	          ers.id_er,
	          ers.description_er,
	          ers.date_debut_er,
	          ers.date_fin_er
        FROM public.ensembles_reglements_stat ers
        JOIN 
          associations ON associations.id_er = ers.id_er
        ORDER BY 
          date_debut_er ASC
      `;
            const result = await client.query(query, [id]);
            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error test' });
        } finally {
            if (client) {
                client.release()
            }
        }
    };
  const obtiensAssociationsParFiltre: RequestHandler<void> = async (req, res): Promise<void> => {
    console.log('Serveur - obtention ens-reg-terr par filtre')
    let client;
    const conditionsGeom: string[] = [];
    const conditionsER: string[] = [];
    const values: any[] = []; // store parameters
    let paramIndex = 1;
    
    try {
      client = await pool.connect();
      const {lat, long,id_periode,annee_debut_avant,annee_debut_apres,annee_fin_avant,annee_fin_apres,ville_comme,secteur_comme,} = req.query;
      const addConditionGeom = (sql: string, value: any) => {
        conditionsGeom.push(sql.replace('?', `$${paramIndex}`));
        values.push(value);
        paramIndex++;
      };
      const addConditionER = (sql: string, value: any) => {
        conditionsER.push(sql.replace('?', `$${paramIndex}`));
        values.push(value);
        paramIndex++;
      };

      if (lat !== undefined && long!==undefined) {
        conditionsGeom.push('ST_Within(ST_SetSRID( ST_Point( $1, $2), 4326),cs.geometry)')
        values.push(long);
        values.push(lat);
        paramIndex++;
        paramIndex++;
      }
      if (id_periode!==undefined){
        addConditionGeom('id_periode = ?',id_periode)
      }
      if(annee_debut_avant!==undefined){
        addConditionER('hg.date_debut_periode <= ?',annee_debut_avant)
        addConditionER('(ers.date_debut_er <= ? OR ers.date_debut_er IS NULL)',annee_debut_avant)
      }
      if(annee_debut_apres!==undefined){
        addConditionER('hg.date_debut_periode >= ?',annee_debut_apres)
        addConditionER('ers.date_debut_er >= ?',annee_debut_apres)
      }
      if(annee_fin_avant!==undefined){
        addConditionER('hg.date_fin_periode <= ?',annee_fin_avant)
        addConditionER('ers.date_fin_er <= ?',annee_fin_avant)
      }
      if(annee_fin_apres!==undefined){
        addConditionER('(hg.date_fin_periode >= ? OR hg.date_fin_periode IS NULL) ',annee_fin_apres)
        addConditionER('(ers.date_fin_er >= ? OR ers.date_fin_er IS NULL)',annee_fin_apres)
      }
      if(ville_comme!==undefined){
        addConditionER(`to_tsvector('french', tp.ville) @@ plainto_tsquery('french', ?)`, decodeURIComponent(ville_comme as string))
      }
      if(secteur_comme!==undefined){
        addConditionER(`to_tsvector('french', tp.secteur) @@ plainto_tsquery('french', ?)`, decodeURIComponent(secteur_comme as string))
      }



      let cteTerritoriesQuery = `territoires_possibles AS (
          SELECT 
            * 
          FROM 
            public.cartographie_secteurs cs
          `
      if (conditionsGeom.length>=1){
        cteTerritoriesQuery += 'WHERE '+ conditionsGeom.join(' AND ') + ')'
      } else{
        cteTerritoriesQuery +=')'
      }

      let cteAssociations = `associations_possibles AS (
        SELECT
          * 
        FROM
          public.association_er_territoire)
      `

      let queryFin = `
        SELECT
            ap.id_asso_er_ter,
            ap.id_periode_geo,
	          ers.id_er,
	          ers.description_er,
	          ers.date_debut_er,
	          ers.date_fin_er
        FROM public.ensembles_reglements_stat ers
        JOIN 
          associations_possibles ap ON ap.id_er = ers.id_er
        JOIN 
          territoires_possibles tp ON tp.id_periode_geo = ap.id_periode_geo
        LEFT JOIN
          historique_geopol hg ON hg.id_periode = tp.id_periode
        
      `;
      if(conditionsER.length>=1){
        queryFin+= 'WHERE '+conditionsER.join(' AND ')+ '\n'
      }
      queryFin += 'ORDER BY ers.date_debut_er ASC'

      // Final SQL build
      let query = 'WITH ' + cteTerritoriesQuery+ ', ' + cteAssociations + '\n' + queryFin
      

      

      client = await pool.connect();

      const result = await client.query(query, values);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  };

    const nouvelleAssociation:RequestHandler<void> = async(req,res):Promise<void>=>{
      console.log('Serveur - obtention ens-reg-terr par territoire')
        let client;
        try {
            client = await pool.connect();
            const { id_er,id_periode_geo } = req.body;
            const query = `
                INSERT INTO public.association_er_territoire(id_er,id_periode_geo)
                VALUES ($1,$2)
                RETURNING *;
              `;
            const result = await client.query(query, [id_er,id_periode_geo]);
            res.json({ success: true, data: result.rows[0] });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error test' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }
    const supprimeAssociation:RequestHandler<ParamsAssocEnsRegTerr>= async(req,res):Promise<void>=>{
      console.log('Serveur - suppression assoc ens-reg-terr')
        let client;
        try {
            client = await pool.connect();
            const { id } = req.params;
            const query = `
                DELETE FROM public.association_er_territoire
                WHERE id_asso_er_ter = $1
                RETURNING *;
              `;
            const result = await client.query(query, [id]);
            res.json({success:result.rowCount===1});
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error test' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }
  const modifieAssociation: RequestHandler<ParamsAssocEnsRegTerr> = async (req, res): Promise<void> => {
    console.log('Serveur obtention association ens-reg-terr')
    let client;
    const conditions: string[] = [];
    const values: any[] = []; // store parameters
    let paramIndex = 1;
    try {
      client = await pool.connect();
      const { id } = req.params;
      const { id_er, id_periode_geo } = req.body;
      const query = `
                UPDATE public.association_er_territoire
                SET
                  id_er = $1,
                  id_periode_geo = $2
                WHERE id_asso_er_ter = $3
                RETURNING *;
              `;
      const result = await client.query(query, [id_er, id_periode_geo, id]);
      res.json({ success: result.rowCount === 1, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  }


    router.get('/par-territoire/:id', obtiensAssociations);
    router.get('/associations', obtiensAssociationsParFiltre)
    router.post('/association',nouvelleAssociation)
    router.delete('/association/:id',supprimeAssociation)
    router.put('/association/:id',modifieAssociation)
    return router;
}