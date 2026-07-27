import { EntreeValidation, FeuilleFinaleStrate,  Strate } from "../types/DataTypes";
import axios, { AxiosResponse } from 'axios';
import api from './api';
import { ApiResponse, ReponseDataGraphique, ReponseFeuilles, ReponseResultatValidation, ReponseStrateUnique, ReponseStrateValide,RequeteApiStrate, RequeteResultatValidation } from "../types/serviceTypes";
const serviceValidation = {
    obtiensStrates:async(requeteApiStrate?:RequeteApiStrate):Promise<ReponseStrateValide>=>{
        try{
            let conditions:string[] = [];
            if (requeteApiStrate?.id_strate!==undefined && requeteApiStrate.id_strate!==null){
                conditions.push(`id_strate=${requeteApiStrate?.id_strate}`)
            }
            if (requeteApiStrate?.n_sample_ge!==undefined && requeteApiStrate.n_sample_ge!==null){
                conditions.push(`n_samples_ge=${requeteApiStrate?.n_sample_ge}`)
            }
            if (requeteApiStrate?.n_sample_se!==undefined && requeteApiStrate.n_sample_se!==null){
                conditions.push(`n_samples_se=${requeteApiStrate?.n_sample_se}`)
            }
            let query:string = '/valid/strate'
            if (conditions.length>0){
                query += '?'+conditions.join('&')
            }
            const output = await api.get(query)
            return {success:true,data:output.data.data};
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    nouvelleStrate:async(strateAInserer:Strate,idParent:number|null):Promise<ReponseStrateValide>=>{
        try{
            let query_new:string = '/valid/strate'
            const { id_strate, ...rest } = strateAInserer;
            let body: Omit<Strate, 'id_strate'> = rest;
            const output = await api.post(query_new,{princip:body,id_parent:idParent});
            return {success:true,data:output.data.data};
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    modifieStrate:async(idStrate:number,strateComplete:Strate)=>{
        try{
            let query_new:string = `/valid/strate/${idStrate}`
            const { id_strate, ...rest } = strateComplete;
            let body: Omit<Strate, 'id_strate'> = rest;
            const output = await api.put(query_new,body);
            return {success:true,data:output.data.data};
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    supprimeStrate:async(idStrate:number):Promise<ReponseStrateValide>=>{
        try{
            let query_new:string = `/valid/strate/${idStrate}`
            const output = await api.delete(query_new);
            return {success:true,data:output.data.data};
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    obtiensColonnesValides:async():Promise<ApiResponse<string[]>>=>{
        try{
            let query_new:string = `/valid/strate/colonnes_possibles`
            const output = await api.get(query_new);
            return {success:true,data:output.data.data};
        }catch(error:any){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    regenereInputs:async():Promise<ApiResponse<boolean>>=>{
        try{
            let query_new:string = '/valid/strate/donnees_intrantes'
            const output:AxiosResponse<boolean> = await api.get(query_new);
            return {success:output.data,data:output.data};
        }catch(error:any){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    obtiensFeuilles:async():Promise<ReponseFeuilles>=>{
        try{
            let query_new:string = '/valid/feuilles'
            const output:AxiosResponse = await api.get(query_new);
            return {success:true,data:output.data.data};
        }catch(error:any){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    obtiensResultatValidation:async(requete:RequeteResultatValidation):Promise<ReponseResultatValidation>=>{
        try{
            let query_new:string = '/valid/resultats'
            let queries:string[]=[]
            if (requete.id_strate!==undefined){
                queries.push(`id_strate=${requete.id_strate}`)
            }
            if (requete.g_no_lot!==undefined){
                queries.push(`g_no_lot=${requete.g_no_lot.replace(' ','_')}`)
            }
            if (requete.fond_tuile!==undefined){
                queries.push(`fond_tuile=${requete.fond_tuile}`)
            }
            if (queries.length>0){
                query_new += '?' + queries.join('&')
            }
            const output:AxiosResponse = await api.get(query_new);
            return {success:true,data:output.data.data};
        }catch(error:any){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    nouveauResultatValidation:async(entree:EntreeValidation):Promise<ReponseResultatValidation>=>{
        try{
            let query_new:string = '/valid/resultats'
            const {id_val,...rest} = entree
            const out:Omit<EntreeValidation,'id_val'>=rest;
            const output:AxiosResponse = await api.post(query_new,out);
            return {success:true,data:output.data.data};
        }catch(error:any){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    modifieResultatValidation:async(entree:EntreeValidation):Promise<ReponseResultatValidation>=>{
        try{
            let query_new:string = `/valid/resultats/${entree.id_val}`
            const {id_val,...rest} = entree
            const out:Omit<EntreeValidation,'id_val'>=rest;
            const output:AxiosResponse = await api.put(query_new,out);
            return {success:true,data:output.data.data};
        }catch(error:any){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
    supprimeResultatValidation:async(id_val:number):Promise<ReponseResultatValidation>=>{
        try{
            let query_new:string = `/valid/resultats/${id_val}`
            
            const output:AxiosResponse = await api.delete(query_new);
            return {success:true,data:output.data.data};
        }catch(error:any){
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error.response?.data);
                console.error('Axios Error Status:', error.response?.status);
                console.error('Axios Error Data:', error.response?.data);
            } else {
                console.error('Unexpected Error:', error);
            }
            throw error; // Re-throw if necessary
        }
    },
        obtiensGraphique:async(props:{id_strate?:number,x_max?:number,variable?:string}):Promise<ReponseDataGraphique>=>{
        try {
            let query_add: string[] = [];
            
            if (typeof props.id_strate !== 'undefined') {
                query_add.push(`id_strate=${Number(props.id_strate)}`)
            }
            if (typeof props.x_max !== 'undefined') {
                query_add.push(`x_max=${Number(props.x_max)}`)
            }
            if (typeof props.variable !== 'undefined') {
                query_add.push(`type=${props.variable}`)
            }
            let base_query: string = `/valid/graphiques`
            if (query_add.length > 0) {
                base_query += '?' + query_add.join('&')
            }
            const response: AxiosResponse<ReponseDataGraphique> = await api.get(base_query);
            return ({
                success: response.data.success,
                data: response.data.data
            });
        } catch (error: any) {
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

export default serviceValidation;