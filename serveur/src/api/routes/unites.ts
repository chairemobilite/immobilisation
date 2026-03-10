import { RequestHandler, Router } from "express";
import { Pool } from "pg";
import { spawn } from "child_process";
import path from "path";
import {obtiensUnites, serviceCreeUnite,serviceModifiedUnite, serviceSupprimeUnite} from '../services/unites.services'

export const CreationRouteurUnites = (pool: Pool): Router => {
    const router = Router();
    const obtiensToutesUnites: RequestHandler = async (_req, res): Promise<void> => {
        console.log('Serveur - Obtention toutes unites')
        try {
            const result = await obtiensUnites(pool)
            res.json({ success: true, data: result.data });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        }
    };
    const obtiensUnitesParLot: RequestHandler = async (req, res): Promise<void> => {
        const { id } = req.params;
        const decipheredId = typeof id === 'string' ? id.replace(/_/g, " ") : id[0].replace(/_/g, " ");
        console.log(`obtention des unités pour les règlements s'appliquant au lot : ${decipheredId}`)
        const scriptPath = path.resolve(__dirname, "../../../../serveur_calcul_python/obtention_reglements_lot.py");

        // Chemin direct vers l'interpréteur Python dans l'environnement Conda
        const pythonExecutable = '/opt/conda/envs/serveur_calcul_python/bin/python3';

        // Exécuter le script Python avec l'interpréteur de l'environnement
        const pythonProcess = spawn(pythonExecutable, [scriptPath, decipheredId]);
        let outputData = '';
        let errorData = '';

        // Capturer l'output standard
        pythonProcess.stdout.on('data', (data:string) => {
            outputData += data.toString();
        });

        // Capturer les erreurs standard
        pythonProcess.stderr.on('data', (data:string) => {
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
    const obtiensColonnesPossibles: RequestHandler = async(req,res): Promise<void>=>{
        try{
            const colonnesCorrectes =[
                {
                    nom_colonne:'rl0301a',
                    description_colonne:'Mesure frontale'
                },
                {
                    nom_colonne:'rl0302a',
                    description_colonne: 'Superficie du terrain'
                },
                {
                    nom_colonne: 'rl0306a',
                    description_colonne: "Nombre d'étages"
                },
                {
                    nom_colonne: 'rl0307a',
                    description_colonne: 'Année de construction'
                },
                {
                    nom_colonne:'rl0308a',
                    description_colonne: "Aire d'étages"
                },
                {
                    nom_colonne:'rl0311a',
                    description_colonne:'Nombre de logements'
                },
                {
                    nom_colonne:'rl0312a',
                    description_colonne: 'Nombre de chambres locatives'
                },
                {
                    nom_colonne:'rl0313a',
                    description_colonne:'Nombre de locaux non résidentiels'
                }
            ]
            res.status(200).json({success:true,data:colonnesCorrectes})
        }catch(err){
            res.status(500).json({success:false,message:'Erreur interne serveur'})
        }
        
    }
    const creeNouvelleUnite:RequestHandler = async(req,res):Promise<void>=>{
        console.log('Création nouvelle unité')
        try {
            const result = await serviceCreeUnite(
                pool,
                {
                    desc_unite:String(req.body.desc_unite),
                    facteur_correction: Number(req.body.facteur_correction),
                    abscisse_correction: Number(req.body.abscisse_correction),
                    colonne_role_foncier: String(req.body.colonne_role_foncier)
                }
            )
            res.json({ success: true, data: result.data });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        }
    }
    const modifieUnite:RequestHandler = async(req,res):Promise<void>=>{
        console.log('modification unité')
        try {
            const result = await serviceModifiedUnite(
                pool,
                Number(req.params.id),
                {
                    desc_unite:String(req.body.desc_unite),
                    facteur_correction: Number(req.body.facteur_correction),
                    abscisse_correction: Number(req.body.abscisse_correction),
                    colonne_role_foncier: String(req.body.colonne_role_foncier)
                }
            )
            res.json({ success: true, data: result.data });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        }
    }

    const supprimeUnite:RequestHandler = async(req,res):Promise<void>=>{
        console.log('modification unité')
        try {
            const result = await serviceSupprimeUnite(
                pool,
                Number(req.params.id)
            )
            res.json({ success: result });
        } catch (err) {
            res.status(500).json({ success: false, error: 'Database error' });
        }
    }

    router.get('/', obtiensToutesUnites)
    router.get('/par-lot/:id', obtiensUnitesParLot)
    router.get('/colonnes-possibles',obtiensColonnesPossibles)
    router.post('/',creeNouvelleUnite)
    router.put('/:id',modifieUnite)
    router.delete('/:id',supprimeUnite)
    return router
}