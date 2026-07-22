import { FiltreReglementProps } from "../../types/InterfaceTypes";
import React,{useEffect, useState} from 'react'
import { serviceReglements } from "../../services";
import { parametres_requete_filtree_stationnement } from "../../types/DataTypes";
const FiltreReglement:React.FC<FiltreReglementProps>=(props:FiltreReglementProps)=>{
    {/* Annee debut */}
    const [anneeDebutActif,defAnneeDebutActif] = useState<boolean>(false);
    const [conditionAnneeDebut,defConditionAnneeDebut] = useState<number>(-1);
    const [anneeDebut,defAnneeDebut] = useState<number|null>(null);
    {/* Annee Fin */}
    const [anneeFinActif,defAnneeFinActif] = useState<boolean>(false);
    const [conditionAnneeFin,defConditionAnneeFin] = useState<number>(-1);
    const [anneeFin,defAnneeFin] = useState <number|null>(null);
    {/* Ville */}
    const [villeActif,defVilleActif] = useState<boolean>(false);
    const [ville,defVille] = useState<string>('')
    {/* description */}
    const [descriptionActif,defDescriptionActif] = useState<boolean>(false);
    const [description,defDescription] = useState<string>('')
    {/* texte de loi */}
    const [texteActif,defTexteActif] = useState<boolean>(false);
    const [texte,defTexte] = useState<string>('')
    {/* article */}
    const [articleActif,defArticleActif]= useState<boolean>(false);
    const [article,defArticle] = useState<string>('')
    {/* paragraphe */}
    const [paragrapheActif,defParagrapheActif] = useState<boolean>(false);
    const [paragraphe,defParagraphe] = useState<string>('')

    const gestRequeteFiltre=async()=>{
        const structureRequete:parametres_requete_filtree_stationnement = {
            annee_debut_avant:anneeDebutActif&&conditionAnneeDebut===-1?anneeDebut:undefined,
            annee_debut_apres: anneeDebutActif && conditionAnneeDebut === 1 && anneeDebut !== null ? anneeDebut : undefined,
            annee_fin_avant: anneeFinActif && conditionAnneeFin === -1 && anneeFin !== null ? anneeFin : undefined,
            annee_fin_apres:anneeFinActif&&conditionAnneeFin===1?anneeFin:undefined,
            ville:villeActif?ville:undefined,
            description:descriptionActif?description:undefined,
            texte:texteActif?texte:undefined,
            article:articleActif?article:undefined,
            paragraphe:paragrapheActif?paragraphe:undefined
        }
        const reponse = await serviceReglements.chercheReglementAvecFiltre(structureRequete)
        props.defResultatReglements(reponse.data)
    }
    const gestRemiseAZero=()=>{
        props.defResultatReglements(props.tousReglements)
    }
    
    return(
        <div>
            <h4>Filtre Règlement</h4>
            <div className="form-row">
                <input type='checkbox' checked={anneeDebutActif} onClick={()=>(anneeDebutActif?defAnneeDebutActif(false):defAnneeDebutActif(true))}/>
                <label className="form-label">Année Début</label>
                {anneeDebutActif?
                    (anneeDebut!==null?
                        (<>
                            <select onChange={(e) => defConditionAnneeDebut(Number(e.target.value))} value={conditionAnneeDebut}>
                                <option value={-1}>avant</option>
                                <option value={1}>apres</option>
                            </select>
                            <input type='number' value={anneeDebut} onChange={(e)=>defAnneeDebut(Number(e.target.value))}/>
                            <label>Perpétuité</label>
                            <input type='checkbox' checked={anneeDebut===null} onClick={()=>{anneeDebut===null?defAnneeDebut(2015):defAnneeDebut(null)}}/>
                        </>):(
                        <>
                            <label>Perpétuité</label>
                            <input type='checkbox' checked={anneeDebut===null} onClick={()=>{anneeDebut===null?defAnneeDebut(2015):defAnneeDebut(null)}}/>
                        </>)
                    ):
                    <>
                    </>
                }
            </div>
            <div className="form-row">
                <input type='checkbox' 
                    checked={anneeFinActif} 
                    onClick={()=>(anneeFinActif?defAnneeFinActif(false):defAnneeFinActif(true))}/>
                <label className="form-label">Année Fin</label>
                {anneeFinActif?
                    (anneeFin!==null?
                    (<>
                        <select onChange={(e) => defConditionAnneeFin(Number(e.target.value))} value={conditionAnneeFin}>
                            <option value={-1}>avant</option>
                            <option value={1}>apres</option>
                        </select>
                        <input type='number' value={anneeFin} onChange={(e)=>defAnneeFin(Number(e.target.value))}/>
                        <label>En vigueur</label>
                        <input type='checkbox' checked={anneeFin===null} onClick={()=>{anneeFin===null?defAnneeFin(2015):defAnneeFin(null)}}/>
                    </>):(
                    <>
                        <label>En vigueur</label>
                        <input type='checkbox' checked={anneeFin===null} onClick={()=>{anneeFin===null?defAnneeFin(2015):defAnneeFin(null)}}/>
                        </>)
                    ):
                    <>
                    </>
                }
            </div>
            <div className="form-row">
                <input type='checkbox' checked={villeActif}  onClick={()=>(villeActif?defVilleActif(false):defVilleActif(true))}/>
                <label className="form-label">Ville</label>
                {villeActif?
                    <>
                        <input type='string' value={ville}onChange={(e)=>defVille(e.target.value)}/>
                    </>
                    :<>
                    </>
                }
            </div>
            <div className="form-row">
                <input type='checkbox' checked={descriptionActif} 
                    onClick={()=>{ 
                            if(descriptionActif){
                                defDescriptionActif(false)
                            }else{
                                defDescriptionActif(true)
                            }
                        }
                    }/>
                <label className="form-label">Description</label>
                {descriptionActif?
                    <>
                        <input type='string' value={description}onChange={(e)=>defDescription(e.target.value)}/>
                    </>
                    :<>
                    </>
                }
            </div>
            <div className="form-row">
                <input
                    type='checkbox'
                    checked={texteActif}
                    onClick={() => {
                        if (texteActif) {
                            defTexteActif(false);
                            defTexte('');
                        } else {
                            defTexteActif(true);
                        }
                    }}
                />
                <label className='form-label'>Texte de loi</label>
                {texteActif?
                    <>
                        <input type='string' value={texte}onChange={(e)=>defTexte(e.target.value)}/>
                    </>
                    :<>
                    </>
                }
            </div>
            <div className="form-row">
                <input type='checkbox'checked={articleActif} onClick={()=>(articleActif?defArticleActif(false):defArticleActif(true))}/>
                <label className='form-label'>Article de loi</label>
                {articleActif?
                    <>
                        <input type='string' value={article}onChange={(e)=>defArticle(e.target.value)}/>
                    </>
                    :<>
                    </>
                }
            </div>
            <div className="form-row">
                <input type='checkbox' checked={paragrapheActif} onClick={()=>(paragrapheActif?defParagrapheActif(false):defParagrapheActif(true))}/>
                <label className="form-label">Paragraphe de loi</label>
                {paragrapheActif?
                    <>
                        <input type='string' value={paragraphe}onChange={(e)=>defParagraphe(e.target.value)}/>
                    </>
                    :<>
                    </>
                }
            </div>
            <button type="button" onClick={gestRequeteFiltre}>Obtenir Résultats</button>
            <button type="button" onClick={gestRemiseAZero}>Enlever Filtre</button>
        </div>
    )
}

export default FiltreReglement