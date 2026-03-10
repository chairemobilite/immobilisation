import { Router, RequestHandler } from 'express';
import { Pool } from 'pg';
import { ParamsQuartier } from 'secteursAnalyse.types';
import { 
    CorpsRequeteInventaire,
    RequeteCalculeInventaireRegMan,
    RequeteInventaireGros,
    CorpsRequeteInventaireGros,
    RequeteInventaire ,
    ParamsInventaire
} from 'inventaire.types';
// Types pour les requêtes
import path from 'path';
import { spawn } from 'child_process';
import { ParamsCadastre } from 'cadastre.types';

export const creationRouteurInventaire = (pool: Pool): Router => {
    const router = Router();
    // Get all lines
    // Get all lines
    const obtiensInventaireParQuartier: RequestHandler<ParamsQuartier> = async (req, res): Promise<void> => {
        console.log('entering get inventory by neighborhood')
        let client;
        try {
            const { id } = req.params;
            client = await pool.connect();
            const query = `SELECT
            c.g_no_lot,
            i.n_places_min,
            i.n_places_max,
            i.n_places_estime,
            i.n_places_mesure,
            i.n_places_max,
            i.id_er,
            i.id_reg_stat,
            i.commentaire,
            i.methode_estime,
            i.cubf,
            i.id_inv
        FROM 
            public.cadastre c
        RIGHT JOIN
            public.inventaire_stationnement i
            ON i.g_no_lot = c.g_no_lot
        WHERE 
            ST_Intersects(c.geometry, 
                (SELECT 
                    geometry
                FROM public.sec_analyse 
                WHERE id_quartier = $1
                LIMIT 1)  -- Limiting to one geometry result
        );`
            const result = await client.query(
                query,
                [id]
            );
            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    };

    const calculInventairePythonQuartier: RequestHandler<ParamsQuartier> = async (req, res): Promise<void> => {
        console.log('entering calc inventory by neighborhood')
        const { id } = req.params;
        const scriptPath = path.resolve(__dirname, "../../../../serveur_calcul_python/calcul_par_quartier.py");
        //debugger;
        // Chemin direct vers l'interpréteur Python dans l'environnement Conda
        const pythonExecutable = '/opt/conda/envs/serveur_calcul_python/bin/python3';

        // Exécuter le script Python avec l'interpréteur de l'environnement
        const pythonProcess = spawn(pythonExecutable, [scriptPath, id]);
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
                    const jsonStartIndex = outputData.indexOf('[');
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
    };

    const calculInventairePythonLot: RequestHandler<ParamsCadastre> = async (req, res): Promise<void> => {
        const { id } = req.params;
        const decipheredId = id.replace(/_/g, " ");
        const scriptPath = path.resolve(__dirname, "../../../../serveur_calcul_python/calcul_par_lot.py");

        // Chemin direct vers l'interpréteur Python dans l'environnement Conda
        const pythonExecutable = '/opt/conda/envs/serveur_calcul_python/bin/python3';
        console.log('path', [scriptPath])
        // Exécuter le script Python avec l'interpréteur de l'environnement
        const pythonProcess = spawn(pythonExecutable, [scriptPath, decipheredId]);
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
                    const jsonStartIndex = outputData.indexOf('[');
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
    };

    const metAJourInventaire: RequestHandler<ParamsInventaire, any, CorpsRequeteInventaire> = async (req, res, next) => {
        let client;
        try {
            const { id_inv } = req.params;
            const { g_no_lot, n_places_min, n_places_max, n_places_estime, n_places_mesure, id_er, id_reg_stat, commentaire, methode_estime, cubf } = req.body;
            client = await pool.connect();
            const result = await client.query(
                `UPDATE public.inventaire_stationnement SET 
            g_no_lot = $1, 
            n_places_min = $2, 
            n_places_max = $3, 
            n_places_estime = $4,
            n_places_mesure = $5,
            id_er = $6,
            id_reg_stat = $7,
            commentaire = $8,
            methode_estime= $9,
            cubf=$10
          WHERE 
            id_inv = $11 
          RETURNING 
            *`,
                [g_no_lot, n_places_min, n_places_max, n_places_estime, n_places_mesure, id_er, id_reg_stat, commentaire, methode_estime, cubf, id_inv]
            );
            if (result.rows.length === 0) {
                res.status(404).json({ success: false, error: 'Entry not found' });
                return;
            }
            res.json({ success: true, data: result.rows[0] });

        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    };
    const nouvelInventaire: RequestHandler<any, any, CorpsRequeteInventaire> = async (req, res, next) => {
        let client;
        try {
            const { g_no_lot, n_places_min, n_places_max, n_places_estime, n_places_mesure, id_er, id_reg_stat, commentaire, methode_estime, cubf } = req.body;
            client = await pool.connect();
            const result = await client.query(
                `INSERT INTO public.inventaire_stationnement(g_no_lot,n_places_min,n_places_max,n_places_estime,n_places_mesure,id_er,id_reg_stat,commentaire,methode_estime,cubf)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10)RETURNING *`,
                [g_no_lot, n_places_min, n_places_max, n_places_estime, n_places_mesure, id_er, id_reg_stat, commentaire, methode_estime, cubf]
            );
            if (result.rows.length === 0) {
                res.status(404).json({ success: false, error: 'Entry not found' });
                return;
            }
            res.json({ success: true, data: result.rows[0] });

        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    };
    const supprimerInventaire: RequestHandler<ParamsInventaire> = async (req, res, next): Promise<void> => {
        let client;
        try {
            const { id_inv } = req.params
            client = await pool.connect();
            const result = await client.query(
                `DELETE FROM public.inventaire_stationnement WHERE id_inv= $1;`,
                [id_inv]
            );
            if (result.rowCount === 0) {
                res.status(404).json({ success: false, error: 'Entry not found' });
                return;
            }
            res.json({ success: true, data: [] });

        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    };
    const calculeInventaireValeursManuelles: RequestHandler<any, any, RequeteCalculeInventaireRegMan> = async (req, res, next): Promise<void> => {
        const scriptPath = path.resolve(__dirname, "../../../../serveur_calcul_python/calcul_entree_manuelle.py");

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
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                //console.log(`Output: ${outputData}`)
                console.log(`Processus enfant terminé avec succès.`);
                try {
                    // 🔹 Extract JSON by finding the first `{` (start of JSON)
                    const jsonStartIndex = outputData.indexOf('[');
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
    };

    const metAJourInventaireEnGros: RequestHandler<any, any, RequeteInventaireGros> = async (req, res, next): Promise<void> => {
        let client;
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                res.status(400).json({ success: false, error: 'Invalid or empty data' });
                throw new Error('empty array provided')
            }
            client = await pool.connect();
            await client.query('BEGIN');

            // Prepare the values for bulk insert and update
            const values = data.map(item =>
                `(${item.id_inv}, '${item.g_no_lot}', ${item.n_places_min}, ${item.n_places_max}, ${item.n_places_mesure}, ${item.n_places_estime}, '${item.id_er}', '${item.id_reg_stat}', '${item.commentaire}', ${item.methode_estime}, '${item.cubf}')`
            ).join(', ');

            // Insert new items or update existing ones
            const insertQuery = `
        INSERT INTO public.inventaire_stationnement (id_inv, g_no_lot, n_places_min, n_places_max, n_places_mesure, n_places_estime, id_er, id_reg_stat, commentaire, methode_estime, cubf)
        VALUES ${values}
        ON CONFLICT (id_inv) DO UPDATE
        SET
            n_places_min    = EXCLUDED.n_places_min,
            n_places_max    = EXCLUDED.n_places_max,
            n_places_mesure = EXCLUDED.n_places_mesure,
            n_places_estime = EXCLUDED.n_places_estime,
            id_er           = EXCLUDED.id_er,
            id_reg_stat     = EXCLUDED.id_reg_stat,
            commentaire     = EXCLUDED.commentaire,
            cubf            = EXCLUDED.cubf
        RETURNING *;
        `;

            const result = await client.query(insertQuery);
            await client.query('COMMIT');

            res.json({ success: true, data: result.rows });
        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release()
            }
        }
    };

    const nouvelInventaireEnGros: RequestHandler<any, any, CorpsRequeteInventaireGros> = async (req, res, next): Promise<void> => {
        const client = await pool.connect();
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                res.status(400).json({ success: false, error: 'Invalid or empty data' });
                throw new Error('empty array provided')
            }

            await client.query('BEGIN');

            // Prepare the values for bulk insert and update
            const values = data.map(item =>
                `('${item.g_no_lot}', ${item.n_places_min}, ${item.n_places_max}, ${item.n_places_mesure}, ${item.n_places_estime}, '${item.id_er}', '${item.id_reg_stat}', '${item.commentaire}', ${item.methode_estime}, '${item.cubf}')`
            ).join(', ');

            // Insert new items or update existing ones
            const insertQuery = `
        INSERT INTO public.inventaire_stationnement (g_no_lot, n_places_min, n_places_max, n_places_mesure, n_places_estime, id_er, id_reg_stat, commentaire, methode_estime, cubf)
        VALUES ${values}
        RETURNING *;
      `;

            const result = await client.query(insertQuery);
            await client.query('COMMIT');

            res.json({ success: true, data: result.rows });
        } catch (err) {
            next(err);
        } finally {
            if (client) {
                client.release();
            }
        }
    };

    const requeteInventaireSpec:RequestHandler<any,any,any,RequeteInventaire>=async(req,res):Promise<void>=>{
        console.log('entering get inventory by neighborhood')
        
        let client;
        try {
            const {g_no_lot,id_inv,n_places_ge,dens_places_ge,methode_estime,cubf}=req.query;
            let query:string='';
            let conditions:string[]=[]
            let replaceCount:number = 1;
            let joins:string[]=[]
            let values:any[]=[]
            if (g_no_lot!==undefined){
                conditions.push(`i.g_no_lot = $${replaceCount}`)
                values.push(g_no_lot.replace('_',' '))
                replaceCount++
            }
            if (id_inv!==undefined){
                conditions.push(`i.id_inv = $${replaceCount}`)
                values.push(Number(id_inv))
                replaceCount++
            }
            if (n_places_ge!==undefined){
                conditions.push(`(i.n_places_min >=$${replaceCount} OR i.n_places_estime>=$${replaceCount} OR i.n_places_mesure>=$${replaceCount})`)
                values.push(Number(n_places_ge))
                replaceCount++
            }
            if (dens_places_ge!==undefined){
                joins.push(`LEFT JOIN public.cadastre c ON c.g_no_lot=i.g_no_lot`)
                conditions.push(`(COALESCE(i.n_places_min/c.g_va_suprf,0) >=$${replaceCount} OR COALESCE( i.n_places_estime/c.g_va_supr,0)>=$${replaceCount} OR COALESCE(i.n_places_mesure/c.g_va_supr,0)>=$${replaceCount})`)
                values.push(Number(n_places_ge))
                replaceCount++
            }
            if (methode_estime!==undefined){
                conditions.push(`methode_estime=${replaceCount}`)
                replaceCount++
            }
            if (cubf!==undefined){
                conditions.push(`cubf LIKE ${replaceCount}`)
                replaceCount++
            }
            client = await pool.connect();
            query = `
            SELECT
                i.g_no_lot,
                i.n_places_min,
                i.n_places_max,
                i.n_places_estime,
                i.n_places_mesure,
                i.n_places_max,
                i.id_er,
                i.id_reg_stat,
                i.commentaire,
                i.methode_estime,
                i.cubf,
                i.id_inv
            FROM 
                public.inventaire_stationnement i`
            if (joins.length>0){
                query += joins.join(' \n ')
            }
            if (conditions.length>0){
                query += '\n WHERE ' + conditions.join(' AND ')
            }
            query+=';'
            const result = await client.query(
                query,values
            );
            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        } finally {
            if (client) {
                client.release()
            }
        }
    }

    // Routes
    router.get('/quartier/:id', obtiensInventaireParQuartier);
    router.get('/calcul/quartier/:id', calculInventairePythonQuartier);
    router.get('/calcul/lot/:id', calculInventairePythonLot);
    router.post('/calcul/reg-val-man', calculeInventaireValeursManuelles)
    router.put('/maj-en-gros', metAJourInventaireEnGros)
    router.put('/:id_inv', metAJourInventaire)
    router.post('/', nouvelInventaire)
    router.post('/nouv-en-gros', nouvelInventaireEnGros)
    router.delete('/:id_inv', supprimerInventaire)
    router.get('/query',requeteInventaireSpec)
    return router;
};