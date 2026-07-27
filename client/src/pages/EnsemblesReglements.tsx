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

    const [enteteEnsembles, defEnteteEnsembles] = useState<entete_ensembles_reglement_stationnement[]>([]);
    const [charge, defCharg] = useState<boolean>(true);
    const [ensembleReglementComplet, defEnsembleReglementComplet] = useState<ensemble_reglements_stationnement>(reglementCompletVide);
    const [ancienEnsembleReglementComplet,defAncienEnsembleReglementComplet] = useState<ensemble_reglements_stationnement>(reglementCompletVide);
    const [reglementsPertinents,defRegPert] = useState<entete_reglement_stationnement[]>([]);
    const [editionEnteteEncours,defEditionEnteteEnCours] = useState<boolean>(false);
    const [editionCorpsEnCours,defEditionCorpsEnCours] = useState<boolean>(false);
    const [idAssocModifEncours,defIdAssocModifEnCours] = useState<number>(-1);
    const [modalOuvert,defModalOuvert] = useState<boolean>(false);
    const [TousReglements,defTousReglements] = useState<entete_reglement_stationnement[]>([]);
    const [searchParams] = useSearchParams();

    useEffect(() => {
    // code for handling search query change
        const fetchER=async(idER:number)=>{
            const [responseAssoc,reponseEntete] = await Promise.all([serviceEnsemblesReglements.chercheEnsembleReglementParId(idER),serviceEnsemblesReglements.chercheReglementsPourEnsReg(idER)]) 
            defEnsembleReglementComplet(responseAssoc.data[0])
            defRegPert(reponseEntete.data)
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
                <TableListeEnsReg
                    entetesEnsembles={enteteEnsembles}
                    defEntetesEnsembles={defEnteteEnsembles}
                    ensembleReglement={ensembleReglementComplet}
                    defEnsembleReglement={defEnsembleReglementComplet}
                    entetesReglements={reglementsPertinents}
                    defEntetesReglements={defRegPert}
                    editionEnteteEnCours={editionEnteteEncours}
                    defEditionEnteteEnCours={defEditionEnteteEnCours}
                    editionCorpsEnCours={editionCorpsEnCours}
                    defEditionCorpsEnCours={defEditionCorpsEnCours}
                    ancienEnsRegComplet={ancienEnsembleReglementComplet}
                    defAncienEnsRegComplet={defAncienEnsembleReglementComplet}
                />


                <TableVisModEnsReg
                    charge={charge}
                    defCharge={defCharg}
                    ensembleReglement={ensembleReglementComplet}
                    defEnsembleReglement={defEnsembleReglementComplet}
                    entetesReglements={reglementsPertinents}
                    defEntetesReglements={defRegPert}
                    editionEnteteEnCours={editionEnteteEncours}
                    defEditionEnteteEnCours={defEditionEnteteEnCours}
                    editionCorpsEnCours={editionCorpsEnCours}
                    defEditionCorpsEnCours = {defEditionCorpsEnCours}
                    idAssociationEnEdition={idAssocModifEncours}
                    defIdAssociationEnEdition={defIdAssocModifEnCours}
                    entetesEnsRegListe={enteteEnsembles}
                    defEntetesEnsRegListe={defEnteteEnsembles}
                    ancienEnsRegComplet={ancienEnsembleReglementComplet}
                    defAncienEnsRegComplet={defAncienEnsembleReglementComplet}
                    modalOuvert={modalOuvert}
                    defModalOuvert={defModalOuvert}
                />
                <CreationAssociationCubfRegEnsReg 
                    editionCorpsEnCours={editionCorpsEnCours}
                    editionEnteteEnCours={editionEnteteEncours}
                    defEditionCorpsEnCours={defEditionCorpsEnCours}
                    defEditionEnteteEnCours={defEditionEnteteEnCours}
                    ensembleReglement={ensembleReglementComplet}
                    defEnsembleReglement={defEnsembleReglementComplet}
                    ancienEnsRegComplet={ancienEnsembleReglementComplet}
                    defAncienEnsRegComplet={defAncienEnsembleReglementComplet}
                    idAssociationEnEdition={idAssocModifEncours}
                    defIdAssociationEnEdition={defIdAssocModifEnCours}
                    modalOuvert={modalOuvert}
                    defModalOuvert={defModalOuvert}
                    tousReglements={TousReglements}
                    defTousReglement={defTousReglements}
                    reglementVisu={reglementsPertinents}
                    defReglementVisu={defRegPert}
                />
            </div>
        </div>
    )
}

export default EnsemblesReglements;