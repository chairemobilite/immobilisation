import { Box, List, ListItemButton, ListItemText, ListSubheader } from "@mui/material";
import { PropsListeUnite } from "../../types/InterfaceTypes";
import { Add } from "@mui/icons-material";


const ListeUnitesPossibles : React.FC<PropsListeUnite> = (props:PropsListeUnite)=>{
    const handleListClick = async (idUnite: number) => {
        const nouvelleUnite = props.unites.find((unit)=>unit.id_unite === idUnite)
        if (typeof nouvelleUnite !== 'undefined'){
            props.defUniteSelect(nouvelleUnite)
        }
    }
    const ajouteNouvelleUniteEdition = ()=>{
        let old= props.unites;
        props.defAnciennesUnites(structuredClone(old))
        const newItem = {id_unite:-1,desc_unite:'Nouvelle unité',facteur_correction:1,abscisse_correction:0,colonne_role_foncier:props.colonnesPossibles[0].nom_colonne}
        old.push(newItem)
        props.defUniteSelect(newItem)
        props.defUnites(old)
        props.defEditionEnCours(true)   
    }
    return(<div className="liste-unites-possibles">
    <Box
            sx={{
                width: '100%',
                maxWidth: 200,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >

            <Box
                sx={{
                    bgcolor: '#1f1f1f',
                    color: 'white',
                    py: 1,
                    px: 2,
                }}
            >
                <ListSubheader
                    component="div"
                    sx={{ color: 'inherit', bgcolor: 'inherit', p: 0 }}
                >
                    Unités utilisées
                </ListSubheader>
            </Box>

            {/* ── Zone défilante ── */}
            <Box
                sx={{       // hauteur de la zone scrollable
                    overflowY: 'auto',    // ← active le scroll
                    bgcolor: '#1f1f1f',
                    flex: 1
                }}
            >
                <List
                    sx={{
                        width: '100%',
                        maxWidth: 200,
                        bgcolor: "#1f1f1f",
                        color: "white",
                        overflowY: 'auto'
                    }}
                    dense={true}
                    component="nav"
                    aria-labelledby="nested-list-subheader"
                >

                    {props.unites.map((item) => (
                        <ListItemButton onClick={() => handleListClick(item.id_unite)} selected={props.uniteSelect.id_unite===item.id_unite}>
                            <ListItemText
                                primary={item.desc_unite}
                                primaryTypographyProps={{
                                    sx: {
                                        color: "white",
                                        bgcolor:'inherit'
                                    }
                                }}
                            />
                        </ListItemButton>
                    ))}
                    <ListItemButton onClick={()=>ajouteNouvelleUniteEdition()}>
                        <Add/>Ajouter Item
                    </ListItemButton>
                </List>
            </Box>
        </Box>
    </div>)
}

export default ListeUnitesPossibles;