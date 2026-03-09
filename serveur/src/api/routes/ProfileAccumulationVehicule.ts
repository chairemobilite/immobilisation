import { Router, Request, Response, RequestHandler } from 'express';
import { Pool } from 'pg';
import { ParamsTerritoire } from 'historique.types';
import { ParamsQuartier } from 'secteursAnalyse.types';
import path from 'path';
import { spawn } from 'child_process';
// Types pour les requêtes
import { Polygon, MultiPolygon } from 'geojson';
interface GeometryBody {
    geometry: Polygon | MultiPolygon;
}


export const creationRouteurProfileAccumVehiculeQuartier = (pool: Pool): Router => {
    const router = Router();
    const obtientPAVQuartier: RequestHandler<ParamsTerritoire> = async (req, res): Promise<void> => {
        let client;
        try {
            const { order, id_quartier,stat_type,type } = req.query;
            const numbers: number[] = (typeof order === 'string' ? order.split(',').map(Number) : []);
            const selectedIds = numbers.slice(0, 3);
            const stringForReq = selectedIds.map(String).join('');
            console.log('Obtention Profile Accumulation vehicule');
            let condition_stat:string[] = []
            let colonneAChercher = 'voitures';
            let chercherInventaire:boolean=false
            if (typeof type === 'string'){
                switch (type){
                    case 'voitures':
                        colonneAChercher = 'voitures'
                        break;
                    case 'personnes':
                        colonneAChercher = 'personnes'
                        break;
                    case 'permis':
                        colonneAChercher = 'permis'
                        break;
                    case 'voitures_res':
                        colonneAChercher = 'voitures_res'
                        break;
                    case 'voitures_pub':
                        colonneAChercher = 'voitures_pub'
                        break;
                    case 'voit_entrantes_tot':
                        colonneAChercher = 'voit_entrantes_tot'
                        break;
                    case 'voit_entrantes_res':
                        colonneAChercher = 'voit_entrantes_res'
                        break
                    case 'voit_entrantes_pub':
                        colonneAChercher = 'voit_entrantes_pub'
                        break;
                    case 'voit_sortantes_tot':
                        colonneAChercher = 'voit_sortantes_tot'
                        break;
                    case 'voit_sortantes_res':
                        colonneAChercher = 'voit_sortantes_res'
                        break
                    case 'voit_sortantes_pub':
                        colonneAChercher = 'voit_sortantes_pub'
                        break;
                    case 'pers_entrantes_tot':
                        colonneAChercher = 'pers_entrantes_tot'
                        break;
                    case 'pers_sortantes_tot':
                        colonneAChercher = 'pers_sortantes_tot'
                        break;
                    case 'perm_entrants_tot':
                        colonneAChercher = 'perm_entrants_tot'
                        break;
                    case 'perm_sortants_tot':
                        colonneAChercher = 'perm_sortants_tot'
                        break;
                    default:
                        colonneAChercher = 'voitures'
                        break;
                }

            }
            if (typeof stat_type ==='string'){
                switch(stat_type){
                    case 'res':
                        condition_stat.push(' cubf_principal_n1 = 1 ')
                        chercherInventaire = true
                        break;
                    case 'pub':
                        condition_stat.push(' cubf_principal_n1 in (2,3,4,5,6,7,8,9) ')
                        chercherInventaire = true
                        break;
                    case 'tot':
                        chercherInventaire = true
                        break;
                    case 'none':
                        chercherInventaire = false
                        break;
                    default: 
                        chercherInventaire=true
                        break;
                }
            }
            client = await pool.connect();
            let query_total;
            let query_PAV;
            let result;
            if (Number(id_quartier) !==0){
                 query_total = `
                    SELECT 
                        stag.id_quartier,
                        sa.nom_quartier,
                        SUM(inv_${stringForReq})::int AS valeur
                    FROM public.stat_agrege stag
                    LEFT JOIN public.sec_analyse sa ON sa.id_quartier = stag.id_quartier
                    WHERE stag.id_quartier = $1${condition_stat.length > 0 ?  ' AND '+ condition_stat.join(' AND ') : ''}
                    GROUP BY stag.id_quartier,sa.nom_quartier
                    ORDER BY stag.id_quartier;
                `;
                result = await client.query(query_total, [id_quartier]);
                 query_PAV = `
                    SELECT 
                        *,
                        ${colonneAChercher} as valeur
                    FROM public.profile_accumulation_vehicule
                    WHERE id_quartier = $1
                    ORDER BY heure ASC
                `
            }else{
                 query_total = `
                    SELECT 
                        0 as id_quartier,
                        'Ville Complète' as nom_quartier,
                        SUM(COALESCE(inv_${stringForReq},0))::int AS valeur
                    FROM public.stat_agrege
                    ${condition_stat.length > 0 ? 'WHERE ' + condition_stat.join(' AND ') : ''};
                `;
                result = await client.query(query_total);
                 query_PAV = `
                    SELECT 
                        *,
                        ${colonneAChercher} as valeur 
                    FROM public.profile_accumulation_vehicule
                    WHERE id_quartier = $1
                    ORDER BY heure ASC
                `
                
            }
            
            const result_PAV = await client.query(query_PAV, [id_quartier])
            const row = result.rows[0];
            const output = {
                id_quartier: row?.id_quartier ?? 0,
                nom_quartier: row?.nom_quartier ?? '',
                capacite_stat_quartier: row?.valeur ?? 0,
                PAV: result_PAV.rows.map(row => ({
                    id_ent_pav: row.id_ent_pav ?? 0,
                    heure: row.heure ?? 0,
                    valeur: row.valeur ?? 0,
                    voitures: row.voitures ?? 0,
                    personnes: row.personnes ??0,
                    permis: row.permis ?? 0,
                    voitures_res: row.voitures_res ??0,
                    voitures_pub: row.voitures_pub ??0
                }))
            };
            res.json({ success: true, data: output });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
            console.log('fourré dans la fonction obtention')
        } finally {
            if (client) {
                client.release()
            }
        }
    };
    const calculPAV: RequestHandler<ParamsQuartier> = async (req, res): Promise<void> => {
        console.log('calcul du profile accumulation vehicule')
        const { id } = req.params;
        const scriptPath = path.resolve(__dirname, "../../../../serveur_calcul_python/src/calcul_profils_acc_veh.py");

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
                console.log('errorData',errorData)
                console.error(`Processus enfant échoué avec le code : ${code}`);
                return res.status(500).send(`Erreur: ${errorData}`);
            }
        });
    };
    const MAJPAV: RequestHandler<ParamsQuartier> = async (req, res,next): Promise<void> => {
        const client = await pool.connect();
        try {
            const data = req.body;
            const {id} = req.params
            if (!Array.isArray(data) || data.length === 0) {
                res.status(400).json({ success: false, error: 'Invalid or empty data' });
                throw new Error('empty array provided')
            }



            // Prepare the values for bulk insert and update
            const flatValues: any[] = [];
            const values = data.map((item, index) => {
                flatValues.push(
                    item.heure,
                    Number(id),
                    item.voitures,
                    item.personnes,
                    item.permis,
                    item.voitures_res,
                    item.voitures_pub,
                    item.voit_entrantes_tot,
                    item.voit_entrantes_res,
                    item.voit_entrantes_pub,
                    item.voit_sortantes_tot,
                    item.voit_sortantes_res,
                    item.voit_sortantes_pub,
                    item.voit_transfer_pub_a_res,
                    item.voit_transfer_res_a_pub,
                    item.pers_entrantes_tot,
                    item.pers_sortantes_tot,
                    item.perm_entrants_tot,
                    item.perm_sortants_tot
                );
                const baseIndex = index * 19;
                return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12}, $${baseIndex + 13}, $${baseIndex + 14}, $${baseIndex + 15}, $${baseIndex + 16}, $${baseIndex + 17}, $${baseIndex + 18}, $${baseIndex + 19})`;
            }).join(', ');

            // Insert new items or update existing ones
            const deleteQuery = `
                DELETE FROM public.profile_accumulation_vehicule WHERE id_quartier = $1;
            `;
            await client.query(deleteQuery, [Number(id)]);
            const insertQuery = `
                INSERT INTO public.profile_accumulation_vehicule (heure, id_quartier, voitures,personnes,permis,voitures_res,voitures_pub,voit_entrantes_tot,voit_entrantes_res,voit_entrantes_pub,voit_sortantes_tot,voit_sortantes_res,voit_sortantes_pub,voit_transfer_pub_a_res,voit_transfer_res_a_pub,pers_entrantes_tot,pers_sortantes_tot,perm_entrants_tot,perm_sortants_tot)
                VALUES ${values}
                ON CONFLICT (id_quartier, heure) DO NOTHING
                RETURNING *;
            `;
            const result = await client.query(insertQuery, flatValues);


            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
            console.log('fucké la mise a jour')
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    // Routes
    router.get('', obtientPAVQuartier)
    router.get('/recalcule/:id', calculPAV)
    router.post('/:id',MAJPAV)
    return router;
};