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
import { validate } from '../middleware/validate';


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
    router.delete('/:id',validate(DeleteItemsSchema), supprimeEnsembleReglement)
    router.get('/complet/:id',validate(GetFullRegSetsSchema), obtiensEnsembleReglementCompletParId)
    router.get('/entete',validate(GetRegSetsQuerySchema), obtiensEntetesEnsemblesReglements);
    router.post('/entete',validate(PostRegSetHeaderSchema), nouvelleEnteteEnsembleReglement)
    router.put('/entete/:id', validate(ModifyRegSetHeaderSchema),modifieEnteteEnsembleReglement)
    router.post('/assoc', validate(PostLandUseToRuleAssignSchema),nouvelleAssociationEnsembleReglement)
    router.put('/assoc/:id',validate(ModifyLandUseToRuleAssignSchema), modifieAssocEnsembleReglement)
    router.delete('/assoc/:id',validate(DeleteItemsSchema), supprimeAssocEnsembleReglement)
    // ancilaires
    router.get('/regs-associes/:id',validate(DeleteItemsSchema), obtiensReglementsPourEnsReg);
    router.get('/entete-par-territoire/:id',validate(DeleteItemsSchema), obtiensEntetesParTerritoire)
    router.get('/par-role/:ids', validate(GetRegSetsByTaxIdSchema),obtiensEnsRegCompletParRole)
    router.post('/informations-pour-graphique',validate(GetInfoForChartsSchema), infoPourGraphiques)
    router.post('/copy/:id',validate(DeleteItemsSchema),createRegSetCopy)
    return router;
};