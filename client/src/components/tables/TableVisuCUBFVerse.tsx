import { Dispatch, FC, SetStateAction, useEffect, useState } from "react"
import { utilisation_sol } from "../../types/DataTypes"
import serviceUtilisationDuSol from "../../services/serviceUtilisationDuSol"
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"

interface propsTableVisuCUBF{
    modalOuvert:boolean,
    utilSol:utilisation_sol[]
    defUtilSol:Dispatch<SetStateAction<utilisation_sol[]>>
    defUtilSolN1:Dispatch<SetStateAction<utilisation_sol[]>>
}


const TableVisuCUBF:FC<propsTableVisuCUBF>=(props:propsTableVisuCUBF)=>{
    


    useEffect(()=>{
        const fetchData = async ()=>{
            const data = await serviceUtilisationDuSol.obtientUtilisationDuSol(-1)
            props.defUtilSol(data.data)
        }
        fetchData()
    },[props.modalOuvert])
    return(<div className="table-cubf">
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
                            Code d'utilisation du bien fond
                        </TableCell>
                        <TableCell>
                            Description
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.utilSol.map((item)=>{return(
                        <TableRow
                            key={item.cubf}
                        >
                            <TableCell>
                                {item.cubf}
                            </TableCell>
                            <TableCell>
                                {item.description}
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </TableContainer>
    </div>)
}

export default TableVisuCUBF