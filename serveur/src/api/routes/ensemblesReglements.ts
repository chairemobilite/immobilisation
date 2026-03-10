import { Router, Request, Response, RequestHandler } from 'express';
import { Pool } from 'pg';
import { 
  unit_reg_reg_set_land_use_query, 
  unit_reg_reg_set_land_use_output } from 'inventaire.types';
import { DbAssociationReglementUtilSol,DbEnteteEnsembleReglement,DbCountAssoc } from 'ensembleReglements.types';
import { DbUtilisationSol } from 'utilisationDuSol.types';
import { DbEnteteReglement,DbReglementComplet } from 'reglements.types';
import {ParamsTerritoire} from 'historique.types'
import { ParamsRole } from 'role.types';
import { ParamsEnsReg, ParamsAssocEnsReg } from 'ensembleReglements.types';
import path from 'path';
import { spawn } from 'child_process';

export const creationRouteurEnsemblesReglements = (pool: Pool): Router => {
  const router = Router();
  // Get all lines
  const obtiensEntetesEnsemblesReglements: RequestHandler = async (req:any, res:any): Promise<void> => {
    console.log('Serveur - Obtention entetes ensembles reglements')
    let client;
    try {
      try {
        client = await pool.connect();
      } catch (connErr) {
        console.error('Database connection error:', connErr);
        res.status(500).json({ success: false, error: 'Database connection error' });
        return;
      }
      //console.log(client)
      const { date_debut_er_avant, date_debut_er_apres, date_fin_er_avant, date_fin_er_apres, description_like,id_er} = req.query;
      let queryConds = [];
      let queryVals = [];
      let countquery =1;
      let query = `
        SELECT *
        FROM public.ensembles_reglements_stat
      `
      if (typeof(date_debut_er_avant)!=='undefined'){
        console.log('ajout condition date_debut_er_avant')
        if (date_debut_er_avant !=='null'){
          queryConds.push(`(date_debut_er <= $${countquery} OR date_debut_er IS NULL)`);
          queryVals.push(date_debut_er_avant);
          countquery++;
        } else{
          queryConds.push(`date_debut_er IS NULL`);
        }
      }
      if (typeof(date_debut_er_apres)!=='undefined'){
        console.log('ajout condition date_debut_er_apres')
        if (date_debut_er_apres !=='null'){
          queryConds.push(`date_debut_er >= $${countquery}`);
          queryVals.push(date_debut_er_apres);
          countquery++;
        }else{
          queryConds.push(`date_debut_er IS NULL`);
        }
      }
      if (typeof(date_fin_er_avant)!=='undefined'){
        console.log('ajout condition date_fin_er_avant')
        if (date_fin_er_avant !=='null'){
          queryConds.push(`date_fin_er <= $${countquery}`);
          queryVals.push(date_fin_er_avant);
          countquery++;
        }else{
          queryConds.push(`date_fin_er IS NULL`);
        }
      }
      if (typeof(date_fin_er_apres)!=='undefined'){
        console.log('ajout condition date_fin_er_apres')
        if (date_fin_er_apres!=='null'){
          queryConds.push(`(date_fin_er >= $${countquery} OR date_fin_er IS null)`);
          queryVals.push(date_fin_er_apres);
          countquery++;
        }else{
          queryConds.push(`date_fin_er IS NULL`);
        }
      }
      if (typeof(description_like)!=='undefined'){
        console.log('ajout condition description')
        queryConds.push(`to_tsvector('french', description_er) @@ plainto_tsquery('french', $${countquery})`)
        queryVals.push(decodeURIComponent(description_like as string))
        countquery++;
      }
      if (typeof(id_er) !== 'undefined') {
        let id_er_list: string[] = [];
        if (typeof id_er === 'string') {
          id_er_list = id_er.split(',');
        } else if (Array.isArray(id_er)) {
          id_er_list = id_er.flatMap(item => typeof item === 'string' ? item.split(',') : []);
        }
        if (id_er_list.length === 1) {
          queryConds.push(`id_er = $${countquery}`);
          queryVals.push(id_er_list[0]);
          countquery++;
        } else if (id_er_list.length > 1) {
          // Generate placeholders for each id_er
          const placeholders = id_er_list.map((_, idx) => `$${countquery + idx}`).join(',');
          queryConds.push(`id_er IN (${placeholders})`);
          queryVals.push(...id_er_list);
          countquery += id_er_list.length;
        }
      }
      if (queryConds.length>0){
        query += '\n WHERE ' + queryConds.join(' \n AND ')
      }
      query += `\n ORDER BY id_er ASC`
      let result;
      if (queryConds.length>0){
        result = await client.query<DbEnteteEnsembleReglement>(query,queryVals);
      }else{
        result = await client.query<DbEnteteEnsembleReglement>(query);
      }
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  };

  const obtiensEnsembleReglementCompletParId: RequestHandler = async (req:any, res:any): Promise<void> => {
    console.log('Serveur - Obtention ensembles reglements complets')
    let client;
    try {
      const { id } = req.params;
      // Parse the comma-separated IDs into an array of numbers
      const idArray = id.split(',').map(Number);
      // Dynamically create placeholders for the query (e.g., $1, $2, $3, ...)
      const placeholders = idArray.map((_:number, index: number) => `$${index + 1}`).join(',');

      client = await pool.connect();
      const query_1 = `
        SELECT *
        FROM public.ensembles_reglements_stat
        WHERE id_er IN (${placeholders})
        ORDER BY id_er ASC
      `;

      const result_header = await client.query<DbEnteteEnsembleReglement>(query_1, idArray);
      const query2 = `
        SELECT id_assoc_er_reg, id_reg_stat,cubf,id_er
        FROM public.association_er_reg_stat
        WHERE id_er IN (${placeholders})
        ORDER BY id_assoc_er_reg  ASC
      `
      const result_rules = await client.query<DbAssociationReglementUtilSol>(query2, idArray);

      const query_3 = `
        SELECT *
        FROM public.cubf
        ORDER BY cubf ASC
      `
      const resulUtilSol = await client.query<DbUtilisationSol>(query_3);
      const output = idArray.map((id: number) => {
        const entete = result_header.rows.find((row: DbEnteteEnsembleReglement) => row.id_er === id);
        const assoc_util_reg = result_rules.rows.filter((row: DbAssociationReglementUtilSol) => row.id_er === id);
        return {
          entete,
          assoc_util_reg,
          table_util_sol: resulUtilSol.rows
        };
      });
      res.json({ success: true, data: output });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    } finally {
      if (client) {
        client.release()
      }
    }
  };

  const obtiensReglementsPourEnsReg: RequestHandler = async (req, res): Promise<void> => {
    console.log('Serveur - Obtention entetes de reglements associés à un ensemble de règlements')
    let client;
    try {
      const { id } = req.params;
      client = await pool.connect();
      const query_1 = `
        WITH reg_pert AS(
          SELECT DISTINCT id_reg_stat
          from public.association_er_reg_stat
          where id_er = $1
        )

        SELECT * 
        FROM public.entete_reg_stationnement
        where id_reg_stat in (SELECT id_reg_stat from reg_pert)
      `;

      const result_header = await client.query<DbEnteteReglement>(query_1, [id]);

      res.json({ success: true, data: result_header.rows });

    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error' });
    } finally {
      if (client) {
        client.release()
      }
    }
  };

  const obtiensEntetesParTerritoire: RequestHandler<ParamsTerritoire> = async (req, res): Promise<void> => {
    console.log('Serveur - Obtention entete reglement par territoire')
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
      const result = await client.query<DbEnteteEnsembleReglement>(query, [id]);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  };

  const obtiensEnsRegCompletParRole: RequestHandler<ParamsRole> = async (req, res): Promise<void> => {
    console.log('obtention ens-reg par role - Implémentation incomplète')
    let client;
    try {
      client = await pool.connect();
      const { ids } = req.params;
      const listeIds = typeof ids === 'string' ? ids.split(',') : ids;
      const stringToTransmit = "'" + listeIds.join("','") + "'"
      const query = `
        WITH role AS (
          SELECT 
          rf.id_provinc,
          rf.geometry,
          COALESCE(rf.rl0307a::int, 0) as annee_constr,
          hg.id_periode
          FROM
          public.role_foncier rf
          left join historique_geopol hg on (hg.date_debut_periode <= COALESCE(rf.rl0307a::int, 0) OR hg.date_debut_periode is null) AND (hg.date_fin_periode >= COALESCE(rf.rl0307a::int, 0) OR hg.date_fin_periode is null)
          WHERE id_provinc = ANY($1::text[])
        ), territoire_avec_annee as(
          SELECT
            cs.id_periode_geo,
            cs.geometry,
            cs.id_periode,
            hg.date_debut_periode,
            hg.date_fin_periode,
            ers.id_er,
            ers.description_er,
            ers.date_debut_er,
            ers.date_fin_er
          FROM
            cartographie_secteurs cs
          LEFT JOIN historique_geopol hg on hg.id_periode = cs.id_periode 
          left join association_er_territoire aet on aet.id_periode_geo = cs.id_periode_geo
          left join ensembles_reglements_stat ers on ers.id_er = aet.id_er
        )
        SELECT
          role.id_provinc,
          --role.annee_constr,
          --role.id_periode,
          --taa.id_periode_geo,
          --taa.date_debut_periode,
          --taa.date_fin_periode,
          --
          --role.geometry as geometry_role,
          --taa.geometry as geometry_sector,
          taa.id_er,
          taa.description_er,
          taa.date_debut_er,
          taa.date_fin_er
        FROM 
          role
        left join territoire_avec_annee taa 
          on taa.id_periode = role.id_periode 
          AND ST_Intersects(role.geometry,taa.geometry) 
          AND (role.annee_constr >= taa.date_debut_er or taa.date_debut_er is null) 
          AND (role.annee_constr <= taa.date_fin_er or taa.date_fin_er is null)
      `;
      const result = await client.query<DbReglementComplet>(query, [listeIds]);
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  };
  const nouvelleEnteteEnsembleReglement: RequestHandler<void> = async (req, res): Promise<void> => {
    console.log('Sauvegarde nouvelle entete ensemble reg')
    let client;
    try {
      client = await pool.connect();
      const { description_er, date_debut_er, date_fin_er } = req.body;
      const query = `
        INSERT INTO public.ensembles_reglements_stat(description_er,date_debut_er,date_fin_er)
        VALUES ($1,$2,$3)
        RETURNING *;
      `;
      const result = await client.query<DbEnteteEnsembleReglement>(query, [description_er, date_debut_er, date_fin_er]);
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  };
  const supprimeEnsembleReglement: RequestHandler<ParamsEnsReg> = async (req, res) => {
    console.log('Sauvegarde nouvelle entete ensemble reg')
    let client;
    try {
      client = await pool.connect();
      const { id } = req.params;
      const queryCountAssoc = `
        SELECT
          COUNT(*) as count_assoc_lines
        FROM
          public.association_er_reg_stat
        WHERE 
          id_er = $1;
      `;
      const resultCount = await client.query<DbCountAssoc>(queryCountAssoc, [id]);
      let queryHeader: string;
      let queryAssoc: string;
      let resultHeader: any;
      let resultAssoc: any;
      if (resultCount.rows[0].count_assoc_lines > 0) {
        queryHeader =
          ` DELETE FROM public.ensembles_reglements_stationnement
            WHERE id_er = $1; `
        queryAssoc =
          ` DELETE FROM public.association_er_reg_stat
            WHERE id_er = $1`
        resultAssoc = await client.query(queryAssoc, [id]);
        resultHeader = await client.query(queryHeader, [id]);
      } else {
        queryHeader =
          ` DELETE FROM public.ensembles_reglements_stationnement
            WHERE id_er = $1; `
        resultHeader = await client.query(queryHeader, [id]);
        resultAssoc = { rowCount: 1 }
      }
      const successHeader = resultHeader && resultAssoc.rowCount >= 0 ? true : false;
      const successAssoc = resultAssoc && resultAssoc.rowCount >= 0 ? true : false;
      res.json({ success: successHeader && successAssoc });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  };
  const modifieEnteteEnsembleReglement: RequestHandler<ParamsEnsReg> = async (req, res) => {

    let client;
    try {
      client = await pool.connect();
      const { id } = req.params
      console.log(`Sauvegarde modification entete ensemble reg id_er: ${id}`)
      const { description_er, date_debut_er, date_fin_er } = req.body;
      const query = `
        UPDATE public.ensembles_reglements_stat
        SET 
          description_er = $1,
          date_debut_er = $2,
          date_fin_er = $3
        WHERE id_er = $4
        RETURNING *;
      `;
      const result = await client.query<DbEnteteEnsembleReglement>(query, [description_er, date_debut_er, date_fin_er, Number(id)]);
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  }
  const nouvelleAssociationEnsembleReglement: RequestHandler<void> = async (req, res) => {
    console.log('Sauvegarde nouvelle association ensemble reg')
    let client;
    try {
      client = await pool.connect();
      const { id_er, cubf, id_reg_stat } = req.body;
      const query = `
        INSERT INTO public.association_er_reg_stat(id_er,cubf,id_reg_stat)
        VALUES ($1,$2,$3)
        RETURNING *;
      `;
      const result = await client.query<DbEnteteEnsembleReglement>(query, [id_er, cubf, id_reg_stat]);
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  }
  const modifieAssocEnsembleReglement: RequestHandler<ParamsEnsReg> = async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const { id } = req.params
      console.log(`Sauvegarde modification entete ensemble reg id_er: ${id}`)
      const { id_er, cubf, id_reg_stat } = req.body;
      const query = `
        UPDATE public.association_er_reg_stat
        SET 
          id_er = $1,
          cubf= $2,
          id_reg_stat= $3
        WHERE id_assoc_er_reg = $4
        RETURNING *;
      `;
      const result = await client.query<DbEnteteEnsembleReglement>(query, [id_er, cubf, id_reg_stat, id]);
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  }
  const supprimeAssocEnsembleReglement: RequestHandler<ParamsAssocEnsReg> = async (req, res) => {
    console.log('Sauvegarde nouvelle entete ensemble reg')
    let client;
    try {
      client = await pool.connect();
      const { id } = req.params;

      const queryAssoc =
        ` DELETE FROM public.association_er_reg_stat
          WHERE id_assoc_er_reg = $1`
      const resultAssoc: any = await client.query(queryAssoc, [id]);

      const successAssoc = resultAssoc && resultAssoc.rowCount >= 0 ? true : false;
      res.json({ success: successAssoc });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Database error test' });
    } finally {
      if (client) {
        client.release()
      }
    }
  };

  const infoPourGraphiques: RequestHandler<void> = async (req, res) => {
    const scriptPath = path.resolve(__dirname, "../../../../serveur_calcul_python/obtention_information_graphiques.py");

    // Chemin direct vers l'interpréteur Python dans l'environnement Conda
    const pythonExecutable = '/opt/conda/envs/serveur_calcul_python/bin/python3';

    // Exécuter le script Python avec l'interpréteur de l'environnement
    const pythonProcess = spawn(pythonExecutable, [scriptPath]);

    const jsonData = JSON.stringify(req.body);
    pythonProcess.stdin.write(jsonData);
    pythonProcess.stdin.end();

    let outputData = '';
    let errorData = '';

    // Capturer l'output standard
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    // Capturer les erreurs standard
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    // Capturer la fin du processus
    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        //console.log(`Output: ${outputData}`)
        console.log(`Processus enfant terminé avec succès.`);
        try {
          // 🔹 Extract JSON by finding the first `{` (start of JSON)
          const jsonStartIndex = outputData.indexOf('[');
          if (jsonStartIndex !== -1) {
            const jsonString = outputData.slice(jsonStartIndex).trim();
            const jsonData:unit_reg_reg_set_land_use_query[] = JSON.parse(jsonString);
            
            // Extract unique units safely for parameterized query
            const regsToGet = jsonData.map(e=>e.id_reg_stat);
            const unitsToGet = jsonData.flatMap(e => e.unite);
            const RegSetsToGet = jsonData.flatMap(e=> e.id_er);
            const uniqueUnits = Array.from(new Set(unitsToGet)).filter(u => typeof u === 'number' || typeof u === 'string');
            const uniqueRegs =  Array.from(new Set(regsToGet)).filter(u => typeof u === 'number' || typeof u === 'string');
            const uniqueRegSets = Array.from(new Set(RegSetsToGet)).filter(u => typeof u === 'number' || typeof u === 'string');
            let output: unit_reg_reg_set_land_use_output[];
            output = []
            if (uniqueUnits.length > 0 && uniqueRegs.length>0 && uniqueRegSets.length>0) {
              const placeholders = uniqueUnits.map((_, i) => `$${i + 1}`).join(',');
              const placeHolderRegs = uniqueRegs.map((_, i) => `$${i + 1}`).join(',');
              const placeHolderRegSets = uniqueRegSets.map((_, i) => `$${i + 1}`).join(',');
              const unitDescsQuery = `
              SELECT id_unite, desc_unite
              FROM public.multiplicateur_facteurs_colonnes
              WHERE id_unite IN (${placeholders})
              `;
              const regDescQuery = `
                SELECT 
                  id_reg_stat, 
                  description 
                FROM public.entete_reg_stationnement
                WHERE id_reg_stat IN (${placeHolderRegs})
              `
              const regSetDescQuery = `
                SELECT id_er,description_er
                FROM public.ensembles_reglements_stat
                WHERE id_er IN (${placeHolderRegSets})
              `
              const [result_unit,result_regs,result_regSets] = await Promise.all([pool.query(unitDescsQuery, uniqueUnits),pool.query(regDescQuery,uniqueRegs),pool.query(regSetDescQuery,uniqueRegSets)]);
              output = jsonData.map(e => ({ 
                id_er: e.id_er,
                desc_er: result_regSets.rows.find((o)=>o.id_er===e.id_er)?.description_er??'N/A',
                id_reg_stat: e.id_reg_stat,
                desc_reg_stat:result_regs.rows.find((p)=>p.id_reg_stat===e.id_reg_stat)?.description??'N/A',
                unite:e.unite,
                desc_unite:e.unite.map((uniteOut)=>result_unit.rows.find((unitRet)=>unitRet.id_unite===uniteOut)?.desc_unite??'N/A')
              }));
              // Use result.rows as needed
            }
            
            console.log('Parsed JSON:', jsonData);
            return res.status(200).json({ success: true, data: output });  //  Send JSON response
          } else {
            console.error('No JSON found in output:', outputData);
            return res.status(500).send('Erreur: No valid JSON found in output.');
          }
        } catch (err) {
          console.error('Failed to parse JSON:', err);
          return res.status(500).send('Erreur: JSON parsing failed.');
        }
      } else {
        console.error(`Processus enfant échoué avec le code : ${code}`);
        return res.status(500).send(`Erreur: ${errorData}`);
      }
    });
  };

  // Routes
  // basiques
  router.delete('/:id', supprimeEnsembleReglement)
  router.get('/complet/:id', obtiensEnsembleReglementCompletParId)
  router.get('/entete', obtiensEntetesEnsemblesReglements);
  router.post('/entete', nouvelleEnteteEnsembleReglement)
  router.put('/entete/:id', modifieEnteteEnsembleReglement)
  router.post('/assoc', nouvelleAssociationEnsembleReglement)
  router.put('/assoc/:id', modifieAssocEnsembleReglement)
  router.delete('/assoc/:id', supprimeAssocEnsembleReglement)
  // ancilaires
  router.get('/regs-associes/:id', obtiensReglementsPourEnsReg);
  router.get('/entete-par-territoire/:id', obtiensEntetesParTerritoire)
  router.get('/par-role/:ids', obtiensEnsRegCompletParRole)
  router.post('/informations-pour-graphique', infoPourGraphiques)
  return router;
};