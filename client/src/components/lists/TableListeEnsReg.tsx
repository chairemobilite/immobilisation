/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

List that display all the available regulation sets
*/

import React, { useState, useRef, useEffect } from 'react';
import { 
    ensemble_reglements_stationnement, 
    entete_ensembles_reglement_stationnement, 
    entete_reglement_stationnement 
} from '../../types/DataTypes';
import { TableEnteteEnsembleProps } from '../../types/InterfaceTypes';
import { serviceEnsemblesReglements } from "../../services";
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSearchParams } from 'react-router';
import { 
    Button, 
    IconButton,
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Typography 
} from '@mui/material';

/**
 * Left hand panel used for creating new reg sets, duplicating them and navigating the full list
 * @param props are specified in the type file
 * @returns a TSX component which is used for lising the regulation sets and creating, deleting and copying them
 */
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

                console.log('Failed retrieval')
            }
        };

        fetchData();
    }, []); // Empty dependency array means this runs once when the component mounts
    /**
     * retrieves the complete reg set from the backend when the user selects it in the list and
     * pushes the id to the history
     * @param id_reg the id of the regulation set which we're getting from backend
     */
    const onLineSelect = async (id_reg: number) => {
        const reglementAObtenir = await serviceEnsemblesReglements.chercheEnsembleReglementParId(id_reg)
        props.defEnsembleReglement(reglementAObtenir.data[0])
        const entetesReglementsPertinents = await serviceEnsemblesReglements.chercheReglementsPourEnsReg(id_reg)
        props.defEntetesReglements(entetesReglementsPertinents.data)
        window.history.pushState({}, '', `?id_er=${id_reg}`);
    }
    /**
     * manages what happens to the UI state when you create a new object. basically create an empty object and 
     * puts the reg set edition ui into edition mode
     */
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
    /**
     * sends the query to the backend to delete the specified item and hangles 
     * the updates to filter out the deleted item from the frontend display
     * @param idEnsReg the id of the reg set to delete
     */
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
    /**
     * handles the logic to modify the css to change the size of the left hand panel
     * @param e a React mouse event when the user toggles the resize handle
     */
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
            <Typography sx={{ mt: 4, mb: 2,paddingLeft:'10px' }} variant="h4" component="div">
            Ensembles Règlements
            </Typography>
            
            
            <div style={{padding:10}}>
                <Button
                    onClick={gestBoutonAjout}
                    variant='outlined'
                    fullWidth={true}
                     sx={{
                            gap:2,
                            padding:'10px'
                        }}
                >
                    <AddIcon />
                    Ajouter Ens. Règ.
                </Button>
            </div>
            <div className="panneau-scroll-entete-ens-reg">
                <TableContainer
                     component={Paper}
                >
                <Table 
                    stickyHeader
                    size='small'              
                >
                    <TableHead>
                        <TableRow>
                            <TableCell>Description Ensemble</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {props.entetesEnsembles.map((entete) => (
                            <TableRow key={entete.id_er} className={entete.id_er ===props.ensembleReglement.entete.id_er?'selected-row':''} onClick={() => onLineSelect(entete.id_er)}>
                                <TableCell>{entete.description_er}</TableCell>
                                <TableCell><IconButton onClick={(e)=>{e.stopPropagation(); gestSuppressionEnsReg(entete.id_er);}}><DeleteIcon/></IconButton></TableCell>
                            </TableRow>

                        ))}
                    </TableBody>
                </Table>
                </TableContainer>
            </div>
        </div>
    );
};


export default TableListeEnsReg;