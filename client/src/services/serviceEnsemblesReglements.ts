/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.
 
Service that launches queries to the backend to retrieve data
*/



import axios,{ AxiosResponse } from 'axios';
import {ReponseEnteteEnsembleReglementStationnement,ReponseEnsembleReglementComplet, ReponseEntetesEnsemblesReglement, ReponseEntetesReglements, ReponseComboERsRoleFoncier, ReponseAssociationEnsembleReglement,ReponseUnitesGraph, ReponseDataGraphique, ApiResponse} from '../types/serviceTypes';
import api from './api';
import { association_util_reglement, ensemble_reglements_stationnement, entete_ensembles_reglement_stationnement, ProprietesRequetesER } from '../types/DataTypes';

/**
 * 
 */
class ServiceEnsemblesReglements {
    /**
     * basic get function that returns all the available datasets
     * @returns all the available regulations sets in the database
     */
    async chercheTousEntetesEnsemblesReglements():Promise<ReponseEntetesEnsemblesReglement> {
        try {
            const response: AxiosResponse<ReponseEntetesEnsemblesReglement> = await api.get(`/ens-reg/entete`);
            const data_res = response.data.data;
            return {success:response.data.success,data:data_res};
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    } 

    /**
     * function to query backend for relevant regulation sets
     * @param paramsRequetes object with following fields: 
     *      dateDebutAvant?:number|null, 
     *      dateDebutApres?:number|null, 
     *      dateFinAvant?:number|null,  
     *      dateFinApres?:number|null, 
     *      descriptionLike?:string,        
     *      idER?:number|number[]
     * @returns an array of regulation set headers
     */
    async chercheEntetesParPropriete(paramsRequetes:ProprietesRequetesER):Promise<ReponseEntetesEnsemblesReglement>{
        try {
            let query:string = `/ens-reg/entete`
            let queryAdds = []
            
            if (typeof(paramsRequetes.dateDebutAvant)!=='undefined'){
                queryAdds.push(`date_debut_er_avant=${paramsRequetes.dateDebutAvant}`)
            }
            if (typeof(paramsRequetes.dateDebutApres)!=='undefined'){
                queryAdds.push(`date_debut_er_apres=${paramsRequetes.dateDebutApres}`)
            }
            if (typeof(paramsRequetes.dateFinAvant)!=='undefined'){
                queryAdds.push(`date_fin_er_avant=${paramsRequetes.dateFinAvant}`)
            }
            if (typeof(paramsRequetes.dateFinApres)!=='undefined'){
                queryAdds.push(`date_fin_er_apres=${paramsRequetes.dateFinApres}`)
            }
            if (typeof(paramsRequetes.descriptionLike)!=='undefined'){
                queryAdds.push(`description_like=${encodeURIComponent(paramsRequetes.descriptionLike)}`)
            }
            if (typeof(paramsRequetes.idER)!=='undefined'){
                if (typeof(paramsRequetes.idER)==='number'){
                    queryAdds.push(`id_er=${paramsRequetes.idER}`)
                } else{
                    queryAdds.push(`id_er=${paramsRequetes.idER.join(',')}`)
                }
            }
            if (queryAdds.length>0){
                query+= '?'+queryAdds.join('&')
            }
            const response: AxiosResponse<ReponseEntetesEnsemblesReglement> = await api.get(query);
            const data_res = response.data.data;
            return {success:response.data.success,data:data_res};
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }

    async chercheEnsembleReglementParId(id:number|number[]):Promise<ReponseEnsembleReglementComplet> {
        try{
            const response:AxiosResponse<ReponseEnsembleReglementComplet>= await api.get(`/ens-reg/complet/${id}`);
            if (typeof(id)==='number'){
                const response:AxiosResponse<ReponseEnsembleReglementComplet>= await api.get(`/ens-reg/complet/${id}`);
                const data_res = response.data.data;
                return{success:response.data.success,data:data_res};
            } else{
                const response:AxiosResponse<ReponseEnsembleReglementComplet>= await api.get(`/ens-reg/complet/${id.join(',')}`);
                const data_res = response.data.data;
                return{success:response.data.success,data:data_res};
            }
            
        } catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }

    async chercheReglementsPourEnsReg(id:number):Promise<ReponseEntetesReglements>{
        try{
            const response: AxiosResponse<ReponseEntetesReglements>= await api.get(`/ens-reg/regs-associes/${id}`)
            const data_res = response.data.data
            return{success:response.data.success,data:data_res}
        }catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }

    async obtiensEnsRegParTerritoire(idPeriodeGeo:number):Promise<ReponseEntetesEnsemblesReglement>{
        try{
            const response: AxiosResponse<ReponseEntetesEnsemblesReglement>= await api.get(`/ens-reg/entete-par-territoire/${idPeriodeGeo}`)
            const data_res = response.data.data
            return{success:response.data.success,data:data_res}
        }catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }

    async chercheEnsRegPourRole(ids:string[]):Promise<ReponseComboERsRoleFoncier>{
        try{
            const response: AxiosResponse<ReponseComboERsRoleFoncier>= await api.get(`/ens-reg/par-role/${ids.join(',')}`)
            const data_res = response.data.data
            return{success:response.data.success,data:data_res}
        }catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }

    async nouvelleEntete (enteteASauver:Omit<entete_ensembles_reglement_stationnement,'id_er'>):Promise<ReponseEnteteEnsembleReglementStationnement>{
        try{
            const dbData:Omit<entete_ensembles_reglement_stationnement,'id_er'>={
                description_er:enteteASauver.description_er,
                date_debut_er:enteteASauver.date_debut_er,
                date_fin_er:enteteASauver.date_fin_er
            }
            const reponse = await api.post('ens-reg/entete',dbData)
            return({success:true,data: reponse.data.data})
        } catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    };

    async modifEntete(idEntete:number,corpsEntete:Omit<entete_ensembles_reglement_stationnement,'id_er'>):Promise<ReponseEnteteEnsembleReglementStationnement>{
        try{
            const dbData:Omit<entete_ensembles_reglement_stationnement,'id_er'>={
                description_er:corpsEntete.description_er,
                date_debut_er:corpsEntete.date_debut_er,
                date_fin_er:corpsEntete.date_fin_er
            }
            const reponse = await api.put(`ens-reg/entete/${idEntete}`,dbData)
            return({success:true,data: reponse.data.data})
        } catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }
    async supprimeEnsReg(idEnsReg:number):Promise<boolean>{
        try{
            const reponse = await api.delete(`ens-reg/${idEnsReg}`)
            return(reponse.data.success)
        } catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }
    async nouvelleAssoc(assocASauver:Omit<association_util_reglement,'id_assoc_er_reg'>):Promise<ReponseAssociationEnsembleReglement>{
        try{
            const dbData:Omit<association_util_reglement,'id_assoc_er_reg'>={
                id_er:assocASauver.id_er,
                id_reg_stat:assocASauver.id_reg_stat,
                cubf:assocASauver.cubf
            }
            const reponse = await api.post('ens-reg/assoc',dbData)
            return({success:true,data: reponse.data.data})
        } catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }
    async modifAssoc(idAssocAModif:number,assocASauver:Omit<association_util_reglement,'id_assoc_er_reg'>):Promise<ReponseAssociationEnsembleReglement>{
        try{
            const dbData:Omit<association_util_reglement,'id_assoc_er_reg'>={
                id_er:assocASauver.id_er,
                id_reg_stat:assocASauver.id_reg_stat,
                cubf:assocASauver.cubf
            }
            const reponse = await api.put( `ens-reg/assoc/${idAssocAModif}`,dbData)
            return({success:true,data: reponse.data.data})
        } catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }
    async supprimeAssoc(idAssocASupprimer:number):Promise<boolean>{
        try{
            const reponse = await api.delete( `ens-reg/assoc/${idAssocASupprimer}`)
            const success:boolean = reponse.data.success
            return(success)
        } catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }

    async obtiensReglementsUnitesParCUBF(idEnsReg:number[],cubf:number):Promise<ReponseUnitesGraph>{
        try{
            const dbData={
                cubf:cubf,
                id_er:idEnsReg
            }
            const response:AxiosResponse<ReponseUnitesGraph>= await api.post(`/ens-reg/informations-pour-graphique`,[dbData]);
            const data_res = response.data.data;
            return{success:response.data.success,data:data_res};
        } catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }

    async obtiensDonneesGraphiques(idEnsReg:number[],cubf:number,unite:number,valMin:number,valMax:number,pas:number):Promise<ReponseDataGraphique>{
        try{
            const response:AxiosResponse<ReponseDataGraphique>= await api.get(`/ens-reg/data-graphique?cubf=${cubf}&id_er=${idEnsReg.join(',')}&unite=${unite}&val_min=${valMin}&val_max=${valMax}&pas_graphe=${pas}`,);
            const data_res = response.data.data;
            return{success:response.data.success,data:data_res};
        } catch(error){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    }

    async copyRegulationSet(regSetToCopy:number){
        try{
            const response:AxiosResponse<ApiResponse<ensemble_reglements_stationnement>> = await api.post(`/ens-reg/copy/${regSetToCopy}`)
            const data_res = response.data.data;
            return{success:response.data.success,data:data_res};
        }catch(error:any){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            return{success:false}
        }
    }
}

export const   serviceEnsemblesReglements =  new ServiceEnsemblesReglements();