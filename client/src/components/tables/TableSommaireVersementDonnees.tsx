import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import{FC, useEffect, useState} from 'react'
import { serviceSommaireDonnees } from '../../services/serviceSommaireDonnees'
import { sommaireDonnee } from '../../types/DataTypes'

const TableSommaireVersementDonnees:FC=()=>{
    const [sommaireDonnees,defSommmaireDonnees] = useState<sommaireDonnee[]>([])
    useEffect(()=>{
        const fetchData = async()=>{
            const reponse = await serviceSommaireDonnees.obtiensSommaireDonnees()
            defSommmaireDonnees(reponse.data)
        }
        fetchData()
    },[])

    return(
        <div className="tableau-sommaire-donnees">
            <TableContainer component={Paper} sx={{
                    maxHeight: '100%',
                    overflowY: 'auto',
                    overflowX: 'auto'
                }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            Type de données
                        </TableCell>
                        <TableCell>
                            Table BD
                        </TableCell>
                        <TableCell>
                            Nombre d'entrées
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                        {sommaireDonnees.map((item)=>{
                                    return(
                                        <TableRow>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell>{item.table}</TableCell>
                                            <TableCell>{item.nombre_entrees}</TableCell>
                                        </TableRow>
                                    )
                                }
                            )
                        }
                </TableBody>
            </Table>
            </TableContainer>
        </div>
    )
}

export default TableSommaireVersementDonnees