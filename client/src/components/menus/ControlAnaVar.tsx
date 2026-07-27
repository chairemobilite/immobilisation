import { FC, useState, useEffect } from 'react'
import { ControlAnaVarProps } from '../../types/InterfaceTypes';
import { entete_ensembles_reglement_stationnement } from '../../types/DataTypes';
import {
    Modal,
    Box,
    Button,
    Autocomplete,
    TextField,
    Select, 
    MenuItem, 
    InputLabel, 
    FormControl,
    Checkbox,
    FormGroup,
    FormControlLabel
} from '@mui/material';
import { serviceEnsemblesReglements } from '../../services';
import { serviceAnaVariabilite } from '../../services/serviceAnaVariabilite';

const ControlAnaVar: FC<ControlAnaVarProps> = (props: ControlAnaVarProps) => {
    const [tousEnsReg, defTousEnsRegs] = useState<entete_ensembles_reglement_stationnement[]>([])
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const ensRegColorMap = Object.fromEntries(
        props.ensRegAAnalyser.map((id_er, idx) => [id_er, props.colorPalette[idx % props.colorPalette.length]])
    );

    useEffect(() => {
            const fetchData = async () => {
                const reponseEnsReg = await serviceEnsemblesReglements.chercheTousEntetesEnsemblesReglements()
                defTousEnsRegs(reponseEnsReg.data)
            }
            fetchData()
        }, [])
    const gestChangementMethode=(idMethode:number)=>{
        const nouvelleMethode = props.methodessAnalysesPossibles.find((item)=>item.idMethodeAnalyse===idMethode)??{idMethodeAnalyse:0,descriptionMethodeAnalyse:'Entrées Manuelles'}
            props.defMethodeAnalyse(nouvelleMethode)
    }
    const gestChangementVisu = (idVisu:number)=>{
        const nouvelleMethode = props.methodeVisualisationPossibles.find((item)=>item.idMethodeAnalyse===idVisu)??{idMethodeAnalyse:0,descriptionMethodeAnalyse:'Barres'}
        props.defMethodeVisualisation(nouvelleMethode)
    }
    const gestSelectionTousEnsReg =()=>{
        const listeEnsReg = Array.from(new Set(tousEnsReg.map((entree) => entree.id_er)))
        props.defEnsRegAAnalyser(listeEnsReg)
    }

    const gestLancementCalculsVariabilite =async()=>{
        props.defCalculsEnCours(true)
        try {
            await serviceAnaVariabilite.recalculeInventairesFonciersAvecTousEnsRegs()
        } catch(err:any){
            alert('erreur lors de du calcul de l\'analyse de variabilité')
        }finally {
            props.defCalculsEnCours(false)
        }
    }

    return (<div className="control-comp-reg">
        <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
            <InputLabel id="select-ana-var-method-label"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                Methode d'analyse
            </InputLabel>
            <Select
                labelId="select-ana-var-method-label"
                id="select-ana-var-method"
                value={props.methodeAnalyse.idMethodeAnalyse}
                onChange={(e) => gestChangementMethode(Number(e.target.value))}
                label="Methode analyse"
                sx={{
                    backgroundColor: 'black',
                    minWidth: '120px',
                    color: 'white',
                    '& .MuiSvgIcon-root': { color: 'white' }, // arrow
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#aaa' },
                    
                }}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            bgcolor: 'black',
                            color: 'white',
                        },
                    },
                }}
            >
                {props.methodessAnalysesPossibles.map((val) => (
                    <MenuItem
                        key={val.idMethodeAnalyse}
                        value={val.idMethodeAnalyse}
                        sx={{
                            backgroundColor: 'black',
                            color: 'white',
                            '&.Mui-selected': {
                                backgroundColor: '#222',
                                color: 'white',
                            },
                            '&.Mui-selected:hover': {
                                backgroundColor: '#333',
                            },
                        }}
                    >
                        {val.descriptionMethodeAnalyse}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
        <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
            <InputLabel id="select-ana-var-method-label"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                Methode Visualisation
            </InputLabel>
            <Select
                labelId="select-ana-var-visu-label"
                id="select-ana-var-visu"
                value={props.methodeVisualisation.idMethodeAnalyse}
                onChange={(e) => gestChangementVisu(Number(e.target.value))}
                label="Methode analyse"
                sx={{
                    backgroundColor: 'black',
                    minWidth: '120px',
                    color: 'white',
                    '& .MuiSvgIcon-root': { color: 'white' }, // arrow
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#aaa' },
                    
                }}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            bgcolor: 'black',
                            color: 'white',
                        },
                    },
                }}
            >
                {props.methodeVisualisationPossibles.map((val) => (
                    <MenuItem
                        key={val.idMethodeAnalyse}
                        value={val.idMethodeAnalyse}
                        sx={{
                            backgroundColor: 'black',
                            color: 'white',
                            '&.Mui-selected': {
                                backgroundColor: '#222',
                                color: 'white',
                            },
                            '&.Mui-selected:hover': {
                                backgroundColor: '#333',
                            },
                        }}
                    >
                        {val.descriptionMethodeAnalyse}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>

        <>
            <Button onClick={() => setModalOpen(true)} variant="outlined" sx={{
                ml: 2,
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                    backgroundColor: '#222',
                    borderColor: 'white',
                },
            }}>
                Choisir les ensembles de règlements ({props.ensRegAAnalyser.length} sélectionnés)
            </Button>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 500,
                        maxHeight: '80vh',        // Limit the modal height to 80% of viewport
                        overflowY: 'auto',        // Enable vertical scrolling
                        bgcolor: 'black',
                        color: 'white',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                    }}
                >
                    <Autocomplete
                        multiple
                        options={tousEnsReg.map((o) => o.id_er)}
                        getOptionLabel={(ensReg) =>
                            `${tousEnsReg.find((o) => o.id_er === ensReg)?.description_er ?? ''}`
                        }
                        value={props.ensRegAAnalyser}
                        onChange={(_, newValue) => props.defEnsRegAAnalyser(newValue)}
                        renderTags={(value, getTagProps) =>
                            value.map((optionIci, index) => (
                                <Box
                                    component="div"
                                    sx={{
                                        backgroundColor: ensRegColorMap[optionIci] || '#333',
                                        color: 'white',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.875rem',
                                        mr: 0.5,
                                    }}
                                    {...getTagProps({ index })}
                                >
                                    {tousEnsReg.find((o) => o.id_er === optionIci)?.description_er}
                                </Box>
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Sélectionner des règlements"
                                placeholder="Rechercher..."
                                sx={{
                                    input: { color: 'white' },
                                    label: { color: 'white' },
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: '#888',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#aaa',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#ccc',
                                        },
                                    },
                                }}
                            />
                        )}
                    />
                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                        <Button
                            sx={{
                                ml: 2,
                                color: 'white',
                                borderColor: 'white',
                                '&:hover': {
                                    backgroundColor: '#222',
                                    borderColor: 'white',
                                },
                            }}
                            onClick={gestSelectionTousEnsReg}>Sélectionner tous</Button>
                        <Button onClick={() => setModalOpen(false)}
                            sx={{
                                ml: 2,
                                color: 'white',
                                borderColor: 'white',
                                '&:hover': {
                                    backgroundColor: '#222',
                                    borderColor: 'white',
                                },
                            }}>
                            Fermer
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
        <>
            <Button onClick={() => gestLancementCalculsVariabilite()} variant="outlined" sx={{
                ml: 2,
                color: 'red',
                borderColor: 'white',
                '&:hover': {
                    backgroundColor: '#222',
                    borderColor: 'red',
                },
            }}>
                Lancer calculs d'inventaire avec tous les ensembles (très long)
            </Button>
        </>
        <>  {props.methodeVisualisation.idMethodeAnalyse===0?
            <Box
                sx={{
                    border: "1px solid",
                    borderColor: "white", // uses theme divider color
                    borderRadius: 1,
                    padding: '1px',
                    display: "inline-block", // makes it shrink to fit
                    cursor: "pointer",
                    "&:hover": {
                    backgroundColor: "action.hover",
                    },
                }}
                >
                
                <FormGroup>
                    <FormControlLabel control={<Checkbox  checked={props.voirInv} onChange={()=>props.defVoirInv(!props.voirInv)}/>} label="Voir Inventaire calculé"/>
                </FormGroup>
                
                
            </Box>:<></>}
        </>
        
        {/*<h2 style={{ color: "white" }}>Analyse de Variabilité</h2>*/}
    </div>)
}

export default ControlAnaVar