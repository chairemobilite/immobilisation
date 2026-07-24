/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Page to visualize and create new regulation sets which are associations between land use and 
parking regulations
*/


import MenuBar from "../components/menus/MenuBar";
import TableListeEnsReg from "../components/lists/TableListeEnsReg";
import TableVisModEnsReg from "../components/tables/TableVisEnsReg";
import { useState, useEffect, useRef } from "react";
import {useSearchParams} from 'react-router'
import {  association_util_reglement, ensemble_reglements_stationnement, entete_reglement_stationnement } from "../types/DataTypes";
import { entete_ensembles_reglement_stationnement } from "../types/DataTypes";
import CreationAssociationCubfRegEnsReg from "../components/modals/CreationAssociationCubfRegEnsReg";
import './ensemblereg.css'
import './common.css'
import { serviceEnsemblesReglements } from "../services";
import ModalDuplicationEnsReg from '../components/modals/ModalDuplicationEnsReg'
/**
 * this is the main page item for the modification of regulation sets. There are 2 big panels 
 * and 2 modals as part of this page which handle the various interactions
 * @returns a tsx page which can be used for render
 */
const EnsemblesReglements: React.FC = () => {
    const enteteEnsemblevide: entete_ensembles_reglement_stationnement = {
        id_er:0,
        date_debut_er:0,
        date_fin_er:0,
        description_er:'',
    };
    const reglementCompletVide: ensemble_reglements_stationnement = {
        entete: enteteEnsemblevide,
        assoc_util_reg: [],
        table_util_sol:[],
        table_etendue:[]
    }

    const [regSetHeaders, setRegSetHeaders] = useState<entete_ensembles_reglement_stationnement[]>([]);
    const [charge, defCharg] = useState<boolean>(true);
    const [fullRegSet, setFullRegSet] = useState<ensemble_reglements_stationnement>(reglementCompletVide);
    const [oldFullRegSet,setOldFullRegSet] = useState<ensemble_reglements_stationnement>(reglementCompletVide);
    const [pertinentRegs,setPertinentRegs] = useState<entete_reglement_stationnement[]>([]);
    const [editHeaderFlag,setEditHeaderFlag] = useState<boolean>(false);
    const [assignEditFlag,setAssignEditFlag] = useState<boolean>(false);
    const [editedAssignId,setEditedAssignId] = useState<number>(-1);
    const [newAssignModalOpen,setNewAssignModalOpen] = useState<boolean>(false);
    const [AllRegHeaders,setAllRegHeaders] = useState<entete_reglement_stationnement[]>([]);
    const [duplicateERsModalOpen,setDuplicateERsModalOpen]=useState<boolean>(false)
    const [searchParams] = useSearchParams();
    
    useEffect(() => {
    // code for handling search query change
        const fetchER=async(idER:number)=>{
            const [
                responseAssoc,
                reponseEntete,
                reponseListe
            ] = await Promise.all([
                    serviceEnsemblesReglements.chercheEnsembleReglementParId(idER),
                    serviceEnsemblesReglements.chercheReglementsPourEnsReg(idER),
                    serviceEnsemblesReglements.chercheTousEntetesEnsemblesReglements()
                ]) 
            setFullRegSet(responseAssoc.data[0])
            setPertinentRegs(reponseEntete.data)
            setRegSetHeaders(reponseListe.data)
        }
        
        const id_er = searchParams.get("id_er");
        if (id_er!==null &&typeof(Number(id_er))==='number'){
             fetchER(Number(id_er))
        }
    }, [searchParams]);
    return (
        <div className="page-creation-ens-reg">
            <MenuBar />
            <div className="ens-reg-conteneur-row">
                {/* The list on the left which provides all the reg sets */}
                <TableListeEnsReg
                    entetesEnsembles={regSetHeaders}
                    defEntetesEnsembles={setRegSetHeaders}
                    ensembleReglement={fullRegSet}
                    defEnsembleReglement={setFullRegSet}
                    entetesReglements={pertinentRegs}
                    defEntetesReglements={setPertinentRegs}
                    editionEnteteEnCours={editHeaderFlag}
                    defEditionEnteteEnCours={setEditHeaderFlag}
                    editionCorpsEnCours={assignEditFlag}
                    defEditionCorpsEnCours={setAssignEditFlag}
                    ancienEnsRegComplet={oldFullRegSet}
                    defAncienEnsRegComplet={setOldFullRegSet}
                    setDuplicationModalOpen={setDuplicateERsModalOpen}
                />

                {/* The panel on the right for detailed edition of regulation set */}
                <TableVisModEnsReg
                    charge={charge}
                    defCharge={defCharg}
                    ensembleReglement={fullRegSet}
                    defEnsembleReglement={setFullRegSet}
                    entetesReglements={pertinentRegs}
                    defEntetesReglements={setPertinentRegs}
                    editionEnteteEnCours={editHeaderFlag}
                    defEditionEnteteEnCours={setEditHeaderFlag}
                    editionCorpsEnCours={assignEditFlag}
                    defEditionCorpsEnCours = {setAssignEditFlag}
                    idAssociationEnEdition={editedAssignId}
                    defIdAssociationEnEdition={setEditedAssignId}
                    entetesEnsRegListe={regSetHeaders}
                    defEntetesEnsRegListe={setRegSetHeaders}
                    ancienEnsRegComplet={oldFullRegSet}
                    defAncienEnsRegComplet={setOldFullRegSet}
                    modalOuvert={newAssignModalOpen}
                    defModalOuvert={setNewAssignModalOpen}
                />
                {/* The modal that creates the assignments between land use and regulation*/}
                <CreationAssociationCubfRegEnsReg 
                    editionCorpsEnCours={assignEditFlag}
                    editionEnteteEnCours={editHeaderFlag}
                    defEditionCorpsEnCours={setAssignEditFlag}
                    defEditionEnteteEnCours={setEditHeaderFlag}
                    ensembleReglement={fullRegSet}
                    defEnsembleReglement={setFullRegSet}
                    ancienEnsRegComplet={oldFullRegSet}
                    defAncienEnsRegComplet={setOldFullRegSet}
                    idAssociationEnEdition={editedAssignId}
                    defIdAssociationEnEdition={setEditedAssignId}
                    modalOuvert={newAssignModalOpen}
                    defModalOuvert={setNewAssignModalOpen}
                    tousReglements={AllRegHeaders}
                    defTousReglement={setAllRegHeaders}
                    reglementVisu={pertinentRegs}
                    defReglementVisu={setPertinentRegs}
                />
                <ModalDuplicationEnsReg
                    modalOpen={duplicateERsModalOpen}
                    setModalOpen={setDuplicateERsModalOpen}
                    setRegSetCurrent={setFullRegSet}
                    setRegSetList={setRegSetHeaders}
                />
            </div>
        </div>
    )
}

export default EnsemblesReglements;