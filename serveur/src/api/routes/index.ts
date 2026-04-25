import { Router,Application } from 'express';
import { Pool } from 'pg';
import { creationRouteurQuartiersAnalyse } from './secteursAnalyse';
import { creationRouteurHistorique } from './historique';
import { creationRouteurInventaire } from './inventaire';
import { creationRouteurTerritoires } from './territoire';
import { creationRouteurReglements } from './reglements';
import { creationRouteurEnsemblesReglements } from './ensemblesReglements';
import { creationRouteurCadastre } from './cadastre';
import { creationRouteurAnalyseParQuartiers } from './analyseQuartiers';
import { creationRouteurProfileAccumVehiculeQuartier } from './ProfileAccumulationVehicule';
import { creationRouteurEnsRegTerr } from './ensRegTerr';
import { creationRouteurUtilsationDuSol } from './utilisationDuSol';
import { creationRouteurAnalyseVariabilite } from './analyseVariabilite';
import { creationRouteurValidation } from './validation';
import { CreationRouteurUnites } from './unites';
import { creationRouteurDonnees } from './geojsonGest';
import { creationRouteurRoleFoncier } from './roleFoncier';
import { creationRouteurAssocCadRole } from './assocCadRole';
import { creationRouteurRecensement } from './recensement';
import { creationRouteurEnqueteOD } from './enqueteOD';
import { creationRouteurDonneesCSV } from './fichiersCSV';
import { CreationRouteurSommaireDonnee } from './sommaireVersement';
import adminRoutes from './admin';


export const createApiRouter = (pool: Pool,app: Application) => {
    const router = Router();
    console.log('going through router test')
    router.use('/quartiers-analyse', creationRouteurQuartiersAnalyse(pool));
    router.use('/historique', creationRouteurHistorique(pool));
    router.use('/inventaire',creationRouteurInventaire(pool));
    router.use('/territoire',creationRouteurTerritoires(pool));
    router.use('/reglements',creationRouteurReglements(pool));
    router.use('/ens-reg',creationRouteurEnsemblesReglements(pool));
    router.use('/cadastre',creationRouteurCadastre(pool))
    router.use('/ana-par-quartier',creationRouteurAnalyseParQuartiers(pool))
    router.use('/PAV',creationRouteurProfileAccumVehiculeQuartier(pool))
    router.use('/ens-reg-terr',creationRouteurEnsRegTerr(pool))
    router.use('/cubf',creationRouteurUtilsationDuSol(pool))
    router.use('/ana-var',creationRouteurAnalyseVariabilite(pool))
    router.use('/valid',creationRouteurValidation(pool))
    router.use('/unites',CreationRouteurUnites(pool))
    router.use('/geojson',creationRouteurDonnees(pool))
    router.use('/role-foncier',creationRouteurRoleFoncier(pool))
    router.use('/assoc-cad-role',creationRouteurAssocCadRole(pool))
    router.use('/recensement',creationRouteurRecensement(pool))
    router.use('/enquete-od',creationRouteurEnqueteOD(pool))
    router.use('/fichier-csv',creationRouteurDonneesCSV(pool))
    router.use('/sommaire-donnees',CreationRouteurSommaireDonnee(pool))
    router.use('/routes',adminRoutes(app))
    return router;
}