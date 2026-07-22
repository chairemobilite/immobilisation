/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Helps visualize and create the assignments of regulations to land 
uses in a regulation set
*/

import React from 'react';
import { TableVisModEnsRegProps } from '../../types/InterfaceTypes';
import AddIcon from '@mui/icons-material/AddOutlined';
import CancelIcon from '@mui/icons-material/Cancel';
import { 
    Edit, 
    Save 
} from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
    ensemble_reglements_stationnement, 
    entete_ensembles_reglement_stationnement 
} from '../../types/DataTypes';
import { serviceEnsemblesReglements } from '../../services';
import { ReponseEnteteEnsembleReglementStationnement } from '../../types/serviceTypes';
import { 
    Box, 
    Button, 
    Checkbox, 
    IconButton, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    TextField, 
    Typography 
} from '@mui/material';


/**
 * this function is a function capable of showing a complte regulation set
 * TO-DO:split up the return value into a few components this is getting a little large at the moment 
 * @param props the properties that are used for the component see interface definition
 * @returns a jsx component that visualizes a complete parking regulation set
 */
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
    /**
     * Handles the opening of the modal which is used to create new 
     * land use to regulation assignments
     */
    const gestBoutonAjout = async () => {
        props.defModalOuvert(true)
    }
    /**
     * handles the saving the of the regulation set handers and figures out 
     * whether we're discussing a new item or one that we need to update.
     * Once save is complete, handles updating the states in the frontend
     */
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

    /**
     * handles the changes to the header on the go during edition
     * @param champsAModifier the field we want to edit
     * @param valeur the new value of the field
     */
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

    /**
     * handles the opening of the modal that edits things and the various flages 
     * that are used to avoid trying to make 2 changes at once which makes state 
     * handling a pain
     * @param idAssoc the id of the land use regulation assignement we want to set
     */
    const gestEditionAssociation = async(idAssoc:number)=>{
        props.defEditionCorpsEnCours(true)
        props.defIdAssociationEnEdition(idAssoc)
        props.defModalOuvert(true)
    }

    /**
     * handles the deletion of an existing land use to regulation assignement
     * @param idAssoc the id of the assignment we want to delete 
     */
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

    /**
     * Handles what to do when you cancel an edition
     */
    function handleCancel(){
        props.defEnsembleReglement(props.ancienEnsRegComplet)
        props.defAncienEnsRegComplet({
                entete:{
                    id_er:-1,
                    description_er:'',
                    date_debut_er:0,
                    date_fin_er:2025
                },
                table_util_sol:[],
                assoc_util_reg:[],
                table_etendue:[]  
            }
        )
    }
    return (
        <div className="panneau-details-ens-reg">
           <Typography sx={{ mt: 4, mb: 2,paddingLeft:'10px' }} variant="h4" component="div">
            Détails ensemble sélectionné
            </Typography>
            <div
            
                >
                <TableContainer
                    component={Paper}
                    sx={{ padding: '10px' }}
                >
                    <Table >
                        <TableHead>
                            <TableRow>
                                <TableCell>ID ensemble</TableCell>
                                <TableCell>Description Ensemble</TableCell>
                                <TableCell>Année Début Reglement</TableCell>
                                {props.editionEnteteEnCours ? <TableCell>Perpetuite</TableCell> : <></>}
                                <TableCell>Année Fin Reglement</TableCell>
                                {props.editionEnteteEnCours ? <TableCell>En Vigueur</TableCell> : <></>}
                                <TableCell></TableCell>
                                {props.editionEnteteEnCours ? <TableCell></TableCell> : <></>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {<TableRow key={props.ensembleReglement.entete.id_er}>
                                <TableCell>{props.ensembleReglement.entete.id_er}</TableCell>
                                <TableCell>{props.editionEnteteEnCours ? 
                                    <TextField value={props.ensembleReglement.entete.description_er} onChange={(e) => { gestChangementEntete('description_er', e.target.value) }}  /> : 
                                    props.ensembleReglement.entete.description_er}
                                </TableCell>
                                <TableCell>{props.editionEnteteEnCours && props.ensembleReglement.entete.date_debut_er !== null ? 
                                    <TextField value={props.ensembleReglement.entete.date_debut_er} onChange={(e) => { gestChangementEntete('date_debut_er', e.target.value) }} type='number' /> : 
                                    props.ensembleReglement.entete.date_debut_er}
                                </TableCell>
                                {props.editionEnteteEnCours ? 
                                    <TableCell>
                                        <Checkbox
                                            checked={props.ensembleReglement.entete.date_debut_er === null} 
                                            onClick={() => gestChangementEntete('date_debut_er', props.ensembleReglement.entete.date_debut_er === null ? '0' : null)}
                                            component={Paper} 
                                        />
                                    </TableCell> : <>
                                    </>
                                }
                                <TableCell>
                                    {
                                        props.editionEnteteEnCours && props.ensembleReglement.entete.date_fin_er !== null ? 
                                            <TextField value={props.ensembleReglement.entete.date_fin_er} onChange={(e) => { gestChangementEntete('date_fin_er', e.target.value) }} type='number' /> : 
                                            props.ensembleReglement.entete.date_fin_er
                                    }
                                </TableCell>
                                {props.editionEnteteEnCours ? 
                                    <TableCell>
                                        <Checkbox 
                                            checked={props.ensembleReglement.entete.date_fin_er === null} 
                                            onClick={() => gestChangementEntete('date_fin_er', props.ensembleReglement.entete.date_fin_er === null ? '0' : null)} 
                                        />
                                    </TableCell> : <></>}
                                <TableCell>
                                    {
                                        props.editionEnteteEnCours ? 
                                            <IconButton
                                                onClick={gestBoutonSauvegardeEntete} 
                                            >
                                                <Save />
                                            </IconButton> : 
                                            <IconButton
                                                onClick={() => { 
                                                    props.defAncienEnsRegComplet(props.ensembleReglement); 
                                                    props.defEditionEnteteEnCours(true); 
                                                }}
                                            >
                                                <Edit  />
                                            </IconButton>
                                    }
                                </TableCell>
                                {props.editionEnteteEnCours ? <TableCell>
                                    <IconButton
                                        onClick={handleCancel}
                                    >
                                        <CancelIcon />
                                    </IconButton>
                                </TableCell> : <></>}
                            </TableRow>}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            {props.ensembleReglement.entete.id_er>0?
                <Box 
                    sx={{padding:'10px'}}
                >
                    <Button
                        variant='outlined'
                        onClick={gestBoutonAjout}
                    >
                        <AddIcon  /> Ajouter association
                    </Button>
                </Box>:<></>}
 
            <div
                className='panneau-table-association'
            >

            <TableContainer component={Paper}>
                
            <Table
                stickyHeader
                size='small'
                style={{
                    padding:'15px',
                    overflow:'auto'
                }}
            >
                <TableHead>
                    <TableRow>
                        <TableCell>ID Assoc</TableCell>
                        <TableCell>CUBF</TableCell>
                        <TableCell>ID Règlement</TableCell>
                        <TableCell>Deb reg</TableCell>
                        <TableCell>Fin Reg</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
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
                            <TableRow key={assoc.id_assoc_er_reg} >
                                <TableCell>{assoc.id_assoc_er_reg}</TableCell>
                                <TableCell>{assoc.cubf + ' - ' + (foundLandUse ? foundLandUse?.description : 'N/A')}</TableCell>
                                <TableCell>{assoc.id_reg_stat + ' - ' + (foundRule ? foundRule.description : 'N/A')}</TableCell>
                                <TableCell>{(foundRule ? foundRule.annee_debut_reg : 'N/A')}</TableCell>
                                <TableCell>{(foundRule ? foundRule.annee_fin_reg : 'N/A')}</TableCell>
                                <TableCell>{<IconButton><Edit onClick={()=>gestEditionAssociation(assoc.id_assoc_er_reg)} /></IconButton>}</TableCell>
                                <TableCell>{<IconButton><DeleteIcon onClick={()=>gestSuppressionAssoc(assoc.id_assoc_er_reg)}/></IconButton>}</TableCell>
                            </TableRow>

                        )
                    })}
                </TableBody>
                
            </Table>

            </TableContainer>
            </div>
        </div>
    );
};


export default TableVisModEnsReg;