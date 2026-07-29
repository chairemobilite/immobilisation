import axios,{ AxiosResponse } from 'axios';
import { definition_reglement_stationnement, entete_reglement_stationnement, parametres_requete_filtree_stationnement,  } from '../types/DataTypes';
import { 
    ReponseEntetesReglements, 
    ReponseReglementComplet,
    ReponseOperationsReglements,
    ReponseLigneDefReglement, 
    ReponseDataGraphique, 
    ApiResponse
} from '../types/serviceTypes';
import api from './api'; 

class ServiceReglements {
    async chercheTousEntetesReglements():Promise<ReponseEntetesReglements> {
        try {
            const response: AxiosResponse<ReponseEntetesReglements> = await api.get(`/reglements`);
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

    async chercheReglementAvecFiltre(requete:parametres_requete_filtree_stationnement):Promise<ReponseEntetesReglements>{
        try {
            const sanitizeString=(stringEntry:string):string=>{
                const stringOut = stringEntry.replace(' ','%20')
                return stringOut
            }
            let queryString;
            queryString = `/reglements`;
            const params = [];
            if(requete.annee_debut_apres!==undefined){
                params.push(`annee_debut_apres=${requete.annee_debut_apres}`)
            }
            if(requete.annee_debut_avant!==undefined){
                params.push(`annee_debut_avant=${requete.annee_debut_avant}`)
            }
            if(requete.annee_fin_avant!==undefined){
                params.push(`annee_fin_avant=${requete.annee_fin_avant}`)
            }
            if(requete.annee_fin_apres!==undefined){
                params.push(`annee_fin_apres=${requete.annee_fin_avant}`)

            }
            if(typeof(requete.ville)!=='undefined'){
                params.push(`ville=${sanitizeString(requete.ville)}`)

            }
            if(requete.description!==undefined){
                params.push(`description=${sanitizeString(requete.description)}`)
            }
            if(requete.texte!==undefined){
                params.push(`texte=${sanitizeString(requete.texte)}`)
            }
            if(requete.article!==undefined){
                params.push(`article=${sanitizeString(requete.article)}`)
            }
            if(requete.paragraphe!==undefined){
                params.push(`paragraphe=${sanitizeString(requete.paragraphe)}`)
            }
            queryString+= '?' + params.join('&')
            const response: AxiosResponse<ReponseEntetesReglements> = await api.get(queryString);
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

    async chercheReglementComplet(id:number|number[]):Promise<ReponseReglementComplet>{
        try {
            if (typeof(id)==='number'){
                const response: AxiosResponse<ReponseReglementComplet> = await api.get(`/reglements?id_reg_stat=${id}&format=c`);
                const data_res = response.data.data;
                return {success:response.data.success,data:data_res};
            } else{
                const response: AxiosResponse<ReponseReglementComplet> = await api.get(`/reglements?id_reg_stat=${id.join(',')}&format=c`);
                const data_res = response.data.data;
                return {success:response.data.success,data:data_res};
            }
            
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



    async nouvelEnteteReglement(enteteASauvegarder:Omit<entete_reglement_stationnement,'id_reg_stat'>):Promise<ReponseEntetesReglements>{
        try{
            const dbData:Partial<entete_reglement_stationnement>={
                description:enteteASauvegarder.description,
                annee_debut_reg:enteteASauvegarder.annee_debut_reg,
                annee_fin_reg:enteteASauvegarder.annee_fin_reg,
                texte_loi:enteteASauvegarder.texte_loi,
                article_loi:enteteASauvegarder.article_loi,
                paragraphe_loi:enteteASauvegarder.paragraphe_loi,
                ville:enteteASauvegarder.ville
            }
            const response:AxiosResponse<ReponseEntetesReglements> = await api.post(`/reglements/entete/`,dbData)
            return{success:response.data.success,data:response.data.data}
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

    async modifieEnteteReglement(idReglement:number,enteteASauver:Omit<entete_reglement_stationnement,'id_reg_stat'>):Promise<ReponseEntetesReglements>{
        try{
            const dbData:Partial<entete_reglement_stationnement>={
                description:enteteASauver.description,
                annee_debut_reg:enteteASauver.annee_debut_reg,
                annee_fin_reg:enteteASauver.annee_fin_reg,
                texte_loi:enteteASauver.texte_loi,
                article_loi:enteteASauver.article_loi,
                paragraphe_loi:enteteASauver.paragraphe_loi,
                ville:enteteASauver.ville
            }
            const response:AxiosResponse<ReponseEntetesReglements> = await api.put(`/reglements/entete/${idReglement}`,dbData)
            return{success:response.data.success,data:response.data.data}
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
    
    async supprimeReglement(idReglement:number):Promise<boolean>{
        try{
            const response:AxiosResponse<ReponseEntetesReglements> = await api.delete(`/reglements/${idReglement}`)
            return response.data.success?response.data.success:false;
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

    async obtiensOperationsPossibles():Promise<ReponseOperationsReglements>{
        try {
            const response: AxiosResponse<ReponseOperationsReglements> = await api.get(`/reglements/operations`);
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

    async creeOperationsParDefaut():Promise<ApiResponse<number>>{
        try {
            const response: AxiosResponse<ApiResponse<number>> = await api.post(`/reglements/operation-defaults`);
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

    async nouvelleLigneDefinition(definition:Partial<definition_reglement_stationnement>):Promise<ReponseLigneDefReglement>{
        try{
            const dbData:Partial<definition_reglement_stationnement>={
                id_reg_stat:definition.id_reg_stat,
                seuil:definition.seuil,
                ss_ensemble:definition.ss_ensemble,
                oper:definition.oper,
                cases_fix_min:definition.cases_fix_min,
                cases_fix_max:definition.cases_fix_max,
                pente_min:definition.pente_min,
                pente_max:definition.pente_max,
                unite:definition.unite
            }
            const response:AxiosResponse<ReponseLigneDefReglement> = await api.post(`/reglements/ligne-def/`,dbData)
            return{success:response.data.success,data:response.data.data}
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

    async modifieLigneDefinition(idLigne:number,definition:Omit<definition_reglement_stationnement,'id_reg_stat_emp'>):Promise<ReponseLigneDefReglement>{
        try{
            const dbData:Partial<definition_reglement_stationnement>={
                id_reg_stat:definition.id_reg_stat,
                seuil:definition.seuil,
                ss_ensemble:definition.ss_ensemble,
                oper:definition.oper,
                cases_fix_min:definition.cases_fix_min,
                cases_fix_max:definition.cases_fix_max,
                pente_min:definition.pente_min,
                pente_max:definition.pente_max,
                unite:definition.unite
            }
            const response:AxiosResponse<ReponseLigneDefReglement> = await api.put(`/reglements/ligne-def/${idLigne}`,dbData)
            return{success:response.data.success,data:response.data.data}
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

    async supprimeLigneDefinition(idLigne:number):Promise<boolean>{
        try{
            const response:AxiosResponse<ReponseEntetesReglements> = await api.delete(`/reglements/ligne-def/${idLigne}`)
            return response.data.success?response.data.success:false;
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

    async obtiensRepresentationGraphique(idER:number[],idUnite:number,Min:number,Max:number,Pas:Number,cubf:number){
        try{
            const response:AxiosResponse<ReponseDataGraphique> = await api.get(`/reglements/graphiques?id_er=${idER.join(',')}&id_unite=${idUnite}&min=${Min}&max=${Max}&pas=${Pas}&cubf=${cubf}`)
            return {success:true,data:response.data.data}
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
}

export const serviceReglements =  new ServiceReglements();