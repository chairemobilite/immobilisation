import { Router, Request, RequestHandler } from 'express';
import { Pool } from 'pg';
import { DbDefReglement, DbEnteteReglement, DbReglementComplet } from 'reglements.types';
import path from 'path';
import { spawn } from 'child_process';
import { GetReglementsParams } from '../repositories/reglements.repositories';
import { serviceCreeOperations, serviceGetReg } from '../services/reglements.services';

export const creationRouteurReglements = (pool: Pool): Router => {
    const router = Router();
    // Get all lines
    // Get all lines
    const parseParamsGetRules = (req:Request):GetReglementsParams =>{
        const {
            annee_debut_apres,
            annee_debut_avant,
            annee_fin_apres,
            annee_fin_avant,
            description,
            ville,
            texte,
            article,
            paragraphe,
            unite,
            format,
            id_er,
            id_periode_geo,
            id_periode,
            cubf,
            id_reg_stat
        } = req.query;

        return{
            reg_complet: format!==undefined && format==='c'?true:false,
            annee_debut_apres: annee_debut_apres!==undefined? Number(annee_debut_apres) : undefined,
            annee_debut_avant: annee_debut_avant!==undefined? annee_debut_avant!=='null'? Number(annee_debut_avant):null:undefined,
            annee_fin_avant: annee_fin_avant!==undefined?Number(annee_fin_avant):undefined,
            annee_fin_apres: annee_fin_apres!==undefined?annee_fin_apres!=='null'?Number(annee_fin_apres):null:undefined,
            description: description!==undefined?String(description):undefined,
            ville: ville!==undefined?String(ville):undefined,
            texte: texte!==undefined?String(texte):undefined,
            paragraphe: paragraphe!==undefined?String(paragraphe):undefined,
            article: article!==undefined?String(article):undefined,
            unite: unite!==undefined?String(unite).split(',').map((item)=>Number(item)):undefined,
            id_er: id_er!==undefined?String(id_er).split(',').map((item)=>Number(item)):undefined,
            id_periode_geo:id_periode_geo!==undefined?String(id_periode_geo).split(',').map((item)=>Number(item)):undefined,
            id_periode: id_periode!==undefined?String(id_periode).split(',').map((item)=>Number(item)):undefined,
            cubf: cubf!==undefined?String(cubf).split(',').map((item)=>Number(item)):undefined,
            id_reg_stat: id_reg_stat!==undefined?String(id_reg_stat).split(',').map((item)=>Number(item)):undefined,
        }
    }

    const obtiensReglements: RequestHandler = async (req, res): Promise<void> => {
        console.log('Serveur - Obtention règlements')
        try {
            const params = parseParamsGetRules(req)
            const result_2 = await serviceGetReg(pool,params)
            res.json({ success: true, data: result_2 });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } 
    };

    const obtiensReglementCompletParId: RequestHandler = async (req:any, res:any): Promise<void> => {
        console.log('Serveur - Obtention reg complet par id')
        let client;
        try {
            client = await pool.connect();
            const { idToSplit } = req.params;
            // Parse the comma-separated IDs into an array of numbers
            const idArray = idToSplit.split(',').map(Number);

            // Dynamically create placeholders for the query (e.g., $1, $2, $3, ...)
            const placeholders = idArray.map((_:number, index: number) => `$${index + 1}`).join(',');

            // Query to fetch headers
            const query1 = `
        SELECT *
        FROM public.entete_reg_stationnement
        WHERE id_reg_stat IN (${placeholders})
        ORDER BY id_reg_stat ASC
      `;
            const result_header = await client.query(query1, idArray);

            // Query to fetch rules
            const query2 = `
        SELECT * 
        FROM public.reg_stationnement_empile
        WHERE id_reg_stat IN (${placeholders})
        ORDER BY id_reg_stat_emp ASC
      `;
            const result_rules = await client.query(query2, idArray);

            // Group rules by `id_reg_stat` for efficient access
            const rulesById = new Map<number, DbDefReglement[]>();
            result_rules.rows.forEach((rule: DbDefReglement) => {
                if (!rulesById.has(rule.id_reg_stat)) {
                    rulesById.set(rule.id_reg_stat, []);
                }
                rulesById.get(rule.id_reg_stat)?.push(rule);
            });

            // Combine headers with their corresponding rules
            const output_2: DbReglementComplet[] = result_header.rows.map((header: DbEnteteReglement) => ({
                entete: header,
                definition: rulesById.get(header.id_reg_stat) || [], // Default to an empty array if no rules match
            }));

            res.json({ success: true, data: output_2 });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release(); // Release the connection back to the pool
            }
        }
    };



    const nouvelEnteteReglement: RequestHandler = async (req, res, next): Promise<void> => {
        let client;
        try {
            const { description, annee_debut_reg, annee_fin_reg, texte_loi, article_loi, paragraphe_loi, ville } = req.body;
            client = await pool.connect();
            const query = `INSERT INTO public.entete_reg_stationnement(description,annee_debut_reg,annee_fin_reg,texte_loi,article_loi,paragraphe_loi,ville)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;`
            const response = await client.query(query, [description, annee_debut_reg, annee_fin_reg, texte_loi, article_loi, paragraphe_loi, ville])
            if (response.rows.length === 0) {
                res.status(404).json({ success: false, error: 'Entry not found' });
                return;
            }
            res.json({ success: true, data: response.rows });
        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    const modifieEnteteReglement: RequestHandler = async (req, res, next): Promise<void> => {
        let client;
        try {
            const { id } = req.params;
            const { description, annee_debut_reg, annee_fin_reg, texte_loi, article_loi, paragraphe_loi, ville } = req.body;
            client = await pool.connect();
            const query =
                `UPDATE public.entete_reg_stationnement
      SET
        description = $1,
        annee_debut_reg = $2,
        annee_fin_reg = $3,
        texte_loi = $4,
        article_loi = $5,
        paragraphe_loi = $6,
        ville = $7
      WHERE id_reg_stat = $8 
      RETURNING *;`
            const response = await client.query(query, [description, annee_debut_reg, annee_fin_reg, texte_loi, article_loi, paragraphe_loi, ville, id])
            if (response.rows.length === 0) {
                res.status(404).json({ success: false, error: 'Entry not found' });
                return;
            }
            res.json({ success: true, data: response.rows });
        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    const supprimeReglement: RequestHandler = async (req, res, next): Promise<void> => {
        let client;
        try {
            const { id } = req.params;
            client = await pool.connect();
            const queryCount = `SELECT
                            COUNT(*)
                          FROM
                            public.reg_stationnement_empile
                          WHERE
                            id_reg_stat = $1;`
            const responseCount = await client.query(queryCount, [id])
            let queryDeleteHeader: string;
            let queryDeleteStack: string;
            let responseHeader: any;
            let responseStacked: any;
            queryDeleteHeader = `DELETE FROM 
                              public.entete_reg_stationnement 
                            WHERE
                              id_reg_stat = $1;`
            queryDeleteStack = `DELETE FROM
                              public.reg_stationnement_empile
                            WHERE
                              id_reg_stat = $1;`
            if (Number(responseCount.rows[0].count) === 0) {
                responseHeader = await client.query(queryDeleteHeader, [id]);
                responseStacked = { rowCount: 1 };
            } else {
                responseHeader = await client.query(queryDeleteHeader, [id])
                responseStacked = await client.query(queryDeleteStack, [id])
            }
            const successHeader = responseHeader && responseHeader.rowCount >= 0 ? true : false;
            const successStacked = responseStacked && responseStacked.rowCount >= 0 ? true : false;
            res.json({ success: successHeader && successStacked });
        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    }
    const obtiensToutesOperations: RequestHandler = async (_req, res): Promise<void> => {
        console.log('Serveur - Obtention toutes operations')
        let client;
        try {
            client = await pool.connect();
            const query = `
        SELECT *
        FROM public.liste_operations
        order by id_operation
      `;

            const result = await client.query(query);
            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release(); // Release the connection back to the pool
            }
        }
    };

    const creeOperationsParDefaut: RequestHandler = async(_req,res):Promise<void>=>{
        try {
            console.log('Serveur règlements - créations opérations par défaut')
            const result = await serviceCreeOperations(pool)
            if ( result.success){
                res.status(200).json({success:true,data:result.rowCount})
            }else{
                res.status(500).json({success:false,data:result.rowCount})
            }
        }catch(err:any){
            res.status(500).json({ success: false, error: 'Database error' });
        }
        
    }



    const nouvelleLigneDefinition: RequestHandler = async (req, res, next): Promise<void> => {
        let client;
        try {
            const { id_reg_stat, ss_ensemble, seuil, oper, cases_fix_min, cases_fix_max, pente_min, pente_max, unite } = req.body;
            client = await pool.connect();
            const query = `INSERT INTO public.reg_stationnement_empile(id_reg_stat,ss_ensemble,seuil,oper,cases_fix_min,cases_fix_max,pente_min,pente_max,unite)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *;`
            const response = await client.query(query, [id_reg_stat, ss_ensemble, seuil, oper, cases_fix_min, cases_fix_max, pente_min, pente_max, unite])
            if (response.rows.length === 0) {
                res.status(404).json({ success: false, error: 'Entry not found' });
                return;
            }
            res.json({ success: true, data: response.rows });
        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    }
    const majLigneDefinition: RequestHandler = async (req, res, next): Promise<void> => {
        let client;
        try {
            const { id_reg_stat, ss_ensemble, seuil, oper, cases_fix_min, cases_fix_max, pente_min, pente_max, unite } = req.body;
            const { id } = req.params;
            client = await pool.connect();
            const query = `UPDATE public.reg_stationnement_empile
      SET
        id_reg_stat = $1,
        ss_ensemble = $2,
        seuil = $3,
        oper = $4,
        cases_fix_min = $5,
        cases_fix_max = $6,
        pente_min = $7,
        pente_max = $8,
        unite = $9
      WHERE id_reg_stat_emp = $10 
      RETURNING *;`
            const response = await client.query(query, [id_reg_stat, ss_ensemble, seuil, oper, cases_fix_min, cases_fix_max, pente_min, pente_max, unite, id])
            if (response.rows.length === 0) {
                res.status(404).json({ success: false, error: 'Entry not found' });
                return;
            }
            res.json({ success: true, data: response.rows });
        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    }
    const supprimeLigneDefinition: RequestHandler = async (req, res, next): Promise<void> => {
        let client;
        try {
            const { id } = req.params;
            client = await pool.connect();

            let queryDeleteStack: string;
            let responseStacked: any;
            queryDeleteStack = `DELETE FROM
                            public.reg_stationnement_empile
                          WHERE
                            id_reg_stat_emp = $1`

            responseStacked = await client.query(queryDeleteStack, [id])
            res.json({ success: responseStacked.rowCount > 0 });
        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    }
    const obtiensGraphiquesReglements: RequestHandler = async (req, res, next): Promise<void> => {
        console.log('Calcul des données nécessaires pour faire un graphique de règlements')
        if (typeof (req.query['id_reg_stat']) === 'undefined' && typeof (req.query['id_unite']) === 'undefined') {
            res.status(400).json({ error: "Doit fournir id_reg_stat et id_unite" });
        }
        const scriptPath = path.resolve(__dirname, "../../../../serveur_calcul_python/calculer_valeurs_graphiques.py");

        // Chemin direct vers l'interpréteur Python dans l'environnement Conda
        const pythonExecutable = '/opt/conda/envs/serveur_calcul_python/bin/python3';

        // Exécuter le script Python avec l'interpréteur de l'environnement
        const pythonProcess = spawn(pythonExecutable, [scriptPath]);

        const jsonData = JSON.stringify(req.query);
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
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                //console.log(`Output: ${outputData}`)
                console.log(`Processus enfant terminé avec succès.`);
                try {
                    // 🔹 Extract JSON by finding the first `{` (start of JSON)
                    const jsonStartIndex = outputData.indexOf('{');
                    if (jsonStartIndex !== -1) {
                        const jsonString = outputData.slice(jsonStartIndex).trim();
                        const jsonData = JSON.parse(jsonString);

                        //console.log('Parsed JSON:', jsonData);
                        return res.status(200).json({ success: true, data: jsonData });  //  Send JSON response
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
    }
    // Routes
    router.get('',obtiensReglements)
    //router.get('/entete', obtiensTousEntetesReglements);
    //router.get('/complet/:idToSplit', obtiensReglementCompletParId);
    router.get('/operations', obtiensToutesOperations)
    router.post('/operation-defaults',creeOperationsParDefaut)
    router.post('/entete', nouvelEnteteReglement)
    router.put('/entete/:id', modifieEnteteReglement)
    router.delete('/:id', supprimeReglement)
    router.post('/ligne-def', nouvelleLigneDefinition)
    router.put('/ligne-def/:id', majLigneDefinition)
    router.delete('/ligne-def/:id', supprimeLigneDefinition)
    router.get('/graphiques', obtiensGraphiquesReglements)
    return router;
};