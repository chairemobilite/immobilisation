/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

These are the functions called by the router and act to take the output from the services and format them to return to 
the data through the api
*/


import { 
    ParamsAssocEnsReg, 
    ParamsEnsReg 
} from "@localTypes/ensembleReglements.types";
import { ParamsTerritoire } from "@localTypes/historique.types";
import { ParamsRole } from "@localTypes/role.types";
import { 
    deleteRegSetAssocServ, 
    deleteRegSetServ, 
    getChartInfoServ, 
    getFullRegulationSetById, 
    getRegulationsByTerritoryServ, 
    getRegulationSetsByTaxIdServ, 
    getRegulationSetsService, 
    getRegulationsForRegSetIdServ, 
    insertRegSetHeaderServ, 
    modifyRegSetAssocServ, 
    modifyRegSetHeaderServ, 
    newRegSetAssociationServ 
} from "../services/ensembleReglements.services";
import  { RequestHandler, Response, Request, NextFunction } from "express";

/**
 * controller that gets relevant reg set headers based on query parameters
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const obtiensEntetesEnsemblesReglements: RequestHandler = async (req: Request, res: Response,next:NextFunction): Promise<void> => {
    console.log('Serveur - Obtention entetes ensembles reglements')
    try {
        const { 
            date_debut_er_avant, 
            date_debut_er_apres, 
            date_fin_er_avant, 
            date_fin_er_apres, 
            description_like, 
            id_er 
        } = req.query as {date_debut_er_avant:string,date_debut_er_apres:string,date_fin_er_avant:string,date_fin_er_apres:string,description_like:string,id_er:string};
        const message=await getRegulationSetsService({
            date_debut_er_avant:date_debut_er_avant,
            date_debut_er_apres:date_debut_er_apres,
            date_fin_er_avant:date_fin_er_avant,
            date_fin_er_apres:date_fin_er_apres,
            description_like:description_like,
            id_er:id_er
        })
        if (message.success===true){
            res.status(200).json(message);
        }else{
            res.status(500).json(message);
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error test' });
    } 
};
/**
 * controller for getting a full regulation based on the id
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const obtiensEnsembleReglementCompletParId: RequestHandler = async (req: Request, res: Response, next:NextFunction): Promise<void> => {
    console.log('Serveur - Obtention ensembles reglements complets')
    try {
        const { id } = req.params as {id:string};
        // Parse the comma-separated IDs into an array of numbers
        const idArray = id.split(',').map(Number);
        // Dynamically create placeholders for the query (e.g., $1, $2, $3, ...)
        const output = await getFullRegulationSetById(idArray)
        if (output.success){
            res.status(200).json(output);
        }else{
            res.status(500).json((output))
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error' });
    } 
};
/** Controller that gets regs for a givent regulation set id
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const obtiensReglementsPourEnsReg: RequestHandler = async (req:Request, res:Response,next): Promise<void> => {
    console.log('Serveur - Obtention entetes de reglements associés à un ensemble de règlements')
    try {
        const { id } = req.params;
        const id_out = Number(id)
        const result=await getRegulationsForRegSetIdServ(id_out)
        if (result.success===true){
            res.status(200).json(result);
        }else{
            res.status(500).json(result)
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error' });
    } 
};

/** controller that gets regulation set heaaders by territory id
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const obtiensEntetesParTerritoire: RequestHandler<ParamsTerritoire> = async (req:Request, res:Response, next:NextFunction): Promise<void> => {
    console.log('Serveur - Obtention entete reglement par territoire')

    try {
        const { id } = req.params;
        const idOut =Number(id)
        const result = await getRegulationsByTerritoryServ(idOut)
        if (result.success===true){
            res.status(200).json(result);
        }else{
            res.status(500).json(result)
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error test' });
    } 
};
/** Controller that obtains relevant regulation sets based on tax ids
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const obtiensEnsRegCompletParRole: RequestHandler<ParamsRole> = async (req:Request, res:Response, next:NextFunction): Promise<void> => {
    console.log('obtention ens-reg par role - Implémentation incomplète')

    try {
        const { ids } = req.params;
        const listeIds = typeof ids === 'string' ? ids.split(',') : ids;
        const stringToTransmit = "'" + listeIds.join("','") + "'"
        const output = await getRegulationSetsByTaxIdServ(listeIds)
        if (output.success===true){
            res.status(200).json(output);
        }else{
            res.status(500).json(output)
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error test' });
    } 
};
/** Controller that creates a new regulation set header
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const nouvelleEnteteEnsembleReglement: RequestHandler<void> = async (req, res, next): Promise<void> => {
    console.log('Sauvegarde nouvelle entete ensemble reg')
    try {

        const { description_er, date_debut_er, date_fin_er } = req.body;
        const result= await insertRegSetHeaderServ({
            description_er,date_debut_er,date_fin_er
        })
        if (result.success===true){
            res.status(200).json(result);
        }else{
            res.status(500).json(result)
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error test' });
    }
};
/**
 * Controller used for deleting a regulation set
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const supprimeEnsembleReglement: RequestHandler<ParamsEnsReg> = async (req, res,next) => {
    console.log('Sauvegarde nouvelle entete ensemble reg')
    try {
        const { id } = req.params;
        const result = await deleteRegSetServ(Number(id))
        if (result.success===true){
            res.status(200).json(result);
        }else{
            res.status(500).json(result);
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error test' });
    } 
};
/**
 * Controllerused to modify a regulation set header
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const modifieEnteteEnsembleReglement: RequestHandler<ParamsEnsReg> = async (req, res,next ) => {

    try {
        const { id } = req.params
        console.log(`Sauvegarde modification entete ensemble reg id_er: ${id}`)
        const { description_er, date_debut_er, date_fin_er } = req.body;
        const output= await modifyRegSetHeaderServ(Number(id),description_er,date_debut_er,date_fin_er)
        if (output.success===true){
            res.status(200).json(output);
        }else{
            res.status(500).json(output)
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error test' });
    }
}
/** Controller for new land use to regulation association for a given regset 
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const nouvelleAssociationEnsembleReglement: RequestHandler<void> = async (req, res,next) => {
    console.log('Sauvegarde nouvelle association ensemble reg')
    try {
        const { id_er, cubf, id_reg_stat } = req.body;
        const out = await newRegSetAssociationServ(id_er,id_reg_stat,cubf)
        if (out.success===true){

            res.status(200).json(out);
        }else{
            res.status(500).json(out)
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error on creating new association' });
    } 
}
/**
 * Controller to use to modify an association between land use and regulation for a regulation set
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const modifieAssocEnsembleReglement: RequestHandler<ParamsEnsReg> = async (req, res,next) => {
    try {

        const { id } = req.params
        console.log(`Sauvegarde modification entete ensemble reg id_er: ${id}`)
        const { id_er, cubf, id_reg_stat } = req.body;
        const result = await modifyRegSetAssocServ(Number(id),id_er,id_reg_stat,cubf)
        if (result.success===true){
            res.status(200).json(result);
        }else{
            res.status(500).json(result)
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error test' });
    } 
}
/**
 * Controller to delete a land use to regulation assignment
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const supprimeAssocEnsembleReglement: RequestHandler<ParamsAssocEnsReg> = async (req, res,next) => {
    console.log('Sauvegarde nouvelle entete ensemble reg')
    try {
        const { id } = req.params;

        const result= await deleteRegSetAssocServ(Number(id))
        if (result.success){

            res.status(200).json(result);
        }else{
            res.status(500).json(result)
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error test' });
    } 
};
/**
 * Controller used to retrieve regulations, units and descriptions of the regulations used for a 
 * given land use and given regulation sets
 * @param req request format from express
 * @param res response format form express
 * @param next next function execute in the express stack
 */
export const infoPourGraphiques: RequestHandler<void> = async (req, res,next ) => {
    console.log('Getting information for graphs')
    try {
        const json_in= JSON.stringify(req.body)
        const out= await getChartInfoServ(json_in)
        if (out.success===true){
            res.status(200).json(out)
        }else{
            res.status(500).json(out)
        }
    }catch(error:any){
        res.status(500).json({success:false,message:error})
    }
    
};


