import React from 'react';
import { useNavigate } from "react-router";
import { utiliserContexte } from '../contexte/ContexteImmobilisation';
import { donneesCarteDeFond } from '../types/ContextTypes';
import SubMenuComponent from './SubMenuComponent';
import { Logout, AccountBox } from '@mui/icons-material';
import { authClient } from '../lib/auth-client';
import { IconButton } from '@mui/material';

const MenuBar: React.FC<{}> = () => {

    const navigate = useNavigate();
    const contexte = utiliserContexte();
    const optionCartoChoisie = contexte?.optionCartoChoisie ?? "";
    const changerCarto = contexte?.changerCarto ?? (() => {});
    const optionsCartos = contexte?.optionsCartos ?? [];
    return(
        <div className="menu-bar">
            <h1>Immobilisation</h1>
            <SubMenuComponent
                label={"Entrée Données Départ"}
                options={[
                    {label:"Secteurs d'analyse",path:"/sec-analyse-verse"},
                    {label:"Conversion unité", path:"/unites"},
                    {label:"Rôle Foncier",path:"/role-foncier"},
                    {label:"Cadastre", path:"/cadastre"},
                    {label:"Associations Cadastre-rôle",path:"/assoc-cadastre-role"},
                    {label:"Données Recensement", path:"/recensement"},
                    {label:'Enquête OD', path:'/enquete-od'},
                    {label:'CUBF', path:'/cubf'},
                    {label:'Opérateurs règlements',path:'/operateurs-reg'},
                    {label:'Sommaire Données', path:'/sommaire-versement'}
                ]}
            />
            <SubMenuComponent
                label={"Entrée Règlementation"}
                options={[
                    {label:"Historique",path:"/historique"},
                    {label:"Règlements",path:"/reg"},
                    {label:"Ensembles de règlements",path:"/ens-reg"},
                    {label:"Ensembles de règlements territoires",path:"/ens-reg-terr"}]}
            />
            <SubMenuComponent
                label={"Inventaire"}
                options={[
                    {label:"Manipulation Inventaire", path:"/inventaire"},
                    {label:"Validation Statistique", path:"/valid-stat"},
                    {label:"Sommaire Validation", path:"/sommaire-valid"}
                ]}
            />
            <SubMenuComponent
                label={"Pages d'analyse"}
                options={[
                    {label:"Visualisation Ensembles de règlements",path:"/ana-reg"},
                    {label:"Analyse de variabilité",path:"/ana-var"},
                    {label:"Analyse agrégée quartiers",path:"/ana-quartiers"}
                ]}
            />
            <div className='gestionUtilsateur'>
                <IconButton aria-label="Profil" onClick={()=>{navigate('/profil')}}>
                    <AccountBox sx={{color:"white"}}/>
                </IconButton>
                <IconButton aria-label="Déconnexion" onClick={async()=>{
                            try {
                                await authClient.signOut();
                                navigate('/login', { replace: true });
                            } catch (error) {
                                alert("Échec de déconnexion:"+error);
                            }
                        }
                    }
                >
                    <Logout sx={{color:"white"}}/>
                </IconButton>
            </div>
            <div className="control-dds">
            {/*
            
                <div className="ville-control">
                    <label 
                        htmlFor="ville-control-dd" 
                        className="label-ville-control">
                            Centre
                    </label>
                    <select 
                        className="ville-control-dd" 
                        id="select-quartier" 
                        name="select-quartier"
                        value={optionCentreChoisie}
                        onChange={(e)=>changerCentre(Number(e.target.value))}
                    >
                        {
                            optionsCentres.map((entree)=><option value={entree.idLieu}>{entree.nomLieu}</option>)
            
                        }
                    </select>
                </div>*/}
                <div className="map-bground-control">
                    <label 
                        htmlFor="fond-de-carte" 
                        className="label-fond-de-carte">
                            Tuiles
                    </label>
                    <select id="fond-de-carte" name="fond-de-carte" value={optionCartoChoisie} onChange={(e)=>changerCarto(Number(e.target.value))}>
                        {optionsCartos.map((entree: donneesCarteDeFond) => <option value={entree.id}>{entree.description}</option>)}
                    </select>
                </div>
            </div>
        </div>
    )
}

export default MenuBar;