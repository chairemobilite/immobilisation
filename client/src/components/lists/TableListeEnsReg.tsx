import React, { useState, useRef, useEffect } from 'react';
import { ensemble_reglements_stationnement, entete_ensembles_reglement_stationnement, entete_reglement_stationnement } from '../../types/DataTypes';
import { TableEnteteEnsembleProps } from '../../types/InterfaceTypes';
import { serviceEnsemblesReglements } from "../../services";
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSearchParams } from 'react-router';

const TableListeEnsReg: React.FC<TableEnteteEnsembleProps> = (props) => {
    const [searchParams,setSearchParams]=useSearchParams()
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
    useEffect(() => { 
        const fetchData = async () => {
            try {
                const res = await serviceEnsemblesReglements.chercheTousEntetesEnsemblesReglements();
                console.log('Recu les périodes', res);
                props.defEntetesEnsembles(res.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                console.log('Failed retrieval')
            }
        };

        fetchData();
    }, []); // Empty dependency array means this runs once when the component mounts

    const onLineSelect = async (id_reg: number) => {
        const reglementAObtenir = await serviceEnsemblesReglements.chercheEnsembleReglementParId(id_reg)
        props.defEnsembleReglement(reglementAObtenir.data[0])
        const entetesReglementsPertinents = await serviceEnsemblesReglements.chercheReglementsPourEnsReg(id_reg)
        props.defEntetesReglements(entetesReglementsPertinents.data)
        window.history.pushState({}, '', `?id_er=${id_reg}`);
    }

    const gestBoutonAjout = async() =>{
        const nouveauEnsRegEntete:entete_ensembles_reglement_stationnement={
            id_er:-1,
            description_er:'Nouvel Ensemble',
            date_debut_er:0,
            date_fin_er:null
        }
        const nouveauAssocEnsReg:ensemble_reglements_stationnement={
            entete: nouveauEnsRegEntete,
            assoc_util_reg:[],
            table_etendue:[],
            table_util_sol:[]
        }
        props.defEditionEnteteEnCours(true);
        props.defEnsembleReglement(nouveauAssocEnsReg)
        props.defAncienEnsRegComplet(reglementCompletVide)
    }

    const gestSuppressionEnsReg = async(idEnsReg:number) =>{
        const reponse = await serviceEnsemblesReglements.supprimeEnsReg(idEnsReg)
        if (reponse){
            searchParams.delete('id_er')
            setSearchParams(searchParams)
            const newList = props.entetesEnsembles.filter((item)=>item.id_er!==idEnsReg)
            props.defEntetesEnsembles(newList)
        }
    }

    const panelRef = useRef<HTMLDivElement>(null);
    const handleMouseDown = (e: React.MouseEvent) => {
        const startX = e.clientX;
        const startWidth = panelRef.current ? panelRef.current.offsetWidth : 0;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth - (startX - e.clientX);
            if (panelRef.current) {
                panelRef.current.style.width = `${newWidth}px`;
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="panneau-entete-ens-reg" ref={panelRef}>
            <div className="resize-handle-left-panel" onMouseDown={handleMouseDown}></div>
            <h4>Entete Ensembles</h4>
            <div className="ajout-reglement"><AddIcon onClick={gestBoutonAjout}/></div>
            <div className="panneau-scroll-entete-ens-reg">
                <table className="table-entete-ens-reg">
                    <thead>
                        <tr>
                            <th>Description Ensemble</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.entetesEnsembles.map((entete) => (
                            <tr key={entete.id_er} className={entete.id_er ===props.ensembleReglement.entete.id_er?'selected-row':''} onClick={() => onLineSelect(entete.id_er)}>
                                <td>{entete.description_er}</td>
                                <td><td ><DeleteIcon onClick={()=> gestSuppressionEnsReg(entete.id_er)}/></td></td>
                            </tr>

                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default TableListeEnsReg;