import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { inventaire_stationnement } from "../../types/DataTypes";
import { SetStateAction } from "react";
import { serviceInventaire } from "../../services";


const TableauApprobationInventaire: React.FC<{
    ancien: inventaire_stationnement,
    nouveau: inventaire_stationnement,
    defFaireComparaison: React.Dispatch<SetStateAction<boolean>>
    defInventairePert: React.Dispatch<SetStateAction<inventaire_stationnement[]>>
    defAncienInventaire: React.Dispatch<SetStateAction<inventaire_stationnement>>
    defNouvelInventaire: React.Dispatch<SetStateAction<inventaire_stationnement>>
}> = (
    props: {
        ancien: inventaire_stationnement,
        nouveau: inventaire_stationnement,
        defFaireComparaison: React.Dispatch<SetStateAction<boolean>>
        defInventairePert: React.Dispatch<SetStateAction<inventaire_stationnement[]>>
        defAncienInventaire: React.Dispatch<SetStateAction<inventaire_stationnement>>
        defNouvelInventaire: React.Dispatch<SetStateAction<inventaire_stationnement>>
    }
) => {
        const inventaireVide:inventaire_stationnement = {
            id_inv: -1,
            g_no_lot: '',
            n_places_min: 0,
            n_places_max: 0,
            n_places_estime: 0,
            n_places_mesure: 0,
            methode_estime: 2,
            cubf: '',
            id_er: '',
            id_reg_stat: '',
            commentaire: ''
        }
        const gestAnnulation=()=>{
            props.defNouvelInventaire(inventaireVide)
            props.defFaireComparaison(false)
        }
        const gestSauvegardeOption=async()=>{
            if (props.ancien.id_inv!==-1){
                const reponse = await serviceInventaire.modifieInventaire(props.ancien.id_inv,props.nouveau)
                props.defInventairePert(prev =>
                    prev.map(item =>
                        item.methode_estime === reponse.data.methode_estime
                            ? { ...item, ...reponse.data } // overwrite with new values
                            : item
                    )
                )
                props.defAncienInventaire(inventaireVide)
                props.defNouvelInventaire(inventaireVide)
                props.defFaireComparaison(false)
            } else{
                const reponse = await serviceInventaire.nouvelInventaire(props.nouveau)
                props.defInventairePert(prev=>[...prev, {...reponse.data}])
                props.defAncienInventaire(inventaireVide)
                props.defNouvelInventaire(inventaireVide)
                props.defFaireComparaison(false)
            }
            
        }
        return (<>
            <div className='table-compar'>
                <TableContainer component={Paper} sx={{ maxHeight: '30vh' }}>
                <Table>
                    <TableHead sx={{ position: 'sticky', top: 0, background: 'white' }}>
                        <TableRow>
                            <TableCell>
                                Valeur
                            </TableCell>
                            <TableCell>
                                Ancien
                            </TableCell>
                            <TableCell>
                                Nouveau
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {['n_places_min', 'n_places_max', 'n_places_estime', 'n_places_mesure', 'cubf', 'id_reg_stat', 'id_er', 'commentaire', 'id_inv'].map((item) =>
                            <TableRow
                                key={item}
                            >
                                <TableCell>
                                    {item.replace(/_/g, " ").toUpperCase()}
                                </TableCell>
                                <TableCell>
                                    {(item==='n_places_min'&&props.ancien[item as keyof inventaire_stationnement]!==null)||(item==='n_places_max'&&props.ancien[item as keyof inventaire_stationnement]!==null)?Number(props.ancien[item as keyof inventaire_stationnement]).toFixed(2):props.ancien[item as keyof inventaire_stationnement]}
                                </TableCell>
                                <TableCell>
                                    {(item==='n_places_min'&&props.nouveau[item as keyof inventaire_stationnement]!==null )||(item==='n_places_max'&& props.nouveau[item as keyof inventaire_stationnement]!==null)?Number(props.nouveau[item as keyof inventaire_stationnement]).toFixed(2):props.nouveau[item as keyof inventaire_stationnement]}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </TableContainer>
            </div>
            <div className='boutons-gestion' style={{width: 300,display:'flex',flexDirection:'row',textAlign:'center'}}>
                <Button variant="outlined" onClick={gestAnnulation} sx={{width:'50%',backgroundColor:'red',outlineColor:'white',color:'white'}}>Annuler</Button>
                <Button 
                    variant='outlined' 
                    sx={{width:'50%',backgroundColor:'green',outlineColor:'white',color:'white',flex:1}}
                    onClick={gestSauvegardeOption}
                >
                    Sauvegarder
                </Button>
            </div>

        </>)
    }

export default TableauApprobationInventaire