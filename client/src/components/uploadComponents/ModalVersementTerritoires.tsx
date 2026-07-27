import {Modal,Dialog,Box,Button} from '@mui/material'
import { PropsVersTerritoires } from '../../types/InterfaceTypes';
import React from 'react';
import { FeatureCollection,Geometry } from 'geojson';
import { quartiers_analyse, territoireGeoJsonProperties } from '../../types/DataTypes';


const modalVersementTerritoires:React.FC<PropsVersTerritoires> = (props:PropsVersTerritoires) => {
    const [file, setFile] = React.useState<File | null>(null);
    const [columns, setColumns] = React.useState<string[]>([]);
    const [nomVilleCol, setNomVilleCol] = React.useState('');
    const [nomSecteurCol, setNomSecteurCol] = React.useState(''); 
    const sxBox = {
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    bgcolor: '#1f1f1f',
                    color: 'white',
                    paddingTop: '20px',
                    padding: '10px',
                    display: 'grid',
                    gap: '10px',
                    width:'420px'
                }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        setFile(f);

        const reader = new FileReader();
        reader.onload = () => {
            try {
            const geojson = JSON.parse(reader.result as string);
            const firstFeature = geojson.features?.[0];
            if (firstFeature?.properties) {
                setColumns(Object.keys(firstFeature.properties));
            }
            } catch (err) {
            console.error('GeoJSON invalide', err);
            }
        };
        reader.readAsText(f);
    };

    const handleFileLoad = () => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const geojson = JSON.parse(reader.result as string);
                const geojson_out:FeatureCollection<Geometry,territoireGeoJsonProperties> = {
                    type: "FeatureCollection",
                    features:geojson.features.map((feature:any,idx:number)=>{
                        const properties_out:territoireGeoJsonProperties = {
                            ville: feature.properties[nomVilleCol],
                            secteur: feature.properties[nomSecteurCol],
                            id_periode: props.idPeriodeSelect,
                            id_periode_geo: -(idx+1) // ID négatif provisoire
                        };
                        
                        return {
                            type: "Feature",
                            geometry: feature.geometry,
                            properties: properties_out
                        }
                    })
                }
                props.setSecTerritoireNew(geojson_out);
                console.log('Fichier chargé et converti en format interne.')
                props.defNouvelleCartoDispo(true);
                props.setModalOuvert(false);
                setNomSecteurCol('');
                setNomVilleCol('');
                setFile(null);
                setColumns([]);
            } catch (err) {
                console.error('GeoJSON invalide', err);
            }
        };
        reader.readAsText(file);
    };
    return(
        <>
        <Dialog
            open={props.modalOuvert}
            onClose={() => props.setModalOuvert(false)}
        >
            <Box
                sx={sxBox}
            >
                <h4>Modal de versement des secteurs d'analyse</h4>
                <div className="form-group">
                    <label>Fichier GeoJSON</label>
                    <input
                        type="file"
                        accept=".geojson,.json"
                        onChange={handleFileChange}
                    />
                </div>

                    {columns.length > 0 && (
                    <>

                        <div className="form-group">
                            <label>Colonne pour ville</label>
                            <select
                                value={nomVilleCol}
                                onChange={(e) => setNomVilleCol(e.target.value)}
                            >
                                <option value="">-- sélectionner --</option>
                                {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" >
                            <label>Colonne pour secteur</label>
                            <select
                                value={nomSecteurCol}
                                onChange={(e) => setNomSecteurCol(e.target.value)}
                            >
                                <option value="">-- sélectionner --</option>
                                {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                    </>
            )}
            {nomVilleCol!=='' && nomSecteurCol!=='' && file && (
                <Button
                    onClick={() => handleFileLoad()}
                    variant="outlined"
                >
                    Charger les données
                </Button>)}
            </Box>
        </Dialog>
        </>
    )
}
export default modalVersementTerritoires;