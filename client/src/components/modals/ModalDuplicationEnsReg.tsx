/*
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Modal to search, select and duplicate a regulation set relatively rapidly
*/

import { 
    Box, 
    Button,
    Modal, 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableRow, 
} from "@mui/material";
import { 
    Dispatch, 
    SetStateAction, 
    useState 
} from "react";
import { 
    ensemble_reglements_stationnement, 
    entete_ensembles_reglement_stationnement 
} from "../../types/DataTypes";
import { serviceEnsemblesReglements } from "../../services";
import RegSetSearchComponent from "../searchComponents/RegSetSearchComponent";
import { useSearchParams } from "react-router";

interface ModalDuplicationProps {
    modalOpen: boolean,
    setModalOpen: Dispatch<SetStateAction<boolean>>
    setRegSetList:Dispatch<SetStateAction<entete_ensembles_reglement_stationnement[]>>
    setRegSetCurrent:Dispatch<SetStateAction<ensemble_reglements_stationnement>>
}

export default function ModalDuplicationEnsReg(props: ModalDuplicationProps) {
    
    const [
        searchResults,
        setSearchRes
    ]= useState<
            entete_ensembles_reglement_stationnement[]
            >([])
    const [erSelect,setErSelect]=useState<number|null>(null)
    const [searchParams, setSearchParams] = useSearchParams();

   

    function handleRegSetSelect(id_er:number){
        setErSelect(id_er)
    }

    async function handleRegSetCopy(){
        if(erSelect!==null){
            const newRegSet = await serviceEnsemblesReglements.copyRegulationSet(erSelect)
            if (newRegSet.success&&newRegSet.data){
                props.setRegSetCurrent(newRegSet.data)
                props.setRegSetList((vals)=>[...vals,newRegSet.data.entete])
                searchParams.set('id_er', String(newRegSet.data.entete.id_er))
                setSearchParams(searchParams)
                handleClose()
            }
            else{
                alert('erreur pendant la copie')
            }
        }
    }
    function handleClose(){
        props.setModalOpen(false)
        setErSelect(null)
    }
    return (
        <Modal
            open={props.modalOpen}
            onClose={handleClose}
        >
            <Box
                sx={{
                   width: 500, // was 100px — likely too narrow
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    bgcolor: "background.paper",
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <RegSetSearchComponent
                    setRegSet={setSearchRes}
                />
                <Table
                    stickyHeader
                >
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                Ens. reg
                            </TableCell>
                            <TableCell>
                                Date début
                            </TableCell>
                            <TableCell>
                                Date fin
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {searchResults.map((rs)=><TableRow
                            onClick={()=>handleRegSetSelect(rs.id_er)}
                            key={rs.id_er}
                        >
                            <TableCell>
                                {rs.description_er}
                            </TableCell>
                            <TableCell>
                                {rs.date_debut_er===null?'Perp':rs.date_debut_er}
                            </TableCell>
                            <TableCell>
                                {rs.date_fin_er===null?'En vig':rs.date_fin_er}
                            </TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
                {erSelect!==null?
                <Button
                    variant='outlined'
                    color='primary'
                    onClick={handleRegSetCopy}
                >
                    Copier l'ens reg. {`${erSelect}`}
                </Button>:<></>}
            </Box>
        </Modal>
    )
}