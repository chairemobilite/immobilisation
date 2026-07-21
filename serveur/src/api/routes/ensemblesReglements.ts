/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

This is the router which requests the correct handler/controller based on the endpoint
*/

import { Router } from 'express';

import {
    createRegSetCopy,
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
import { 
    DeleteItemsSchema, 
    GetFullRegSetsSchema, 
    GetInfoForChartsSchema, 
    GetRegSetsByTaxIdSchema, 
    GetRegSetsQuerySchema, 
    ModifyLandUseToRuleAssignSchema, 
    ModifyRegSetHeaderSchema, 
    PostLandUseToRuleAssignSchema, 
    PostRegSetHeaderSchema 
} from '../validators/ensembleReglement.validator';
import { validateIncomingQueryInputs } from '../middleware/validateIncomingQueryInputs';


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
    router.delete('/:id',validateIncomingQueryInputs(DeleteItemsSchema), supprimeEnsembleReglement)
    router.get('/complet/:id',validateIncomingQueryInputs(GetFullRegSetsSchema), obtiensEnsembleReglementCompletParId)
    router.get('/entete',validateIncomingQueryInputs(GetRegSetsQuerySchema), obtiensEntetesEnsemblesReglements);
    router.post('/entete',validateIncomingQueryInputs(PostRegSetHeaderSchema), nouvelleEnteteEnsembleReglement)
    router.put('/entete/:id', validateIncomingQueryInputs(ModifyRegSetHeaderSchema),modifieEnteteEnsembleReglement)
    router.post('/assoc', validateIncomingQueryInputs(PostLandUseToRuleAssignSchema),nouvelleAssociationEnsembleReglement)
    router.put('/assoc/:id',validateIncomingQueryInputs(ModifyLandUseToRuleAssignSchema), modifieAssocEnsembleReglement)
    router.delete('/assoc/:id',validateIncomingQueryInputs(DeleteItemsSchema), supprimeAssocEnsembleReglement)
    // ancilaires
    router.get('/regs-associes/:id',validateIncomingQueryInputs(DeleteItemsSchema), obtiensReglementsPourEnsReg);
    router.get('/entete-par-territoire/:id',validateIncomingQueryInputs(DeleteItemsSchema), obtiensEntetesParTerritoire)
    router.get('/par-role/:ids', validateIncomingQueryInputs(GetRegSetsByTaxIdSchema),obtiensEnsRegCompletParRole)
    router.post('/informations-pour-graphique',validateIncomingQueryInputs(GetInfoForChartsSchema), infoPourGraphiques)
    router.post('/copy/:id',validateIncomingQueryInputs(DeleteItemsSchema),createRegSetCopy)
    return router;
};