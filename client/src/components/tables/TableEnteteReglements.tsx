import React, { useState, useRef, useEffect } from 'react';
import { definition_reglement_stationnement, entete_reglement_stationnement, reglement_complet } from '../../types/DataTypes';
import { TableEnteteProps } from '../../types/InterfaceTypes';
import { serviceReglements } from "../../services";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { FilterAlt } from '@mui/icons-material';
const TableEnteteReglements: React.FC<TableEnteteProps> = (props) => {
    const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
    const enteteReglementVide: entete_reglement_stationnement = {
        id_reg_stat: 0,
        description: '',
        annee_debut_reg: 0,
        annee_fin_reg: 0,
        texte_loi: '',
        article_loi: '',
        paragraphe_loi: '',
        ville: ''
    };


    const reglementCompletVide: reglement_complet = {
        entete: enteteReglementVide,
        definition: []
    }
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resReglements = await serviceReglements.chercheTousEntetesReglements();
                console.log('Recu les règlements', resReglements);
                props.defEntetes(resReglements.data);
                props.defToutesEntetes(resReglements.data)
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                props.defCharge(false);
            }
        };

        fetchData();
    }, []); // Empty dependency array means this runs once when the component mounts

    useEffect(() => {
        if (props.regSelect.entete.id_reg_stat) {
            const regKey = props.regSelect.entete.id_reg_stat;
            const row = rowRefs.current[regKey];
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [props.regSelect]);

    if (props.charge) {
        return <div>Chargement...</div>; // You can show a loading state while waiting for the data
    }
    const onLineSelect = async (id_reg: number) => {
        const reglementAObtenir = await serviceReglements.chercheReglementComplet(id_reg)
        props.defRegSelect(reglementAObtenir.data[0])
        props.defCreationEnCours(false)
        window.history.pushState({}, '', `?id_reg_stat=${id_reg}`)
    }
    const gestBoutonAjout = () =>{
        console.log('No add implemented')
        const newEntete:entete_reglement_stationnement={id_reg_stat:-1,description:'Nouveau Règlement',texte_loi:'',article_loi:'',paragraphe_loi:'',annee_debut_reg:0,annee_fin_reg:null,ville:''}
        const newStack:definition_reglement_stationnement[]=[]
        const newReglement:reglement_complet = {entete:newEntete,definition:newStack}
        props.defRegSelect(newReglement)
        props.defCreationEnCours(true)
        props.defEditionEnteteEnCours(true)
    }
    const gestSuppressionReglement =async(idASupprimer:number)=>{
        console.log(`suppression reglement frontend ${idASupprimer}`)
        if (props.creationEnCours && props.editionEnteteEnCours){
            props.defRegSelect(reglementCompletVide)
        } else {
            console.log('suppression reglement')
            const confirm = await serviceReglements.supprimeReglement(idASupprimer)
            if (confirm){
                props.defEntetes(props.entetes.filter((entete) => entete.id_reg_stat !== idASupprimer));
                props.defRegSelect(reglementCompletVide)
            }
            window.history.replaceState({}, "", window.location.pathname);
        } 
    }
    return (
        <div className="panneau-table-entete">
            <h4>Entete reglements</h4>
            <div className="div-filtre-reglements"><FilterAlt onClick={()=>props.defModalOuvert(true)}/> Filtrer règlements</div>
            <div className="ajout-reglement"><AddIcon onClick={gestBoutonAjout}/> Ajout Nouveau Reglement</div>
            <div className="table-entete-reglements-container">
                <table className="table-entete-reglements">
                    <thead>
                        <tr>
                            <th>ID reglement</th>
                            <th>Description Reglement</th>
                            <th>Année Début Reglement</th>
                            <th>Année Fin Reglement</th>
                            <th>Texte Loi</th>
                            <th>Article Loi</th>
                            <th>Paragraphe Loi</th>
                            <th>Ville</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.entetes.map((entete) => (
                            <tr key={entete.id_reg_stat} 
                                onClick={() => onLineSelect(entete.id_reg_stat)}
                                ref={el => { rowRefs.current[entete.id_reg_stat] = el; }}
                                className={entete.id_reg_stat===props.regSelect.entete.id_reg_stat?"reg-selectionne":"reg-general"}>
                                <td>{entete.id_reg_stat}</td>
                                <td>{entete.description}</td>
                                <td>{entete.annee_debut_reg}</td>
                                <td>{entete.annee_fin_reg}</td>
                                <td>{entete.texte_loi}</td>
                                <td>{entete.article_loi}</td>
                                <td>{entete.paragraphe_loi}</td>
                                <td>{entete.ville}</td>
                                <td onClick={()=> gestSuppressionReglement(entete.id_reg_stat)}><DeleteIcon /></td>
                            </tr>

                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default TableEnteteReglements;