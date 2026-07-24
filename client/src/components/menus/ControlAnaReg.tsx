import { FC, useState, useEffect, SetStateAction, Dispatch } from 'react'
import { serviceEnsemblesReglements } from '../../services';
import { ControlAnaRegProps } from '../../types/InterfaceTypes';
import { entete_ensembles_reglement_stationnement, ProprietesRequetesER } from '../../types/DataTypes';
import {
    Modal,
    Box,
    Button,
    Autocomplete,
    TextField,
    Select, 
    MenuItem, 
    InputLabel, 
    FormControl
} from '@mui/material';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { serviceEnsRegTerr } from '../../services/serviceEnsRegTerr';
const ControlAnaReg: FC<ControlAnaRegProps> = (props: ControlAnaRegProps) => {
    const [tousEnsReg, defTousEnsRegs] = useState<entete_ensembles_reglement_stationnement[]>([])
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [mapModalOpen, setMapModalOpen] = useState<boolean>(false);
    const [dateModalOpen,setDateModalOpen] = useState<boolean>(false);
    const [selectedLocation, setSelectedLocation] = useState<L.LatLngExpression | null>(null);
    const [selectedDate,setSelectedDate] = useState<number|null>(null);
    const [mapZoom, setMapZoom] = useState<number>(13);
    const [mapCenter, setMapCenter] = useState<L.LatLngExpression>([46.8139, -71.2082]);
    const [regSetOptionsForLocale,defRegSetOptionsForLocale] = useState<entete_ensembles_reglement_stationnement[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const reponseEnsReg = await serviceEnsemblesReglements.chercheTousEntetesEnsemblesReglements()
            defTousEnsRegs(reponseEnsReg.data)
        }
        fetchData()
    }, [])
    const ensRegColorMap = Object.fromEntries(
        props.ensRegSelectionnesHaut.map((id_er, idx) => [id_er, props.colorPalette[idx % props.colorPalette.length]])
    );

    const handleChange = (ngraphiques: number) => {
        props.defNGraphiques(ngraphiques);
    };



    const gestObtentionERCarto = async () => {
        if (Array.isArray(selectedLocation) && selectedLocation.length === 2 &&selectedLocation !== null) {
            const [lat, lng] = selectedLocation;
            const reponse = await serviceEnsRegTerr.obtiensEnsRegEtAssocParLatLong(lat, lng);
            const idER = Array.from(new Set(reponse.data.map((item) => item.id_er)));
            props.defEnsRegSelectionnesHaut(idER)
            setMapModalOpen(false)
        } else {
            // Handle case where selectedLocation is not a tuple
            console.error('selectedLocation is not a valid LatLng tuple:', selectedLocation);
        }

    }

    const gestObtentionERDate = async()=>{
        let params:ProprietesRequetesER;
        if (selectedDate !== null){
            params={
                dateDebutAvant: selectedDate,
                dateFinApres: selectedDate
        }}else{
             params={
                dateFinApres: selectedDate
        }}
        const reponse = await serviceEnsemblesReglements.chercheEntetesParPropriete(params)
        const idER = Array.from(new Set(reponse.data.map((item) => item.id_er)));
        props.defEnsRegSelectionnesHaut(idER)
        setDateModalOpen(false)
    }

    return (<div className="control-comp-reg">
        <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
            <InputLabel id="select-n-charts-label"
                sx={{
                    color: 'white',
                    '&.Mui-focused': { color: 'white' },
                    '&.MuiInputLabel-shrink': { color: 'white' },
                }}
            >
                N graphes
            </InputLabel>
            <Select
                labelId="select-n-charts-label"
                id="select-n-charts"
                value={props.nGraphiques}
                onChange={(e) => handleChange(Number(e.target.value))}
                label="N Graphes"
                sx={{
                    backgroundColor: 'black',
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
                {[2, 4, 6, 8, 10].map((val) => (
                    <MenuItem
                        key={val}
                        value={val}
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
                        {val}
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
                Choisir les ensembles de règlements ({props.ensRegSelectionnesHaut.length} sélectionnés)
            </Button>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 500,
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
                        value={props.ensRegSelectionnesHaut}
                        onChange={(_, newValue) => props.defEnsRegSelectionnesHaut(newValue)}
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

            <Button variant="outlined"
                sx={{
                    ml: 2,
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                        backgroundColor: '#222',
                        borderColor: 'white',
                    },
                }}
                onClick={() => setMapModalOpen(true)}
            >
                Choisir les Ens. Règ par localisation
            </Button>
            <Modal open={mapModalOpen} onClose={() => setMapModalOpen(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 500,
                        bgcolor: 'black',
                        color: 'white',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                    }}
                >
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        style={{ height: '400px', width: '400px' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <MapComponent 
                            selectedLocation={selectedLocation}
                            setSelectedLocation={setSelectedLocation}
                        />
                        {selectedLocation ? (
                            <Marker
                                position={selectedLocation}
                                icon={L.icon({
                                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                                    iconSize: [25, 41],
                                    iconAnchor: [12, 41],
                                    popupAnchor: [1, -34],
                                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                                    shadowSize: [41, 41],
                                })}
                            />
                        ) : null}
                    </MapContainer>
                    {selectedLocation?
                    <Button 
                        variant="outlined"
                        sx={{
                            ml: 2,
                            color: 'white',
                            borderColor: 'white',
                            '&:hover': {
                                backgroundColor: '#222',
                                borderColor: 'white',
                            },
                        }}
                        onClick={gestObtentionERCarto}> 
                        Obtenir Ensembles règlements pour localisation
                    </Button>
                    :<>
                    </>}
                </Box>
            </Modal>
            <Button variant="outlined"
                sx={{
                    ml: 2,
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                        backgroundColor: '#222',
                        borderColor: 'white',
                    },
                }}
                onClick={() => setDateModalOpen(true)}
            >
                Choisir les Ens. Règ par date
            </Button>
            <Modal open={dateModalOpen} onClose={() => setDateModalOpen(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 500,
                        bgcolor: 'black',
                        color: 'white',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                    }}
                >
                    {selectedDate!==null?(<>
                    <TextField
                        onChange={(e)=>setSelectedDate(Number(e.target.value))}
                        value={selectedDate}
                        type='number'
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
                        <label htmlFor='en-vigueur'>En Vigueur</label>
                        <input 
                            id='en-vigueur'
                            type='checkbox'
                            checked={selectedDate===null}
                            onClick={()=>setSelectedDate(null)}></input>
                    </>
                    ):(
                        <>
                        <label htmlFor='en-vigueur'>En Vigueur</label>
                        <input 
                            id='en-vigueur'
                            type='checkbox'
                            checked={selectedDate===null}
                            onClick={()=>setSelectedDate(2024)}></input></>
                    )
                    }
                    <Button variant="outlined"
                        sx={{
                            ml: 2,
                            color: 'white',
                            borderColor: 'white',
                            '&:hover': {
                                backgroundColor: '#222',
                                borderColor: 'white',
                            },
                        }}
                        onClick={gestObtentionERDate}
                        >
                            Obtenir Ensembles Règlements
                    </Button>
                </Box>
            </Modal>
        </>
    </div>)
}

function MapComponent({ 
    selectedLocation,
    setSelectedLocation
}: { 
    selectedLocation: L.LatLngExpression | null,
    setSelectedLocation: Dispatch<SetStateAction< L.LatLngExpression | null>>
}) {
    const map = useMap(); // Access the map instance

    useEffect(() => {
        if (selectedLocation !== null) {
            map.setView(selectedLocation, map.getZoom());
        }

        // Add click handler to set selected location
        const handleClick = (e: L.LeafletMouseEvent) => {
            setSelectedLocation([e.latlng.lat, e.latlng.lng]);
        };
        map.on('click', handleClick);
        if (selectedLocation) {
            // Add marker at the selected location
            // But since MapComponent is not responsible for rendering, marker should be rendered in MapContainer
        }
        // Cleanup on unmount
        return () => {
            map.off('click', handleClick);
        };
    }, [map]); // Dependency on props.geoJsondata and map

    return null; // No need to render anything for the map component itself
};

export default ControlAnaReg