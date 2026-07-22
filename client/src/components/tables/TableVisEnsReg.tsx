import React, { useState, useRef } from 'react';
import { TableVisModEnsRegProps } from '../../types/InterfaceTypes';
import AddIcon from '@mui/icons-material/AddOutlined';
import CancelIcon from '@mui/icons-material/Cancel';
import { Edit, Save } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ensemble_reglements_stationnement, entete_ensembles_reglement_stationnement } from '../../types/DataTypes';
import { serviceEnsemblesReglements } from '../../services';
import { ReponseEnteteEnsembleReglementStationnement } from '../../types/serviceTypes';

const TableVisModEnsReg: React.FC<TableVisModEnsRegProps> = (props) => {
    const enteteEnsemblevide: entete_ensembles_reglement_stationnement = {
        id_er: 0,
        date_debut_er: 0,
        date_fin_er: 0,
        description_er: '',
    };
    const reglementCompletVide: ensemble_reglements_stationnement = {
        entete: enteteEnsemblevide,
        assoc_util_reg: [],
        table_util_sol: [],
        table_etendue: []
    }
    const gestBoutonAjout = async () => {
        props.defModalOuvert(true)
    }
    const gestBoutonSauvegardeEntete = async () => {
        const isNew = props.ensembleReglement.entete.id_er === -1;
        let saveReturn: ReponseEnteteEnsembleReglementStationnement;
        // interface with backend
        if (isNew) {
            const headerToSave: Omit<entete_ensembles_reglement_stationnement, 'id_er'> = {
                description_er: props.ensembleReglement.entete.description_er,
                date_debut_er: props.ensembleReglement.entete.date_debut_er,
                date_fin_er: props.ensembleReglement.entete.date_fin_er
            }
            saveReturn = await serviceEnsemblesReglements.nouvelleEntete(headerToSave)
        } else {
            const headerToSave: Omit<entete_ensembles_reglement_stationnement, 'id_er'> = {
                description_er: props.ensembleReglement.entete.description_er,
                date_debut_er: props.ensembleReglement.entete.date_debut_er,
                date_fin_er: props.ensembleReglement.entete.date_fin_er
            }
            const idHeaderToSave: number = props.ensembleReglement.entete.id_er;
            saveReturn = await serviceEnsemblesReglements.modifEntete(idHeaderToSave, headerToSave)
        }
        // clean up database return and plug into current reg set
        const updatedEntete: entete_ensembles_reglement_stationnement = saveReturn.data;
        const updatedEnsReg: ensemble_reglements_stationnement = {
            entete: updatedEntete,
            table_util_sol: props.ensembleReglement.table_util_sol,
            assoc_util_reg: props.ensembleReglement.assoc_util_reg,
            table_etendue: props.ensembleReglement.table_etendue
        }
        // update current item
        props.defEnsembleReglement(updatedEnsReg)
        // plug header into list for left hand panel
        let newListeEnsembles: entete_ensembles_reglement_stationnement[]
        if (isNew) {
            newListeEnsembles = [
                ...props.entetesEnsRegListe.map((item) => ({
                    id_er: item.id_er,
                    date_debut_er: item.date_debut_er,
                    date_fin_er: item.date_fin_er,
                    description_er: item.description_er
                })),
                updatedEnsReg.entete
            ];
        } else {
            newListeEnsembles = [
                ...props.entetesEnsRegListe.map((item) => item.id_er === updatedEnsReg.entete.id_er ? ({
                    id_er: updatedEnsReg.entete.id_er,
                    date_debut_er: updatedEnsReg.entete.date_debut_er,
                    date_fin_er: updatedEnsReg.entete.date_fin_er,
                    description_er: updatedEnsReg.entete.description_er
                }) : ({
                    id_er: item.id_er,
                    date_debut_er: item.date_debut_er,
                    date_fin_er: item.date_fin_er,
                    description_er: item.description_er
                })),
            ];
        }
        // update list
        props.defEntetesEnsRegListe(newListeEnsembles)
        // clear old version of the reg set
        props.defAncienEnsRegComplet(reglementCompletVide)
        // clear editing boolean in order to go back to display mode
        props.defEditionEnteteEnCours(false)
    }
    const gestChangementEntete = (champsAModifier: string, valeur: string | null) => {
        let newEntete: entete_ensembles_reglement_stationnement;
        if ((champsAModifier === 'date_debut_er' || champsAModifier === 'date_fin_er') && valeur !== null) {
            newEntete = {
                id_er: props.ensembleReglement.entete.id_er,
                description_er: props.ensembleReglement.entete.description_er,
                date_debut_er: props.ensembleReglement.entete.date_debut_er,
                date_fin_er: props.ensembleReglement.entete.date_fin_er,
                [champsAModifier]: Number(valeur)
            }
        } else {
            newEntete = {
                id_er: props.ensembleReglement.entete.id_er,
                description_er: props.ensembleReglement.entete.description_er,
                date_debut_er: props.ensembleReglement.entete.date_debut_er,
                date_fin_er: props.ensembleReglement.entete.date_fin_er,
                [champsAModifier]: valeur
            }
        }
        const newReg: ensemble_reglements_stationnement = {
            entete: newEntete,
            assoc_util_reg: props.ensembleReglement.assoc_util_reg,
            table_util_sol: props.ensembleReglement.table_util_sol,
            table_etendue: []
        }
        props.defEnsembleReglement(newReg)
    }

    const gestEditionAssociation = async(idAssoc:number)=>{
        props.defEditionCorpsEnCours(true)
        props.defIdAssociationEnEdition(idAssoc)
        props.defModalOuvert(true)
    }
    const gestSuppressionAssoc = async(idAssoc:number)=>{
        const reponse = await serviceEnsemblesReglements.supprimeAssoc(idAssoc)
        if (reponse){
            const nouvelTableAssoc = props.ensembleReglement.assoc_util_reg.filter((o)=>o.id_assoc_er_reg!==idAssoc)
            const nouvelEnsemble:ensemble_reglements_stationnement={
                entete:props.ensembleReglement.entete,
                table_etendue:props.ensembleReglement.table_etendue,
                table_util_sol:props.ensembleReglement.table_util_sol,
                assoc_util_reg:nouvelTableAssoc
            }
            props.defEnsembleReglement(nouvelEnsemble)
        }
    }
    return (
        <div className="panneau-details-ens-reg">

            <h4>Détails Ensemble</h4>
            <table className="table-modif-ens-reg-entete">
                <thead>
                    <tr>
                        <th>ID ensemble</th>
                        <th>Description Ensemble</th>
                        <th>Année Début Reglement</th>
                        {props.editionEnteteEnCours ? <th>Perpetuite</th> : <></>}
                        <th>Année Fin Reglement</th>
                        {props.editionEnteteEnCours ? <th>En Vigueur</th> : <></>}
                        <th></th>
                        {props.editionEnteteEnCours ? <th></th> : <></>}
                    </tr>
                </thead>
                <tbody>
                    {<tr key={props.ensembleReglement.entete.id_er}>
                        <td>{props.ensembleReglement.entete.id_er}</td>
                        <td>{props.editionEnteteEnCours ? <input value={props.ensembleReglement.entete.description_er} onChange={(e) => { gestChangementEntete('description_er', e.target.value) }} type='text' /> : props.ensembleReglement.entete.description_er}</td>
                        <td>{props.editionEnteteEnCours && props.ensembleReglement.entete.date_debut_er !== null ? <input value={props.ensembleReglement.entete.date_debut_er} onChange={(e) => { gestChangementEntete('date_debut_er', e.target.value) }} type='number' /> : props.ensembleReglement.entete.date_debut_er}</td>
                        {props.editionEnteteEnCours ? <td><input type='checkbox' checked={props.ensembleReglement.entete.date_debut_er === null} onClick={() => gestChangementEntete('date_debut_er', props.ensembleReglement.entete.date_debut_er === null ? '0' : null)} /></td> : <></>}
                        <td>{props.editionEnteteEnCours && props.ensembleReglement.entete.date_fin_er !== null ? <input value={props.ensembleReglement.entete.date_fin_er} onChange={(e) => { gestChangementEntete('date_fin_er', e.target.value) }} type='number' /> : props.ensembleReglement.entete.date_fin_er}</td>
                        {props.editionEnteteEnCours ? <td><input type='checkbox' checked={props.ensembleReglement.entete.date_fin_er === null} onClick={() => gestChangementEntete('date_fin_er', props.ensembleReglement.entete.date_fin_er === null ? '0' : null)} /></td> : <></>}
                        <td>{props.editionEnteteEnCours ? <Save onClick={gestBoutonSauvegardeEntete} /> : <Edit onClick={() => { props.defAncienEnsRegComplet(props.ensembleReglement); props.defEditionEnteteEnCours(true); }} />}</td>
                        {props.editionEnteteEnCours ? <td><CancelIcon /></td> : <></>}
                    </tr>}
                </tbody>
            </table>
            {props.ensembleReglement.entete.id_er>0?<div className="ajout-reglement"><AddIcon onClick={gestBoutonAjout} /> Ajouter association</div>:<></>}
            <table className="table-modif-ens-reg-corps">
                <thead>
                    <tr>
                        <th>ID Assoc</th>
                        <th>CUBF</th>
                        <th>ID Règlement</th>
                        <th>Deb reg</th>
                        <th>Fin Reg</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {props.ensembleReglement.assoc_util_reg.map((assoc) => {
                        //console.log('Printing relevant rules',props.entetesReglements)
                        const foundRule = Array.isArray(props.entetesReglements)
                            ? props.entetesReglements.find(item => {
                                //console.log('Comparing:', item.id_reg_stat, 'with', assoc.id_reg_stat);
                                return item.id_reg_stat === assoc.id_reg_stat;
                            })
                            : null;
                        const foundLandUse = Array.isArray(props.ensembleReglement.table_util_sol) ?
                            props.ensembleReglement.table_util_sol.find(item => {
                                return Number(item.cubf) === assoc.cubf
                            })
                            : null;
                        //console.log('assoc.cubf:', assoc.cubf, 'foundItem:', foundLandUse);
                        return (
                            <tr key={assoc.id_assoc_er_reg} >
                                <td>{assoc.id_assoc_er_reg}</td>
                                <td>{assoc.cubf + ' - ' + (foundLandUse ? foundLandUse?.description : 'N/A')}</td>
                                <td>{assoc.id_reg_stat + ' - ' + (foundRule ? foundRule.description : 'N/A')}</td>
                                <td>{(foundRule ? foundRule.annee_debut_reg : 'N/A')}</td>
                                <td>{(foundRule ? foundRule.annee_fin_reg : 'N/A')}</td>
                                <td>{props.editionCorpsEnCours && props.idAssociationEnEdition === assoc.id_assoc_er_reg ? <Save /> : <Edit onClick={()=>gestEditionAssociation(assoc.id_assoc_er_reg)} />}</td>
                                <td>{props.editionCorpsEnCours && props.idAssociationEnEdition === assoc.id_assoc_er_reg ? <CancelIcon /> : <DeleteIcon onClick={()=>gestSuppressionAssoc(assoc.id_assoc_er_reg)}/>}</td>
                            </tr>

                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};


export default TableVisModEnsReg;