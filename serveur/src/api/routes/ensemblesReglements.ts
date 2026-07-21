/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

This is the router which requests the correct handler/controller based on the endpoint
*/

import { Router } from 'express';

import {
    infoPourGraphiques,
    modifieAssocEnsembleReglement,
    modifieEnteteEnsembleReglement,
    nouvelleAssociationEnsembleReglement,
    nouvelleEnteteEnsembleReglement,
    obtiensEnsembleReglementCompletParId,
    obtiensEnsRegCompletParRole,
    obtiensEntetesEnsemblesReglements,
    obtiensEntetesParTerritoire,
    obtiensReglementsPourEnsReg,
    supprimeAssocEnsembleReglement,
    supprimeEnsembleReglement
} from '../controllers/ensemblesReglements.controllers';


/**
 * This is the router for regluations sets. It points to validation middleware 
 * and the relevant controller functions
 * @returns a router for the regulation sets
 */
export const creationRouteurEnsemblesReglements = (): Router => {
    const router = Router();
    // Get all lines

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