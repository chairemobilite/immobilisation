import React, { useState, useEffect,useCallback } from 'react';
import { calculateRegLotInventoryProps } from '../../types/utilTypes';
import { TableRevueProps } from '../../types/InterfaceTypes';
import { serviceInventaire } from '../../services';
import { FeatureCollection, Geometry,Feature } from 'geojson';
import { ensemble_reglement_territoire, informations_reglementaire_manuelle, inventaire_stationnement,  reglement_complet,requete_calcul_manuel_reg } from '../../types/DataTypes';
import TableauInventaireUnique from '../tables/TableauInventaireUnique';
import recalculeInventaireLot from '../../utils/recalculeInventaireLot';
import obtRegManuel from '../../utils/obtRegManuel';

// Define the structure of the input values state
interface InputValues {
    [key:string]:{valeur:number}
}
const CompoModifInventaire: React.FC<TableRevueProps> = (props:TableRevueProps) => {
    const emptyFeature: inventaire_stationnement = {
          g_no_lot: '',
          n_places_min: 0,
          n_places_max: 0,
          n_places_mesure: 0,
          n_places_estime: 0,
          methode_estime: 0,
          id_er: '',
          id_reg_stat: '',
          cubf: '',
          commentaire: '',
          id_inv:null
      };
    const [optionCalcul,defOptionCalcul] = useState<number>(-1);
    const [modifEnMarche,defModifEnMarche]= useState<boolean>(false);
    const [inventaireProp, defInventaireProp] = useState<inventaire_stationnement>(emptyFeature);
    const [newRegInvToProc,setNewRegInvToProc] = useState<boolean>(false);
    const [regPertinents,defRegPertinents] = useState<reglement_complet[]>([]);
    const [ensRegPertinents,defEnsRegPertinents] = useState<ensemble_reglement_territoire[]>([]);
    const [reglementUnites,defReglementsUnites] = useState<informations_reglementaire_manuelle[]>([]);
    const [obtentionEnCoursReg,defObtentionEnCoursReg] = useState<boolean>(false);

    const renvoiInventaireReg = (methodeAMontrer:number): inventaire_stationnement => {
        const foundItem = props.inventaire?.find(item => item.methode_estime === methodeAMontrer);
        return foundItem ?? emptyFeature;
    }
    const [inputValues, setInputValues] = useState<InputValues>({});

    const handleInputChange = (cubf: number, unite: number, id_reg_stat: number, id_er:number,value: string) => {
        const key = `${cubf}-${unite}-${id_reg_stat}-${id_er}`;
        setInputValues((prevValues) => ({
            ...prevValues,
            [key]: {
                valeur: Number(value)
            }
        }));
        console.log(inputValues)
    };

    const gestAnnulModifs = () =>{
        defModifEnMarche(false)
        setNewRegInvToProc(false)
        defInventaireProp(emptyFeature)
        setInputValues({})
    }

    const gestAnnulPanneau = () =>{
        defModifEnMarche(false)
        setNewRegInvToProc(false)
        defInventaireProp(emptyFeature)
        if (props.defPanneauModifVisible)
        props.defPanneauModifVisible(false)
    }
    const gestDemarrerCalcul = async() =>{
        if (!modifEnMarche){
            defModifEnMarche(true)
            if (optionCalcul===3 && props.lots&&props.lots.features.length>0){
                defObtentionEnCoursReg(true)
                const resultats = await obtRegManuel(props.lots.features[0].properties.g_no_lot)
                defReglementsUnites(resultats)
                defObtentionEnCoursReg(false)
            }
        } else {
            defModifEnMarche(false)
        }
    }
    const gestMethodeCalcul =(e: React.ChangeEvent<HTMLSelectElement>)=>{
        const valeur = Number(e.target.value); // Convertit en nombre
        console.log("Méthode choisie:", valeur);
        defOptionCalcul(valeur); // Met à jour l'état
    }
    const gestEntreeManuelle = async (e:React.FormEvent<HTMLFormElement>): Promise<void> =>{
        console.log('a implementer')
        // Prevent the browser from reloading the page
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const inventaireASauvegarder = Number(formData.get("entree-manuelle-inventaire"));
        if (!isNaN(inventaireASauvegarder)) {
            if (props.inventaire?.find((o)=>o.methode_estime===1)){
                const featureASauvegarder:inventaire_stationnement={
                    g_no_lot: props.inventaire.find((o)=>o.methode_estime===1)?.g_no_lot?? '',
                    n_places_min: 0,
                    n_places_max: 0,
                    n_places_mesure: inventaireASauvegarder,
                    n_places_estime: 0,
                    methode_estime: 1,
                    id_er: '',
                    id_reg_stat: '',
                    cubf: '',
                    commentaire: 'Relevé manuel',
                    id_inv:props.inventaire.find((o)=>o.methode_estime===1)?.id_inv??(-1)
                }
                if (featureASauvegarder.id_inv!= -1 && featureASauvegarder.g_no_lot!=''){
                    const reussi = await serviceInventaire.modifieInventaire(featureASauvegarder.id_inv,featureASauvegarder)
                    if (reussi){
                        console.log(`Modification Réussie de l'entrée  ${featureASauvegarder.id_inv} de la table d'inventaire`)
                    } else{
                        throw new Error('Écriture Échouée')
                    }
                } else{
                    throw new Error('Erreur d\'index aux inventaires dispo')
                }
            } else{
                const FeatureASauvegarder: Omit<inventaire_stationnement,'id_inv'>= {
                    g_no_lot: props.lots?.features[0].properties.g_no_lot??'',
                    n_places_min: 0,
                    n_places_max: 0,
                    n_places_mesure: inventaireASauvegarder,
                    n_places_estime: 0,
                    methode_estime: 1,
                    id_er: '',
                    id_reg_stat: '',
                    cubf: '',
                    commentaire: 'Relevé manuel',
                };
                const reussi = await serviceInventaire.nouvelInventaire(FeatureASauvegarder)
                if (reussi){
                    console.log(`Entrée dans la table réussie`)
                    if (props.quartier_select){
                    const rechargeInventaire = await serviceInventaire.obtientInventaireParQuartier(props.quartier_select)
                    if (rechargeInventaire.success){
                        if (props.defInventaireQuartier)props.defInventaireQuartier(rechargeInventaire.data)
                        alert('Mise a jour réussie')
                        if (props.defPanneauModifVisible) props.defPanneauModifVisible(false)
                        defModifEnMarche(false)
                    }
                }
                } else{
                    throw new Error('Écriture Échouée')
                }
            }
            console.log("La valeur convertie est :", inventaireASauvegarder);
            
        } else {
            console.error("La conversion a échoué : la valeur n'est pas un nombre.");
        }
        console.log(`a implementer${formData.getAll("entree-manuelle-inventaire")}`)
    }

    const gestSauvegardeNvInv=async()=>{
        const id_modif = renvoiInventaireReg(optionCalcul).id_inv;
        let reussi;
        if (id_modif){
            reussi = await serviceInventaire.modifieInventaire(id_modif,inventaireProp);
            console.log(`Mise à jour réussie ?: ${reussi}`)
        }else{
            reussi = await serviceInventaire.nouvelInventaire(inventaireProp);
        }
        if (reussi){
            setNewRegInvToProc(false);
            defInventaireProp(emptyFeature);
            defModifEnMarche(false);
            if (props.quartier_select){
                const rechargeInventaire = await serviceInventaire.obtientInventaireParQuartier(props.quartier_select)
                if (rechargeInventaire.success){
                    if (props.defInventaireQuartier) props.defInventaireQuartier(rechargeInventaire.data)
                    if (props.defPanneauModifVisible) props.defPanneauModifVisible(false)
                }
                alert('Calcul sauvegardé');
            }
        } else{
            alert('Sauvegarde échouée');
        }
    }

    const renduInventaireApprobation = ()=>{
        if (newRegInvToProc){
            return(
                <div className="compare-inventaire">
                    <div className="compare-side-by-side">
                        <div className="compare-inventaire-old">
                            <p>Ancien</p>
                            <TableauInventaireUnique
                                inventaire={renvoiInventaireReg(optionCalcul)}
                            />
                        </div>
                        <div className="compare-inventaire-new">
                            <p>Nouveau</p>
                            <TableauInventaireUnique
                                inventaire={inventaireProp}
                            />
                        </div>
                    </div>
                    <button onClick={gestSauvegardeNvInv}>Écraser ancien inventaire</button>
                </div>
                
            )
        } else{
            return(<></>)
        }
    }

    const gestCalculLotInvReg = ()=>{
        const propsCalcul:calculateRegLotInventoryProps = {
            lots:props.lots??{type:'FeatureCollection',features:[]},
            modifEnMarche:modifEnMarche,
            defInventaireProp:defInventaireProp,
            defNvInvRegATrait:setNewRegInvToProc
        }
        recalculeInventaireLot(propsCalcul)
        console.log('Calcul complet, mise en page')
    }

    const gestLancementCalculRegEntManuelle=async()=>{
        const matchCalcul: requete_calcul_manuel_reg[] = reglementUnites.map((item) => {
            const key:string = `${item.cubf}-${item.unite}-${item.id_reg_stat}-${item.id_er}`;
            return {
                g_no_lot:props.lots?.features[0].properties.g_no_lot??'',
                cubf: item.cubf,
                id_reg_stat: item.id_reg_stat,
                id_er:item.id_er,
                unite: item.unite,
                valeur: inputValues[key]?.valeur || 0, // Use the input value or default to 0
            };
        });
        console.log(`Processing following lot:\n ${matchCalcul.map((item)=>`${item.cubf.toString()} - ${item.id_reg_stat} - ${item.unite} : ${item.valeur}\n`)}`)
        
        const inventaire = await serviceInventaire.calculeInventaireValeursManuelles(matchCalcul)
        if (inventaire.success){
            setNewRegInvToProc(true)
            defInventaireProp(inventaire.data[0])
        }
        console.log('recu un inventaire')
    }

    const renduReglementsPossibles =()=>{
        if(obtentionEnCoursReg && !newRegInvToProc) {
            return(<><p>Obtention règlement en cours</p></>)
        } else if(!newRegInvToProc) {
            return(
                <>
                    <table>
                        <thead>
                            <th>CUBF</th>
                            <th>ID Reg</th>
                            <th>Unite</th>
                            <th>Valeur</th>
                        </thead>
                        <tbody>
                            {reglementUnites.map((item)=>{
                                const key = `${item.cubf}-${item.unite}-${item.id_reg_stat}-${item.id_er}`;
                                return(
                                <tr key={key}>
                                    <td>{item.cubf}</td>
                                    <td>{item.id_reg_stat}</td>
                                    <td>{item.desc_unite}</td>
                                    <td><input
                                    type='text'
                                    value={inputValues[key]?.valeur != null ? inputValues[key]?.valeur.toString() : ''}
                                    onChange={(e) => handleInputChange(item.cubf,item.unite,item.id_reg_stat,item.id_er, e.target.value)}
                                    /></td>
                                </tr>
                                );
                            })
                        }
                        </tbody>
                    </table>
                    <button onClick={gestLancementCalculRegEntManuelle}>Completer</button>
                </>
            )
        } else{
            return(
                <>
                {renduInventaireApprobation()}
                </>
            );
        }
    }

    const renderForm = () => {
        switch (optionCalcul) {
            case 1:
                return (
                    <>
                        <form onSubmit={gestEntreeManuelle}>
                            <label>
                                Nombre de places pour ce lot <input name="entree-manuelle-inventaire" defaultValue="0" />
                            </label>
                            <button type="submit">Sauvegarder</button>
                        </form>
                    </>
                );
            case 2:
                return (
                    <>
                        <p>Le calcul règlementaire automatique à partir du rôle sera lancé.</p>
                        <button onClick={gestCalculLotInvReg}>Lancer le calcul</button>
                        {renduInventaireApprobation()}
                    </>
                );
            case 3:
                return (
                    <>
                        {renduReglementsPossibles()}
                        
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="compo-modif-inventaire">
            <div className="controle-modif-inventaire-lot">
            <button onClick={gestAnnulPanneau}>Annuler Modifs</button>
            <select onChange={gestMethodeCalcul} value={optionCalcul} disabled={modifEnMarche}>
                <option value={-1} disabled>Choisissez une option</option>
                <option value={1}>Entrée Manuelle</option>
                <option value={2}>Calcul Règlementaire Automatique</option>
                <option value={3}>Calcul Règlementaire Valeurs Manuelles</option>
            </select>
            {!modifEnMarche?(<button onClick={gestDemarrerCalcul}>Démarrer option choisie</button>):(<button onClick={gestAnnulModifs}> Annuler</button>)}
            </div>
            <div className="panneau-modif-inventaire-lot">
            {modifEnMarche && (
            <div className="options-dynamiques">
                {renderForm()}
            </div>
        )}
            </div>
        </div>
    )
}

export default CompoModifInventaire;