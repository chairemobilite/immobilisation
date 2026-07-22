import { Box, Button, Dialog, FormControl, InputLabel, MenuItem, Modal, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, useMediaQuery, useTheme } from "@mui/material"
import { PropsModalRecomputeInventaire } from "../../types/InterfaceTypes"
import { useEffect, useState } from "react";
import { Save } from "@mui/icons-material";
import { informations_reglementaire_manuelle, InputValues, inventaire_stationnement, methodeCalcul, requete_calcul_manuel_reg } from "../../types/DataTypes";
import { serviceEnsemblesReglements, serviceInventaire } from "../../services";
import obtRegManuel from "../../utils/obtRegManuel";
import TableauInventaireUnique from "../tables/TableauInventaireUnique";
import TableauApprobationInventaire from "../tables/TableauApprobationInventaire";
import { ClimbingBoxLoader } from "react-spinners";


const ModalRecomputeInventaire: React.FC<PropsModalRecomputeInventaire> = (props: PropsModalRecomputeInventaire) => {
    const [methodeCalculSelect, defMethodeCalculSelect] = useState<number>(2)
    const inventaireVide: inventaire_stationnement = {
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

     const methodesCalcul:methodeCalcul[]=[{methode_estime:1,description:'Entrée manuelle'},
        {
            methode_estime:2,
            description:'Calcul réglementaire automatique'
        },
        {methode_estime:3,description:'Calcul réglementaire valeurs manuelles'}]

    const [ancienInventaire, defAncienInventaire] = useState<inventaire_stationnement>(inventaireVide);
    const [nouvelInventaire, defNouvelInventaire] = useState<inventaire_stationnement>(inventaireVide);
    const [faireComparaison, defFaireComparaison] = useState<boolean>(false);
    const [entreeManuelleRequise, defEntreeManuelleRequise] = useState<boolean>(false)
    const [calculEnCours, defCalculEnCours] = useState<boolean>(false)
    const [entreesInventaireSemiManuel, defEntreesInventaireSemiManuel] = useState<informations_reglementaire_manuelle[]>([]);
    const [entreesDonneesPourCalcul,defEntreesDonneesPourCalcul] = useState<InputValues>({});
    const [nombrePlaces, defNombrePlaces] = useState<number>(0);
    const [commentaire, defCommentaire] = useState<string>("");
    useEffect(() => {
        const fetchData = async () => {
            if (props.modalOuvert == true) {
                try {
                    if (props.lotPert) {defAncienInventaire(
                        props.inventairePert.find(
                            (row)=>row.methode_estime===methodeCalculSelect&&row.g_no_lot===props.lotPert?.features[0].properties.g_no_lot)??inventaireVide);
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    //props.defCharge(false);
                }
            }
        };

        fetchData();
    }, [props.modalOuvert]);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const gestFermetureModal = () => {
        props.defModalOuvert(false)
    }
    const gestRelancerCalculLot = async () => {
        if (props.lotPert){
        switch (methodeCalculSelect) {
            case 1:
                console.log('Non implémenté')
                break;
            case 2:
                defCalculEnCours(true)
                try {
                    const nouveauInventaire = await serviceInventaire.recalculeLotSpecifique(props.lotPert.features[0].properties.g_no_lot);
                    defNouvelInventaire(nouveauInventaire.data[0])
                    defFaireComparaison(true)
                } catch (error) {
                    console.error('Erreur recalcul lot:', error)
                } finally {
                    defCalculEnCours(false)
                }
                break;
            case 3:
                defCalculEnCours(true)
                const donneesARemplir = await obtRegManuel(props.lotPert.features[0].properties.g_no_lot)
                defEntreesInventaireSemiManuel(donneesARemplir)
                defCalculEnCours(false)
                break;
            default:
                console.log('Cas inconnu')
                break;
        }}
    }

    const gestLancementCalculRegEntManuelle=async()=>{
            const matchCalcul: requete_calcul_manuel_reg[] = entreesInventaireSemiManuel.map((item) => {
                const key:string = `${item.cubf}-${item.unite}-${item.id_reg_stat}-${item.id_er}`;
                return {
                    g_no_lot:props.lotPert?.features[0].properties.g_no_lot??"",
                    cubf: item.cubf,
                    id_reg_stat: item.id_reg_stat,
                    id_er:item.id_er,
                    unite: item.unite,
                    valeur: entreesDonneesPourCalcul[key]?.valeur || 0, // Use the input value or default to 0
                };
            });
            console.log(`Processing following lot:\n ${matchCalcul.map((item)=>`${item.cubf.toString()} - ${item.id_reg_stat} - ${item.unite} : ${item.valeur}\n`)}`)
            
            const inventaire = await serviceInventaire.calculeInventaireValeursManuelles(matchCalcul)
            if (inventaire.success){
                defNouvelInventaire(inventaire.data[0])
                defFaireComparaison(true)
            }
            console.log('recu un inventaire')
        }
    const handleInputChange = (cubf: number, unite: number, id_reg_stat: number, id_er:number,value: string) => {
        const key = `${cubf}-${unite}-${id_reg_stat}-${id_er}`;
        defEntreesDonneesPourCalcul((prevValues) => ({
            ...prevValues,
            [key]: {
                valeur: Number(value)
            }
        }));
        console.log(entreesDonneesPourCalcul)
    };
    const gestChangementMethodeCalcul = (idMethode:number)=>{
        if (props.lotPert){
        defMethodeCalculSelect(Number(idMethode))
        const ancienInventairePot = props.inventairePert.find((row)=>row.methode_estime===Number(idMethode)&&row.g_no_lot===props.lotPert?.features[0].properties.g_no_lot)??{...inventaireVide,g_no_lot:props.lotPert.features[0].properties.g_no_lot,methode_estime:Number(idMethode)}
        defAncienInventaire(ancienInventairePot)}
    }
    const gestObtentionReglements=async()=>{
        if (props.lotPert){
            defCalculEnCours(true)
            const donnees = await obtRegManuel(props.lotPert.features[0].properties.g_no_lot)
            defEntreesInventaireSemiManuel(donnees)
            defEntreeManuelleRequise(true)
            defCalculEnCours(false)
        }
    }
    const gestEntreeComptageManuel=()=>{
        defNouvelInventaire({...ancienInventaire,n_places_mesure:nombrePlaces,commentaire:commentaire})
        defFaireComparaison(true)
        defEntreeManuelleRequise(false)
    }
    const renduLandingChangementOptionCalcul = () => {
        switch (methodeCalculSelect) {
            case 1:
                return (<>
                    <FormControl>
                        <Stack spacing={2}>
                            <TextField
                                value={nombrePlaces}
                                label='Nombre de places'
                                onChange={(e) => defNombrePlaces(Number(e.target.value))}
                                sx={{
                                    input: { color: "white" },
                                    label: { color: "white" },
                                    "& .MuiOutlinedInput-root": {
                                        "& fieldset": { borderColor: "white" },
                                        "&:hover fieldset": { borderColor: "lightgray" },
                                        "&.Mui-focused fieldset": { borderColor: "white" },
                                    },
                                }}
                            />
                            <TextField
                                value={commentaire}
                                label='Commentaire'
                                onChange={(e) => defCommentaire(e.target.value)}
                                sx={{
                                    input: { color: "white" },
                                    label: { color: "white" },
                                    "& .MuiOutlinedInput-root": {
                                        "& fieldset": { borderColor: "white" },
                                        "&:hover fieldset": { borderColor: "lightgray" },
                                        "&.Mui-focused fieldset": { borderColor: "white" },
                                    },
                                }}
                            />
                            <Button
                                variant="outlined"
                                onClick={gestEntreeComptageManuel}
                            >
                                Comparer à l'ancien estimé
                            </Button>
                        </Stack>

                    </FormControl>
                </>)

            case 2:
                return (<>
                    <FormControl>
                        <Button variant="outlined" onClick={gestRelancerCalculLot}>
                            Lancer le calcul
                        </Button>
                    </FormControl>
                </>)
            case 3:
                return (<>
                    <FormControl>
                        <Button variant="outlined" onClick={gestObtentionReglements}>Obtenir Règlements lot</Button>
                    </FormControl>
                </>)
            default:
                return (<></>)
        }
    }
    const renduEntreeManuelle = () => {
        switch (methodeCalculSelect) {
            case 1:
                return (<>
                    <FormControl>
                        <TextField label='Nombre de places' />
                        <Save />
                    </FormControl>
                </>)

            case 2:
                return (<>
                </>)
            case 3:
                return (<>
                    <TableContainer component={Paper} sx={{ maxHeight: '30vh' }}>
                        <Table sx={{ minWidth: 200 }} aria-label="simple table">
                            <TableHead sx={{ position: 'sticky', top: 0, background: 'white' }}>
                                <TableRow>
                                    <TableCell>Item</TableCell>
                                    <TableCell align="center">Valeur</TableCell>
                                    <TableCell align="center">Option</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody sx={{ overflowY: 'auto' }}>
                                {entreesInventaireSemiManuel.map((entree)=>{
                                    const key = `${entree.cubf}-${entree.unite}-${entree.id_reg_stat}-${entree.id_er}`; 
                                    return(
                                    <TableRow key={key}>
                                        <TableCell>{entree.description_cubf}</TableCell>
                                        <TableCell>
                                            <TextField 
                                                value={entreesDonneesPourCalcul[key]?.valeur != null ? entreesDonneesPourCalcul[key]?.valeur.toString() : ''}
                                                onChange={(e) => handleInputChange(
                                                    entree.cubf,
                                                    entree.unite,
                                                    entree.id_reg_stat,
                                                    entree.id_er, 
                                                    e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>{entree.desc_unite}</TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Button 
                        variant="outlined"
                        onClick={gestLancementCalculRegEntManuelle}
                    >
                        Lancer le calcul
                    </Button>
                </>)
            default:
                return (<></>)
        }
    }
    const sxBox = {
                    overflowX: 'hidden',
                    overflowY:calculEnCours===true?'hidden': 'auto',
                    bgcolor: '#1f1f1f',
                    color: 'white',
                    paddingTop: '20px',
                    padding: '10px',
                    display: 'grid',
                    gap: '10px',
                    width:'420px'
                }

    return (<>
        <Dialog
            fullScreen={fullScreen}
            open={props.modalOuvert}
            onClose={gestFermetureModal}
            sx={{ width: '80vw' }}
            scroll={'paper'}
        >
            <Box
                sx={sxBox}
            >   {calculEnCours === false ? (<>
                <FormControl sx={{ paddingTop: '10px' }}>
                    <InputLabel id='methode-calcul' sx={{
                        color: "#cccccc",
                        paddingBottom: '10px',
                        "&.Mui-disabled": { color: "#cccccc", WebkitTextFillColor: "#cccccc" },
                    }}>
                        Méthode de calcul
                    </InputLabel>
                    <Select sx={{
                        borderColor: 'white',
                        "& .MuiSelect-select": { color: "white", backgroundColor: "#1f1f1f" },
                        "& .MuiSelect-select.Mui-disabled": {
                            color: "#cccccc",
                            WebkitTextFillColor: "#cccccc",
                            opacity: 1,
                        },
                        "& .MuiInput-underline:before": { borderBottomColor: "white" },
                        "& .MuiInput-underline:hover:before": { borderBottomColor: "#ffcc00" },
                    }} value={methodeCalculSelect} onChange={(e) => gestChangementMethodeCalcul(e.target.value)} labelId='methode-calcul'>
                        {props.methodesCalculs.map((item) =>{
                            const methodeProp:methodeCalcul|undefined = methodesCalcul.find((meth)=>meth.methode_estime===item)
                            if (methodeProp!==undefined){
                                return <MenuItem 
                                            value={methodeProp.methode_estime} 
                                            key={methodeProp.methode_estime}
                                        >
                                        {methodeProp.description}
                                    </MenuItem>
                            }else{
                                return(
                                    <></>
                                
                            )}
                            
                        }
                            
                        )}
                    </Select>
                </FormControl>
                {faireComparaison === false ? (
                    entreeManuelleRequise === false ?
                        renduLandingChangementOptionCalcul()
                        :
                        renduEntreeManuelle()
                ) : (
                    <>
                        <TableauApprobationInventaire
                            ancien={ancienInventaire}
                            nouveau={nouvelInventaire}
                            defFaireComparaison={defFaireComparaison}
                            defAncienInventaire={defAncienInventaire}
                            defNouvelInventaire={defNouvelInventaire}
                            defInventairePert={props.defInventairePert}
                        />
                    </>)}
            </>) : (<div style={{textAlign:'center',flex:1}}>
                <ClimbingBoxLoader
                        loading={calculEnCours}
                        size={10}
                        color="#fff"
                        aria-label="Calculs en Cours - Prends ton mal en patience"
                        data-testid="loader"
                    />
            </div>
            )}


            </Box>
        </Dialog>
    </>)
}

export default ModalRecomputeInventaire