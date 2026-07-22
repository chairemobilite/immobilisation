import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import { FC, useEffect, useState } from "react"
import { operation_reglement_stationnement } from "../../types/DataTypes";
import { serviceReglements } from "../../services";


const PanneauCreationOperateurs:FC=()=>{
    const [operateurs,defOperateurs] = useState<operation_reglement_stationnement[]>([]);
    const fetchData = async()=>{
            const res  = await serviceReglements.obtiensOperationsPossibles()
            defOperateurs(res.data)
        }
        
    useEffect(()=>{
        
        fetchData()
    },[])
    const handleRedef = async()=>{
        const out = await serviceReglements.creeOperationsParDefaut()
        if (out.success === true){
            fetchData()
            alert(`Création ${out.data} opérations`)
        }else{
            alert(`Erreur serveur`)
        }
    }

    return(<div className="panneau-creat-operateurs">
        <div className='bouton-creat-oper'>
        <Button 
            variant='outlined'
            sx={{backgroundColor:'red',color:'black'}}
                        onClick={()=>handleRedef()}
        >
            Re définis les opérateurs automatiquement
        </Button>
        </div>
        <div className='table-vis-operateurs'>
            <TableContainer
                component={Paper} 
                sx={{
                        maxHeight: '100%',
                        overflowY: 'auto',
                        overflowX: 'auto'
                    }}
            >
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                Identifiant opérateur
                            </TableCell>
                            <TableCell> 
                                Description opérateur
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {operateurs.map((item)=>{return(
                            <TableRow
                                key={item.id_operation}
                            >
                                <TableCell>
                                    {item.id_operation}
                                </TableCell>
                                <TableCell>
                                    {item.desc_operation}
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    </div>)
}

export default  PanneauCreationOperateurs