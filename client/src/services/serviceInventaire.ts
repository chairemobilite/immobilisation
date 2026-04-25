
import { ReponseInventaire,ReponseDBInventaire, ReponseDBCadastreGeoSeul, ReponseInventaireSeuil, RequeteInventaire} from '../types/serviceTypes';
import api from './api';
import axios,{AxiosResponse} from 'axios';
import { inventaire_stationnement, requete_calcul_manuel_reg } from '../types/DataTypes';

export const serviceInventaire = {
    obtientInventaireParQuartier: async(id_quartier:number) : Promise<ReponseInventaire> => {
        try {
            const response: AxiosResponse<ReponseDBInventaire> = await api.get(`/inventaire/quartier/${id_quartier}`);
            const data_res = response.data.data;
            console.log('Recu Inventaire')
            return {success:response.data.success,data:data_res};
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

    obtientInventaireParId:async(id_lot:string) : Promise<ReponseInventaire> =>{
        try {
            const response: AxiosResponse<ReponseDBInventaire> = await api.get(`/inventaire/no_lot/${id_lot}`);
            const data_res = response.data.data;
            console.log('Recu Inventaire')
            return {success:response.data.success,data:data_res};
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
    obtiensInventaireQuery:async(queryParams:RequeteInventaire):Promise<ReponseInventaire>=>{
        try {
            let queries:string[]=[]
            let query:string = '/inventaire/query'
            if(queryParams.id_inv!==undefined){
                queries.push(`id_inv=${queryParams.id_inv}`)
            }
            if (queryParams.cubf!==undefined){
                queries.push(`cubf=${queryParams.cubf}`)
            }
            if (queryParams.g_no_lot!==undefined){
                queries.push(`g_no_lot=${queryParams.g_no_lot.replace(' ','_')}`)
            }
            if (queryParams.methode_estime!==undefined){
                queries.push(`methode_estime=${queryParams.methode_estime}`)
            }
            if(queryParams.n_places_plus_grand!==undefined){
                queries.push(`n_places_ge=${queryParams.n_places_plus_grand}`)
            }
            if(queryParams.dens_places_plus_grand!==undefined){
                queries.push(`dens_places_ge=${queryParams.n_places_plus_grand}`)
            }
            if (queries.length>0){
                query += '?'+queries.join('&')
            }
            const response: AxiosResponse<ReponseDBInventaire> = await api.get(query);
            const data_res = response.data.data;
            console.log('Recu Inventaire')
            return {success:response.data.success,data:data_res};
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

    recalculeQuartierComplet:async(id_quartier:number) : Promise<ReponseInventaire> =>{
        try {
            console.log('recalcul Quarier complet')
            const response= await api.get<ReponseDBInventaire>(`/inventaire/calcul/quartier/${id_quartier}`);

            //const reponseGeomLots= await api.get<ReponseDBCadastreGeoSeul>(`/cadastre/lot/quartier-ana/${id_quartier}`)
           
            console.log('obtenu resultats')
            const data_res = response.data.data; 
            console.log('Recu Inventaire')
            return {success:response.data.success,data:data_res};
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

    recalculeLotSpecifique: async(id_lot:string) : Promise<ReponseInventaire>=>{
        try {
            console.log('recalcul lot specifique')
            const formattedId = id_lot.replace(/ /g, "_");
            const response= await api.get<ReponseDBInventaire>(`/inventaire/calcul/lot/${formattedId}`);
            const data_res = response.data.data; 
            console.log('Recu Inventaire')
            return {success:response.data.success,data:data_res};
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
    
    calculeInventaireValeursManuelles:async(requete:requete_calcul_manuel_reg[]):Promise<ReponseInventaire>=>{
        try{
            console.log("Calcule d'un inventaire avec valeurs manuelles")
            const reponse = await api.post<ReponseDBInventaire>('/inventaire/calcul/reg-val-man',requete)
            console.log('Recu Inventaire')
            return {success:reponse.data.success,data:reponse.data.data};
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
    },

    modifieInventaire:async(id_inv:number|null,inventaireAEnvoyer:inventaire_stationnement) :Promise<ReponseInventaireSeuil>=>{
        try {
            if (!isNaN(Number(id_inv))){
                const dbData: Partial<inventaire_stationnement> = {
                    g_no_lot: inventaireAEnvoyer.g_no_lot,
                    n_places_min: inventaireAEnvoyer.n_places_min,
                    n_places_max: inventaireAEnvoyer.n_places_max,
                    n_places_estime: inventaireAEnvoyer.n_places_estime,
                    n_places_mesure: inventaireAEnvoyer.n_places_mesure,
                    id_er: inventaireAEnvoyer.id_er,
                    id_reg_stat: inventaireAEnvoyer.id_reg_stat,
                    commentaire: inventaireAEnvoyer.commentaire,
                    methode_estime: inventaireAEnvoyer.methode_estime,
                    cubf: inventaireAEnvoyer.cubf
                  };
                const reponseMAJInv = await api.put(`/inventaire/${id_inv}`,dbData);
                return {success:reponseMAJInv.data.success,data:reponseMAJInv.data.data}
            } else{
                throw new Error("id_inv doit être défini pour cette fonction");
            }
        } catch (error:any) {
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

    nouvelInventaire:async(nouvelInventaire:Omit<inventaire_stationnement,'id_inv'>):Promise<ReponseInventaireSeuil>=>{
        try {
            const dbData: Partial<inventaire_stationnement> = {
                g_no_lot: nouvelInventaire.g_no_lot ,
                n_places_min: nouvelInventaire.n_places_min,
                n_places_max: nouvelInventaire.n_places_max,
                n_places_estime: nouvelInventaire.n_places_estime,
                n_places_mesure: nouvelInventaire.n_places_mesure,
                id_er: nouvelInventaire.id_er,
                id_reg_stat: nouvelInventaire.id_reg_stat,
                commentaire: nouvelInventaire.commentaire ,
                methode_estime: nouvelInventaire.methode_estime,
                cubf: nouvelInventaire.cubf
                };
            const reponseMAJInv = await api.post(`/inventaire/`,dbData);
            return {success:reponseMAJInv.data.success,data:reponseMAJInv.data.data}
        } catch (error:any) {
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

    supprimerEntreeInventaire:async(inventaireASupprimer:number):Promise<boolean>=>{
        try {
            
            const reponseMAJInv = await api.delete(`/inventaire/${inventaireASupprimer}`);
            return reponseMAJInv.data.success
        } catch (error:any) {
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

    modifiePlusieursInventaires:async(inventaireAMAJ:inventaire_stationnement[]):Promise<ReponseInventaire>=>{
        try {
            // Check that all items have an id_inv
            inventaireAMAJ.forEach((item, index) => {
                if (!item.id_inv) {
                    throw new Error(`Item with g_no_lot ${item.g_no_lot} is missing id_inv`);
                }
            });
            const reponseMAJInv = await api.put(`/inventaire/maj-en-gros/`,inventaireAMAJ);
            return {success:reponseMAJInv.data.success,data:reponseMAJInv.data.data};
        } catch (error:any) {
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

    plusieursNouveauxInventaires:async(nouvelInventaire:Omit<inventaire_stationnement[],'id_inv'>):Promise<ReponseInventaire>=>{
        try {
            const reponseMAJInv = await api.post(`/inventaire/nouv-en-gros`,nouvelInventaire);
            return reponseMAJInv.data.success
        } catch (error:any) {
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
};