import React, { useEffect, useState } from 'react';
import { PropsModifUnites } from '../../types/InterfaceTypes';
import { FormControl, FormLabel, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { Cancel, Delete, Edit, Save } from '@mui/icons-material';
import { unites_reglement_stationnement } from '../../types/DataTypes';
import { serviceUnites } from '../../services';

const PanneauModificationUnites: React.FC<PropsModifUnites> = (props:PropsModifUnites) =>{

   

    const allumeEdition = ()=>{
        props.defEditionEnCours(true)
        props.defAnciennesUnites(structuredClone(props.unites))
    }
    const gestSupprime = async(id_unite:number)=>{
        const resultat = await serviceUnites.supprimeUnite(id_unite)
        if (resultat===true){
            props.defUnites(props.unites.filter((unite)=>unite.id_unite!==id_unite))
            props.defAnciennesUnites([])
            props.defUniteSelect({id_unite:0,desc_unite:''})
        }
    }
    const gestSauve = async()=>{
        if (props.uniteSelect.id_unite===-1){
            const resultat = await serviceUnites.creeNouvelleUnite(props.uniteSelect)
            if (!resultat.success || !resultat.data[0]) { alert('Sauvegarde non réussie'); return }
            const newUnites = props.unites.map((unite)=>{if(unite.id_unite!==-1){return unite}else{return resultat.data[0]}})
            props.defUnites(newUnites)
            props.defUniteSelect(resultat.data[0])
            props.defEditionEnCours(false)
            props.defAnciennesUnites([])
        }else{
            const id = props.uniteSelect.id_unite
            const resultat = await serviceUnites.modifieUnite(id,props.uniteSelect)
            if (!resultat.success || !resultat.data[0]) { alert('Sauvegarde non réussie'); return }
            const newUnites = props.unites.map((unite)=>{if(unite.id_unite!==id){return unite}else{return resultat.data[0]}})
            props.defUnites(newUnites)
            props.defUniteSelect(resultat.data[0])
            props.defEditionEnCours(false)
            props.defAnciennesUnites([])
        }
    }
    const annuleEdition =()=>{
        props.defUnites(props.anciennesUnites)
        props.defAnciennesUnites([])
        props.defUniteSelect({id_unite:0,desc_unite:''})
        props.defEditionEnCours(false)
    }
    const handleItemChange = (colonneAEditer:string,nouvelleValeur:string|number)=>{
        let uniteAmodif:unites_reglement_stationnement={...props.uniteSelect};
        if ( ['desc_unite',].includes(colonneAEditer)){
            uniteAmodif = {...uniteAmodif,[colonneAEditer]:nouvelleValeur};

        }
        if (['colonne_role_foncier'].includes(colonneAEditer)){
            const nom_unite = props.colonnesPossibles.find((item)=>item.nom_colonne===nouvelleValeur)
            if (typeof nom_unite !== 'undefined'){
                uniteAmodif = {...uniteAmodif,[colonneAEditer]:nom_unite.nom_colonne}
            }
        }
        if (['facteur_correction','abscisse_correction'].includes(colonneAEditer)){
            uniteAmodif= {
                ...uniteAmodif,
                [colonneAEditer]:Number(nouvelleValeur)
            }
        }
        props.defUniteSelect(uniteAmodif)
        props.defUnites(props.unites.map((uniteL)=>{if(uniteL.id_unite!==uniteAmodif.id_unite){return uniteL}else{return uniteAmodif}}))
    }
    return(
        <div className="modif-unite">
            {props.uniteSelect.id_unite!==0?(<>{!props.editionEnCours ? (
                    <div className='unite-edit-del'>
                        <Edit sx={{ paddingBottom: "8px" }} onClick={allumeEdition} />
                        <Delete onClick={()=>gestSupprime(props.uniteSelect.id_unite)}/>
                    </div>
                ) : (
                    <div className='strate-save-cancel'>
                        <Save onClick={gestSauve} />
                        <Cancel onClick={annuleEdition} />
                    </div>
                )
            }
                <FormControl variant="standard" fullWidth sx={{ gap: 2 }}>
                    <FormLabel sx={{ color: "white" }}>Informations de base</FormLabel>

                    
                    <FormControl>
                        {["desc_unite"].map((field) => (
                            <TextField
                                key={field}
                                label={field.replace("_", " ").toUpperCase()}
                                value={(props.uniteSelect as any)[field]}
                                disabled={!props.editionEnCours}
                                onChange={(e) => handleItemChange(field, e.target.value)}
                                variant="standard"
                                sx={{
                                    "& .MuiInputBase-input": {
                                        color: "white",
                                        backgroundColor: "#1f1f1f",
                                    },
                                    "& .MuiInputLabel-root": { color: "white" },
                                    "& .MuiInputLabel-root.Mui-disabled": {
                                        color: "#cccccc",
                                        WebkitTextFillColor: "#cccccc",
                                    },
                                    "& .MuiInputBase-input.Mui-disabled": {
                                        color: "#cccccc",
                                        WebkitTextFillColor: "#cccccc",
                                        opacity: 1,
                                    },
                                    "& .MuiInput-underline:before": { borderBottomColor: "white" },
                                    "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                                }}
                            />
                        ))}
                    </FormControl>
                    <FormControl>
                        {["facteur_correction",'abscisse_correction'].map((field) => (
                            <TextField
                                key={field}
                                label={field.replace("_", " ").toUpperCase()}
                                value={(props.uniteSelect as any)[field]}
                                disabled={!props.editionEnCours}
                                onChange={(e) => handleItemChange(field, e.target.value)}
                                variant="standard"
                                type='number'
                                sx={{
                                    "& .MuiInputBase-input": {
                                        color: "white",
                                        backgroundColor: "#1f1f1f",
                                    },
                                    "& .MuiInputLabel-root": { color: "white" },
                                    "& .MuiInputLabel-root.Mui-disabled": {
                                        color: "#cccccc",
                                        WebkitTextFillColor: "#cccccc",
                                    },
                                    "& .MuiInputBase-input.Mui-disabled": {
                                        color: "#cccccc",
                                        WebkitTextFillColor: "#cccccc",
                                        opacity: 1,
                                    },
                                    "& .MuiInput-underline:before": { borderBottomColor: "white" },
                                    "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                                }}
                            />
                        ))}
                    </FormControl>
                    <FormControl variant="standard" fullWidth>
                    <InputLabel
                            id="colonne-select-label"
                            sx={{
                                color: "#cccccc",
                                "&.Mui-disabled": { color: "#cccccc", WebkitTextFillColor: "#cccccc" },
                            }}
                        >
                            Colonne entrée pour conversion unité
                    </InputLabel>
                    <Select
                            labelId="colonne-select-label"
                            value={props.uniteSelect.colonne_role_foncier}
                            disabled={!props.editionEnCours}
                            onChange={(e) => handleItemChange("colonne_role_foncier", String(e.target.value))}
                            sx={{
                                "& .MuiSelect-select": { color: "white", backgroundColor: "#1f1f1f" },
                                "& .MuiSelect-select.Mui-disabled": {
                                    color: "#cccccc",
                                    WebkitTextFillColor: "#cccccc",
                                    opacity: 1,
                                },
                                "& .MuiInput-underline:before": { borderBottomColor: "white" },
                                "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                            }}
                        >
                            {props.colonnesPossibles.map((valeur)=><MenuItem value={valeur.nom_colonne} key={valeur.nom_colonne}>{valeur.description_colonne}</MenuItem>)}
                    </Select>{props.uniteSelect.colonne_role_foncier}
                    </FormControl>
                </FormControl></>
            ):(
                <>
                
                </>
            )}
        </div>

    )
}
export default PanneauModificationUnites