import { FormControl, List, ListItem, ListItemButton, ListItemText, ListSubheader, Box } from "@mui/material"
import { PropsListeLotsValid } from "../../types/InterfaceTypes"
import { serviceCadastre, serviceInventaire } from "../../services"
import serviceValidation from "../../services/serviceValidation"
import { utiliserContexte } from "../../contexte/ContexteImmobilisation"
import { FeatureCollection, Geometry } from "geojson"
import { inventaire_stationnement, lotCadastralAvecBoolInvGeoJsonProperties, lotCadastralGeoJsonProperties } from "../../types/DataTypes"


const ListeLotsValidation: React.FC<PropsListeLotsValid> = (props: PropsListeLotsValid) => {
    const contexte = utiliserContexte();
    const optionCartoChoisie = contexte?.optionCartoChoisie ?? "";
    const changerCarto = contexte?.changerCarto ?? (() => { });
    const optionsCartos = contexte?.optionsCartos ?? [];

    const urlCarto = optionsCartos.find((entree) => entree.id === optionCartoChoisie)?.URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    const attributionCarto = optionsCartos.find((entree) => entree.id === optionCartoChoisie)?.attribution ?? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    const optCarto = optionsCartos.find((entree) => entree.id === optionCartoChoisie)?.description ?? "N/A"
    const inventaireVide:inventaire_stationnement[]=[{
        id_inv:-1,
        n_places_min:0,
        n_places_max:0,
        n_places_estime:0,
        n_places_mesure:0,
        cubf:'',
        id_er:'',
        id_reg_stat:'',
        commentaire:'',
        g_no_lot:'',
        methode_estime:2
    }]
    const handleListClick = async (lot: string) => {
        const [inventaire,validation,role] = await Promise.all(
            [
                serviceInventaire.obtiensInventaireQuery({ g_no_lot: lot}),
                serviceValidation.obtiensResultatValidation({ g_no_lot: lot, id_strate: props.feuilleSelect.id_strate }),
                serviceCadastre.chercheRoleAssocieParId(lot)
            ]
        )
    
        if (inventaire.data.length > 0) {
            props.defInventairePert(inventaire.data)
        } else{
            props.defInventairePert([{...(inventaireVide[0]),g_no_lot:lot}])
        }
        if (validation.data.length > 0) {
            props.defEntreeValid(validation.data[0])
        } else {
            console.log('creation Nouvelle entree valid')
            props.defEntreeValid({ id_strate: props.feuilleSelect.id_strate, fond_tuile: optCarto, g_no_lot: lot, n_places: 0 ,id_val:-1})
            props.defNewValid(true)
        }
        let add_bits:string[]=[];
        let new_add:string='';
        if(role.data.features.length>0){
            const num = role.data.features[0].properties.rl0101a;
            const type =role.data.features[0].properties.rl0101e;
            const rue =role.data.features[0].properties.rl0101g;
            if (num!==null){    
                add_bits.push(num)
            }
            if (type!==null){    
                if (type==='BO'){
                    add_bits.push('Blvd')
                }
                if (type==='RU'){
                    add_bits.push('Rue')
                }
                if (type==='AV'){
                    add_bits.push('Avenue')
                }
                if(type==='CH'){
                    add_bits.push('Chemin')
                }
            }
            if (rue!==null){    
                add_bits.push(rue)
            }
            new_add= add_bits.join(' ')
            props.defAdresse(new_add)
        } else{ props.defAdresse('')}
        const foundFeature = props.lots?.features.find((feature) => feature.properties.g_no_lot === lot);
        const lotSelect:FeatureCollection<Geometry,lotCadastralAvecBoolInvGeoJsonProperties> = {
            type: 'FeatureCollection',
            features: foundFeature ? [foundFeature] : [
                {
                    geometry: {
                        type: 'Point',
                        coordinates: [0, 0]
                    },
                    type: 'Feature',
                    properties: {
                        g_no_lot: '',
                        g_va_suprf: 0,
                        g_nb_coo_1: 0,
                        g_nb_coord: 0,
                        bool_inv:true
                    }
                }
            ]
        }
        props.defLotSelect(lotSelect)
    }
    return (<>
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
                    Items à valider
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

                    {props.lots?.features.map((item) => (
                        <ListItemButton onClick={() => handleListClick(item.properties.g_no_lot)} selected={props.lotSelect?.features[0].properties.g_no_lot=== item.properties.g_no_lot}>
                            <ListItemText
                                primary={item.properties.g_no_lot}
                                primaryTypographyProps={{
                                    sx: {
                                        color: "white",
                                        bgcolor:'inherit'
                                    }
                                }}
                            />
                        </ListItemButton>
                    ))}

                </List>
            </Box>
        </Box>
    </>)
}
export default ListeLotsValidation
